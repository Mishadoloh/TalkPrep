import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { BILLING_SERVICE_URL } from "@/lib/config";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Call Billing Service admin endpoint injecting secure token
    const res = await fetch(`${BILLING_SERVICE_URL}/api/internal/admin/metrics`, {
      headers: {
        "x-admin-token": "internal-admin-bypass-token"
      }
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error || "Failed to load admin metrics" }, { status: res.status });
    }

    return NextResponse.json({
      success: true,
      metrics: data.metrics
    });
  } catch (e) {
    console.error("Admin metrics gateway proxy failure:", e);
    return NextResponse.json({ error: "Billing service unreachable" }, { status: 502 });
  }
}
