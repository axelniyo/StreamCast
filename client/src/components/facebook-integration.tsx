import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SiFacebook } from "react-icons/si";
import { Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertFacebookCredentialsSchema, type FacebookCredentials } from "@shared/schema";
import { z } from "zod";

const streamFormSchema = z.object({
  pageId: z.string().min(1, "Please select a Facebook page"),
  streamTitle: z.string().min(1, "Stream title is required"),
  streamDescription: z.string().optional(),
});

export default function FacebookIntegration() {
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: credentials = [] } = useQuery<FacebookCredentials[]>({
    queryKey: ["/api/facebook/credentials"],
  });

  const activeCredentials = credentials.filter(c => c.isActive);

  const streamForm = useForm({
    resolver: zodResolver(streamFormSchema),
    defaultValues: {
      pageId: "",
      streamTitle: "Weekly Product Demo",
      streamDescription: "Join us for our weekly product demonstration and Q&A session!",
    },
  });

  const credentialsForm = useForm({
    resolver: zodResolver(insertFacebookCredentialsSchema),
    defaultValues: {
      accessToken: "",
      pageId: "",
      pageName: "",
      isActive: true,
    },
  });

  const saveCredentialsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/facebook/credentials", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/credentials"] });
      setIsCredentialsDialogOpen(false);
      credentialsForm.reset();
      toast({
        title: "Credentials Saved",
        description: "Facebook credentials have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save Facebook credentials.",
        variant: "destructive",
      });
    },
  });

  const onSaveCredentials = (data: any) => {
    saveCredentialsMutation.mutate(data);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Facebook Live</h3>
        
        {/* Connection Status */}
        {activeCredentials.length > 0 ? (
          <div className="flex items-center justify-between p-3 bg-success/5 border border-success/20 rounded-lg mb-4">
            <div className="flex items-center space-x-2">
              <SiFacebook className="text-blue-600" size={20} />
              <span className="text-sm font-medium text-gray-900">Connected</span>
            </div>
            <div className="w-2 h-2 bg-success rounded-full"></div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-error/5 border border-error/20 rounded-lg mb-4">
            <div className="flex items-center space-x-2">
              <SiFacebook className="text-blue-600" size={20} />
              <span className="text-sm font-medium text-gray-900">Not Connected</span>
            </div>
            <div className="w-2 h-2 bg-error rounded-full"></div>
          </div>
        )}

        <Form {...streamForm}>
          <form className="space-y-4">
            {/* Page Selection */}
            <FormField
              control={streamForm.control}
              name="pageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Facebook Page</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a page" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeCredentials.map((credential) => (
                        <SelectItem key={credential.id} value={credential.pageId}>
                          {credential.pageName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {/* Stream Title */}
            <FormField
              control={streamForm.control}
              name="streamTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Stream Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter stream title..." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Stream Description */}
            <FormField
              control={streamForm.control}
              name="streamDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Optional description..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>

        {/* Credentials Management */}
        <Dialog open={isCredentialsDialogOpen} onOpenChange={setIsCredentialsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full mt-4">
              <Settings className="mr-2" size={16} />
              Manage Credentials
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Facebook Credentials</DialogTitle>
            </DialogHeader>
            <Form {...credentialsForm}>
              <form onSubmit={credentialsForm.handleSubmit(onSaveCredentials)} className="space-y-4">
                <FormField
                  control={credentialsForm.control}
                  name="accessToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Token</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter Facebook access token..." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={credentialsForm.control}
                  name="pageId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Facebook page ID..." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={credentialsForm.control}
                  name="pageName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter page name..." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCredentialsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saveCredentialsMutation.isPending}
                    className="bg-primary text-white"
                  >
                    {saveCredentialsMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
