import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const BILLING_SERVICE_URL = "http://localhost:3030";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const response = await fetch(`${BILLING_SERVICE_URL}/api/billing/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": session.userId,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Checkout failed" }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Gateway Billing Checkout Proxy error:", error);
    return NextResponse.json({ error: "Billing microservice unreachable" }, { status: 502 });
  }
}
