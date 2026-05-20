import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const API = "https://api.calendly.com";

function getToken() {
  const token = process.env.CALENDLY_API_TOKEN;
  if (!token) throw new Error("CALENDLY_API_TOKEN is not configured");
  return token;
}

async function calendly(path: string, token: string) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Calendly API ${res.status}: ${body}`);
  }
  return res.json();
}

let cachedEventTypeUri: string | null = null;
async function resolveEventTypeUri(token: string): Promise<string> {
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
  // Auto-discover from the authenticated user.
  const me = await calendly("/users/me", token);
  const userUri = me.resource.uri as string;
  const list = await calendly(
    `/event_types?user=${encodeURIComponent(userUri)}&active=true&count=10`,
    token,
  );
  const first = list.collection?.[0]?.uri as string | undefined;
  if (!first) throw new Error("No active Calendly event types found for this user");
  cachedEventTypeUri = first;
  return first;
}

export const getEventInfo = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const token = getToken();
    const uri = await resolveEventTypeUri(token);
    const path = uri.replace(API, "");
    const data = await calendly(path, token);
    const r = data.resource;
    return {
      ok: true as const,
      name: r.name as string,
      duration: r.duration as number,
      location: ((r.location?.kind as string) || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c: string) => c.toUpperCase()),
      scheduling_url: r.scheduling_url as string,
      uri: r.uri as string,
      profile_name: r.profile?.name as string | undefined,
    };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
  }
});

const SlotsInput = z.object({ date: z.string() });

export const getAvailableSlots = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => SlotsInput.parse(d))
  .handler(async ({ data }) => {
    const token = getToken();
    const uri = await resolveEventTypeUri(token);

    const dayStart = new Date(`${data.date}T00:00:00.000Z`);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1000);
    const nowPlus = new Date(Date.now() + 5 * 60 * 1000);
    const start = dayStart < nowPlus ? nowPlus : dayStart;
    if (start >= dayEnd) return { slots: [] };

    const params = new URLSearchParams({
      event_type: uri,
      start_time: start.toISOString(),
      end_time: dayEnd.toISOString(),
    });
    const res = await calendly(`/event_type_available_times?${params}`, token);
    return {
      slots: (res.collection as Array<{
        start_time: string;
        scheduling_url: string;
        invitees_remaining: number;
        status: string;
      }>).map((s) => ({
        start_time: s.start_time,
        scheduling_url: s.scheduling_url,
        status: s.status,
      })),
    };
  });