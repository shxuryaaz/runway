"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const SOURCE_OPTIONS = [
  { value: "", label: "Select (optional)" },
  { value: "customer", label: "Customer" },
  { value: "potential_customer", label: "Potential customer" },
  { value: "investor", label: "Investor" },
  { value: "team_member", label: "Team member" },
  { value: "other", label: "Other" },
] as const;

export default function ValidatePage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const milestoneId = params.milestoneId as string;

  const [context, setContext] = useState<{
    workspaceName: string;
    milestoneTitle: string;
    milestoneDescription: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sourceType, setSourceType] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!workspaceId || !milestoneId) return;
    const base = typeof window !== "undefined" ? window.location.origin : "";
    fetch(
      `${base}/api/validate/context?workspaceId=${encodeURIComponent(workspaceId)}&milestoneId=${encodeURIComponent(milestoneId)}`
    )
      .then((res) => {
        if (res.status === 503) {
          setError(
            "Validation links are not configured for this app. If you're the workspace owner, set FIREBASE_SERVICE_ACCOUNT_KEY in the server environment to enable public validation links."
          );
          return null;
        }
        if (!res.ok) {
          setError("This validation link is invalid or has expired.");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setContext(data);
      })
      .catch(() => setError("This validation link is invalid or has expired."))
      .finally(() => setLoading(false));
  }, [workspaceId, milestoneId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/validate/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          milestoneId,
          sourceType: sourceType || null,
          feedbackText: feedbackText.trim(),
          confidenceScore: confidenceScore ?? null,
        }),
      });
      if (!res.ok) throw new Error("Submit failed");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] dark:bg-[#111418] flex items-center justify-center p-6">
        <p className="text-gray-500 dark:text-gray-400">Loading…</p>
      </div>
    );
  }

  if (error && !context) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] dark:bg-[#111418] flex items-center justify-center p-6">
        <p className="text-gray-700 dark:text-gray-300 text-center">{error}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] dark:bg-[#111418] flex items-center justify-center p-6">
        <div className="bg-white dark:bg-[#1a2530] rounded-2xl border border-gray-200 dark:border-white/10 p-8 max-w-md text-center shadow-sm">
          <h1 className="text-xl font-bold text-[#111418] dark:text-white mb-2">
            Thanks for your feedback
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            It&apos;s been shared with the team.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] dark:bg-[#111418] flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <div className="bg-white dark:bg-[#1a2530] rounded-2xl border border-gray-200 dark:border-white/10 p-8 shadow-sm">
            <h1 className="text-xl font-bold text-[#111418] dark:text-white mb-1">
              Help us validate this idea
            </h1>
            {context && (
              <div className="mb-6 mt-4">
                <p className="text-sm font-semibold text-[#111418] dark:text-white">
                  {context.workspaceName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {context.milestoneTitle}
                </p>
                {context.milestoneDescription && (
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    {context.milestoneDescription}
                  </p>
                )}
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              This feedback will be used to improve the product. No login required.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="source" className="block text-sm font-medium text-[#111418] dark:text-white mb-1">
                  Source (optional)
                </label>
                <select
                  id="source"
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#111418] px-4 py-2.5 text-sm text-[#111418] dark:text-white"
                >
                  {SOURCE_OPTIONS.map((o) => (
                    <option key={o.value || "opt"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="feedback" className="block text-sm font-medium text-[#111418] dark:text-white mb-1">
                  Feedback (required)
                </label>
                <textarea
                  id="feedback"
                  required
                  rows={4}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="What works, what doesn't, or what's unclear?"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#111418] px-4 py-2.5 text-sm text-[#111418] dark:text-white placeholder:text-gray-400 resize-y min-h-[100px]"
                />
              </div>

              <div>
                <p className="block text-sm font-medium text-[#111418] dark:text-white mb-2">
                  How confident are you that this solves a real problem? (optional)
                </p>
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setConfidenceScore(n)}
                      className={`w-10 h-10 rounded-lg border text-sm font-medium transition-colors ${
                        confidenceScore === n
                          ? "bg-primary border-primary text-white"
                          : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting || !feedbackText.trim()}
                className="w-full rounded-lg py-3 bg-primary text-white font-bold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
              >
                {submitting ? "Submitting…" : "Submit feedback"}
              </button>
            </form>
          </div>
        </div>
      </div>
  );
}
