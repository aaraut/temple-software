export function localizeBlockName(displayName, language) {
  if (language !== "hi" || !displayName) return displayName;
  return displayName.replace(/bhaktniwas/i, "भक्त निवास");
}
