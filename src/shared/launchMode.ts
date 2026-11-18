export const launchMode = import.meta.env.VITE_LAUNCH_MODE === "true"
  || (import.meta.env.MODE !== "test" && import.meta.env.VITE_LAUNCH_MODE !== "false");

export const demoMode = !launchMode && import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS === "true";
