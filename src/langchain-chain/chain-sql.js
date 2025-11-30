import fs from "node:fs/promises";
import path from "node:path";
import { SqlDatabase } from "@langchain/classic/sql_db";
import { DataSource } from "typeorm";

const url = "https://storage.googleapis.com/benchmarks-artifacts/chinook/Chinook.db";
const localPath = path.resolve("Chinook.db");

async function resolveDbPath() {
  if (await fs.access(localPath).then(() => true).catch(() => false)) {
    return localPath;
  }
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to download DB. Status code: ${resp.status}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  await fs.writeFile(localPath, buf);
  return localPath;
}
let db;
async function getDb() {
  if (!db) {
    const dbPath = await resolveDbPath();
    const datasource = new DataSource({ type: "sqlite", database: dbPath });
    db = await SqlDatabase.fromDataSourceParams({ appDataSource: datasource });
  }
  return db;
}

async function getSchema() {
  const db = await getDb();
  return await db.getTableInfo();
}
console.log(await getSchema());
