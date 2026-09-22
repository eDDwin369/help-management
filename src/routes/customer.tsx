import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/AppShell";
import { ModernUserDashboard } from "@/components/admin/ModernUserDashboard";
import { useHmsStore } from "@/components/hms/hmsStore";

const CUSTOMER_URL = "https://help-management-flows.lovable.app/customer";
const CUSTOMER_TITLE = "Customer Dashboard · OomniEye";
const CUSTOMER_DESC =
  "Customer operational digital twin dashboard with interactive review queue, widget customization, and operational telemetry.";

export const Route = createFileRoute("/customer")({
  component: CustomerPage,
  head: () => ({
    meta: [
      { title: CUSTOMER_TITLE },
      { name: "description", content: CUSTOMER_DESC },
      { property: "og:title", content: CUSTOMER_TITLE },
      { property: "og:description", content: CUSTOMER_DESC },
      { property: "og:url", content: CUSTOMER_URL },
      { name: "twitter:title", content: CUSTOMER_TITLE },
      { name: "twitter:description", content: CUSTOMER_DESC },
    ],
    links: [{ rel: "canonical", href: CUSTOMER_URL }],
  }),
});

function CustomerPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { setSection } = useHmsStore();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: "/login", search: { redirect: "/customer" }, replace: true });
    }
  }, [isLoading, user, navigate]);

  useEffect(() => {
    setSection("section-customer-dashboard");
  }, [setSection]);

  if (isLoading || !user) return null;

  return (
    <AppShell>
      <div className="p-6 max-w-[1600px] mx-auto relative h-full flex flex-col min-h-0 overflow-hidden space-y-3">
        <h1 className="sr-only">Customer Dashboard</h1>
        <div className="flex-1 min-h-0 overflow-hidden">
          <ModernUserDashboard
            onOpenReview={() => {
              navigate({ to: "/admin", search: { tab: "content" } });
            }}
          />
        </div>
      </div>
    </AppShell>
  );
}
