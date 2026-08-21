import { useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { HmsLauncher } from "./HmsLauncher";
import { HmsPanel } from "./HmsPanel";
import { HelpInspectorProvider } from "@/lib/inspector-context";
import { HelpInspectorBottomBar } from "@/components/help/HelpInspectorBottomBar";
import { VisualHelpHighlighter } from "@/components/help/VisualHelpHighlighter";
import { RightClickHelpMenu } from "@/components/help/RightClickHelpMenu";
import { HelpAdminRightClickModal } from "@/components/help/HelpAdminRightClickModal";
import { PageHelpReportModal } from "@/components/help/PageHelpReportModal";
import { HoverFocusHighlight } from "@/components/help/HoverFocusHighlight";

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
    <HelpInspectorProvider>
      <HmsLauncher />
      <HmsPanel />
      <VisualHelpHighlighter />
      <RightClickHelpMenu />
      <HelpAdminRightClickModal />
      <PageHelpReportModal />
      <HelpInspectorBottomBar />
      <HoverFocusHighlight />
    </HelpInspectorProvider>
  );
}

