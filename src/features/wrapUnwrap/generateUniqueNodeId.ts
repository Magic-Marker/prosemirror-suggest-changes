export function generateUniqueNodeId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `node-${Math.random().toString(36).slice(2)}`;
}
