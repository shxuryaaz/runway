/**
 * Public validation link: return only the minimal context needed for the form.
 * No private workspace data. Used by /validate/[workspaceId]/[milestoneId].
 * Scope: read-only; requires Firebase Admin (server-side).
 */

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  const milestoneId = searchParams.get("milestoneId");

  if (!workspaceId || !milestoneId) {
    return NextResponse.json(
      { error: "Missing workspaceId or milestoneId" },
      { status: 400 }
    );
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: "Validation link service not configured" },
      { status: 503 }
    );
  }

  try {
    const [wsSnap, msSnap] = await Promise.all([
      db.collection(COLLECTIONS.WORKSPACES).doc(workspaceId).get(),
      db.collection(COLLECTIONS.MILESTONES).doc(milestoneId).get(),
    ]);

    if (!wsSnap.exists || !msSnap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const wsData = wsSnap.data();
    const msData = msSnap.data();

    if (msData?.workspaceId !== workspaceId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      workspaceName: wsData?.name ?? "Startup",
      milestoneTitle: msData?.title ?? "Milestone",
      milestoneDescription: msData?.description ?? null,
    });
  } catch (e) {
    console.error("validate/context:", e);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
