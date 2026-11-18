import type { Role } from "./types";

export function homeForRole(role: Role) {
  if (role === "provider") return "/provider";
  if (role === "receiver") return "/receiver";
  return "/admin";
}
