import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderOpen, CloudUpload, Plus, Play, Trash2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Video } from "@shared/schema";

export default function VideoUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: videos = [], isLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("video", file);
          
      // Use fetch directly for file uploads to avoid JSON serialization
      const response = await fetch("/api/videos/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload video",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (videoId: string) => {
      await apiRequest("DELETE", `/api/videos/${videoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
    },
  });

  const addToQueueMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const queueLength = (await apiRequest("GET", "/api/queue")).json().then(q => q.length);
      await apiRequest("POST", "/api/queue", {
        videoId,
        position: queueLength,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/queue"] });
      toast({
        title: "Added to Queue",
        description: "Video has been added to the streaming queue.",
      });
    },
  });

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file.size > 2 * 1024 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 2GB.",
        variant: "destructive",
      });
      return;
    }
    
    uploadMutation.mutate(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready": return "bg-success/10 text-success";
      case "processing": return "bg-warning/10 text-warning";
      case "error": return "bg-error/10 text-error";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Video Management</h2>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-700"
          >
            <FolderOpen className="mr-2" size={16} />
            Browse Files
          </Button>
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-gray-300 hover:border-primary"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <CloudUpload className="text-4xl text-gray-400 mb-4 mx-auto" size={48} />
          <p className="text-lg font-medium text-gray-900 mb-2">Drag & drop videos here</p>
          <p className="text-sm text-secondary mb-4">Supports MP4, AVI, MOV formats (max 2GB)</p>
          <Button className="bg-primary text-white hover:bg-blue-600">
            <Plus className="mr-2" size={16} />
            Choose Files
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />

        {/* Uploaded Videos List */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            Uploaded Videos <span className="text-secondary">({videos.length})</span>
          </h3>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-20" />
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Play className="mx-auto mb-2" size={24} />
              <p>No videos uploaded yet</p>
              <p className="text-sm">Upload your first video to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-lg flex items-center justify-center">
                      <Play className="text-gray-600" size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{video.originalName}</p>
                      <p className="text-sm text-secondary">
                        {video.duration ? formatDuration(video.duration) : "Unknown"} • {formatFileSize(video.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(video.status)}>
                      {video.status === "processing" && (
                        <div className="w-3 h-3 border border-warning border-t-transparent rounded-full animate-spin mr-1" />
                      )}
                      {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
                    </Badge>
                    {video.status === "ready" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addToQueueMutation.mutate(video.id)}
                        disabled={addToQueueMutation.isPending}
                      >
                        <PlusCircle size={16} />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(video.id)}
                      disabled={deleteMutation.isPending}
                      className="text-error hover:text-error"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
