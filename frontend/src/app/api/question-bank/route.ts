import { NextResponse } from "next/server";
import { AI_SERVICE_URL } from "@/lib/config";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const response = await fetch(`${AI_SERVICE_URL}/api/question-bank?${url.searchParams.toString()}`, {
      cache: "no-store",
    });
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.detail || data.error || "Failed to load question bank" }, { status: response.status });
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Question Bank proxy error:", error);
    return NextResponse.json({ error: "AI microservice unreachable" }, { status: 502 });
  }
}
