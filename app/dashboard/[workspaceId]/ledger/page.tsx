"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getWorkspace, getLedgerForWorkspace } from "@/lib/firestore";
import type { StartupWorkspace, LedgerEntry } from "@/lib/types";

export default function LedgerPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [workspace, setWorkspace] = useState<StartupWorkspace | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    getWorkspace(workspaceId).then(setWorkspace);
    getLedgerForWorkspace(workspaceId).then(setEntries).finally(() => setLoading(false));
  }, [workspaceId]);

  if (!workspace) {
    return (
      <div className="py-12">
        <p className="text-gray-500">Workspace not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-[#111418] dark:text-white">
          Execution &amp; Validation Ledger
        </h1>
        <p className="text-gray-500 text-sm">
          Sprint commitments and completion summaries are hashed and timestamped for integrity. No tokens or wallets.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading ledger…</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No ledger entries yet. Lock or close a sprint to generate hashes.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {entries.map((e) => (
              <li key={e.id} className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">
                      {e.type === "commitment" ? "lock" : "check_circle"}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-[#111418] dark:text-white capitalize">{e.type}</p>
                    <p className="text-xs text-gray-500">{e.payloadSummary}</p>
                  </div>
                </div>
                <div className="flex-1 font-mono text-xs text-gray-500 truncate" title={e.hash}>
                  {e.hash}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(e.timestamp).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
