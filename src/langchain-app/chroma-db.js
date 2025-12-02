import { CloudClient } from "chromadb";
import dotenv from 'dotenv';

dotenv.config();

const client = new CloudClient({
  apiKey: process.env.CHROMA_DB_API_KEY,
  tenant: process.env.CHROMA_DB_TENANT,
  database: process.env.CHROMA_DB_DATABASE
});

export default client;
