import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { AUTH_SERVICE_URL } from "@/lib/config";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Missing Google token" }, { status: 400 });
    }

    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || "Google authentication failed" },
        { status: response.status }
      );
    }

    // Set cookie session
    await createSession(data.user.id, data.user.email, data.user.username);

    return NextResponse.json({ success: true, user: data.user });
  } catch (error) {
    console.error("Google Auth Proxy error:", error);
    return NextResponse.json({ error: "Auth microservice unreachable" }, { status: 502 });
  }
}
