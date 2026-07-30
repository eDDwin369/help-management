import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DEMO_ACCOUNTS } from "./demo-accounts";

/**
 * Provisions one of the fixed demo accounts in the backend (idempotent).
 *
 * Only the hardcoded demo emails above can be provisioned, and each one gets
 * exactly the role defined in the registry — a caller cannot request an
 * arbitrary email or an arbitrary role.
 */
export const ensureDemoAccount = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string().email() }))
  .handler(async ({ data }) => {
    const account = DEMO_ACCOUNTS.find((a) => a.email === data.email.trim().toLowerCase());
    if (!account) return { ok: false as const, error: "Not a demo account" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created } = await supabaseAdmin.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: { full_name: account.name },
    });

    let userId = created?.user?.id ?? null;

    if (!userId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", account.email)
        .maybeSingle();
      userId = profile?.id ?? null;
      if (userId) {
        // Keep the documented demo password working even if it drifted.
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: account.password,
          email_confirm: true,
        });
      }
    }

    if (!userId) return { ok: false as const, error: "Could not provision demo account" };

    await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, email: account.email, full_name: account.name }, { onConflict: "id" });

    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: account.role }, { onConflict: "user_id,role" });

    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId).neq("role", account.role);

    return { ok: true as const };
  });
