import { spawn, ChildProcess } from "child_process";
import path from "path";
import fs from "fs";

export interface StreamingOptions {
  inputFile: string;
  rtmpUrl: string;
  quality: string;
  bitrate: string;
}

export class FFmpegService {
  private streamingProcess: ChildProcess | null = null;
  private isStreaming = false;
  private currentStreamInfo: StreamingOptions | null = null;

  async startStream(options: StreamingOptions): Promise<boolean> {
    if (this.isStreaming) {
      throw new Error("Stream is already running");
    }

    const inputPath = path.join(process.cwd(), "uploads", options.inputFile);
    
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Video file not found: ${options.inputFile}`);
    }

    return new Promise((resolve, reject) => {
      const ffmpegArgs = [
        "-re", // Read input at its native frame rate
        "-i", inputPath,
        "-c:v", "libx264",
        "-preset", "fast",
        "-b:v", options.bitrate + "k",
        "-maxrate", options.bitrate + "k",
        "-bufsize", (parseInt(options.bitrate) * 2) + "k",
        "-c:a", "aac",
        "-b:a", "128k",
        "-ar", "44100",
        "-f", "flv",
        options.rtmpUrl
      ];

      this.streamingProcess = spawn("ffmpeg", ffmpegArgs);

      this.streamingProcess.stdout?.on("data", (data) => {
        console.log(`FFmpeg stdout: ${data}`);
      });

      this.streamingProcess.stderr?.on("data", (data) => {
        console.log(`FFmpeg stderr: ${data}`);
      });

      this.streamingProcess.on("close", (code) => {
        console.log(`FFmpeg process exited with code ${code}`);
        this.isStreaming = false;
        this.streamingProcess = null;
      });

      this.streamingProcess.on("error", (error) => {
        console.error("FFmpeg error:", error);
        this.isStreaming = false;
        this.streamingProcess = null;
        reject(error);
      });

      // Give FFmpeg a moment to start
      setTimeout(() => {
        if (this.streamingProcess && !this.streamingProcess.killed) {
          this.isStreaming = true;
          this.currentStreamInfo = options;
          console.log(`✅ Stream started successfully: ${options.inputFile}`);
          console.log(`📺 Streaming will continue even if browser is closed`);
          resolve(true);
        } else {
          reject(new Error("Failed to start FFmpeg process"));
        }
      }, 2000);
    });
  }

  async stopStream(): Promise<boolean> {
    if (!this.isStreaming || !this.streamingProcess) {
      return false;
    }

    return new Promise((resolve) => {
      this.streamingProcess!.on("close", () => {
        console.log(`⏹️ Stream ended: ${this.currentStreamInfo?.inputFile || 'unknown'}`);
        this.isStreaming = false;
        this.streamingProcess = null;
        this.currentStreamInfo = null;
        resolve(true);
      });

      // Send SIGTERM to gracefully stop
      this.streamingProcess!.kill("SIGTERM");
      
      // Force kill after 5 seconds if not stopped
      setTimeout(() => {
        if (this.streamingProcess && !this.streamingProcess.killed) {
          this.streamingProcess.kill("SIGKILL");
        }
      }, 5000);
    });
  }

  getStreamingStatus(): boolean {
    return this.isStreaming;
  }

  getCurrentStreamInfo(): StreamingOptions | null {
    return this.currentStreamInfo;
  }

  // Check if the process is actually running (in case of unexpected termination)
  isProcessAlive(): boolean {
    return this.streamingProcess !== null && !this.streamingProcess.killed;
  }

  async getVideoInfo(filePath: string): Promise<{ duration: number; size: number }> {
    const fullPath = path.join(process.cwd(), "uploads", filePath);
    
    return new Promise((resolve, reject) => {
      const ffprobe = spawn("ffprobe", [
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        fullPath
      ]);

      let output = "";
      ffprobe.stdout.on("data", (data) => {
        output += data.toString();
      });

      ffprobe.on("close", (code) => {
        if (code === 0) {
          try {
            const info = JSON.parse(output);
            const duration = Math.floor(parseFloat(info.format.duration));
            const size = parseInt(info.format.size);
            resolve({ duration, size });
          } catch (error) {
            reject(new Error("Failed to parse video info"));
          }
        } else {
          reject(new Error("FFprobe failed"));
        }
      });

      ffprobe.on("error", reject);
    });
  }
}

export const ffmpegService = new FFmpegService();
