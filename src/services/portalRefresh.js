import { clearReadCache } from "./api.js";

const REFRESH_EVENT = "portal-refresh";
const ACCOUNT_EVENT = "account-updated";

export function requestPortalRefresh() {
  clearReadCache();
  window.dispatchEvent(new Event(REFRESH_EVENT));
}

export function subscribePortalRefresh(listener) {
  window.addEventListener(REFRESH_EVENT, listener);
  return () => window.removeEventListener(REFRESH_EVENT, listener);
}

export function publishAccount(account) {
  window.dispatchEvent(new CustomEvent(ACCOUNT_EVENT, { detail: account }));
}

export function subscribeAccount(listener) {
  const handler = (event) => listener(event.detail);
  window.addEventListener(ACCOUNT_EVENT, handler);
  return () => window.removeEventListener(ACCOUNT_EVENT, handler);
}
