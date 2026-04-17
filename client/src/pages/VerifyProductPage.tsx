import { useMemo, useState, useRef } from "react";
import { Camera, Search } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import VerificationResult from "../components/verification/VerificationResult";
import { SHOW_DEMO_DATA } from "../config/features";
import { api } from "../services/api";
import { useChainTraceStore } from "../store/useChainTraceStore";

function extractProductId(value: string): string {
  const trimmedValue = value.trim();
  if (!trimmedValue) return "";

  try {
    const url = new URL(trimmedValue);
    return url.searchParams.get("productId")?.trim() || trimmedValue;
  } catch {
    const [, queryString] = trimmedValue.split("?");
    if (!queryString) return trimmedValue;
    const searchParams = new URLSearchParams(queryString);
    return searchParams.get("productId")?.trim() || trimmedValue;
  }
}

export default function VerifyProductPage() {
  const products = useChainTraceStore((state) => state.products);
  const checkpoints = useChainTraceStore((state) => state.checkpoints);
  const [query, setQuery] = useState(SHOW_DEMO_DATA ? "CT-PH-3044" : "");
  const [loading, setLoading] = useState(false);
  const [remoteData, setRemoteData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const container = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from(".animate-in", {
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: "power3.out"
    });
  }, { scope: container });

  const localProduct = useMemo(
    () => products.find((item) => item.id.toLowerCase() === query.trim().toLowerCase()),
    [products, query]
  );

  const localCheckpoints = useMemo(() => {
    if (!localProduct) return [];
    return checkpoints.filter((cp) => cp.productId === localProduct.id);
  }, [checkpoints, localProduct]);

  async function verifyInput() {
    const id = extractProductId(query);
    if (!id) return;

    if (localProduct) {
      setRemoteData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.verifyProduct(id);
      setRemoteData(data);
    } catch (err: any) {
      setError(err.message ?? "Unable to verify the product right now.");
      setRemoteData(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main ref={container} className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 dark:[&_*]:text-white dark:[&_input]:border-slate-700 dark:[&_input]:bg-slate-800 dark:[&_input]:placeholder:text-white/70 dark:[&_.bg-slate-50]:!bg-slate-800 dark:[&_.border-slate-200]:!border-slate-700 dark:[&_.border-slate-300]:!border-slate-700">
      <div className="animate-in">
        <p className="text-xs uppercase text-slate-500">Public Portal</p>
        <h1 className="text-3xl font-semibold text-slate-900">Verify Product Authenticity</h1>
        <p className="mt-2 text-slate-600">Scan QR code or enter Product ID to verify blockchain-backed provenance.</p>
      </div>

      <Card className="animate-in grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Camera className="h-4 w-4" />
            QR Scanner
          </div>
          <p className="text-sm text-slate-500">
            {SHOW_DEMO_DATA
              ? "Camera integration can be plugged in with `html5-qrcode` or AR.js scanner mode."
              : "Enable camera scanner integration with html5-qrcode or AR.js, or enter Product ID manually."}
          </p>
        </div>

        <div className="flex gap-2 md:w-[420px]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") verifyInput();
            }}
            className="h-12 flex-1 rounded-xl border border-slate-200 px-4 text-sm"
            placeholder="Enter product ID or paste verify URL"
          />
          <Button className="h-12 px-4" onClick={verifyInput} disabled={loading}>
            <Search className="mr-2 h-4 w-4" />
            {loading ? "Checking..." : "Verify"}
          </Button>
        </div>
      </Card>

      {localProduct ? (
        <div className="animate-in">
          <VerificationResult product={localProduct} checkpoints={localCheckpoints} />
        </div>
      ) : remoteData ? (
        <div className="animate-in">
          <VerificationResult product={remoteData.product} checkpoints={remoteData.checkpoints} />
        </div>
      ) : (
        <Card className="animate-in">
          {error ? (
            <p className="text-sm text-red-600">
              {error}
            </p>
          ) : query.trim() ? (
            <p className="text-sm text-slate-600">
              Start verification to check authenticity of <span className="font-mono">{query}</span>.
            </p>
          ) : (
            <p className="text-sm text-slate-600">Enter a product ID or scan a QR code to verify a product.</p>
          )}
        </Card>
      )}
    </main>
  );
}
