import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

import { AI_SERVICE_URL } from "@/lib/config";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const response = await fetch(`${AI_SERVICE_URL}/api/interview/${id}`, {
      method: "GET",
      headers: {
        "x-user-id": session.userId,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Failed to fetch interview" }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Gateway Get Interview Proxy error:", error);
    return NextResponse.json({ error: "AI microservice unreachable" }, { status: 502 });
  }
}
