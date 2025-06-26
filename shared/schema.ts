import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  freeDownloads: integer("free_downloads").default(5).notNull(),
  totalDownloads: integer("total_downloads").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bookCovers = pgTable("book_covers", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  bookTitle: text("book_title").notNull(),
  authorName: text("author_name").notNull(),
  genre: text("genre").notNull(),
  keywords: text("keywords"),
  mood: text("mood"),
  colorPalette: text("color_palette"),
  imageUrl: text("image_url"),
  prompt: text("prompt"),
  downloaded: boolean("downloaded").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  paystackReference: text("paystack_reference").notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(), // success, pending, failed
  creditsAdded: integer("credits_added").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sessions table for authentication
export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertBookCoverSchema = createInsertSchema(bookCovers).omit({
  id: true,
  createdAt: true,
  downloaded: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const generateCoverSchema = z.object({
  bookTitle: z.string().min(1, "Book title is required"),
  authorName: z.string().min(1, "Author name is required"),
  genre: z.string().min(1, "Genre is required"),
  keywords: z.string().optional(),
  mood: z.string().optional(),
  colorPalette: z.string().optional(),
});

export const downloadCoverSchema = z.object({
  coverId: z.number(),
});

export const paymentSchema = z.object({
  amount: z.number().min(100), // Minimum 100 cents ($1)
  email: z.string().email(),
});

export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertBookCover = z.infer<typeof insertBookCoverSchema>;
export type BookCover = typeof bookCovers.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type GenerateCoverRequest = z.infer<typeof generateCoverSchema>;
export type DownloadCoverRequest = z.infer<typeof downloadCoverSchema>;
export type PaymentRequest = z.infer<typeof paymentSchema>;
