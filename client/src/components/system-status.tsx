import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "@/hooks/use-websocket";

interface SystemStatus {
  ffmpeg: "running" | "stopped" | "error";
  facebook: "connected" | "disconnected" | "error";
  storage: string;
  network: "excellent" | "good" | "moderate" | "poor";
}

export default function SystemStatus() {
  const { isConnected } = useWebSocket();
  
  // Mock system status - in production, this would come from actual system monitoring
  const systemStatus: SystemStatus = {
    ffmpeg: "running",
    facebook: "connected",
    storage: "2.1 GB / 10 GB",
    network: "moderate",
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
      case "connected":
      case "excellent":
      case "good":
        return "bg-success/10 text-success";
      case "moderate":
        return "bg-warning/10 text-warning";
      case "error":
      case "poor":
      case "stopped":
      case "disconnected":
        return "bg-error/10 text-error";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case "running":
      case "connected":
      case "excellent":
      case "good":
        return "bg-success";
      case "moderate":
        return "bg-warning";
      case "error":
      case "poor":
      case "stopped":
      case "disconnected":
        return "bg-error";
      default:
        return "bg-gray-400";
    }
  };

  const recentActivity = [
    {
      id: 1,
      type: "success",
      message: "Stream started successfully",
      timestamp: "2 minutes ago",
    },
    {
      id: 2,
      type: "warning",
      message: "Network latency spike detected",
      timestamp: "8 minutes ago",
    },
    {
      id: 3,
      type: "success",
      message: "Video upload completed",
      timestamp: "15 minutes ago",
    },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${getStatusIndicator(systemStatus.ffmpeg)}`}></div>
              <span className="text-sm text-gray-700">FFmpeg Service</span>
            </div>
            <Badge className={`text-xs ${getStatusColor(systemStatus.ffmpeg)}`}>
              {systemStatus.ffmpeg.charAt(0).toUpperCase() + systemStatus.ffmpeg.slice(1)}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${getStatusIndicator(systemStatus.facebook)}`}></div>
              <span className="text-sm text-gray-700">Facebook API</span>
            </div>
            <Badge className={`text-xs ${getStatusColor(systemStatus.facebook)}`}>
              {systemStatus.facebook.charAt(0).toUpperCase() + systemStatus.facebook.slice(1)}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span className="text-sm text-gray-700">Storage</span>
            </div>
            <span className="text-xs text-secondary">{systemStatus.storage}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${getStatusIndicator(systemStatus.network)}`}></div>
              <span className="text-sm text-gray-700">Network</span>
            </div>
            <Badge className={`text-xs ${getStatusColor(systemStatus.network)}`}>
              {systemStatus.network.charAt(0).toUpperCase() + systemStatus.network.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h4>
          <div className="space-y-2 text-xs">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-2">
                <div className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${
                  activity.type === "success" ? "bg-success" : 
                  activity.type === "warning" ? "bg-warning" : "bg-error"
                }`}></div>
                <div>
                  <p className="text-gray-700">{activity.message}</p>
                  <p className="text-secondary">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
