import { jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { useRouter, isRedirect } from "@tanstack/react-router";
import { T as TSS_SERVER_FUNCTION, g as getServerFnById, a as createServerFn } from "./server-CCtegYzN.js";
import { z } from "zod";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
function useServerFn(serverFn) {
  const router = useRouter();
  return React.useCallback(async (...args) => {
    try {
      const res = await serverFn(...args);
      if (isRedirect(res)) throw res;
      return res;
    } catch (err) {
      if (isRedirect(err)) {
        err.options._fromLocation = router.stores.location.get();
        return router.navigate(router.resolveRedirect(err).options);
      }
      throw err;
    }
  }, [router, serverFn]);
}
var createSsrRpc = (functionId) => {
  const url = "/_serverFn/" + functionId;
  const serverFnMeta = { id: functionId };
  const fn = async (...args) => {
    return (await getServerFnById(functionId))(...args);
  };
  return Object.assign(fn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
const getEventInfo = createServerFn({
  method: "GET"
}).handler(createSsrRpc("4fd69b7cb64aa7aeb23305e8f2ddd74aa8618f32c439eac51450a616be487030"));
const SlotsInput = z.object({
  date: z.string()
});
const getAvailableSlots = createServerFn({
  method: "GET"
}).inputValidator((d) => SlotsInput.parse(d)).handler(createSsrRpc("69798583219c39585501ac6cbd7dfdadb159f6da44b8197f156b96d17173b49a"));
function fmtYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function BookingPage() {
  const fetchInfo = useServerFn(getEventInfo);
  const fetchSlots = useServerFn(getAvailableSlots);
  const [today, setToday] = useState(null);
  useEffect(() => {
    const d = /* @__PURE__ */ new Date();
    d.setHours(0, 0, 0, 0);
    setToday(d);
  }, []);
  const weekDays = useMemo(() => {
    if (!today) return [];
    return Array.from({
      length: 5
    }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }, [today]);
  const [selectedYmd, setSelectedYmd] = useState(null);
  const ymd = selectedYmd ?? (weekDays[0] ? fmtYMD(weekDays[0]) : null);
  const infoQuery = useQuery({
    queryKey: ["calendly", "info"],
    queryFn: () => fetchInfo()
  });
  const slotsQuery = useQuery({
    queryKey: ["calendly", "slots", ymd],
    queryFn: () => fetchSlots({
      data: {
        date: ymd
      }
    }),
    enabled: !!ymd
  });
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const info = infoQuery.data?.ok ? infoQuery.data : null;
  const headerParts = [info ? `${info.duration} minutes` : "30 minutes", info?.location || "Google Meet", "Free"];
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background px-6 py-10 md:py-16", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl", children: [
    /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "This week" }),
    /* @__PURE__ */ jsx("h1", { className: "mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xl font-semibold tracking-tight md:text-3xl", children: headerParts.map((part, i) => /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-x-3", children: [
      i > 0 && /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/50", children: "/" }),
      /* @__PURE__ */ jsx("span", { children: part })
    ] }, i)) }),
    info?.name && /* @__PURE__ */ jsxs("p", { className: "mt-2 text-sm text-muted-foreground", children: [
      info.name,
      info.profile_name ? ` · ${info.profile_name}` : ""
    ] }),
    /* @__PURE__ */ jsx("p", { className: "mt-10 text-sm text-muted-foreground", children: "This week" }),
    /* @__PURE__ */ jsx("div", { className: "mt-3 flex flex-wrap gap-3", children: weekDays.map((d) => {
      const active = fmtYMD(d) === ymd;
      return /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setSelectedYmd(fmtYMD(d)), className: "min-w-[88px] rounded-full border px-5 py-2.5 text-sm font-medium transition " + (active ? "border-transparent bg-[#FFC60B] text-black shadow-sm" : "border-border bg-background text-foreground hover:border-foreground/40"), children: [
        dayNames[d.getDay()],
        " ",
        d.getDate()
      ] }, d.toISOString());
    }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 rounded-2xl border-2 border-[#1E73E8] p-5 md:p-6", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Time" }),
      slotsQuery.isLoading && /* @__PURE__ */ jsx("div", { className: "mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3", children: Array.from({
        length: 6
      }).map((_, i) => /* @__PURE__ */ jsx("div", { className: "h-12 animate-pulse rounded-full border border-border bg-muted/40" }, i)) }),
      slotsQuery.isError && /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm text-destructive", children: "Couldn't load times. Check your Calendly token / event URI." }),
      slotsQuery.data && slotsQuery.data.slots.length === 0 && /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm text-muted-foreground", children: "No available times on this day." }),
      slotsQuery.data && slotsQuery.data.slots.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3", children: slotsQuery.data.slots.map((slot, i) => {
        const t = new Date(slot.start_time);
        const label = t.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit"
        });
        const highlight = i === 1;
        return /* @__PURE__ */ jsx("a", { href: slot.scheduling_url, target: "_blank", rel: "noopener noreferrer", className: "flex h-12 items-center justify-center rounded-full border text-sm font-medium transition " + (highlight ? "border-transparent bg-[#FFC60B] text-black shadow-sm hover:brightness-95" : "border-border bg-background text-foreground hover:border-foreground/40"), children: label }, slot.start_time);
      }) })
    ] })
  ] }) });
}
export {
  BookingPage as component
};
