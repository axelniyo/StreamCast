import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import type { StreamMetrics } from "@shared/schema";

export default function StreamAnalytics() {
  const { data: streamStatus } = useQuery<any>({
    queryKey: ["/api/stream/status"],
    refetchInterval: 1000,
  });

  const { data: metrics } = useQuery<StreamMetrics>({
    queryKey: ["/api/metrics", streamStatus?.session?.id],
    enabled: !!streamStatus?.session?.id,
    refetchInterval: 5000,
  });

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDataUsage = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stream Analytics</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-secondary">Current Viewers</span>
            <span className="text-lg font-semibold text-gray-900">
              {metrics?.currentViewers?.toLocaleString() || "0"}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-secondary">Peak Viewers</span>
            <span className="text-lg font-semibold text-gray-900">
              {metrics?.peakViewers?.toLocaleString() || "0"}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-secondary">Total Reach</span>
            <span className="text-lg font-semibold text-gray-900">
              {metrics?.totalReach?.toLocaleString() || "0"}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-secondary">Engagement Rate</span>
            <span className="text-lg font-semibold text-gray-900">
              {metrics?.engagementRate || "0%"}
            </span>
          </div>
          
          <hr className="border-gray-200" />
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-secondary">Stream Duration</span>
            <span className="text-sm font-medium text-gray-900">
              {metrics?.duration ? formatDuration(metrics.duration) : "0h 0m"}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-secondary">Data Usage</span>
            <span className="text-sm font-medium text-gray-900">
              {metrics?.dataUsage ? formatDataUsage(metrics.dataUsage) : "0 MB"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
