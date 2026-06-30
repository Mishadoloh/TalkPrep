import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { AUTH_SERVICE_URL } from "@/lib/config";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await fetch(`${AUTH_SERVICE_URL}/api/internal/admin/audit-users`, {
      headers: {
        "x-admin-token": "internal-admin-bypass-token"
      }
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: res.status });
    }

    const csvText = await res.text();
    
    // Parse CSV lines into JSON
    const lines = csvText.split("\n").filter(line => line.trim() !== "");
    if (lines.length <= 1) {
      return NextResponse.json({ success: true, users: [] });
    }

    const headers = lines[0].split(",");
    const users = [];

    for (let i = 1; i < lines.length; i++) {
      const currentline = lines[i].split(",");
      if (currentline.length === headers.length) {
        users.push({
          id: currentline[0],
          email: currentline[1],
          username: currentline[2],
          isPro: currentline[3] === "PRO",
          credits: parseInt(currentline[4]) || 0,
          createdAt: currentline[5]
        });
      }
    }

    return NextResponse.json({ success: true, users });
  } catch (e) {
    console.error("Admin users proxy error:", e);
    return NextResponse.json({ error: "Auth service unreachable" }, { status: 502 });
  }
}
