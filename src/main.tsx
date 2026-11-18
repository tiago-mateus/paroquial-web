import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AppProviders } from "./app/providers";
import { router } from "./app/router";
import "./shared/styles/index.css";
import { demoMode, launchMode } from "./shared/launchMode";

async function enableMocks() {
  if (!launchMode && !demoMode) {
    return;
  }

  const { worker } = await import("./mocks/browser");
  await worker.start({
    onUnhandledRequest: "bypass",
    quiet: launchMode,
  });
}

void enableMocks().catch(error => {
  console.error("Não foi possível inicializar os dados de demonstração.", error);
}).then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </React.StrictMode>,
  );
});
