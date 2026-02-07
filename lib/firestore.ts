/**
 * Firestore CRUD and queries for Runway domain.
 * All IDs are document IDs; subcollections not used for simplicity.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";
import { COLLECTIONS } from "./constants";
import type {
  StartupWorkspace,
  Milestone,
  Task,
  Sprint,
  ValidationEntry,
  LedgerEntry,
  WorkspaceMember,
  UserRole,
} from "./types";

const toMillis = (t: Timestamp | undefined) => (t ? t.toMillis() : 0);

// ---- Workspaces ----
export async function createWorkspace(
  name: string,
  stage: StartupWorkspace["stage"],
  founderId: string,
  founderEmail: string,
  founderDisplayName: string
): Promise<string> {
  const db = getFirebaseDb();
  const ref = doc(collection(db, COLLECTIONS.WORKSPACES));
  const members: WorkspaceMember[] = [
    { userId: founderId, role: "founder", email: founderEmail, displayName: founderDisplayName },
  ];
  await setDoc(ref, {
    name,
    stage,
    createdBy: founderId,
    members,
    milestoneIds: [],
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getWorkspace(workspaceId: string): Promise<StartupWorkspace | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, COLLECTIONS.WORKSPACES, workspaceId));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: snap.id,
    name: d.name,
    stage: d.stage,
    createdBy: d.createdBy,
    members: d.members ?? [],
    milestoneIds: d.milestoneIds ?? [],
    createdAt: toMillis(d.createdAt),
  };
}

export async function getWorkspacesForUser(userId: string): Promise<StartupWorkspace[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, COLLECTIONS.WORKSPACES),
    where("members", "array-contains-any", [{ userId }]), // Firestore: need to query by member userId
    orderBy("createdAt", "desc")
  );
  // Firestore doesn't support array-contains-any on objects. Use a membersUserId array for indexing.
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.WORKSPACES), orderBy("createdAt", "desc"))
  );
  const out: StartupWorkspace[] = [];
  snap.docs.forEach((s) => {
    const d = s.data();
    const members = (d.members ?? []) as WorkspaceMember[];
    if (members.some((m) => m.userId === userId)) {
      out.push({
        id: s.id,
        name: d.name,
        stage: d.stage,
        createdBy: d.createdBy,
        members: members,
        milestoneIds: d.milestoneIds ?? [],
        createdAt: toMillis(d.createdAt) || Date.now(),
      });
    }
  });
  return out;
}

// ---- Milestones ----
export async function createMilestone(
  workspaceId: string,
  title: string,
  description: string,
  order: number
): Promise<string> {
  const db = getFirebaseDb();
  const ref = doc(collection(db, COLLECTIONS.MILESTONES));
  await setDoc(ref, {
    workspaceId,
    title,
    description,
    status: "planned",
    progressPercentage: 0,
    taskIds: [],
    order,
    createdAt: serverTimestamp(),
  });
  const ws = await getWorkspace(workspaceId);
  if (ws) {
    await updateDoc(doc(db, COLLECTIONS.WORKSPACES, workspaceId), {
      milestoneIds: [...ws.milestoneIds, ref.id],
    });
  }
  return ref.id;
}

export async function getMilestones(workspaceId: string): Promise<Milestone[]> {
  const db = getFirebaseDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.MILESTONES),
      where("workspaceId", "==", workspaceId),
      orderBy("order", "asc")
    )
  );
  return snap.docs.map((s) => {
    const d = s.data();
    return {
      id: s.id,
      workspaceId: d.workspaceId,
      title: d.title,
      description: d.description,
      status: d.status,
      progressPercentage: d.progressPercentage ?? 0,
      taskIds: d.taskIds ?? [],
      order: d.order ?? 0,
      createdAt: toMillis(d.createdAt),
    };
  });
}

export async function updateMilestone(
  milestoneId: string,
  updates: Partial<Pick<Milestone, "title" | "description" | "status" | "progressPercentage">>
) {
  const db = getFirebaseDb();
  await updateDoc(doc(db, COLLECTIONS.MILESTONES, milestoneId), updates as DocumentData);
}

// ---- Tasks ----
export async function createTask(
  workspaceId: string,
  milestoneId: string,
  sprintId: string | null,
  title: string,
  ownerId: string | null
): Promise<string> {
  const db = getFirebaseDb();
  const ref = doc(collection(db, COLLECTIONS.TASKS));
  const now = Date.now();
  await setDoc(ref, {
    workspaceId,
    milestoneId,
    sprintId,
    title,
    ownerId,
    status: "todo",
    createdAt: now,
    updatedAt: now,
  });
  const milestones = await getMilestones(workspaceId);
  const m = milestones.find((x) => x.id === milestoneId);
  if (m) {
    await updateDoc(doc(db, COLLECTIONS.MILESTONES, milestoneId), {
      taskIds: [...m.taskIds, ref.id],
    });
  }
  return ref.id;
}

export async function getTasksForWorkspace(workspaceId: string): Promise<Task[]> {
  const db = getFirebaseDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.TASKS),
      where("workspaceId", "==", workspaceId),
      orderBy("updatedAt", "desc")
    )
  );
  return snap.docs.map((s) => {
    const d = s.data();
    return {
      id: s.id,
      workspaceId: d.workspaceId,
      milestoneId: d.milestoneId,
      sprintId: d.sprintId ?? null,
      title: d.title,
      ownerId: d.ownerId ?? null,
      status: d.status,
      createdAt: d.createdAt ?? 0,
      updatedAt: d.updatedAt ?? 0,
    };
  });
}

export async function getTasksForSprint(sprintId: string): Promise<Task[]> {
  const db = getFirebaseDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.TASKS),
      where("sprintId", "==", sprintId),
      orderBy("updatedAt", "desc")
    )
  );
  return snap.docs.map((s) => {
    const d = s.data();
    return {
      id: s.id,
      workspaceId: d.workspaceId,
      milestoneId: d.milestoneId,
      sprintId: d.sprintId ?? null,
      title: d.title,
      ownerId: d.ownerId ?? null,
      status: d.status,
      createdAt: d.createdAt ?? 0,
      updatedAt: d.updatedAt ?? 0,
    };
  });
}

export async function updateTask(
  taskId: string,
  updates: Partial<Pick<Task, "status" | "ownerId" | "title" | "sprintId">>
) {
  const db = getFirebaseDb();
  await updateDoc(doc(db, COLLECTIONS.TASKS, taskId), {
    ...updates,
    updatedAt: Date.now(),
  } as DocumentData);
}

// ---- Sprints ----
export async function createSprint(
  workspaceId: string,
  weekStartDate: string,
  weekEndDate: string,
  goals: { id: string; text: string }[],
  taskIds: string[],
  createdBy: string
): Promise<string> {
  const db = getFirebaseDb();
  const ref = doc(collection(db, COLLECTIONS.SPRINTS));
  await setDoc(ref, {
    workspaceId,
    weekStartDate,
    weekEndDate,
    goals,
    taskIds,
    locked: false,
    completed: false,
    completionStats: null,
    createdAt: serverTimestamp(),
    createdBy,
  });
  for (const taskId of taskIds) {
    await updateTask(taskId, { sprintId: ref.id });
  }
  return ref.id;
}

export async function getSprints(workspaceId: string): Promise<Sprint[]> {
  const db = getFirebaseDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.SPRINTS),
      where("workspaceId", "==", workspaceId),
      orderBy("createdAt", "desc"),
      limit(50)
    )
  );
  return snap.docs.map((s) => {
    const d = s.data();
    return {
      id: s.id,
      workspaceId: d.workspaceId,
      weekStartDate: d.weekStartDate,
      weekEndDate: d.weekEndDate,
      goals: d.goals ?? [],
      taskIds: d.taskIds ?? [],
      locked: d.locked ?? false,
      completed: d.completed ?? false,
      completionStats: d.completionStats ?? null,
      createdAt: toMillis(d.createdAt),
      createdBy: d.createdBy,
    };
  });
}

export async function lockSprint(sprintId: string) {
  const db = getFirebaseDb();
  await updateDoc(doc(db, COLLECTIONS.SPRINTS, sprintId), { locked: true });
}

export async function closeSprint(
  sprintId: string,
  completionStats: Sprint["completionStats"]
) {
  const db = getFirebaseDb();
  await updateDoc(doc(db, COLLECTIONS.SPRINTS, sprintId), {
    completed: true,
    completionStats: completionStats,
  });
}

export async function getSprint(sprintId: string): Promise<Sprint | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, COLLECTIONS.SPRINTS, sprintId));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: snap.id,
    workspaceId: d.workspaceId,
    weekStartDate: d.weekStartDate,
    weekEndDate: d.weekEndDate,
    goals: d.goals ?? [],
    taskIds: d.taskIds ?? [],
    locked: d.locked ?? false,
    completed: d.completed ?? false,
    completionStats: d.completionStats ?? null,
    createdAt: toMillis(d.createdAt),
    createdBy: d.createdBy,
  };
}

// ---- Validations ----
export async function createValidationEntry(
  workspaceId: string,
  sprintId: string,
  milestoneId: string,
  type: ValidationEntry["type"],
  summary: string,
  qualitativeNotes: string,
  createdBy: string
): Promise<string> {
  const db = getFirebaseDb();
  const ref = doc(collection(db, COLLECTIONS.VALIDATIONS));
  await setDoc(ref, {
    workspaceId,
    sprintId,
    milestoneId,
    type,
    summary,
    qualitativeNotes,
    createdBy,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getValidationsForWorkspace(
  workspaceId: string
): Promise<ValidationEntry[]> {
  const db = getFirebaseDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.VALIDATIONS),
      where("workspaceId", "==", workspaceId),
      orderBy("createdAt", "desc"),
      limit(100)
    )
  );
  return snap.docs.map((s) => {
    const d = s.data();
    return {
      id: s.id,
      workspaceId: d.workspaceId,
      sprintId: d.sprintId,
      milestoneId: d.milestoneId,
      type: d.type,
      summary: d.summary,
      qualitativeNotes: d.qualitativeNotes,
      createdBy: d.createdBy,
      createdAt: toMillis(d.createdAt),
    };
  });
}

// ---- Ledger (blockchain mock) ----
export async function addLedgerEntry(
  workspaceId: string,
  sprintId: string,
  type: LedgerEntry["type"],
  hash: string,
  payloadSummary: string
): Promise<string> {
  const db = getFirebaseDb();
  const ref = doc(collection(db, COLLECTIONS.LEDGER));
  await setDoc(ref, {
    workspaceId,
    sprintId,
    type,
    hash,
    timestamp: Date.now(),
    payloadSummary,
  });
  return ref.id;
}

export async function getLedgerForWorkspace(
  workspaceId: string
): Promise<LedgerEntry[]> {
  const db = getFirebaseDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.LEDGER),
      where("workspaceId", "==", workspaceId),
      orderBy("timestamp", "desc"),
      limit(50)
    )
  );
  return snap.docs.map((s) => {
    const d = s.data();
    return {
      id: s.id,
      workspaceId: d.workspaceId,
      sprintId: d.sprintId,
      type: d.type,
      hash: d.hash,
      timestamp: d.timestamp ?? 0,
      payloadSummary: d.payloadSummary ?? "",
    };
  });
}
