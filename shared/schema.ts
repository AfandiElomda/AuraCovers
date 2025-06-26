import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const bookCovers = pgTable("book_covers", {
  id: serial("id").primaryKey(),
  bookTitle: text("book_title").notNull(),
  authorName: text("author_name").notNull(),
  genre: text("genre").notNull(),
  keywords: text("keywords"),
  mood: text("mood"),
  colorPalette: text("color_palette"),
  imageUrl: text("image_url"),
  prompt: text("prompt"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertBookCoverSchema = createInsertSchema(bookCovers).omit({
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertBookCover = z.infer<typeof insertBookCoverSchema>;
export type BookCover = typeof bookCovers.$inferSelect;
export type GenerateCoverRequest = z.infer<typeof generateCoverSchema>;
