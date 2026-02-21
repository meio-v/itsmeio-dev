import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { createHash } from "crypto";

const redis = Redis.fromEnv();

const TOTAL_KEY = "squish:total";
const VISITORS_TOTAL_KEY = "squish:visitors_total";
const VISITORS_LEGACY_KEY = "squish:visitors";
const MAX_INCREMENT = 10_000_000;

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function getDailySetKey(): string {
  const d = new Date();
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `squish:daily_ips:${year}-${month}-${day}`;
}

async function recordVisitor(hashedIp: string): Promise<number> {
  // 1. Get current total. Either permanent total or legacy HyperLogLog value
  let totalVisitors = (await redis.get(VISITORS_TOTAL_KEY)) as number | null;

  if (totalVisitors === null) {
    // Migrate legacy count if permanent total doesn't exist
    const legacyCount = await redis.pfcount(VISITORS_LEGACY_KEY);
    totalVisitors = legacyCount || 0;
    // Save to permanent key exactly once
    await redis.set(VISITORS_TOTAL_KEY, totalVisitors);
  }

  // 2. Daily unique logic
  const dailySetKey = getDailySetKey();

  const pipe = redis.pipeline();
  pipe.sadd(dailySetKey, hashedIp);
  pipe.expire(dailySetKey, 48 * 60 * 60); // 48h expiration to save space

  const results = await pipe.exec();
  const saddResult = results[0] as number; // 1 if new to the set, 0 if already exists

  // If this is a new IP for today, increment the permanent total
  if (saddResult === 1) {
    totalVisitors = await redis.incr(VISITORS_TOTAL_KEY);
  }

  return totalVisitors;
}

export async function GET(req: NextRequest) {
  try {
    const ip = getIp(req);
    const hashed = hashIp(ip);

    // Run squish total fetch and visitor recording concurrently
    const [totalSquishes, totalVisitors] = await Promise.all([
      redis.get(TOTAL_KEY).then((v) => (v as number) || 0),
      recordVisitor(hashed),
    ]);

    return NextResponse.json({ total: totalSquishes, visitors: totalVisitors });
  } catch {
    return NextResponse.json({ total: 0, visitors: 0 }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const increment = Math.min(
      Math.max(0, Math.floor(Number(body.increment) || 0)),
      MAX_INCREMENT
    );

    if (increment === 0) {
      return NextResponse.json({ error: "invalid increment" }, { status: 400 });
    }

    const ip = getIp(req);
    const hashed = hashIp(ip);

    // Increment squishes and record visitor concurrently
    const [totalSquishes, totalVisitors] = await Promise.all([
      redis.incrby(TOTAL_KEY, increment),
      recordVisitor(hashed),
    ]);

    return NextResponse.json({ total: totalSquishes, visitors: totalVisitors });
  } catch {
    return NextResponse.json({ total: 0, visitors: 0 }, { status: 500 });
  }
}
