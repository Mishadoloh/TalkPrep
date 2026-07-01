import { NextResponse } from "next/server";
import { AUTH_SERVICE_URL } from "@/lib/config";

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || data.detail || "Failed to process contact message" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, message: data.message });
  } catch (error) {
    console.error("Gateway Contact Form error:", error);
    return NextResponse.json({ error: "Auth microservice unreachable" }, { status: 502 });
  }
}
