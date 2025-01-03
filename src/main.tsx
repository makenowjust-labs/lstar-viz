import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/components/App.tsx";
import "@/index.css";

// biome-ignore lint/style/noNonNullAssertion:
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
