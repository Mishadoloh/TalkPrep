import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { BILLING_SERVICE_URL } from "@/lib/config";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await fetch(`${BILLING_SERVICE_URL}/api/internal/admin/audit-transactions`, {
      headers: {
        "x-admin-token": "internal-admin-bypass-token"
      }
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch transaction logs" }, { status: res.status });
    }

    const csvText = await res.text();
    
    // Parse CSV lines into JSON
    const lines = csvText.split("\n").filter(line => line.trim() !== "");
    if (lines.length <= 1) {
      return NextResponse.json({ success: true, transactions: [] });
    }

    const headers = lines[0].split(",");
    const transactions = [];

    for (let i = 1; i < lines.length; i++) {
      const currentline = lines[i].split(",");
      if (currentline.length === headers.length) {
        transactions.push({
          id: currentline[0],
          userId: currentline[1],
          amount: parseFloat(currentline[2]) || 0.0,
          credits: parseInt(currentline[3]) || 0,
          type: currentline[4],
          status: currentline[5],
          createdAt: currentline[6]
        });
      }
    }

    return NextResponse.json({ success: true, transactions });
  } catch (e) {
    console.error("Admin transactions proxy error:", e);
    return NextResponse.json({ error: "Billing service unreachable" }, { status: 502 });
  }
}
