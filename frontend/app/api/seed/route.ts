import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const SEED_TOKEN = process.env.SEED_TOKEN || "";

export async function POST() {
  if (!SEED_TOKEN) {
    return NextResponse.json(
      { error: "SEED_TOKEN not configured on frontend server" },
      { status: 503 }
    );
  }

  const res = await fetch(`${BACKEND}/api/seed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Seed-Token": SEED_TOKEN,
    },
  });

  const data = await res.json().catch(() => ({ detail: "Backend error" }));

  if (!res.ok) {
    return NextResponse.json(
      { error: data.detail || `Backend returned ${res.status}` },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
