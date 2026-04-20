"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/notifications/push-client";

export function ServiceWorkerRegister() {
  useEffect(() => {
    registerServiceWorker();
  }, []);
  return null;
}
