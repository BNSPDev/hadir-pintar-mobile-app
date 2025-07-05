import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { startHealthMonitoring } from "./utils/healthCheck";
import { isDevelopment } from "./utils/env";

// Start health monitoring in production
if (!isDevelopment()) {
  startHealthMonitoring();
}

// Enhanced error handling
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  event.preventDefault();
});

// Check for required DOM element
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error(
    "Root element not found. Make sure your HTML contains an element with id='root'",
  );
}

// Render app with error boundary
createRoot(rootElement).render(<App />);
