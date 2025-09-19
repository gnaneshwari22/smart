import {
  users,
  documents,
  reports,
  liveDataSources,
  usageEvents,
  type User,
  type UpsertUser,
  type Document,
  type InsertDocument,
  type Report,
  type InsertReport,
  type LiveDataSource,
  type UsageEvent,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserCredits(id: string, credits: number): Promise<User>;
  updateUserStripeInfo(id: string, customerId: string, subscriptionId?: string): Promise<User>;
  
  // Document operations
  createDocument(userId: string, document: InsertDocument): Promise<Document>;
  getUserDocuments(userId: string): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<void>;
  
  // Report operations
  createReport(userId: string, report: InsertReport): Promise<Report>;
  getUserReports(userId: string, limit?: number): Promise<Report[]>;
  getReport(id: string): Promise<Report | undefined>;
  deleteReport(id: string): Promise<void>;
  
  // Live data sources
  getLiveDataSources(): Promise<LiveDataSource[]>;
  getActiveLiveDataSources(): Promise<LiveDataSource[]>;
  updateLiveDataSource(id: string, lastUpdate: Date, metadata?: any): Promise<void>;
  
  // Usage tracking
  createUsageEvent(userId: string, eventType: string, creditsUsed: number, metadata?: any): Promise<UsageEvent>;
  getUserUsageStats(userId: string): Promise<{
    totalReports: number;
    totalCreditsUsed: number;
    documentsUploaded: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
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

  async updateUserCredits(id: string, credits: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ credits, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserStripeInfo(id: string, customerId: string, subscriptionId?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Document operations
  async createDocument(userId: string, document: InsertDocument): Promise<Document> {
    const [doc] = await db
      .insert(documents)
      .values({ ...document, userId })
      .returning();
    return doc;
  }

  async getUserDocuments(userId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt));
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Report operations
  async createReport(userId: string, report: InsertReport): Promise<Report> {
    // Start transaction to update user stats and create report
    return await db.transaction(async (tx) => {
      // Create the report
      const [newReport] = await tx
        .insert(reports)
        .values({ ...report, userId })
        .returning();

      // Update user total reports and reduce credits
      await tx
        .update(users)
        .set({
          totalReports: sql`${users.totalReports} + 1`,
          credits: sql`${users.credits} - ${report.creditsUsed || 1}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return newReport;
    });
  }

  async getUserReports(userId: string, limit = 10): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .where(eq(reports.userId, userId))
      .orderBy(desc(reports.createdAt))
      .limit(limit);
  }

  async getReport(id: string): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report;
  }

  async deleteReport(id: string): Promise<void> {
    await db.delete(reports).where(eq(reports.id, id));
  }

  // Live data sources
  async getLiveDataSources(): Promise<LiveDataSource[]> {
    return await db.select().from(liveDataSources);
  }

  async getActiveLiveDataSources(): Promise<LiveDataSource[]> {
    return await db
      .select()
      .from(liveDataSources)
      .where(eq(liveDataSources.isActive, true));
  }

  async updateLiveDataSource(id: string, lastUpdate: Date, metadata?: any): Promise<void> {
    await db
      .update(liveDataSources)
      .set({ lastUpdate, metadata })
      .where(eq(liveDataSources.id, id));
  }

  // Usage tracking
  async createUsageEvent(userId: string, eventType: string, creditsUsed: number, metadata?: any): Promise<UsageEvent> {
    const [event] = await db
      .insert(usageEvents)
      .values({ userId, eventType, creditsUsed, metadata })
      .returning();
    return event;
  }

  async getUserUsageStats(userId: string): Promise<{
    totalReports: number;
    totalCreditsUsed: number;
    documentsUploaded: number;
  }> {
    const [userStats] = await db
      .select({
        totalReports: users.totalReports,
      })
      .from(users)
      .where(eq(users.id, userId));

    const [creditsUsed] = await db
      .select({
        total: sql<number>`sum(${usageEvents.creditsUsed})`,
      })
      .from(usageEvents)
      .where(eq(usageEvents.userId, userId));

    const [docsCount] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(documents)
      .where(eq(documents.userId, userId));

    return {
      totalReports: userStats?.totalReports || 0,
      totalCreditsUsed: creditsUsed?.total || 0,
      documentsUploaded: docsCount?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
