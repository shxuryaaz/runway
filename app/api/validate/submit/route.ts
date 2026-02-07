/**
 * Public validation link: submit feedback. No auth required.
 * Validates workspace + milestone server-side, then creates one immutable
 * validation entry with origin "external_link". Scope: single write; Firebase Admin only.
 */

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import type { ValidationSourceType } from "@/lib/types";

const SOURCE_TYPES: ValidationSourceType[] = [
  "customer",
  "potential_customer",
  "investor",
  "team_member",
  "other",
];

export interface ValidateSubmitBody {
  workspaceId: string;
  milestoneId: string;
  sprintId?: string | null;
  sourceType?: ValidationSourceType | null;
  feedbackText: string;
  confidenceScore?: number | null;
}

export async function POST(request: Request) {
  const db = getAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: "Validation link service not configured" },
      { status: 503 }
    );
  }

  let body: ValidateSubmitBody;
  try {
    body = (await request.json()) as ValidateSubmitBody;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { workspaceId, milestoneId, feedbackText } = body;
  if (!workspaceId || !milestoneId || typeof feedbackText !== "string") {
    return NextResponse.json(
      { error: "workspaceId, milestoneId, and feedbackText are required" },
      { status: 400 }
    );
  }

  const trimmedFeedback = feedbackText.trim();
  if (trimmedFeedback.length === 0) {
    return NextResponse.json(
      { error: "feedbackText is required" },
      { status: 400 }
    );
  }

  const sourceType =
    body.sourceType && SOURCE_TYPES.includes(body.sourceType)
      ? body.sourceType
      : null;
  let confidenceScore: number | null = null;
  if (typeof body.confidenceScore === "number" && body.confidenceScore >= 1 && body.confidenceScore <= 5) {
    confidenceScore = Math.round(body.confidenceScore);
  }

  try {
    const msRef = db.collection(COLLECTIONS.MILESTONES).doc(milestoneId);
    const msSnap = await msRef.get();
    if (!msSnap.exists || msSnap.data()?.workspaceId !== workspaceId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let sprintId: string | null = body.sprintId ?? null;
    if (!sprintId) {
      const sprintsSnap = await db
        .collection(COLLECTIONS.SPRINTS)
        .where("workspaceId", "==", workspaceId)
        .where("completed", "==", false)
        .limit(1)
        .get();
      if (!sprintsSnap.empty) {
        sprintId = sprintsSnap.docs[0].id;
      }
    }

    const ref = db.collection(COLLECTIONS.VALIDATIONS).doc();
    await ref.set({
      workspaceId,
      milestoneId,
      sprintId,
      type: "survey",
      summary: trimmedFeedback.slice(0, 500),
      qualitativeNotes: "",
      createdBy: null,
      createdAt: new Date(),
      origin: "external_link",
      sourceType,
      feedbackText: trimmedFeedback,
      confidenceScore,
    });

    return NextResponse.json({ ok: true, id: ref.id });
  } catch (e) {
    console.error("validate/submit:", e);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
