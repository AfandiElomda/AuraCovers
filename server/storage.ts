import { users, bookCovers, type User, type InsertUser, type BookCover, type InsertBookCover } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createBookCover(bookCover: InsertBookCover): Promise<BookCover>;
  getBookCovers(): Promise<BookCover[]>;
  getBookCover(id: number): Promise<BookCover | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private bookCovers: Map<number, BookCover>;
  private currentUserId: number;
  private currentCoverId: number;

  constructor() {
    this.users = new Map();
    this.bookCovers = new Map();
    this.currentUserId = 1;
    this.currentCoverId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createBookCover(insertBookCover: InsertBookCover): Promise<BookCover> {
    const id = this.currentCoverId++;
    const bookCover: BookCover = { 
      bookTitle: insertBookCover.bookTitle,
      authorName: insertBookCover.authorName,
      genre: insertBookCover.genre,
      keywords: insertBookCover.keywords || null,
      mood: insertBookCover.mood || null,
      colorPalette: insertBookCover.colorPalette || null,
      imageUrl: insertBookCover.imageUrl || null,
      prompt: insertBookCover.prompt || null,
      id,
      createdAt: new Date(),
    };
    this.bookCovers.set(id, bookCover);
    return bookCover;
  }

  async getBookCovers(): Promise<BookCover[]> {
    return Array.from(this.bookCovers.values()).sort(
      (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async getBookCover(id: number): Promise<BookCover | undefined> {
    return this.bookCovers.get(id);
  }
}

export const storage = new MemStorage();
