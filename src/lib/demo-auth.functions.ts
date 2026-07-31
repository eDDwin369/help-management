// src/lib/demo-auth.functions.ts
//
// In SSR/Cloudflare mode this file used createServerFn to provision
// demo accounts via the Supabase admin client on the server.
//
// In SPA/Netlify mode there is no server runtime, so we replace it with
// a client-side stub that always returns { ok: true }.
//
// The demo accounts are pre-provisioned in the Supabase project already.
// Standard Supabase signInWithPassword works for them without any extra step.

export const ensureDemoAccount = async (
  _args: { data: { email: string } }
): Promise<{ ok: true } | { ok: false; error: string }> => {
  return { ok: true };
};
