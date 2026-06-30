import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { AUTH_SERVICE_URL } from "@/lib/config";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const res = await fetch(`${AUTH_SERVICE_URL}/api/internal/users/${id}/unlock`, {
      method: "POST",
      headers: {
        "x-admin-token": "internal-admin-bypass-token"
      }
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.detail || "Failed to unlock account" }, { status: res.status });
    }

    return NextResponse.json({ success: true, message: "User unlocked successfully" });
  } catch (e) {
    console.error("Unlock gateway proxy failure:", e);
    return NextResponse.json({ error: "Auth service unreachable" }, { status: 502 });
  }
}
