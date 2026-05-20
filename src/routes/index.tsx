import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { getAvailableSlots, getEventInfo } from "@/lib/calendly.functions";

export const Route = createFileRoute("/")({
  component: BookingPage,
});

function fmtYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function BookingPage() {
  const fetchInfo = useServerFn(getEventInfo);
  const fetchSlots = useServerFn(getAvailableSlots);

  // Compute "today" only on the client to avoid SSR hydration mismatches
  // (server clock can be on a different day than the user's browser).
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setToday(d);
  }, []);

  const weekDays = useMemo(() => {
    if (!today) return [] as Date[];
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }, [today]);

  const [selectedYmd, setSelectedYmd] = useState<string | null>(null);
  const ymd = selectedYmd ?? (weekDays[0] ? fmtYMD(weekDays[0]) : null);

  const infoQuery = useQuery({
    queryKey: ["calendly", "info"],
    queryFn: () => fetchInfo(),
  });

  const slotsQuery = useQuery({
    queryKey: ["calendly", "slots", ymd],
    queryFn: () => fetchSlots({ data: { date: ymd! } }),
    enabled: !!ymd,
  });

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const info = infoQuery.data?.ok ? infoQuery.data : null;
  const headerParts = [
    info ? `${info.duration} minutes` : "30 minutes",
    info?.location || "Google Meet",
    "Free",
  ];

  return (
    <div className="min-h-screen bg-background px-6 py-10 md:py-16">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <p className="text-sm text-muted-foreground">This week</p>
        <h1 className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xl font-semibold tracking-tight md:text-3xl">
          {headerParts.map((part, i) => (
            <span key={i} className="flex items-center gap-x-3">
              {i > 0 && <span className="text-muted-foreground/50">/</span>}
              <span>{part}</span>
            </span>
          ))}
        </h1>
        {info?.name && (
          <p className="mt-2 text-sm text-muted-foreground">
            {info.name}
            {info.profile_name ? ` · ${info.profile_name}` : ""}
          </p>
        )}

        {/* Dates */}
        <p className="mt-10 text-sm text-muted-foreground">This week</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {weekDays.map((d) => {
            const active = fmtYMD(d) === ymd;
            return (
              <button
                key={d.toISOString()}
                type="button"
                onClick={() => setSelectedDate(d)}
                className={
                  "min-w-[88px] rounded-full border px-5 py-2.5 text-sm font-medium transition " +
                  (active
                    ? "border-transparent bg-[#FFC60B] text-black shadow-sm"
                    : "border-border bg-background text-foreground hover:border-foreground/40")
                }
              >
                {dayNames[d.getDay()]} {d.getDate()}
              </button>
            );
          })}
        </div>

        {/* Times */}
        <div className="mt-8 rounded-2xl border-2 border-[#1E73E8] p-5 md:p-6">
          <p className="text-sm text-muted-foreground">Time</p>

          {slotsQuery.isLoading && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-full border border-border bg-muted/40"
                />
              ))}
            </div>
          )}

          {slotsQuery.isError && (
            <p className="mt-4 text-sm text-destructive">
              Couldn't load times. Check your Calendly token / event URI.
            </p>
          )}

          {slotsQuery.data && slotsQuery.data.slots.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              No available times on this day.
            </p>
          )}

          {slotsQuery.data && slotsQuery.data.slots.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {slotsQuery.data.slots.map((slot, i) => {
                const t = new Date(slot.start_time);
                const label = t.toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                });
                // Highlight middle slot like the mock; fallback: none.
                const highlight = i === 1;
                return (
                  <a
                    key={slot.start_time}
                    href={slot.scheduling_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={
                      "flex h-12 items-center justify-center rounded-full border text-sm font-medium transition " +
                      (highlight
                        ? "border-transparent bg-[#FFC60B] text-black shadow-sm hover:brightness-95"
                        : "border-border bg-background text-foreground hover:border-foreground/40")
                    }
                  >
                    {label}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
