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
          .withConf({ lang: "en" })
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
