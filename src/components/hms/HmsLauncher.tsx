import { useHmsStore } from "./hmsStore";
import { X } from "lucide-react";

const NAVY = "#102040";

export function HmsLauncher() {
  const { isOpen, togglePanel, state, role } = useHmsStore();
  const count =
    role === "admin"
      ? state.notifications.admin
      : role === "help-admin"
        ? state.notifications.helpAdmin
        : state.notifications.customer;

  return (
    <button
      type="button"
      onClick={togglePanel}
      aria-label={
        isOpen
          ? "Close help panel"
          : count > 0
            ? `Open help panel, ${count} new help updates`
            : "Open help panel"
      }
      aria-expanded={isOpen}
      className="fixed flex items-center justify-center text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3B6BF5]"
      style={{
        right: 24,
        bottom: 24,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: NAVY,
        zIndex: 9999,
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.10), 0 10px 24px rgba(0,0,0,0.16)",
      }}
    >
      {isOpen ? (
        <X style={{ width: 16, height: 16 }} strokeWidth={2.5} />
      ) : (
        <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>✦</span>
      )}
      {!isOpen && count > 0 && (
        <span
          aria-hidden="true"
          className="absolute flex items-center justify-center rounded-full text-white font-bold"
          style={{
            top: -4,
            right: -4,
            width: 14,
            height: 14,
            // Help admins get an amber "new request" cue; others stay red.
            backgroundColor: role === "help-admin" ? "#F59E0B" : "#EF4444",
            border: "1.5px solid #FFFFFF",
            fontSize: 8,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
