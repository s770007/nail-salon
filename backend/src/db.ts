import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import type { User, Staff, Appointment } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "../data");

await fs.mkdir(DATA_DIR, { recursive: true });

export async function readData<T>(fileName: string): Promise<T[]> {
  try {
    const filePath = path.join(DATA_DIR, `${fileName}.json`);
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

export async function writeData<T>(fileName: string, data: T[]): Promise<void> {
  const filePath = path.join(DATA_DIR, `${fileName}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}
