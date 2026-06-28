import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const AI_SERVICE_URL = "http://localhost:3020";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(`${AI_SERVICE_URL}/api/interview/history`, {
      method: "GET",
      headers: {
        "x-user-id": session.userId,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Failed to fetch history" }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Gateway Get History Proxy error:", error);
    return NextResponse.json({ error: "AI microservice unreachable" }, { status: 502 });
  }
}
