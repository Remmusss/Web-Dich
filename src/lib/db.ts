import { MongoClient } from 'mongodb';
import { PageView } from '@/models/PageView';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

// Helper function to get the page views collection
export async function getPageViewsCollection() {
  const client = await clientPromise;
  const db = client.db();
  return db.collection<PageView>('pageViews');
}

// Helper function to increment page views
export async function incrementPageView(path: string) {
  const collection = await getPageViewsCollection();
  const result = await collection.findOneAndUpdate(
    { path },
    { 
      $inc: { views: 1 },
      $set: { lastUpdated: new Date() }
    },
    { 
      upsert: true,
      returnDocument: 'after'
    }
  );
  return result;
}

// Helper function to get all page views
export async function getAllPageViews() {
  const collection = await getPageViewsCollection();
  return collection.find({}).toArray();
} 