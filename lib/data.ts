import { NetworkData } from './types';

const EMPTY: NetworkData = { people: [], meetings: [] };

async function readPG(): Promise<NetworkData> {
  const { sql } = await import('@vercel/postgres');
  await sql`CREATE TABLE IF NOT EXISTS network_data (id TEXT PRIMARY KEY, data JSONB NOT NULL)`;
  const result = await sql`SELECT data FROM network_data WHERE id = 'main'`;
  if (result.rows.length === 0) return { ...EMPTY };
  return result.rows[0].data as NetworkData;
}

async function writePG(data: NetworkData): Promise<void> {
  const { sql } = await import('@vercel/postgres');
  await sql`CREATE TABLE IF NOT EXISTS network_data (id TEXT PRIMARY KEY, data JSONB NOT NULL)`;
  await sql`INSERT INTO network_data (id, data) VALUES ('main', ${JSON.stringify(data)}::jsonb)
            ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify(data)}::jsonb`;
}

function readFS(): NetworkData {
  const fs = require('fs');
  const path = require('path');
  const file = path.join(process.cwd(), 'data', 'network.json');
  try {
    if (!fs.existsSync(file)) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(EMPTY, null, 2));
      return { ...EMPTY };
    }
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as NetworkData;
  } catch {
    return { ...EMPTY };
  }
}

function writeFS(data: NetworkData): void {
  const fs = require('fs');
  const path = require('path');
  const file = path.join(process.cwd(), 'data', 'network.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export async function readData(): Promise<NetworkData> {
  if (process.env.POSTGRES_URL) return readPG();
  return readFS();
}

export async function writeData(data: NetworkData): Promise<void> {
  if (process.env.POSTGRES_URL) return writePG(data);
  writeFS(data);
}
