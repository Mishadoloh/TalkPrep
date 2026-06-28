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

    const response = await fetch(`${AI_SERVICE_URL}/api/interview/${interviewId}/finish`, {
      method: "POST",
      headers: {
        "x-user-id": session.userId,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Failed to finish interview" }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Gateway Finish Interview Proxy error:", error);
    return NextResponse.json({ error: "AI microservice unreachable" }, { status: 502 });
  }
}
