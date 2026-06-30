import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";

import { AUTH_SERVICE_URL } from "@/lib/config";

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
      let errorMessage = "Login failed";
      if (response.status === 422 && data.detail) {
        if (Array.isArray(data.detail)) {
          errorMessage = data.detail.map((err: any) => {
            const field = err.loc && err.loc.length > 1 ? err.loc[1] : "";
            const msg = err.msg || "";
            return field ? `${field}: ${msg}` : msg;
          }).join(". ");
        } else if (typeof data.detail === "string") {
          errorMessage = data.detail;
        }
      } else {
        errorMessage = data.error || data.detail || "Login failed";
      }
      return NextResponse.json({ error: errorMessage }, { status: response.status });
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
