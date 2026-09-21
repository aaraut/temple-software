// Shared module keys — must match `module_key` values seeded in
// backend/src/main/resources/db/migration/V7__module_access_control.sql
export const MODULE_KEYS = {
  DAAN: "DAAN",
  BICHAYAT: "BICHAYAT",
  BHAKT_NIWAS: "BHAKT_NIWAS",
  REPORTS: "REPORTS",
  MASTER: "MASTER",
};

// auth.moduleAccess is only populated for roles the toggle system applies to.
// SUPER_ADMIN has no moduleAccess map and should always see every module.
export function isModuleVisible(auth, moduleKey) {
  if (!auth) return false;
  if (auth.role === "SUPER_ADMIN") return true;
  if (!auth.moduleAccess) return true;
  return auth.moduleAccess[moduleKey] !== false;
}
