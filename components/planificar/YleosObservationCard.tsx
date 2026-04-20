"use client";

import { useEffect, useState } from "react";
import { Bot } from "lucide-react";

export function YleosObservationCard() {
  const [observation, setObservation] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/yleos/analyze-semester")
      .then((r) => r.json())
      .then((data) => {
        setObservation(data.observation);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded || !observation) return null;

  return (
    <div
      className="card riseup"
      style={{
        animationDelay: "800ms",
        borderLeft: "3px solid var(--accent-info)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex items-center justify-center rounded-full shrink-0"
          style={{
            width: "32px",
            height: "32px",
            backgroundColor: "var(--accent-info)",
            color: "#fff",
          }}
        >
          <Bot size={16} />
        </div>
        <div>
          <p className="label" style={{ color: "var(--accent-info)" }}>
            Observación estratégica de YLEOS
          </p>
          <p className="mt-2" style={{ fontSize: "var(--fs-body)", lineHeight: 1.6 }}>
            {observation}
          </p>
        </div>
      </div>
    </div>
  );
}
