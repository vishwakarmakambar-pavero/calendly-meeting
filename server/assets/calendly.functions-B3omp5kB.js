import { T as TSS_SERVER_FUNCTION, a as createServerFn } from "./server-CCtegYzN.js";
import { z } from "zod";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "react";
import "@tanstack/react-router";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
var createServerRpc = (serverFnMeta, splitImportFn) => {
  const url = "/_serverFn/" + serverFnMeta.id;
  return Object.assign(splitImportFn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
const API = "https://api.calendly.com";
function getToken() {
  const token = process.env.CALENDLY_API_TOKEN;
  if (!token) throw new Error("CALENDLY_API_TOKEN is not configured");
  return token;
}
async function calendly(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Calendly API ${res.status}: ${body}`);
  }
  return res.json();
}
let cachedEventTypeUri = null;
async function resolveEventTypeUri(token) {
  if (cachedEventTypeUri) return cachedEventTypeUri;
  const env = process.env.CALENDLY_EVENT_TYPE_URI?.trim();
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (env) {
    if (env.startsWith("https://api.calendly.com/event_types/")) {
      cachedEventTypeUri = env;
      return env;
    }
    if (uuidRe.test(env)) {
      cachedEventTypeUri = `${API}/event_types/${env}`;
      return cachedEventTypeUri;
    }
  }
  const me = await calendly("/users/me", token);
  const userUri = me.resource.uri;
  const list = await calendly(`/event_types?user=${encodeURIComponent(userUri)}&active=true&count=10`, token);
  const first = list.collection?.[0]?.uri;
  if (!first) throw new Error("No active Calendly event types found for this user");
  cachedEventTypeUri = first;
  return first;
}
const getEventInfo_createServerFn_handler = createServerRpc({
  id: "4fd69b7cb64aa7aeb23305e8f2ddd74aa8618f32c439eac51450a616be487030",
  name: "getEventInfo",
  filename: "src/lib/calendly.functions.ts"
}, (opts) => getEventInfo.__executeServer(opts));
const getEventInfo = createServerFn({
  method: "GET"
}).handler(getEventInfo_createServerFn_handler, async () => {
  try {
    const token = getToken();
    const uri = await resolveEventTypeUri(token);
    const path = uri.replace(API, "");
    const data = await calendly(path, token);
    const r = data.resource;
    return {
      ok: true,
      name: r.name,
      duration: r.duration,
      location: (r.location?.kind || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      scheduling_url: r.scheduling_url,
      uri: r.uri,
      profile_name: r.profile?.name
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e)
    };
  }
});
const SlotsInput = z.object({
  date: z.string()
});
const getAvailableSlots_createServerFn_handler = createServerRpc({
  id: "69798583219c39585501ac6cbd7dfdadb159f6da44b8197f156b96d17173b49a",
  name: "getAvailableSlots",
  filename: "src/lib/calendly.functions.ts"
}, (opts) => getAvailableSlots.__executeServer(opts));
const getAvailableSlots = createServerFn({
  method: "GET"
}).inputValidator((d) => SlotsInput.parse(d)).handler(getAvailableSlots_createServerFn_handler, async ({
  data
}) => {
  const token = getToken();
  const uri = await resolveEventTypeUri(token);
  const dayStart = /* @__PURE__ */ new Date(`${data.date}T00:00:00.000Z`);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1e3 - 1e3);
  const nowPlus = new Date(Date.now() + 5 * 60 * 1e3);
  const start = dayStart < nowPlus ? nowPlus : dayStart;
  if (start >= dayEnd) return {
    slots: []
  };
  const params = new URLSearchParams({
    event_type: uri,
    start_time: start.toISOString(),
    end_time: dayEnd.toISOString()
  });
  const res = await calendly(`/event_type_available_times?${params}`, token);
  return {
    slots: res.collection.map((s) => ({
      start_time: s.start_time,
      scheduling_url: s.scheduling_url,
      status: s.status
    }))
  };
});
export {
  getAvailableSlots_createServerFn_handler,
  getEventInfo_createServerFn_handler
};
