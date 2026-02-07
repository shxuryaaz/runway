/**
 * Execution & Validation Ledger — blockchain trust layer (mock).
 * Stores hash + timestamp only. No tokens, no wallets.
 * TODO: Replace with testnet/real chain for production.
 */

export function hashPayload(payload: string): string {
  // Mock: deterministic "hash" for demo. In production use SHA-256 or submit to chain.
  let h = 0;
  for (let i = 0; i < payload.length; i++) {
    const c = payload.charCodeAt(i);
    h = (h << 5) - h + c;
    h = h & h;
  }
  const hex = Math.abs(h).toString(16).padStart(8, "0");
  return `0x${hex}${payload.length.toString(16).padStart(4, "0")}${Date.now().toString(16).slice(-6)}`;
}

export function hashSprintCommitment(sprintId: string, goals: { id: string; text: string }[], taskIds: string[]): string {
  const payload = JSON.stringify({
    sprintId,
    goals: goals.map((g) => g.text),
    taskIds: taskIds.sort(),
    type: "commitment",
  });
  return hashPayload(payload);
}

export function hashSprintCompletion(
  sprintId: string,
  completionPercentage: number,
  tasksCompleted: number,
  tasksTotal: number,
  blockedTaskIds: string[],
  missedGoalIds: string[]
): string {
  const payload = JSON.stringify({
    sprintId,
    completionPercentage,
    tasksCompleted,
    tasksTotal,
    blockedTaskIds,
    missedGoalIds,
    type: "completion",
  });
  return hashPayload(payload);
}
