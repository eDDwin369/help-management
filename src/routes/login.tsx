import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Eye, EyeOff, Loader2, Sparkles, Shield, Users, UserCog } from "lucide-react";
import { toast } from "sonner";
import { DEMO_ACCOUNTS } from "@/lib/demo-accounts";
import { ensureDemoAccount } from "@/lib/demo-auth.functions";



type AppRedirect = "/dashboard" | "/tickets";

function normalizeRedirect(value: unknown): AppRedirect {
  return value === "/tickets" || value === "/dashboard" ? value : "/dashboard";
}

const LOGIN_URL = "https://help-management-flows.lovable.app/login";
const LOGIN_TITLE = "Sign in · OomniEye Help Management";
const LOGIN_DESC =
  "Sign in to the OomniEye workspace to manage contextual help content, support tickets, and role-based access for your organization.";

export const Route = createFileRoute("/login")({
  validateSearch: (search) => ({ redirect: normalizeRedirect(search.redirect) }),
  component: LoginPage,
  head: () => ({
    meta: [
      { title: LOGIN_TITLE },
      { name: "description", content: LOGIN_DESC },
      { property: "og:title", content: LOGIN_TITLE },
      { property: "og:description", content: LOGIN_DESC },
      { property: "og:url", content: LOGIN_URL },
      { name: "twitter:title", content: LOGIN_TITLE },
      { name: "twitter:description", content: LOGIN_DESC },
    ],
    links: [{ rel: "canonical", href: LOGIN_URL }],
  }),
});


function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && user) navigate({ to: search.redirect, replace: true });
  }, [isLoading, user, navigate, search.redirect]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading workspace…</div>
      </div>
    );
  }

  const isDemoEmail = DEMO_ACCOUNTS.some((c) => c.email === email.trim().toLowerCase());
  const canSubmit = email.trim().length > 3 && password.length >= 8 && !loading;

  const onLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      let res = await login(email.trim(), password);
      // Demo workspace accounts are provisioned server-side on first use.
      if (!res.ok && isDemoEmail) {
        const provision = await ensureDemoAccount({ data: { email: email.trim().toLowerCase() } });
        if (!provision.ok) {
          toast.error(provision.error ?? "Could not prepare demo account");
          return;
        }
        res = await login(email.trim(), password);
      }
      if (!res.ok) toast.error(res.error ?? "Login failed");
      else navigate({ to: search.redirect });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Demo workspace credentials: clicking a card only POPULATES the form.
   * The user must press "Sign in" themselves — no automatic login.
   */
  const useDemoAccount = (demoEmail: string, demoPassword: string) => {
    setMode("signin");
    setEmail(demoEmail);
    setPassword(demoPassword);
    toast.success("Credentials filled — press Sign in to continue");
  };

  const roleGroups = [
    { key: "customer", label: "Customer", icon: Users, tint: "from-blue-500 to-cyan-500" },
    { key: "sub_admin", label: "Help Admin", icon: UserCog, tint: "from-violet-500 to-fuchsia-500" },
    { key: "admin", label: "Admin", icon: Shield, tint: "from-emerald-500 to-teal-500" },
  ] as const;


  return (
    <div className="h-screen overflow-y-auto grid lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.4),transparent_60%),radial-gradient(circle_at_70%_80%,rgba(244,114,182,0.3),transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <div className="size-9 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <Sparkles className="size-5" />
            </div>
            OomniEye
          </div>
        </div>
        <div className="relative max-w-md">
          <div className="text-xs uppercase tracking-widest text-white/60 mb-3">
            Enterprise Help Platform
          </div>
          <h1 className="text-4xl font-semibold leading-tight">
            Contextual help, ticketing & content management — built for Fortune-500 teams.
          </h1>
          <p className="text-white/70 mt-4 leading-relaxed">
            Right-click any action button to get instant help, ask support, or browse FAQs — without
            ever leaving the screen.
          </p>
        </div>
        <div className="relative text-xs text-white/50">
          © 2026 OomniEye · Digital Twin Solutions
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          <div>
            <div className="lg:hidden flex items-center gap-2 mb-6 text-lg font-semibold">
              <Sparkles className="size-5 text-primary" /> OomniEye
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Sign in to your workspace</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back. Enter your credentials to continue.
            </p>
          </div>

          <Tabs value="signin">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger
                value="signup"
                disabled
                title="Sign up is disabled — accounts are provisioned by your administrator"
              >
                Sign up
              </TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-4">
              <form className="space-y-3" onSubmit={onLogin}>
                <div className="space-y-1.5">
                  <Label>Work email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <div className="relative">
                    <Input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((s) => !s)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                      aria-label={showPwd ? "Hide password" : "Show password"}
                    >
                      {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={!canSubmit}>
                  {loading && <Loader2 className="size-4 animate-spin mr-1.5" />}
                  Sign in
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <Card className="p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Demo credentials
            </div>
            <Tabs defaultValue="customer">
              <TabsList className="w-full grid grid-cols-3">
                {roleGroups.map((g) => (
                  <TabsTrigger key={g.key} value={g.key}>
                    <g.icon className="size-3.5 mr-1.5" /> {g.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {roleGroups.map((g) => (
                <TabsContent key={g.key} value={g.key} className="mt-3 space-y-1.5">
                  {DEMO_ACCOUNTS.filter((c) => c.role === g.key).map((c) => (
                    <button
                      key={c.email}
                      onClick={() => void useDemoAccount(c.email, c.password)}
                      disabled={loading}
                      type="button"
                      className="w-full text-left p-2.5 rounded-lg border hover:border-primary/40 hover:bg-muted/40 transition-colors group disabled:opacity-60"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{c.name}</div>
                        <div
                          className={`text-[10px] uppercase tracking-wider bg-gradient-to-r ${g.tint} bg-clip-text text-transparent font-semibold`}
                        >
                          Use
                        </div>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        {c.email}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        pwd: {c.password}
                      </div>
                    </button>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          </Card>



        </div>
      </div>
    </div>
  );
}
