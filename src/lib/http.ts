// ============================================================
// HTTP client: token storage, Bearer auth, auto refresh-on-401,
// and unified { success, data, error, meta } envelope handling.
// ============================================================
import { API_BASE_URL } from "./config";

const ACCESS_KEY = "app_token";
const REFRESH_KEY = "app_refresh_token";

export class ApiError extends Error {
  status: number;
  code: string;
  detail: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.detail = message;
  }
}

// ------------------------------------------------------------
// Token store (memory mirror + localStorage)
// ------------------------------------------------------------
let memAccess: string | null = null;
let memRefresh: string | null = null;

const hasWindow = () => typeof window !== "undefined";

export const tokenStore = {
  get access(): string | null {
    if (memAccess) return memAccess;
    memAccess = hasWindow() ? localStorage.getItem(ACCESS_KEY) : null;
    return memAccess;
  },
  get refresh(): string | null {
    if (memRefresh) return memRefresh;
    memRefresh = hasWindow() ? localStorage.getItem(REFRESH_KEY) : null;
    return memRefresh;
  },
  set(access: string, refresh?: string) {
    memAccess = access;
    if (hasWindow()) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) {
      memRefresh = refresh;
      if (hasWindow()) localStorage.setItem(REFRESH_KEY, refresh);
    }
  },
  clear() {
    memAccess = null;
    memRefresh = null;
    if (hasWindow()) {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
    }
  },
};

// Broadcast a forced logout so AuthContext can react (clear user / redirect).
export function forceLogout() {
  tokenStore.clear();
  if (hasWindow()) window.dispatchEvent(new CustomEvent("app:force-logout"));
}

// ------------------------------------------------------------
// Core request pipeline
// ------------------------------------------------------------
interface RequestOpts {
  auth?: boolean; // attempt refresh-on-401 (default true)
  retry?: boolean; // internal
}

function buildHeaders(init: RequestInit): Headers {
  const headers = new Headers(init.headers);
  const access = tokenStore.access;
  if (access) headers.set("Authorization", `Bearer ${access}`);
  return headers;
}

function unwrap(status: number, body: any): any {
  if (body && typeof body.success === "boolean") {
    if (body.success) return body.data;
    const err = body.error ?? {};
    throw new ApiError(status, err.code ?? "UNKNOWN", err.message ?? "Request failed.");
  }
  if (status < 200 || status >= 300) {
    throw new ApiError(status, "HTTP_ERROR", `Request failed (${status}).`);
  }
  return body;
}

let refreshPromise: Promise<void> | null = null;

async function doRefresh(): Promise<void> {
  const refresh = tokenStore.refresh;
  if (!refresh) {
    forceLogout();
    throw new ApiError(401, "INVALID_REFRESH_TOKEN", "Session expired. Please log in again.");
  }
  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success || !body?.data?.access_token) {
    forceLogout();
    throw new ApiError(401, "INVALID_REFRESH_TOKEN", "Session expired. Please log in again.");
  }
  tokenStore.set(body.data.access_token, body.data.refresh_token);
}

async function request(path: string, init: RequestInit = {}, opts: RequestOpts = {}): Promise<any> {
  const { auth = true, retry = true } = opts;
  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: buildHeaders(init) });
  const body = await res.json().catch(() => null);
  const code: string | undefined = body?.error?.code;

  if (
    auth &&
    retry &&
    res.status === 401 &&
    code === "INVALID_ACCESS_TOKEN" &&
    tokenStore.refresh
  ) {
    if (!refreshPromise) {
      refreshPromise = doRefresh().finally(() => {
        refreshPromise = null;
      });
    }
    await refreshPromise;
    return request(path, init, { auth, retry: false });
  }

  return unwrap(res.status, body);
}

// ------------------------------------------------------------
// Verb helpers
// ------------------------------------------------------------
export function getJson(path: string, opts?: RequestOpts) {
  return request(path, { method: "GET" }, opts);
}

export function postJson(path: string, body: unknown, opts?: RequestOpts) {
  return request(
    path,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    opts,
  );
}

export function patchJson(path: string, body: unknown, opts?: RequestOpts) {
  return request(
    path,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    opts,
  );
}

export function postForm(path: string, form: FormData, opts?: RequestOpts) {
  // Do NOT set Content-Type for FormData — the browser sets the boundary.
  return request(path, { method: "POST", body: form }, opts);
}

export function del(path: string, opts?: RequestOpts) {
  return request(path, { method: "DELETE" }, opts);
}
