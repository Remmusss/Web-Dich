import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';

// Proxy configuration
const PROXY_CONFIG = {
  enabled: true, // Mặc định bật proxy để tránh bị block
  host: process.env.PROXY_HOST || '38.153.152.244',
  port: process.env.PROXY_PORT || '9594',
  username: process.env.PROXY_USERNAME,
  password: process.env.PROXY_PASSWORD,
};

// Configure YouTube Transcript with proxy
const configureYouTubeTranscript = () => {
  try {
    if (PROXY_CONFIG.enabled) {
      const proxyAuth = PROXY_CONFIG.username && PROXY_CONFIG.password 
        ? `${PROXY_CONFIG.username}:${PROXY_CONFIG.password}@` 
        : '';
      const proxyUrl = `http://${proxyAuth}${PROXY_CONFIG.host}:${PROXY_CONFIG.port}`;
      const proxyAgent = new HttpsProxyAgent(proxyUrl);

      // Override fetch globally with proxy
      const originalFetch = global.fetch;
      // @ts-ignore
      global.fetch = async (url: string | URL | Request, init?: RequestInit) => {
        try {
          const options = {
            ...init,
            agent: proxyAgent,
            timeout: 10000, // 10 seconds timeout
            headers: {
              ...init?.headers,
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            }
          };
          // @ts-ignore
          const response = await fetch(url.toString(), options);
          return response;
        } catch (error: any) {
          console.error('Proxy fetch error:', error.message);
          // Nếu proxy fail, thử lại không dùng proxy
          // @ts-ignore
          return fetch(url.toString(), init);
        }
      };
    }
  } catch (error) {
    console.error('Error configuring proxy:', error);
  }
};

export async function POST(req: Request) {
  try {
    const { videoUrl, useProxy } = await req.json();

    if (!videoUrl) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
    }

    // Override proxy setting if specified in request
    if (useProxy !== undefined) {
      PROXY_CONFIG.enabled = useProxy;
    }

    // Configure proxy before fetching transcripts
    configureYouTubeTranscript();

    // Extract video ID from URL
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Get transcripts with retry mechanism
    let attempts = 0;
    const maxAttempts = 3;
    let lastError;

    while (attempts < maxAttempts) {
      try {
        const transcripts = await YoutubeTranscript.fetchTranscript(videoId);
        
        if (!transcripts || transcripts.length === 0) {
          return NextResponse.json({ 
            error: 'No captions available for this video',
            proxyUsed: PROXY_CONFIG.enabled 
          }, { status: 404 });
        }

        return NextResponse.json({
          subtitles: transcripts,
          videoId,
          proxyUsed: PROXY_CONFIG.enabled
        });
      } catch (error: any) {
        lastError = error;
        attempts++;
        
        // Log detailed error for debugging
        console.error(`Attempt ${attempts} failed:`, error.message);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        
        // Toggle proxy for next attempt if it's enabled
        if (PROXY_CONFIG.enabled) {
          PROXY_CONFIG.enabled = false;
          configureYouTubeTranscript();
        }
      }
    }

    // If all attempts failed
    console.error('All attempts failed to fetch subtitles');
    return NextResponse.json(
      { 
        error: lastError?.message || 'Failed to fetch subtitles after multiple attempts',
        proxyUsed: PROXY_CONFIG.enabled
      },
      { status: 500 }
    );

  } catch (error: any) {
    console.error('Error in YouTube subtitles API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^/?]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^/?]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
} 