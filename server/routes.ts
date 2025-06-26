import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateCoverSchema, downloadCoverSchema, paymentSchema } from "@shared/schema";
import { generateBookCover } from "./services/gemini";
import path from "path";
import fs from "fs";
import axios from "axios";

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate book cover endpoint
  app.post("/api/generate-cover", async (req, res) => {
    try {
      const validatedData = generateCoverSchema.parse(req.body);
      
      // Get or create session-based user ID
      if (!(req.session as any).userId) {
        (req.session as any).userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      const guestUserId = (req.session as any).userId;
      
      // Get or create user
      let user = await storage.getUser(guestUserId);
      if (!user) {
        user = await storage.upsertUser({
          id: guestUserId,
          email: null,
          firstName: null,
          lastName: null,
          profileImageUrl: null,
        });
      }
      
      // Construct AI prompt from form data
      const prompt = constructPrompt(validatedData);
      
      // Generate unique filename
      const filename = `cover_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;
      const imagePath = path.join(process.cwd(), "temp", filename);
      
      // Ensure temp directory exists
      const tempDir = path.dirname(imagePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Generate image using Gemini
      await generateBookCover(prompt, imagePath);
      
      // Read the generated image and convert to base64
      const imageBuffer = fs.readFileSync(imagePath);
      const imageBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;
      
      // Clean up temp file
      fs.unlinkSync(imagePath);
      
      // Store in database
      const bookCover = await storage.createBookCover({
        userId: guestUserId,
        ...validatedData,
        imageUrl: imageBase64,
        prompt: prompt,
      });
      
      res.json({
        success: true,
        imageUrl: imageBase64,
        bookCover: bookCover,
        user: {
          freeDownloads: user.freeDownloads,
          totalDownloads: user.totalDownloads,
        },
      });
      
    } catch (error) {
      console.error("Error generating book cover:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate book cover",
      });
    }
  });

  // Download cover endpoint with payment logic
  app.post("/api/download-cover", async (req, res) => {
    try {
      const validatedData = downloadCoverSchema.parse(req.body);
      
      // Use same session-based user ID
      if (!(req.session as any).userId) {
        (req.session as any).userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      const guestUserId = (req.session as any).userId;
      
      console.log(`Download request - User ID: ${guestUserId}, Cover ID: ${validatedData.coverId}`);
      
      const user = await storage.getUser(guestUserId);
      const cover = await storage.getBookCover(validatedData.coverId);
      
      console.log(`Found user: ${!!user}, Found cover: ${!!cover}`);
      if (user) console.log(`User free downloads: ${user.freeDownloads}`);
      
      if (!user || !cover) {
        return res.status(404).json({
          error: "User or cover not found",
        });
      }
      
      // Check if user has free downloads available
      if (user.freeDownloads > 0) {
        // Free download
        await storage.decrementFreeDownloads(guestUserId);
        await storage.markCoverDownloaded(validatedData.coverId, guestUserId);
        
        res.json({
          success: true,
          imageUrl: cover.imageUrl,
          remainingFreeDownloads: user.freeDownloads - 1,
          isPaid: false,
        });
      } else {
        // Need payment
        res.status(402).json({
          error: "Payment required",
          message: "You have used all free downloads. Please make a payment to continue.",
          remainingFreeDownloads: 0,
          paymentRequired: true,
        });
      }
    } catch (error) {
      console.error("Error downloading cover:", error);
      res.status(500).json({
        error: "Failed to download cover",
      });
    }
  });

  // Initialize Paystack payment
  app.post("/api/initialize-payment", async (req, res) => {
    try {
      const validatedData = paymentSchema.parse(req.body);
      const guestUserId = req.sessionID || `guest_${Date.now()}`;
      
      const response = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email: validatedData.email,
          amount: validatedData.amount, // Amount in kobo (100 kobo = 1 NGN)
          currency: "NGN",
          metadata: {
            userId: guestUserId,
            credits: 10, // Payment gives 10 downloads
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status) {
        res.json({
          success: true,
          data: response.data.data,
        });
      } else {
        res.status(400).json({
          error: "Failed to initialize payment",
        });
      }
    } catch (error) {
      console.error("Error initializing payment:", error);
      res.status(500).json({
        error: "Failed to initialize payment",
      });
    }
  });

  // Verify Paystack payment
  app.post("/api/verify-payment", async (req, res) => {
    try {
      const { reference } = req.body;
      
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      if (response.data.status && response.data.data.status === "success") {
        const { metadata, amount } = response.data.data;
        const userId = metadata.userId;
        const credits = metadata.credits;

        // Store payment record
        await storage.createPayment({
          userId,
          paystackReference: reference,
          amount: (amount / 100).toString(), // Convert from kobo to dollars
          status: "success",
          creditsAdded: credits,
        });

        // Add credits to user
        await storage.addCreditsToUser(userId, credits);

        res.json({
          success: true,
          creditsAdded: credits,
        });
      } else {
        res.status(400).json({
          error: "Payment verification failed",
        });
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({
        error: "Failed to verify payment",
      });
    }
  });

  // Get user status
  app.get("/api/user-status", async (req, res) => {
    try {
      // Use same session-based user ID as other endpoints
      if (!(req.session as any).userId) {
        (req.session as any).userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      const guestUserId = (req.session as any).userId;
      
      let user = await storage.getUser(guestUserId);
      if (!user) {
        user = await storage.upsertUser({
          id: guestUserId,
          email: null,
          firstName: null,
          lastName: null,
          profileImageUrl: null,
        });
      }

      res.json({
        freeDownloads: user.freeDownloads,
        totalDownloads: user.totalDownloads,
      });
    } catch (error) {
      console.error("Error fetching user status:", error);
      res.status(500).json({
        error: "Failed to fetch user status",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function constructPrompt(data: any): string {
  const { bookTitle, authorName, genre, keywords, mood, colorPalette } = data;
  
  let prompt = `Create a professional book cover image for a ${genre || 'fiction'} book`;
  
  if (keywords) {
    prompt += ` featuring ${keywords}`;
  }
  
  if (mood) {
    prompt += ` with a ${mood} atmosphere`;
  }
  
  if (colorPalette) {
    prompt += ` using ${colorPalette}`;
  }
  
  prompt += '. The image should be suitable for a book cover with space for title and author text overlay. High quality, professional, artistic composition, 3:4 aspect ratio.';
  
  return prompt;
}
