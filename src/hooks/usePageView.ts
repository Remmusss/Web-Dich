import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const trackPageView = async (path: string, retryCount = 0): Promise<void> => {
  try {
    const response = await fetch('/api/page-views', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    await response.json();
  } catch (error) {
    console.error('Error tracking page view:', error);
    
    if (retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      console.log(`Retrying in ${delay}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await sleep(delay);
      return trackPageView(path, retryCount + 1);
    }
    
    console.error('Max retries reached, giving up on tracking page view');
  }
};

export function usePageView() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);
  const retryCount = useRef<number>(0);
  const maxRetries = 3;
  const [pageViews, setPageViews] = useState<Record<string, number>>({});

  // Fetch page views on component mount
  useEffect(() => {
    const fetchPageViews = async () => {
      try {
        const response = await fetch('/api/page-views');
        if (response.ok) {
          const data = await response.json();
          const viewsMap: Record<string, number> = {};
          data.forEach((item: any) => {
            if (item.path) {
              viewsMap[item.path] = item.views || 0;
            }
          });
          setPageViews(viewsMap);
        }
      } catch (error) {
        console.error('Error fetching page views:', error);
      }
    };

    fetchPageViews();
  }, []);

  useEffect(() => {
    if (pathname) {
      trackPageView(pathname);
    }
  }, [pathname]);

  // Return the current page views for display
  return pageViews;
} 