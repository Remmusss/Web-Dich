import { ObjectId } from 'mongodb';

export interface PageView {
  _id?: ObjectId;
  path: string;
  views: number;
  lastUpdated: Date;
}

export interface PageViewWithStats extends PageView {
  stars: number;
  uses: number;
} 