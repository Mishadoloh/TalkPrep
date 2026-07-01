import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { AUTH_SERVICE_URL } from "@/lib/config";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { oldPassword, newPassword } = await req.json();

    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/update-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: session.userId, oldPassword, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      let errorMessage = "Failed to update password";
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
        errorMessage = data.error || data.detail || "Failed to update password";
      }
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    return NextResponse.json({ success: true, message: data.message });
  } catch (error) {
    console.error("Gateway Update Password error:", error);
    return NextResponse.json({ error: "Auth microservice unreachable" }, { status: 502 });
  }
}
