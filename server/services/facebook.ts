export interface FacebookPageInfo {
  id: string;
  name: string;
  access_token: string;
}

export interface LiveVideoResponse {
  id: string;
  stream_url: string;
}

export class FacebookService {
  private baseUrl = "https://graph.facebook.com/v18.0";

  async getPages(userAccessToken: string): Promise<FacebookPageInfo[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/me/accounts?access_token=${userAccessToken}`
      );
      
      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Error fetching Facebook pages:", error);
      throw error;
    }
  }

  async createLiveVideo(
    pageId: string, 
    pageAccessToken: string, 
    title: string, 
    description?: string
  ): Promise<LiveVideoResponse> {
    try {
      const params = new URLSearchParams({
        access_token: pageAccessToken,
        title,
        description: description || "",
        status: "LIVE_NOW"
      });

      const response = await fetch(
        `${this.baseUrl}/${pageId}/live_videos`,
        {
          method: "POST",
          body: params
        }
      );

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        stream_url: data.stream_url
      };
    } catch (error) {
      console.error("Error creating live video:", error);
      throw error;
    }
  }

  async endLiveVideo(videoId: string, accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${videoId}?access_token=${accessToken}`,
        {
          method: "POST",
          body: new URLSearchParams({
            end_live_video: "true"
          })
        }
      );

      return response.ok;
    } catch (error) {
      console.error("Error ending live video:", error);
      return false;
    }
  }

  async getLiveVideoMetrics(videoId: string, accessToken: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${videoId}?fields=live_views&access_token=${accessToken}`
      );

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching live video metrics:", error);
      return null;
    }
  }
}

export const facebookService = new FacebookService();
