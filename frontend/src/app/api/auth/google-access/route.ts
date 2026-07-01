import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { AUTH_SERVICE_URL } from "@/lib/config";

// This endpoint handles the "access_token" Google OAuth flow.
// The frontend already fetched userInfo from Google's /userinfo endpoint,
// and sends us the verified fields (email, name, sub).
// We then upsert the user in our auth microservice's DB directly.

export async function POST(req: Request) {
  try {
    const { email, name, sub } = await req.json();

    if (!email || !sub) {
      return NextResponse.json({ error: "Missing Google user data" }, { status: 400 });
    }

    // Forward to Python auth microservice's google-access endpoint
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/google-access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, sub }),
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
    console.error("Google Access Auth Proxy error:", error);
    return NextResponse.json({ error: "Auth microservice unreachable" }, { status: 502 });
  }
}
