import { createRoot } from "react-dom/client";
import { setCredentials, setClientGuardToken } from "@workspace/api-client-react";
import "@/fonts/inter-latin.css";
import { fetchGeoLanguageHint } from "@/lib/geo-language-client";
import App from "./App";
import "./index.css";
import { installFetchGuard } from "./lib/install-fetch-guard";
import { installChunkLoadRecovery } from "./lib/lazy-with-retry";

const clientGuardToken = import.meta.env.VITE_CLIENT_GUARD_TOKEN as string | undefined;

setCredentials("include");
setClientGuardToken(clientGuardToken ?? null);
installFetchGuard(clientGuardToken);
installChunkLoadRecovery();

// Warm geo hint while the bundle boots so `/` can redirect in one hop.
if (typeof window !== "undefined") {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  if (path === "/") void fetchGeoLanguageHint();
}

createRoot(document.getElementById("root")!).render(<App />);
