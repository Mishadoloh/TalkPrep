import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const AI_SERVICE_URL = "http://localhost:3020";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: interviewId } = await params;
    const body = await req.json();

    const response = await fetch(`${AI_SERVICE_URL}/api/interview/${interviewId}/answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": session.userId,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Failed to submit answer" }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Gateway Submit Answer Proxy error:", error);
    return NextResponse.json({ error: "AI microservice unreachable" }, { status: 502 });
  }
}
