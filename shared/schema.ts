import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  credits: integer("credits").default(50),
  totalReports: integer("total_reports").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents table for uploaded files
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  mimeType: varchar("mime_type").notNull(),
  size: integer("size").notNull(),
  content: text("content"), // Extracted text content
  metadata: jsonb("metadata"), // Additional file metadata
  createdAt: timestamp("created_at").defaultNow(),
});

// Reports table for generated research reports
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  query: text("query").notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  sources: jsonb("sources").notNull(), // Array of source objects
  citations: jsonb("citations").notNull(), // Array of citation objects
  sourceTypes: jsonb("source_types").notNull(), // Which sources were used
  processingTimeMs: integer("processing_time_ms"),
  creditsUsed: integer("credits_used").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// Live data sources table for Pathway integration
export const liveDataSources = pgTable("live_data_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // 'news', 'market', 'academic', etc.
  url: varchar("url"),
  isActive: boolean("is_active").default(true),
  lastUpdate: timestamp("last_update"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Usage tracking for billing
export const usageEvents = pgTable("usage_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  eventType: varchar("event_type").notNull(), // 'report_generated', 'document_uploaded', etc.
  creditsUsed: integer("credits_used").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  filename: true,
  originalName: true,
  mimeType: true,
  size: true,
  content: true,
  metadata: true,
});

export const insertReportSchema = createInsertSchema(reports).pick({
  title: true,
  query: true,
  content: true,
  summary: true,
  sources: true,
  citations: true,
  sourceTypes: true,
  processingTimeMs: true,
  creditsUsed: true,
});

export const researchQuerySchema = z.object({
  question: z.string().min(10, "Question must be at least 10 characters"),
  sourceTypes: z.array(z.enum(['files', 'web', 'academic'])).min(1, "Select at least one source type"),
  includeFiles: z.boolean().default(true),
  includeLiveData: z.boolean().default(true),
  includeAcademic: z.boolean().default(false),
});

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type LiveDataSource = typeof liveDataSources.$inferSelect;
export type UsageEvent = typeof usageEvents.$inferSelect;
export type ResearchQuery = z.infer<typeof researchQuerySchema>;
