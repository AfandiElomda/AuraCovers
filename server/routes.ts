import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateCoverSchema } from "@shared/schema";
import { generateBookCover } from "./services/gemini";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate book cover endpoint
  app.post("/api/generate-cover", async (req, res) => {
    try {
      const validatedData = generateCoverSchema.parse(req.body);
      
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
      
      // Store in database (optional for MVP)
      const bookCover = await storage.createBookCover({
        ...validatedData,
        imageUrl: imageBase64,
        prompt: prompt,
      });
      
      res.json({
        success: true,
        imageUrl: imageBase64,
        bookCover: bookCover,
      });
      
    } catch (error) {
      console.error("Error generating book cover:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate book cover",
      });
    }
  });

  // Get book cover history (optional)
  app.get("/api/covers", async (req, res) => {
    try {
      const covers = await storage.getBookCovers();
      res.json(covers);
    } catch (error) {
      console.error("Error fetching covers:", error);
      res.status(500).json({
        error: "Failed to fetch covers",
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
