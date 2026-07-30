import { useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { HmsLauncher } from "./HmsLauncher";
import { HmsPanel } from "./HmsPanel";

/**
 * Mounts the HMS launcher + panel only where help is available:
 * signed-in application screens. The login screen never shows them.
 */
export function HmsSurface() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isLoading } = useAuth();

  if (isLoading || !user) return null;
  if (pathname.startsWith("/login")) return null;

  return (
    <>
      <HmsLauncher />
      <HmsPanel />
    </>
  );
}
