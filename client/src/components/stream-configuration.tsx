import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertStreamConfigurationSchema, type StreamConfiguration } from "@shared/schema";

export default function StreamConfiguration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: configuration, isLoading } = useQuery<StreamConfiguration>({
    queryKey: ["/api/configuration"],
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", "/api/configuration", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/configuration"] });
      toast({
        title: "Configuration Updated",
        description: "Stream settings have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update configuration.",
        variant: "destructive",
      });
    },
  });

  const form = useForm({
    resolver: zodResolver(insertStreamConfigurationSchema),
    defaultValues: {
      quality: "1080p",
      bitrate: "4000",
      autoQueue: true,
      notifications: true,
    },
  });

  // Update form when configuration loads
  useEffect(() => {
    if (configuration && !isLoading) {
      form.reset({
        quality: configuration.quality,
        bitrate: configuration.bitrate,
        autoQueue: configuration.autoQueue ?? true,
        notifications: configuration.notifications ?? true,
      });
    }
  }, [configuration, isLoading, form]);

  const onSubmit = (data: any) => {
    updateConfigMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-2 gap-6">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Stream Configuration</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="quality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Video Quality</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select quality" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1080p">1080p (High Quality)</SelectItem>
                        <SelectItem value="720p">720p (Standard)</SelectItem>
                        <SelectItem value="480p">480p (Mobile Friendly)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bitrate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Bitrate</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bitrate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="4000">4000 kbps (Recommended)</SelectItem>
                        <SelectItem value="2500">2500 kbps</SelectItem>
                        <SelectItem value="1800">1800 kbps</SelectItem>
                        <SelectItem value="1200">1200 kbps</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="autoQueue"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Automatically queue next video
                      </FormLabel>
                      <p className="text-xs text-secondary mt-1">
                        When enabled, videos will stream continuously without manual intervention
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notifications"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Send notifications for stream events
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              disabled={updateConfigMutation.isPending}
              className="bg-primary text-white hover:bg-blue-600"
            >
              {updateConfigMutation.isPending ? "Saving..." : "Save Configuration"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
