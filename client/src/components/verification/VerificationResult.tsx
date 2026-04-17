import { ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import type { Checkpoint, Product } from "../../types";
import { formatDate, truncateHash } from "../../lib/utils";

interface VerificationResultProps {
  product: Product;
  checkpoints: Checkpoint[];
}

function authenticityVariant(score: number): "success" | "warning" | "danger" {
  if (score >= 95) return "success";
  if (score >= 85) return "warning";
  return "danger";
}

function statusIcon(score: number) {
  if (score >= 95) return <ShieldCheck className="h-5 w-5 text-emerald-600" />;
  if (score >= 85) return <ShieldAlert className="h-5 w-5 text-amber-600" />;
  return <ShieldX className="h-5 w-5 text-red-600" />;
}

export default function VerificationResult({ product, checkpoints }: VerificationResultProps) {
  const variant = authenticityVariant(product.authenticityScore);
  return (
    <div className="space-y-4 dark:[&_*]:text-white dark:[&_.bg-slate-50]:!bg-slate-800 dark:[&_.border-slate-200]:!border-slate-700">
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase text-slate-500">Verification Result</p>
            <h2 className="text-2xl font-semibold text-slate-900">{product.name}</h2>
            <p className="text-sm text-slate-500">Product ID: {product.id}</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              {statusIcon(product.authenticityScore)}
              <Badge variant={variant}>{product.authenticityScore}% Trust Score</Badge>
            </div>
            {product.authenticityScore >= 95 ? (
              <Badge variant="success" className="animate-pulse flex items-center gap-1 mt-1">
                Verified ✅
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Domain: {product.domain}</div>
          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Origin: {product.origin}</div>
          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Batch: {product.batchNumber}</div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Checkpoint Timeline</h3>
        <div className="space-y-3">
          {checkpoints.length === 0 ? <p className="text-sm text-slate-500">No checkpoints available.</p> : null}
          {checkpoints.map((checkpoint) => (
            <div key={checkpoint.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold capitalize text-slate-800">{checkpoint.checkpointType}</p>
                <p className="text-xs text-slate-500">{formatDate(checkpoint.timestamp)}</p>
              </div>
              <p className="mt-1 text-sm text-slate-600">{checkpoint.location}</p>
              {checkpoint.txHash ? <p className="mt-2 font-mono text-xs text-slate-500">Tx: {truncateHash(checkpoint.txHash)}</p> : null}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
