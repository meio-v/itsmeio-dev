import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { createHash } from "crypto";

const redis = Redis.fromEnv();

const TOTAL_KEY = "squish:total";
const VISITORS_KEY = "squish:visitors";
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

export async function GET(req: NextRequest) {
  try {
    const ip = getIp(req);
    const hashed = hashIp(ip);

    const pipe = redis.pipeline();
    pipe.get(TOTAL_KEY);
    pipe.pfadd(VISITORS_KEY, hashed);
    pipe.pfcount(VISITORS_KEY);

    const results = await pipe.exec();
    const total = (results[0] as number) || 0;
    const visitors = (results[2] as number) || 0;

    return NextResponse.json({ total, visitors });
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

    const pipe = redis.pipeline();
    pipe.incrby(TOTAL_KEY, increment);
    pipe.pfadd(VISITORS_KEY, hashed);
    pipe.pfcount(VISITORS_KEY);

    const results = await pipe.exec();
    const total = results[0] as number;
    const visitors = results[2] as number;

    return NextResponse.json({ total, visitors });
  } catch {
    return NextResponse.json({ total: 0, visitors: 0 }, { status: 500 });
  }
}
