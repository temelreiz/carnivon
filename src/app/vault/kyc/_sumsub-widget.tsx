"use client";

import { useEffect, useRef, useState } from "react";
import snsWebSdk from "@sumsub/websdk";

/**
 * Client-side Sumsub WebSDK embed. Fetches a fresh access token from
 * /api/kyc/start each mount; on completion, Sumsub's webhook updates our
 * Investor.kycStatus and the page revalidates.
 */
export function SumsubWidget() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let disposed = false;

    async function fetchToken(): Promise<string> {
      const res = await fetch("/api/kyc/start", { method: "POST" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { accessToken: string };
      return data.accessToken;
    }

    (async () => {
      try {
        const accessToken = await fetchToken();
        if (disposed || !containerRef.current) return;

        const sdk = snsWebSdk
          .init(accessToken, fetchToken)
          .withConf({
            lang: "en",
            theme: "dark",
            // Sumsub honours CSS custom properties via this map. Keep values
            // in sync with tailwind.config (forest + gold palette).
            uiConf: {
              customCssStr: `
                :root {
                  --black: #f4ecdc;
                  --white: #0e1a11;
                  --primary-text-color: #f4ecdc;
                  --secondary-text-color: rgba(244, 236, 220, 0.7);
                  --tertiary-text-color: rgba(244, 236, 220, 0.5);
                  --primary-background-color: #0e1a11;
                  --secondary-background-color: #132018;
                  --tertiary-background-color: #1b2a20;
                  --default-border-color: rgba(52, 72, 56, 0.6);
                  --primary-color: #d4a84a;
                  --primary-color-hover: #e5bd5d;
                  --primary-color-active: #c49737;
                  --selection-color: rgba(212, 168, 74, 0.15);
                  --error-color: #ef4444;
                  --success-color: #d4a84a;
                }
                body, .sumsub-kyc-container {
                  background: #0e1a11 !important;
                  color: #f4ecdc !important;
                  font-family: ui-sans-serif, system-ui, sans-serif;
                }
              `,
            },
          })
          .withOptions({ addViewportTag: false, adaptIframeHeight: true })
          .on("idCheck.onError", (err: unknown) => {
            console.error("[sumsub]", err);
            setError("Verification error — please refresh and try again.");
          })
          .build();

        sdk.launch(containerRef.current);
        setLoaded(true);
      } catch (err) {
        console.error("[sumsub:init]", err);
        setError(
          err instanceof Error
            ? err.message
            : "Could not start verification."
        );
      }
    })();

    return () => {
      disposed = true;
    };
  }, []);

  if (error) {
    return (
      <div className="text-sm text-red-300">
        {error}
      </div>
    );
  }

  return (
    <>
      {!loaded ? (
        <div className="text-sm text-cream-100/60">
          Loading verification flow…
        </div>
      ) : null}
      <div ref={containerRef} id="sumsub-websdk-container" className="mt-4" />
    </>
  );
}
