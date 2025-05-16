import { NextResponse } from 'next/server';
import { incrementPageView, getAllPageViews } from '@/lib/db';

// Set max duration to 10 seconds (default is 5 seconds)
export const maxDuration = 10;

export async function POST(request: Request) {
  try {
    const { path } = await request.json();
    
    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    console.log(`Tracking page view for path: ${path}`);
    const result = await incrementPageView(path);
    
    console.log(`Successfully tracked page view for path: ${path}`);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error tracking page view:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    console.log('Fetching page views');
    const pageViews = await getAllPageViews();
    
    console.log(`Successfully fetched ${pageViews.length} page views`);
    return NextResponse.json(pageViews);
  } catch (error) {
    console.error('Error fetching page views:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      pageViews: [] // Return empty array as fallback
    }, { status: 500 });
  }
} 