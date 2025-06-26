import { users, bookCovers, payments, type User, type UpsertUser, type BookCover, type InsertBookCover, type Payment, type InsertPayment } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createBookCover(bookCover: InsertBookCover): Promise<BookCover>;
  getBookCovers(userId?: string): Promise<BookCover[]>;
  getBookCover(id: number): Promise<BookCover | undefined>;
  markCoverDownloaded(coverId: number, userId: string): Promise<void>;
  decrementFreeDownloads(userId: string): Promise<void>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(reference: string): Promise<Payment | undefined>;
  addCreditsToUser(userId: string, credits: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createBookCover(insertBookCover: InsertBookCover): Promise<BookCover> {
    const [bookCover] = await db
      .insert(bookCovers)
      .values({
        ...insertBookCover,
        downloaded: false,
      })
      .returning();
    return bookCover;
  }

  async getBookCovers(userId?: string): Promise<BookCover[]> {
    const query = db.select().from(bookCovers);
    if (userId) {
      query.where(eq(bookCovers.userId, userId));
    }
    return await query.orderBy(bookCovers.createdAt);
  }

  async getBookCover(id: number): Promise<BookCover | undefined> {
    const [bookCover] = await db.select().from(bookCovers).where(eq(bookCovers.id, id));
    return bookCover || undefined;
  }

  async markCoverDownloaded(coverId: number, userId: string): Promise<void> {
    await db
      .update(bookCovers)
      .set({ downloaded: true })
      .where(eq(bookCovers.id, coverId));
  }

  async decrementFreeDownloads(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      await db
        .update(users)
        .set({ 
          freeDownloads: user.freeDownloads - 1,
          totalDownloads: user.totalDownloads + 1,
        })
        .where(eq(users.id, userId));
    }
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async getPayment(reference: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.paystackReference, reference));
    return payment || undefined;
  }

  async addCreditsToUser(userId: string, credits: number): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      await db
        .update(users)
        .set({ 
          freeDownloads: user.freeDownloads + credits,
        })
        .where(eq(users.id, userId));
    }
  }
}

export const storage = new DatabaseStorage();
