// src/stubs/start-storage-context.ts
// Browser-safe stubs for ALL TanStack Start server-only packages.
// Aliased in vite.spa.config.ts to:
//   @tanstack/start-storage-context
//   @tanstack/start-fn-stubs
//   @tanstack/start-server-core
//   @tanstack/react-start/server

// ── start-storage-context ────────────────────────────────────────────────────
export const getStartContext = () => null;
export const runWithStartContext = (_ctx: unknown, fn: () => unknown) => fn();
export const getGlobalStartContext = () => null;

// ── start-fn-stubs ───────────────────────────────────────────────────────────
// createIsomorphicFn().client(fn).server(fn) — only the client branch runs in SPA
const chainable = (clientFn?: () => unknown) => {
  const self: any = clientFn ? clientFn : () => undefined;
  self.client = (fn: () => unknown) => chainable(fn);
  self.server = (_fn: () => unknown) => chainable(clientFn);
  return self;
};
export const createIsomorphicFn = () => chainable();
export const createClientOnlyFn = (fn: () => unknown) => fn;
export const createServerOnlyFn = () => () => undefined;

// ── start-server-core & react-start/server ───────────────────────────────────
const noop   = () => undefined;
const nullFn = () => null;
const objFn  = () => ({});

export const clearResponseHeaders  = noop;
export const clearSession          = noop;
export const deleteCookie          = noop;
export const getCookie             = nullFn;
export const getCookies            = objFn;
export const getRequest            = nullFn;
export const getRequestHeader      = nullFn;
export const getRequestHeaders     = objFn;
export const getRequestHost        = () => "";
export const getRequestIP          = nullFn;
export const getRequestProtocol    = () => "https";
export const getRequestUrl         = () => "";
export const getResponse           = nullFn;
export const getResponseHeader     = nullFn;
export const getResponseHeaders    = objFn;
export const getResponseStatus     = () => 200;
export const getSession            = nullFn;
export const getValidatedQuery     = objFn;
export const removeResponseHeader  = noop;
export const requestHandler        = noop;
export const sealSession           = nullFn;
export const setCookie             = noop;
export const setResponseHeader     = noop;
export const setResponseHeaders    = noop;
export const setResponseStatus     = noop;
export const unsealSession         = nullFn;
export const updateSession         = noop;
export const useSession            = nullFn;
export const HEADERS               = {};
export const VIRTUAL_MODULES       = {};
export const createStartHandler    = () => noop;
export const attachRouterServerSsrUtils         = noop;
export const createRequestHandler              = () => noop;
export const defineHandlerCallback             = () => noop;
export const transformPipeableStreamWithRouter  = noop;
export const transformReadableStreamWithRouter  = noop;

// createMiddleware — used in auth-attacher.ts and auth-middleware.ts
// In SPA mode these middleware files are imported but the .server() chain
// never executes — only .client() does. Return a chainable no-op.
const mwChain: any = { client: (fn: any) => { mwChain._clientFn = fn; return mwChain; }, server: () => mwChain, _clientFn: null };
export const createMiddleware = (_opts?: unknown) => ({ ...mwChain });

export default {};
