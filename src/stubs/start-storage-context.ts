// src/stubs/start-storage-context.ts
// Stubs ALL server-only @tanstack/start-* packages for the SPA/Netlify build.
// Three packages are aliased to this single file in vite.spa.config.ts:
//   @tanstack/start-storage-context
//   @tanstack/start-fn-stubs
//   @tanstack/start-server-core

// ─── @tanstack/start-storage-context ─────────────────────────────────────────
// Real exports: getStartContext, runWithStartContext
export const getStartContext = () => null;
export const runWithStartContext = (_ctx: unknown, fn: () => unknown) => fn();

// ─── @tanstack/start-fn-stubs ─────────────────────────────────────────────────
// Real exports: createIsomorphicFn, createClientOnlyFn, createServerOnlyFn
const chainable = () => {
  const fn: any = () => undefined;
  fn.client = () => chainable();
  fn.server = () => chainable();
  return fn;
};
export const createIsomorphicFn  = chainable;
export const createClientOnlyFn  = chainable;
export const createServerOnlyFn  = chainable;

// ─── @tanstack/start-server-core ─────────────────────────────────────────────
// Real exports: every request/response/session/cookie helper + SSR routing
const noop     = () => undefined;
const nullFn   = () => null;
const emptyObj = () => ({});
const emptyArr = () => [];

export const clearResponseHeaders  = noop;
export const clearSession          = noop;
export const deleteCookie          = noop;
export const getCookie             = nullFn;
export const getCookies            = emptyObj;
export const getRequest            = nullFn;
export const getRequestHeader      = nullFn;
export const getRequestHeaders     = emptyObj;
export const getRequestHost        = () => "";
export const getRequestIP          = nullFn;
export const getRequestProtocol    = () => "https";
export const getRequestUrl         = () => "";
export const getResponse           = nullFn;
export const getResponseHeader     = nullFn;
export const getResponseHeaders    = emptyObj;
export const getResponseStatus     = () => 200;
export const getSession            = nullFn;
export const getValidatedQuery     = emptyObj;
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
export const attachRouterServerSsrUtils        = noop;
export const createRequestHandler             = () => noop;
export const defineHandlerCallback            = () => noop;
export const transformPipeableStreamWithRouter = noop;
export const transformReadableStreamWithRouter = noop;

// ─── @tanstack/start-client-core (server-side pieces only) ───────────────────
// The client pieces of start-client-core are NOT stubbed — they're real.
// Only these server-context imports need stubbing when pulled transitively:
export const getGlobalStartContext = nullFn;

// Default export fallback
export default {};
