import { useMemo, useState } from "react";

const eventName = import.meta.env.VITE_CALENDLY_EVENT_NAME ?? "Book a meeting";
const eventDuration = import.meta.env.VITE_CALENDLY_EVENT_DURATION ?? "30 minutes";
const eventLocation = import.meta.env.VITE_CALENDLY_EVENT_LOCATION ?? "Google Meet";
const eventDescription =
  import.meta.env.VITE_CALENDLY_EVENT_DESCRIPTION ??
  "Schedule a quick meeting with me on Calendly.";
const schedulingUrl = import.meta.env.VITE_CALENDLY_SCHEDULING_URL ?? "https://calendly.com";

function App() {
  const [copied, setCopied] = useState(false);

  const headerParts = useMemo(
    () => [eventDuration, eventLocation, "Free"],
    [eventDuration, eventLocation],
  );

  const isPlaceholderUrl = schedulingUrl === "https://calendly.com";

  async function copyLink() {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(schedulingUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-background px-6 py-10 md:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm text-muted-foreground">This page is deployed as a GitHub Pages SPA.</p>
        <h1 className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xl font-semibold tracking-tight md:text-3xl">
          {headerParts.map((part, i) => (
            <span key={i} className="flex items-center gap-x-3">
              {i > 0 && <span className="text-muted-foreground/50">/</span>}
              <span>{part}</span>
            </span>
          ))}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{eventDescription}</p>

        <div className="mt-10 rounded-2xl border-2 border-[#1E73E8] p-5 md:p-6">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Event name</p>
              <p className="mt-1 text-base font-semibold text-foreground">{eventName}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="mt-1 text-base font-semibold text-foreground">{eventDuration}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="mt-1 text-base font-semibold text-foreground">{eventLocation}</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex h-14 items-center justify-center rounded-full border border-input bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/50"
              >
                {copied ? "Link copied" : "Copy scheduling link"}
              </button>
              <a
                href={schedulingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-14 items-center justify-center rounded-full bg-[#FFC60B] px-4 text-sm font-semibold text-black transition hover:brightness-95"
              >
                Open Calendly page
              </a>
            </div>
            {isPlaceholderUrl && (
              <p className="text-sm text-destructive">
                NOTE: The scheduling URL is currently a placeholder. Set `VITE_CALENDLY_SCHEDULING_URL` before building for a real event link.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
