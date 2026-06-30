import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

import { AUTH_SERVICE_URL } from "@/lib/config";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/user/${session.userId}`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: data.user,
    });
  } catch (error) {
    console.error("Gateway User Session Proxy error:", error);
    return NextResponse.json({ error: "Auth microservice unreachable" }, { status: 502 });
  }
}
