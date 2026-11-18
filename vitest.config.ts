import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // Test files own independent MSW servers whose resetHandlers calls share
    // the Node interceptor. Running them in parallel can clear another file's
    // handlers while it is still rendering an async query.
    fileParallelism: false,
  },
});
