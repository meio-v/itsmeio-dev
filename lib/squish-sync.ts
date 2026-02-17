const PENDING_KEY = "squish_pending_sync";
const FLUSH_INTERVAL = 2000;

const DEBUG = process.env.NODE_ENV === "development";

type ServerData = { total: number; visitors: number };
type Listener = (data: ServerData) => void;

let pendingIncrement = 0;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let listeners: Listener[] = [];
let flushing = false;

// Debug mode: in-memory global total, no API calls
let debugTotal = 0;

function loadPending(): number {
  try {
    const v = localStorage.getItem(PENDING_KEY);
    if (v) {
      localStorage.removeItem(PENDING_KEY);
      return parseInt(v) || 0;
    }
  } catch {}
  return 0;
}

function savePending() {
  if (pendingIncrement > 0) {
    try {
      localStorage.setItem(PENDING_KEY, pendingIncrement.toString());
    } catch {}
  }
}

function notify(data: ServerData) {
  for (const fn of listeners) {
    try {
      fn(data);
    } catch {}
  }
}

async function flush() {
  if (flushing || pendingIncrement === 0) return;
  flushing = true;
  const amount = pendingIncrement;
  pendingIncrement = 0;

  if (DEBUG) {
    debugTotal += amount;
    notify({ total: debugTotal, visitors: 1 });
    flushing = false;
    return;
  }

  try {
    const res = await fetch("/api/squish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ increment: amount }),
    });
    if (res.ok) {
      const data: ServerData = await res.json();
      try {
        localStorage.removeItem(PENDING_KEY);
      } catch {}
      notify(data);
    } else {
      pendingIncrement += amount;
    }
  } catch {
    pendingIncrement += amount;
  } finally {
    flushing = false;
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_INTERVAL);
}

export function addSquishes(amount: number) {
  pendingIncrement += amount;
  scheduleFlush();
}

export async function fetchInitialState(): Promise<ServerData | null> {
  const restored = loadPending();
  if (restored > 0) {
    pendingIncrement += restored;
    scheduleFlush();
  }

  if (DEBUG) {
    const data = { total: 0, visitors: 1 };
    notify(data);
    return data;
  }

  try {
    const res = await fetch("/api/squish");
    if (res.ok) {
      const data: ServerData = await res.json();
      notify(data);
      return data;
    }
  } catch {}
  return null;
}

export function onServerUpdate(fn: Listener): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

export function handleUnload() {
  if (DEBUG || pendingIncrement === 0) return;

  const payload = JSON.stringify({ increment: pendingIncrement });
  const sent = navigator.sendBeacon(
    "/api/squish",
    new Blob([payload], { type: "application/json" })
  );

  if (sent) {
    pendingIncrement = 0;
  } else {
    savePending();
  }
}

export function cleanup() {
  handleUnload();
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  listeners = [];
}
