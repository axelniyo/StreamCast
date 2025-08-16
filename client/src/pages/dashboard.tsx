import { useEffect } from "react";
import { Video, Settings, Wifi } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import VideoUpload from "@/components/video-upload";
import StreamingQueue from "@/components/streaming-queue";
import StreamConfiguration from "@/components/stream-configuration";
import FacebookIntegration from "@/components/facebook-integration";
import StreamAnalytics from "@/components/stream-analytics";
import SystemStatus from "@/components/system-status";

export default function Dashboard() {
  const { isConnected, lastMessage } = useWebSocket();
  const { toast } = useToast();

  useEffect(() => {
    if (lastMessage) {
      const { type, data } = lastMessage;
      
      switch (type) {
        case "video_uploaded":
          toast({
            title: "Video Uploaded",
            description: `${data.originalName} has been uploaded successfully.`,
          });
          break;
        case "stream_started":
          toast({
            title: "Stream Started",
            description: "Your video is now streaming live to Facebook. Stream will continue even if you close the browser.",
          });
          break;
        case "stream_stopped":
          toast({
            title: "Stream Stopped",
            description: "The live stream has ended.",
          });
          break;
        default:
          break;
      }
    }
  }, [lastMessage, toast]);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Video className="text-white" size={16} />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">FFmpeg Live Streamer</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-secondary">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-error'}`}></div>
                <span>{isConnected ? "Connected to Replit" : "Disconnected"}</span>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Settings size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <VideoUpload />
            <StreamingQueue />
            <StreamConfiguration />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <FacebookIntegration />
            <StreamAnalytics />
            <SystemStatus />
          </div>
        </div>
      </div>
    </div>
  );
}
