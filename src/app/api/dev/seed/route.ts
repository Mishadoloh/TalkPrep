import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const AUTH_SERVICE_URL = "http://localhost:3010";
const AI_SERVICE_URL = "http://localhost:3020";
const BILLING_SERVICE_URL = "http://localhost:3030";

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = session;

    // Trigger seeding concurrently on all microservices
    const [authRes, aiRes, billingRes] = await Promise.all([
      fetch(`${AUTH_SERVICE_URL}/api/internal/dev/seed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      }),
      fetch(`${AI_SERVICE_URL}/api/internal/dev/seed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      }),
      fetch(`${BILLING_SERVICE_URL}/api/internal/dev/seed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      }),
    ]);

    if (!authRes.ok || !aiRes.ok || !billingRes.ok) {
      return NextResponse.json({ error: "One or more microservices failed to seed data" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Microservices databases seeded successfully.",
    });
  } catch (error) {
    console.error("Gateway Seeder Orchestrator error:", error);
    return NextResponse.json({ error: "One or more microservices are unreachable" }, { status: 502 });
  }
}
