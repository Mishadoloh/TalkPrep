import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const BILLING_SERVICE_URL = "http://localhost:3030";

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

    const response = await fetch(`${BILLING_SERVICE_URL}/api/billing/transaction/${id}`, {
      method: "GET",
      headers: {
        "x-user-id": session.userId,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Failed to fetch transaction" }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Gateway Get Transaction Proxy error:", error);
    return NextResponse.json({ error: "Billing microservice unreachable" }, { status: 502 });
  }
}
