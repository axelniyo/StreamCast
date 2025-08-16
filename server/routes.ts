import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { ffmpegService } from "./services/ffmpeg";
import { facebookService } from "./services/facebook";
import { 
  insertVideoSchema, 
  insertStreamingSessionSchema,
  insertStreamingQueueSchema,
  insertStreamConfigurationSchema,
  insertFacebookCredentialsSchema,
  insertStreamMetricsSchema 
} from "@shared/schema";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ["video/mp4", "video/avi", "video/quicktime"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only MP4, AVI, and MOV files are allowed."));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const broadcast = (message: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  };

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  // Video management routes
  app.get("/api/videos", async (req, res) => {
    try {
      const videos = await storage.getVideos();
      res.json(videos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  app.post("/api/videos/upload", upload.single("video"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No video file provided" });
      }

      // Get video info using FFmpeg
      const videoInfo = await ffmpegService.getVideoInfo(req.file.filename);
      
      const videoData = insertVideoSchema.parse({
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: videoInfo.size,
        duration: videoInfo.duration,
        status: "ready"
      });

      const video = await storage.createVideo(videoData);
      
      broadcast({
        type: "video_uploaded",
        data: video
      });

      res.json(video);
    } catch (error) {
      console.error("Video upload error:", error);
      res.status(500).json({ error: "Failed to upload video" });
    }
  });

  app.delete("/api/videos/:id", async (req, res) => {
    try {
      const video = await storage.getVideo(req.params.id);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      // Delete file from disk
      const filePath = path.join(uploadsDir, video.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await storage.deleteVideo(req.params.id);
      
      broadcast({
        type: "video_deleted",
        data: { id: req.params.id }
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete video" });
    }
  });

  // Streaming queue routes
  app.get("/api/queue", async (req, res) => {
    try {
      const queue = await storage.getQueue();
      res.json(queue);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch queue" });
    }
  });

  app.post("/api/queue", async (req, res) => {
    try {
      const queueData = insertStreamingQueueSchema.parse(req.body);
      const queueItem = await storage.addToQueue(queueData);
      
      broadcast({
        type: "queue_updated",
        data: await storage.getQueue()
      });

      res.json(queueItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to add to queue" });
    }
  });

  app.delete("/api/queue/:id", async (req, res) => {
    try {
      await storage.removeFromQueue(req.params.id);
      
      broadcast({
        type: "queue_updated",
        data: await storage.getQueue()
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove from queue" });
    }
  });

  app.delete("/api/queue", async (req, res) => {
    try {
      await storage.clearQueue();
      
      broadcast({
        type: "queue_updated",
        data: []
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear queue" });
    }
  });

  // Streaming control routes
  app.post("/api/stream/start", async (req, res) => {
    try {
      const { videoId, facebookPageId, streamTitle, streamDescription } = req.body;
      
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      // Get Facebook credentials
      const credentials = await storage.getFacebookCredentials();
      const pageCredential = credentials.find(c => c.pageId === facebookPageId);
      
      if (!pageCredential) {
        return res.status(400).json({ error: "Facebook credentials not found" });
      }

      // Create live video on Facebook
      const liveVideo = await facebookService.createLiveVideo(
        facebookPageId,
        pageCredential.accessToken,
        streamTitle,
        streamDescription
      );

      // Get stream configuration
      const config = await storage.getConfiguration();
      
      // Start FFmpeg stream
      await ffmpegService.startStream({
        inputFile: video.filename,
        rtmpUrl: liveVideo.stream_url,
        quality: config?.quality || "1080p",
        bitrate: config?.bitrate || "4000"
      });

      // Create streaming session
      const session = await storage.createSession({
        status: "streaming",
        currentVideoId: videoId,
        facebookPageId,
        streamTitle,
        streamDescription,
        startTime: new Date()
      });

      broadcast({
        type: "stream_started",
        data: { session, video }
      });

      res.json({ success: true, session });
    } catch (error) {
      console.error("Stream start error:", error);
      res.status(500).json({ error: "Failed to start stream" });
    }
  });

  app.post("/api/stream/stop", async (req, res) => {
    try {
      const currentSession = await storage.getCurrentSession();
      if (!currentSession) {
        return res.status(400).json({ error: "No active stream found" });
      }

      // Stop FFmpeg
      await ffmpegService.stopStream();

      // Update session
      await storage.updateSession(currentSession.id, {
        status: "stopped",
        endTime: new Date()
      });

      broadcast({
        type: "stream_stopped",
        data: { sessionId: currentSession.id }
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to stop stream" });
    }
  });

  app.get("/api/stream/status", async (req, res) => {
    try {
      const currentSession = await storage.getCurrentSession();
      const isStreaming = ffmpegService.getStreamingStatus();
      
      res.json({
        isStreaming,
        session: currentSession
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get stream status" });
    }
  });

  // Configuration routes
  app.get("/api/configuration", async (req, res) => {
    try {
      const config = await storage.getConfiguration();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch configuration" });
    }
  });

  app.put("/api/configuration", async (req, res) => {
    try {
      const configData = insertStreamConfigurationSchema.parse(req.body);
      const config = await storage.updateConfiguration(configData);
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to update configuration" });
    }
  });

  // Facebook credentials routes
  app.get("/api/facebook/credentials", async (req, res) => {
    try {
      const credentials = await storage.getFacebookCredentials();
      res.json(credentials);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Facebook credentials" });
    }
  });

  app.post("/api/facebook/credentials", async (req, res) => {
    try {
      const credentialsData = insertFacebookCredentialsSchema.parse(req.body);
      const credentials = await storage.createFacebookCredentials(credentialsData);
      res.json(credentials);
    } catch (error) {
      res.status(500).json({ error: "Failed to save Facebook credentials" });
    }
  });

  app.get("/api/facebook/pages", async (req, res) => {
    try {
      const { accessToken } = req.query;
      if (!accessToken || typeof accessToken !== "string") {
        return res.status(400).json({ error: "Access token required" });
      }

      const pages = await facebookService.getPages(accessToken);
      res.json(pages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Facebook pages" });
    }
  });

  // Metrics routes
  app.get("/api/metrics/:sessionId", async (req, res) => {
    try {
      const metrics = await storage.getLatestMetrics(req.params.sessionId);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  // Periodic metrics update for active streams
  setInterval(async () => {
    try {
      const currentSession = await storage.getCurrentSession();
      if (currentSession && ffmpegService.getStreamingStatus()) {
        // Create mock metrics - in production, these would come from Facebook API
        const metrics = await storage.createMetrics({
          sessionId: currentSession.id,
          currentViewers: Math.floor(Math.random() * 2000) + 500,
          peakViewers: Math.floor(Math.random() * 3000) + 1000,
          totalReach: Math.floor(Math.random() * 10000) + 2000,
          engagementRate: (Math.random() * 20 + 5).toFixed(1) + "%",
          duration: Math.floor((Date.now() - currentSession.startTime!.getTime()) / 1000),
          dataUsage: Math.floor(Math.random() * 1000) + 500
        });

        broadcast({
          type: "metrics_updated",
          data: metrics
        });
      }
    } catch (error) {
      console.error("Error updating metrics:", error);
    }
  }, 5000); // Update every 5 seconds

  return httpServer;
}
