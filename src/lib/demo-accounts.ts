import type { Role } from "./types";

/**
 * Fixed demo workspace accounts. These are throwaway sandbox logins with
 * publicly documented passwords — they exist so reviewers can jump into each
 * role instantly. Real accounts are created through sign-up and get the
 * default `customer` role.
 */
export interface DemoAccount {
  role: Role;
  email: string;
  password: string;
  name: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: "customer", email: "customer@oomnieye.com", password: "Customer@123", name: "Riya Customer" },
  { role: "customer", email: "alex.user@oomnieye.com", password: "Customer@123", name: "Alex User" },
  { role: "customer", email: "demo.viewer@oomnieye.com", password: "Customer@123", name: "Demo Viewer" },
  { role: "sub_admin", email: "subadmin@oomnieye.com", password: "SubAdmin@123", name: "Priya Natarajan" },
  { role: "sub_admin", email: "marcus.lee@oomnieye.com", password: "SubAdmin@123", name: "Marcus Lee" },
  { role: "sub_admin", email: "aisha.khan@oomnieye.com", password: "SubAdmin@123", name: "Aisha Khan" },
  { role: "admin", email: "admin@oomnieye.com", password: "Admin@123", name: "Jordan Admin" },
  { role: "admin", email: "sara.ops@oomnieye.com", password: "Admin@123", name: "Sara Ops" },
  { role: "admin", email: "chen.root@oomnieye.com", password: "Admin@123", name: "Chen Root" },
];

export function findDemoAccount(email: string): DemoAccount | undefined {
  const e = email.trim().toLowerCase();
  return DEMO_ACCOUNTS.find((a) => a.email === e);
}

/** Kept for backwards compatibility with existing imports. */
export const SAMPLE_CREDENTIALS = DEMO_ACCOUNTS;
