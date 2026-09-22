import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/AppShell";
import { DEMO_ACCOUNTS } from "@/lib/demo-accounts";
import { useHmsStore } from "@/components/hms/hmsStore";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Shield, UserCog, UserCheck, CheckCircle2, Mail, KeyRound } from "lucide-react";

const USER_URL = "https://help-management-flows.lovable.app/user";
const USER_TITLE = "Users & Access · OomniEye";
const USER_DESC = "Manage workspace user directory, roles, and access credentials.";

export const Route = createFileRoute("/user")({
  component: UserPage,
  head: () => ({
    meta: [
      { title: USER_TITLE },
      { name: "description", content: USER_DESC },
      { property: "og:title", content: USER_TITLE },
      { property: "og:description", content: USER_DESC },
      { property: "og:url", content: USER_URL },
      { name: "twitter:title", content: USER_TITLE },
      { name: "twitter:description", content: USER_DESC },
    ],
    links: [{ rel: "canonical", href: USER_URL }],
  }),
});

function UserPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { setSection } = useHmsStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: "/login", search: { redirect: "/user" }, replace: true });
    }
  }, [isLoading, user, navigate]);

  useEffect(() => {
    setSection("section-user-directory");
  }, [setSection]);

  const filteredUsers = useMemo(() => {
    return DEMO_ACCOUNTS.filter((acc) => {
      const matchesSearch =
        acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || acc.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [searchQuery, roleFilter]);

  if (isLoading || !user) return null;

  const roleMeta = {
    customer: {
      label: "Customer",
      icon: UserCheck,
      badgeClass: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      description: "Standard access, view recordings & browse contextual help",
    },
    sub_admin: {
      label: "Help Admin",
      icon: UserCog,
      badgeClass: "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      description: "Author & edit help articles, submit for review",
    },
    admin: {
      label: "Superadmin",
      icon: Shield,
      badgeClass: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      description: "Full administrative governance, publish articles & configure settings",
    },
  };

  const totalCount = DEMO_ACCOUNTS.length;
  const customerCount = DEMO_ACCOUNTS.filter((u) => u.role === "customer").length;
  const subAdminCount = DEMO_ACCOUNTS.filter((u) => u.role === "sub_admin").length;
  const adminCount = DEMO_ACCOUNTS.filter((u) => u.role === "admin").length;

  return (
    <AppShell>
      <div className="p-6 max-w-[1600px] mx-auto relative h-full flex flex-col min-h-0 overflow-y-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-normal tracking-tight text-slate-900 dark:text-white">
                Users & Access
              </h1>
              <Badge variant="outline" className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                {totalCount} Total Accounts
              </Badge>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Workspace user directory, role assignments, and permission profiles.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs py-1 px-2.5 font-normal text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800">
              Active User: <span className="font-semibold text-slate-900 dark:text-white ml-1">{user.name}</span>
              <span className="ml-1.5 uppercase font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">
                {user.role}
              </span>
            </Badge>
          </div>
        </div>

        {/* Role Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => setRoleFilter(roleFilter === "customer" ? "all" : "customer")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-slate-900 ${
              roleFilter === "customer"
                ? "border-blue-500 shadow-sm ring-1 ring-blue-500/30"
                : "border-slate-100 dark:border-slate-800 hover:border-slate-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <UserCheck className="size-4.5" />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{customerCount}</span>
            </div>
            <div className="mt-3 font-semibold text-sm text-slate-900 dark:text-white">Customers</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Standard workspace viewers</div>
          </div>

          <div
            onClick={() => setRoleFilter(roleFilter === "sub_admin" ? "all" : "sub_admin")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-slate-900 ${
              roleFilter === "sub_admin"
                ? "border-purple-500 shadow-sm ring-1 ring-purple-500/30"
                : "border-slate-100 dark:border-slate-800 hover:border-slate-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <UserCog className="size-4.5" />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{subAdminCount}</span>
            </div>
            <div className="mt-3 font-semibold text-sm text-slate-900 dark:text-white">Help Admins</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Content authors & editors</div>
          </div>

          <div
            onClick={() => setRoleFilter(roleFilter === "admin" ? "all" : "admin")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-slate-900 ${
              roleFilter === "admin"
                ? "border-emerald-500 shadow-sm ring-1 ring-emerald-500/30"
                : "border-slate-100 dark:border-slate-800 hover:border-slate-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Shield className="size-4.5" />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{adminCount}</span>
            </div>
            <div className="mt-3 font-semibold text-sm text-slate-900 dark:text-white">Superadmins</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">System governance & approvals</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or email..."
              className="pl-9 text-xs h-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {(["all", "customer", "sub_admin", "admin"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  roleFilter === r
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {r === "all" ? "All Roles" : r === "sub_admin" ? "Help Admin" : r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* User Accounts Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Workspace Members</span>
            </div>
            <span className="text-xs text-slate-400">
              Showing {filteredUsers.length} of {totalCount} users
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredUsers.map((acc) => {
              const meta = roleMeta[acc.role];
              const IconComp = meta.icon;
              const isCurrentUser = user.email === acc.email;

              return (
                <div
                  key={acc.email}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs border border-slate-200 dark:border-slate-700 shrink-0">
                      {acc.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{acc.name}</span>
                        {isCurrentUser && (
                          <Badge className="text-[10px] py-0 px-1.5 bg-sky-500 hover:bg-sky-500 text-white font-semibold">
                            You
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <Mail className="size-3" />
                        <span>{acc.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`text-xs py-1 px-2.5 flex items-center gap-1.5 ${meta.badgeClass}`}>
                      <IconComp className="size-3" />
                      <span>{meta.label}</span>
                    </Badge>

                    <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Active</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
