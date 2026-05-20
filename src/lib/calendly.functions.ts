import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const API = "https://api.calendly.com";

function getEnv() {
  const token = process.env.CALENDLY_API_TOKEN;
  const eventTypeUri = process.env.CALENDLY_EVENT_TYPE_URI;
  if (!token) throw new Error("CALENDLY_API_TOKEN is not configured");
  if (!eventTypeUri) throw new Error("CALENDLY_EVENT_TYPE_URI is not configured");
  return { token, eventTypeUri };
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

export const getEventInfo = createServerFn({ method: "GET" }).handler(async () => {
  const { token, eventTypeUri } = getEnv();
  // eventTypeUri can be a full URI or just the UUID
  const uri = eventTypeUri.startsWith("http")
    ? eventTypeUri
    : `${API}/event_types/${eventTypeUri}`;
  const path = uri.replace(API, "");
  const data = await calendly(path, token);
  const r = data.resource;
  return {
    name: r.name as string,
    duration: r.duration as number,
    location: ((r.location?.kind as string) || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c: string) => c.toUpperCase()),
    scheduling_url: r.scheduling_url as string,
    uri: r.uri as string,
    profile_name: r.profile?.name as string | undefined,
  };
});

const SlotsInput = z.object({ date: z.string() }); // YYYY-MM-DD (user's local)

export const getAvailableSlots = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => SlotsInput.parse(d))
  .handler(async ({ data }) => {
    const { token, eventTypeUri } = getEnv();
    const uri = eventTypeUri.startsWith("http")
      ? eventTypeUri
      : `${API}/event_types/${eventTypeUri}`;

    // Calendly limits available_times to <=7 day windows.
    // We request a single day (UTC) — UI groups by local date afterwards.
    const start = new Date(`${data.date}T00:00:00.000Z`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1000);
    const params = new URLSearchParams({
      event_type: uri,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
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