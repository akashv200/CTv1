const truthyFlags = new Set(["1", "true", "yes", "on"]);

export const SHOW_DEMO_DATA = truthyFlags.has(String(import.meta.env.VITE_SHOW_DEMO_DATA ?? "").trim().toLowerCase());
