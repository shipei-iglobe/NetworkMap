import { NetworkData } from './types';

const EMPTY: NetworkData = { people: [], meetings: [] };

async function readKV(): Promise<NetworkData> {
  const { kv } = await import('@vercel/kv');
  const data = await kv.get<NetworkData>('network');
  return data ?? { ...EMPTY };
}

async function writeKV(data: NetworkData): Promise<void> {
  const { kv } = await import('@vercel/kv');
  await kv.set('network', data);
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
  if (process.env.KV_REST_API_URL) return readKV();
  return readFS();
}

export async function writeData(data: NetworkData): Promise<void> {
  if (process.env.KV_REST_API_URL) return writeKV(data);
  writeFS(data);
}
