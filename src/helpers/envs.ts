import { MongoClient } from "mongodb";
import * as process from "process";
import dotenv from "dotenv";

dotenv.config();

export const envs = {
  MONGODB_URI: process.env.MONGODB_URI as string,
  DB_NAME: process.env.DB_NAME as string,
  MIN_INTERVAL_GENERATED: Number(process.env.MIN_INTERVAL_GENERATED),
  MAX_INTERVAL_GENERATED: Number(process.env.MAX_INTERVAL_GENERATED),
  GENERATE_INTERVAL_TIMEOUT: Number(process.env.GENERATE_INTERVAL_TIMEOUT),
  BATCH_INTERVAL_TIMEOUT: Number(process.env.BATCH_INTERVAL_TIMEOUT),
  BATCH_LIMIT: Number(process.env.BATCH_LIMIT),
  RESUME_TOKEN_FILE: process.env.RESUME_TOKEN_FILE as string,
};
