// src/main.spa.tsx
// SPA client entry — used only for the Netlify/static build (vite.spa.config.ts)
// This bypasses TanStack Start SSR and runs TanStack Router in pure client mode.

import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";

// Import global styles
import "./styles.css";

const router = getRouter();

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element #root not found");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
