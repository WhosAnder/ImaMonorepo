import { ObjectId } from "mongodb";

export interface WorkerRecord {
  _id?: ObjectId;
  name: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
