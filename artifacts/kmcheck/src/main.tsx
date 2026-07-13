import { createRoot } from "react-dom/client";
import { setCredentials, setClientGuardToken } from "@workspace/api-client-react";
import "@fontsource-variable/inter/wght.css";
import App from "./App";
import "./index.css";
import { installFetchGuard } from "./lib/install-fetch-guard";
import { installChunkLoadRecovery } from "./lib/lazy-with-retry";

const clientGuardToken = import.meta.env.VITE_CLIENT_GUARD_TOKEN as string | undefined;

setCredentials("include");
setClientGuardToken(clientGuardToken ?? null);
installFetchGuard(clientGuardToken);
installChunkLoadRecovery();

createRoot(document.getElementById("root")!).render(<App />);
