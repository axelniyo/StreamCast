import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const videos = pgTable("videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  size: integer("size").notNull(),
  duration: integer("duration"), // in seconds
  status: text("status").notNull().default("uploaded"), // uploaded, processing, ready, error
  createdAt: timestamp("created_at").defaultNow(),
});

export const streamingSessions = pgTable("streaming_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  status: text("status").notNull().default("idle"), // idle, streaming, paused, stopped, error
  currentVideoId: varchar("current_video_id"),
  facebookPageId: text("facebook_page_id"),
  streamTitle: text("stream_title"),
  streamDescription: text("stream_description"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const streamingQueue = pgTable("streaming_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull(),
  position: integer("position").notNull(),
  sessionId: varchar("session_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const streamConfiguration = pgTable("stream_configuration", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quality: text("quality").notNull().default("1080p"),
  bitrate: text("bitrate").notNull().default("4000"),
  autoQueue: boolean("auto_queue").default(true),
  notifications: boolean("notifications").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const facebookCredentials = pgTable("facebook_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accessToken: text("access_token").notNull(),
  pageId: text("page_id").notNull(),
  pageName: text("page_name").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const streamMetrics = pgTable("stream_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  currentViewers: integer("current_viewers").default(0),
  peakViewers: integer("peak_viewers").default(0),
  totalReach: integer("total_reach").default(0),
  engagementRate: text("engagement_rate").default("0%"),
  duration: integer("duration").default(0), // in seconds
  dataUsage: integer("data_usage").default(0), // in MB
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  createdAt: true,
});

export const insertStreamingSessionSchema = createInsertSchema(streamingSessions).omit({
  id: true,
  createdAt: true,
});

export const insertStreamingQueueSchema = createInsertSchema(streamingQueue).omit({
  id: true,
  createdAt: true,
});

export const insertStreamConfigurationSchema = createInsertSchema(streamConfiguration).omit({
  id: true,
  updatedAt: true,
});

export const insertFacebookCredentialsSchema = createInsertSchema(facebookCredentials).omit({
  id: true,
  createdAt: true,
});

export const insertStreamMetricsSchema = createInsertSchema(streamMetrics).omit({
  id: true,
  timestamp: true,
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type StreamingSession = typeof streamingSessions.$inferSelect;
export type InsertStreamingSession = z.infer<typeof insertStreamingSessionSchema>;
export type StreamingQueue = typeof streamingQueue.$inferSelect;
export type InsertStreamingQueue = z.infer<typeof insertStreamingQueueSchema>;
export type StreamConfiguration = typeof streamConfiguration.$inferSelect;
export type InsertStreamConfiguration = z.infer<typeof insertStreamConfigurationSchema>;
export type FacebookCredentials = typeof facebookCredentials.$inferSelect;
export type InsertFacebookCredentials = z.infer<typeof insertFacebookCredentialsSchema>;
export type StreamMetrics = typeof streamMetrics.$inferSelect;
export type InsertStreamMetrics = z.infer<typeof insertStreamMetricsSchema>;
