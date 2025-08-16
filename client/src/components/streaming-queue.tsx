import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, Pause, Trash2, ArrowUp, ArrowDown, X, ListX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { StreamingQueue, Video } from "@shared/schema";

interface QueueItem extends StreamingQueue {
  video: Video;
}

interface StreamStatus {
  isStreaming: boolean;
  session: any;
}

export default function StreamingQueue() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: queue = [], isLoading } = useQuery<QueueItem[]>({
    queryKey: ["/api/queue"],
  });

  const { data: streamStatus } = useQuery<StreamStatus>({
    queryKey: ["/api/stream/status"],
    refetchInterval: 1000,
  });

  const startStreamMutation = useMutation({
    mutationFn: async () => {
      if (queue.length === 0) {
        throw new Error("No videos in queue");
      }
      
      const firstVideo = queue[0];
      await apiRequest("POST", "/api/stream/start", {
        videoId: firstVideo.videoId,
        facebookPageId: "default", // This should come from Facebook integration
        streamTitle: "Live Stream",
        streamDescription: "Streaming from FFmpeg Live Streamer",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stream/status"] });
      toast({
        title: "Stream Started",
        description: "Your video is now streaming live.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Stream Failed",
        description: error.message || "Failed to start stream",
        variant: "destructive",
      });
    },
  });

  const stopStreamMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/stream/stop");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stream/status"] });
      toast({
        title: "Stream Stopped",
        description: "The live stream has ended.",
      });
    },
  });

  const removeFromQueueMutation = useMutation({
    mutationFn: async (queueId: string) => {
      await apiRequest("DELETE", `/api/queue/${queueId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/queue"] });
    },
  });

  const clearQueueMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/queue");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/queue"] });
      toast({
        title: "Queue Cleared",
        description: "All videos have been removed from the queue.",
      });
    },
  });

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const currentVideo = streamStatus?.session?.currentVideoId 
    ? queue.find(item => item.videoId === streamStatus.session.currentVideoId)
    : null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Streaming Queue</h2>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => clearQueueMutation.mutate()}
              disabled={clearQueueMutation.isPending || queue.length === 0}
              className="text-gray-700"
            >
              <Trash2 className="mr-2" size={16} />
              Clear Queue
            </Button>
            {streamStatus?.isStreaming ? (
              <Button
                variant="destructive"
                onClick={() => stopStreamMutation.mutate()}
                disabled={stopStreamMutation.isPending}
              >
                <Pause className="mr-2" size={16} />
                Pause Streaming
              </Button>
            ) : (
              <Button
                className="bg-success text-white hover:bg-green-600"
                onClick={() => startStreamMutation.mutate()}
                disabled={startStreamMutation.isPending || queue.length === 0}
              >
                <Play className="mr-2" size={16} />
                Start Streaming
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {/* Currently Streaming */}
          {streamStatus?.isStreaming && currentVideo && (
            <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                  <div className="flex items-center space-x-3">
                    <Play className="text-success" size={16} />
                    <div>
                      <p className="font-medium text-gray-900">{currentVideo.video.originalName}</p>
                      <p className="text-sm text-secondary">
                        Currently streaming • Duration: {formatDuration(currentVideo.video.duration || 0)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-secondary">
                    <span className="font-medium text-success">Live</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => stopStreamMutation.mutate()}
                    className="text-error hover:bg-error/10"
                  >
                    <Pause size={16} />
                  </Button>
                </div>
              </div>
              <div className="mt-3">
                <Progress value={25} className="w-full" />
              </div>
            </div>
          )}

          {/* Queue Items */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-16" />
              ))}
            </div>
          ) : queue.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ListX className="mx-auto mb-2" size={24} />
              <p>No videos in queue</p>
              <p className="text-sm">Add videos from your uploaded files</p>
            </div>
          ) : (
            queue
              .filter(item => !streamStatus?.isStreaming || item.videoId !== streamStatus?.session?.currentVideoId)
              .map((item, index) => (
                <div key={item.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-gray-300 rounded flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">{index + 1}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Play className="text-gray-400" size={16} />
                        <div>
                          <p className="font-medium text-gray-900">{item.video.originalName}</p>
                          <p className="text-sm text-secondary">
                            {index === 0 ? "Next in queue" : `Position ${index + 1}`} • {formatDuration(item.video.duration || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {/* TODO: Implement move up */}}
                        disabled={index === 0}
                      >
                        <ArrowUp size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {/* TODO: Implement move down */}}
                        disabled={index === queue.length - 1}
                      >
                        <ArrowDown size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromQueueMutation.mutate(item.id)}
                        className="text-error hover:text-error"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
