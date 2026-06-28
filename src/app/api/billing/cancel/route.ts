import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const BILLING_SERVICE_URL = "http://localhost:3030";

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(`${BILLING_SERVICE_URL}/api/billing/cancel`, {
      method: "POST",
      headers: {
        "x-user-id": session.userId,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Failed to cancel subscription" }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Gateway Billing Cancel Proxy error:", error);
    return NextResponse.json({ error: "Billing microservice unreachable" }, { status: 502 });
  }
}
