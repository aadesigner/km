import { createRoot } from "react-dom/client";
import { setCredentials, setClientGuardToken } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";
import { installFetchGuard } from "./lib/install-fetch-guard";

const clientGuardToken = import.meta.env.VITE_CLIENT_GUARD_TOKEN as string | undefined;

setCredentials("include");
setClientGuardToken(clientGuardToken ?? null);
installFetchGuard(clientGuardToken);

if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    console.error("[kmcheck] unhandled promise rejection", event.reason);
  });
}

createRoot(document.getElementById("root")!).render(<App />);
