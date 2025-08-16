import { 
  type Video, 
  type InsertVideo,
  type StreamingSession,
  type InsertStreamingSession,
  type StreamingQueue,
  type InsertStreamingQueue,
  type StreamConfiguration,
  type InsertStreamConfiguration,
  type FacebookCredentials,
  type InsertFacebookCredentials,
  type StreamMetrics,
  type InsertStreamMetrics
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Video operations
  getVideos(): Promise<Video[]>;
  getVideo(id: string): Promise<Video | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideoStatus(id: string, status: string): Promise<Video | undefined>;
  deleteVideo(id: string): Promise<boolean>;

  // Streaming session operations
  getCurrentSession(): Promise<StreamingSession | undefined>;
  createSession(session: InsertStreamingSession): Promise<StreamingSession>;
  updateSession(id: string, updates: Partial<StreamingSession>): Promise<StreamingSession | undefined>;

  // Queue operations
  getQueue(): Promise<(StreamingQueue & { video: Video })[]>;
  addToQueue(item: InsertStreamingQueue): Promise<StreamingQueue>;
  removeFromQueue(id: string): Promise<boolean>;
  clearQueue(): Promise<boolean>;
  reorderQueue(id: string, newPosition: number): Promise<boolean>;

  // Configuration operations
  getConfiguration(): Promise<StreamConfiguration | undefined>;
  updateConfiguration(config: InsertStreamConfiguration): Promise<StreamConfiguration>;

  // Facebook credentials operations
  getFacebookCredentials(): Promise<FacebookCredentials[]>;
  createFacebookCredentials(credentials: InsertFacebookCredentials): Promise<FacebookCredentials>;
  deleteFacebookCredentials(id: string): Promise<boolean>;

  // Metrics operations
  getLatestMetrics(sessionId: string): Promise<StreamMetrics | undefined>;
  createMetrics(metrics: InsertStreamMetrics): Promise<StreamMetrics>;
}

export class MemStorage implements IStorage {
  private videos: Map<string, Video> = new Map();
  private sessions: Map<string, StreamingSession> = new Map();
  private queue: Map<string, StreamingQueue> = new Map();
  private configuration: StreamConfiguration | undefined;
  private credentials: Map<string, FacebookCredentials> = new Map();
  private metrics: Map<string, StreamMetrics> = new Map();

  async getVideos(): Promise<Video[]> {
    return Array.from(this.videos.values());
  }

  async getVideo(id: string): Promise<Video | undefined> {
    return this.videos.get(id);
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const id = randomUUID();
    const video: Video = { 
      ...insertVideo, 
      id, 
      createdAt: new Date(),
      duration: insertVideo.duration ?? null,
      status: insertVideo.status ?? "uploaded"
    };
    this.videos.set(id, video);
    return video;
  }

  async updateVideoStatus(id: string, status: string): Promise<Video | undefined> {
    const video = this.videos.get(id);
    if (video) {
      const updated = { ...video, status };
      this.videos.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async deleteVideo(id: string): Promise<boolean> {
    return this.videos.delete(id);
  }

  async getCurrentSession(): Promise<StreamingSession | undefined> {
    return Array.from(this.sessions.values()).find(s => s.status === "streaming");
  }

  async createSession(insertSession: InsertStreamingSession): Promise<StreamingSession> {
    const id = randomUUID();
    const session: StreamingSession = {
      ...insertSession,
      id,
      createdAt: new Date(),
      status: insertSession.status ?? "idle",
      currentVideoId: insertSession.currentVideoId ?? null,
      facebookPageId: insertSession.facebookPageId ?? null,
      streamTitle: insertSession.streamTitle ?? null,
      streamDescription: insertSession.streamDescription ?? null,
      startTime: insertSession.startTime ?? null,
      endTime: insertSession.endTime ?? null
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateSession(id: string, updates: Partial<StreamingSession>): Promise<StreamingSession | undefined> {
    const session = this.sessions.get(id);
    if (session) {
      const updated = { ...session, ...updates };
      this.sessions.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async getQueue(): Promise<(StreamingQueue & { video: Video })[]> {
    const queueItems = Array.from(this.queue.values())
      .sort((a, b) => a.position - b.position);
    
    const result = [];
    for (const item of queueItems) {
      const video = this.videos.get(item.videoId);
      if (video) {
        result.push({ ...item, video });
      }
    }
    return result;
  }

  async addToQueue(insertItem: InsertStreamingQueue): Promise<StreamingQueue> {
    const id = randomUUID();
    const item: StreamingQueue = {
      ...insertItem,
      id,
      createdAt: new Date(),
      sessionId: insertItem.sessionId ?? null
    };
    this.queue.set(id, item);
    return item;
  }

  async removeFromQueue(id: string): Promise<boolean> {
    return this.queue.delete(id);
  }

  async clearQueue(): Promise<boolean> {
    this.queue.clear();
    return true;
  }

  async reorderQueue(id: string, newPosition: number): Promise<boolean> {
    const item = this.queue.get(id);
    if (item) {
      const updated = { ...item, position: newPosition };
      this.queue.set(id, updated);
      return true;
    }
    return false;
  }

  async getConfiguration(): Promise<StreamConfiguration | undefined> {
    if (!this.configuration) {
      const id = randomUUID();
      this.configuration = {
        id,
        quality: "1080p",
        bitrate: "4000",
        autoQueue: true,
        notifications: true,
        updatedAt: new Date()
      };
    }
    return this.configuration;
  }

  async updateConfiguration(config: InsertStreamConfiguration): Promise<StreamConfiguration> {
    const id = this.configuration?.id || randomUUID();
    this.configuration = {
      id,
      quality: config.quality ?? "1080p",
      bitrate: config.bitrate ?? "4000",
      autoQueue: config.autoQueue ?? true,
      notifications: config.notifications ?? true,
      updatedAt: new Date()
    };
    return this.configuration;
  }

  async getFacebookCredentials(): Promise<FacebookCredentials[]> {
    return Array.from(this.credentials.values());
  }

  async createFacebookCredentials(insertCredentials: InsertFacebookCredentials): Promise<FacebookCredentials> {
    const id = randomUUID();
    const credentials: FacebookCredentials = {
      ...insertCredentials,
      id,
      createdAt: new Date(),
      isActive: insertCredentials.isActive ?? true
    };
    this.credentials.set(id, credentials);
    return credentials;
  }

  async deleteFacebookCredentials(id: string): Promise<boolean> {
    return this.credentials.delete(id);
  }

  async getLatestMetrics(sessionId: string): Promise<StreamMetrics | undefined> {
    return Array.from(this.metrics.values())
      .filter(m => m.sessionId === sessionId)
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime())[0];
  }

  async createMetrics(insertMetrics: InsertStreamMetrics): Promise<StreamMetrics> {
    const id = randomUUID();
    const metrics: StreamMetrics = {
      ...insertMetrics,
      id,
      timestamp: new Date(),
      currentViewers: insertMetrics.currentViewers ?? 0,
      peakViewers: insertMetrics.peakViewers ?? 0,
      totalReach: insertMetrics.totalReach ?? 0,
      engagementRate: insertMetrics.engagementRate ?? "0%",
      duration: insertMetrics.duration ?? 0,
      dataUsage: insertMetrics.dataUsage ?? 0
    };
    this.metrics.set(id, metrics);
    return metrics;
  }
}

export const storage = new MemStorage();
