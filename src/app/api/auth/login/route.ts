import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";

const AUTH_SERVICE_URL = "http://localhost:3010";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Login failed" }, { status: response.status });
    }

    // Set cookie session at the gateway
    await createSession(data.user.id, data.user.email, data.user.username);

    return NextResponse.json({
      success: true,
      user: data.user,
    });
  } catch (error) {
    console.error("Gateway Login Proxy error:", error);
    return NextResponse.json({ error: "Auth microservice unreachable" }, { status: 502 });
  }
}
