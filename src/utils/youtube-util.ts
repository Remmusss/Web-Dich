export async function getDirectVideoUrl(videoId: string): Promise<string> {
  try {
    const response = await fetch(`/api/youtube/direct-url?videoId=${videoId}`);
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error getting direct video URL:', error);
    throw error;
  }
} 