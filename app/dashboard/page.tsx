"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getWorkspacesForUser } from "@/lib/firestore";
import type { StartupWorkspace } from "@/lib/types";
import { RunwayLogo } from "@/components/RunwayLogo";
import { isFirebaseConfigured } from "@/lib/firebase";

export default function DashboardWorkspacesPage() {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<StartupWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [createName, setCreateName] = useState("");
  const [createStage, setCreateStage] = useState<StartupWorkspace["stage"]>("MVP");
  const [creating, setCreating] = useState(false);
  const configured = isFirebaseConfigured();

  useEffect(() => {
    if (!user || !configured) {
      setLoading(false);
      return;
    }
    getWorkspacesForUser(user.uid)
      .then(setWorkspaces)
      .finally(() => setLoading(false));
  }, [user, configured]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !createName.trim() || !configured) return;
    setCreating(true);
    try {
      const { createWorkspace } = await import("@/lib/firestore");
      const id = await createWorkspace(
        createName.trim(),
        createStage,
        user.uid,
        user.email ?? "",
        user.displayName ?? ""
      );
      setWorkspaces((prev) => [
        ...prev,
        {
          id,
          name: createName.trim(),
          stage: createStage,
          createdBy: user.uid,
          members: [
            {
              userId: user.uid,
              role: "founder",
              email: user.email ?? undefined,
              displayName: user.displayName ?? undefined,
            },
          ],
          milestoneIds: [],
          createdAt: Date.now(),
        },
      ]);
      setCreateName("");
      setCreateStage("MVP");
    } finally {
      setCreating(false);
    }
  };

  if (!configured) {
    return (
      <div className="py-12 text-center">
        <p className="text-amber-600 dark:text-amber-400">
          Firebase not configured. Add .env.local to create workspaces.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold text-[#111418] dark:text-white">
            Startup workspaces
          </h1>
          <p className="text-gray-500 text-sm">
            Create or open a workspace to manage execution, sprints, and validation.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((ws) => (
          <Link
            key={ws.id}
            href={`/dashboard/${ws.id}`}
            className="block p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 hover:border-primary/30 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <RunwayLogo className="size-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-[#111418] dark:text-white">{ws.name}</h3>
                <p className="text-xs text-gray-500">{ws.stage}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              {ws.milestoneIds.length} milestones · You’re {ws.createdBy === user?.uid ? "founder" : "member"}
            </p>
          </Link>
        ))}

        <form
          onSubmit={handleCreate}
          className="p-6 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 flex flex-col gap-4"
        >
          <h3 className="font-bold text-[#111418] dark:text-white">New workspace</h3>
          <input
            type="text"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="Workspace name"
            required
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-[#111418] dark:text-white"
          />
          <select
            value={createStage}
            onChange={(e) => setCreateStage(e.target.value as StartupWorkspace["stage"])}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-[#111418] dark:text-white"
          >
            <option value="Idea">Idea</option>
            <option value="MVP">MVP</option>
            <option value="Early Traction">Early Traction</option>
          </select>
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create workspace"}
          </button>
        </form>
      </div>

      {!loading && workspaces.length === 0 && !createName && (
        <p className="mt-8 text-center text-gray-500">
          No workspaces yet. Create one above to get started.
        </p>
      )}
    </div>
  );
}
