import { NextResponse } from "next/server";
import { AI_SERVICE_URL } from "@/lib/config";

export async function GET() {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/question-bank/stats`, {
      cache: "no-store",
    });
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || "Failed to load question bank stats" },
        { status: response.status },
      );
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Question Bank stats proxy error:", error);
    return NextResponse.json({ error: "AI microservice unreachable" }, { status: 502 });
  }
}
