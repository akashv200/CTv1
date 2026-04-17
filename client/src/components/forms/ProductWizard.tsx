import { useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, Download, ExternalLink, Upload } from "lucide-react";
import { domains } from "../../data/domainConfig";
import type { DomainKey, Product } from "../../types";
import { useChainTraceStore } from "../../store/useChainTraceStore";
import { api } from "../../services/api";
import { useToast } from "../../components/common/Toast";
import Button from "../common/Button";
import Card from "../common/Card";

interface FormState {
  domain: DomainKey;
  productName: string;
  category: string;
  description: string;
  batchNumber: string;
  quantity: string;
  unit: string;
  date: string;
  expiryDate: string;
  location: string;
  certificateType: string;
  issuer: string;
}

const stepTitles = ["Basic Information", "Product Details", "Certifications", "Initial Location", "Review & Submit"];

const domainFieldHints: Record<DomainKey, string[]> = {
  agriculture: ["Crop type", "Soil pH", "Harvest date"],
  pharmaceutical: ["Storage range", "Active ingredients", "Regulatory approval"],
  food: ["Allergen info", "Nutritional values", "Use by date"],
  ecommerce: ["SKU/ASIN", "Seller verification", "Warranty period"],
  warehouse: ["Rack-row-bin", "Reorder point", "Sensor IDs"]
};

const initialState: FormState = {
  domain: "agriculture",
  productName: "",
  category: "",
  description: "",
  batchNumber: "",
  quantity: "",
  unit: "units",
  date: "",
  expiryDate: "",
  location: "",
  certificateType: "",
  issuer: ""
};

function sanitizePreviewToken(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 12);
}

function buildVerifyUrl(productId: string): string {
  const origin = typeof window === "undefined" ? "http://localhost:5173" : window.location.origin;
  return `${origin}/verify?productId=${encodeURIComponent(productId)}`;
}

function buildQrImageUrl(value: string, size = 256): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(value)}`;
}

export default function ProductWizard() {
  const { toast } = useToast();
  const registerProduct = useChainTraceStore((state) => state.registerProduct);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(initialState);
  const [productImages, setProductImages] = useState<File[]>([]);
  const [certificateFiles, setCertificateFiles] = useState<File[]>([]);

  const hints = useMemo(() => domainFieldHints[form.domain], [form.domain]);
  const previewProductId = useMemo(() => {
    const domainPrefix = form.domain.slice(0, 2).toUpperCase();
    const token = sanitizePreviewToken(form.batchNumber) || sanitizePreviewToken(form.productName) || "PREVIEW";
    return `CT-${domainPrefix}-${token}`;
  }, [form.batchNumber, form.domain, form.productName]);
  const previewVerifyUrl = useMemo(() => buildVerifyUrl(previewProductId), [previewProductId]);
  const previewQrUrl = useMemo(() => buildQrImageUrl(previewVerifyUrl, 256), [previewVerifyUrl]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleProductImagesUpload(fileList: FileList | null) {
    const files = Array.from(fileList ?? []).filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;
    setProductImages((prev) => [...prev, ...files]);
  }

  function handleCertificateUpload(fileList: FileList | null) {
    const files = Array.from(fileList ?? []).filter((file) => file.type.startsWith("image/") || file.type === "application/pdf");
    if (!files.length) return;
    setCertificateFiles((prev) => [...prev, ...files]);
  }

  function createProductFromForm(): Product {
    return {
      id: `CT-${form.domain.slice(0, 2).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`,
      domain: form.domain,
      name: form.productName,
      batchNumber: form.batchNumber,
      origin: form.location,
      status: "active",
      authenticityScore: 95,
      createdAt: new Date().toISOString(),
      metadata: {
        category: form.category,
        quantity: form.quantity,
        unit: form.unit,
        date: form.date,
        expiryDate: form.expiryDate,
        certificateType: form.certificateType,
        issuer: form.issuer,
        productImageCount: productImages.length,
        certificateFileCount: certificateFiles.length
      }
    };
  }

  async function submit() {
    const productData = {
      domain: form.domain,
      productName: form.productName,
      category: form.category,
      description: form.description,
      batchNumber: form.batchNumber,
      quantity: Number.parseFloat(form.quantity) || 0,
      unit: form.unit,
      originLocation: form.location,
      metadata: {
        date: form.date,
        expiryDate: form.expiryDate,
        certificateType: form.certificateType,
        issuer: form.issuer
      }
    };

    try {
      const response = (await api.registerProduct(productData)) as any;
      const product: Product = {
        id: response.productId || response.id,
        domain: response.domain,
        name: response.productName,
        batchNumber: response.batchNumber,
        origin: response.originLocation,
        status: response.status,
        authenticityScore: response.authenticityScore,
        createdAt: response.createdAt,
        metadata: response.metadata
      };
      registerProduct(product);
      setSubmitted(product);
      setForm(initialState);
      setProductImages([]);
      setCertificateFiles([]);
      setStep(0);
      toast("Product registered successfully on blockchain!", "success");
    } catch (error) {
      console.error("Failed to register product", error);
      toast("Failed to register product. Check console.", "error");
    }
  }

  if (submitted) {
    const submittedVerifyUrl = buildVerifyUrl(submitted.id);
    const submittedQrUrl = buildQrImageUrl(submittedVerifyUrl, 256);
    const submittedQrDownloadUrl = buildQrImageUrl(submittedVerifyUrl, 1024);

    return (
      <Card className="max-w-3xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Product registered on blockchain queue
        </div>
        <h3 className="text-2xl font-semibold text-slate-900">{submitted.name}</h3>
        <p className="mt-1 text-sm text-slate-500">Product ID: {submitted.id}</p>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-700">Transaction Summary</p>
            <ul className="mt-3 space-y-1 text-sm text-slate-600">
              <li>Batch: {submitted.batchNumber}</li>
              <li>Domain: {submitted.domain}</li>
              <li>Origin: {submitted.origin}</li>
              <li>Estimated gas: local Ganache test transaction</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="grid place-items-center rounded-xl bg-white p-2">
              <img src={submittedQrUrl} alt={`QR code for ${submitted.id}`} className="h-44 w-44 rounded-lg" />
            </div>
            <p className="mt-2 text-center text-xs text-slate-500">Scan to verify authenticity</p>
            <p className="mt-1 break-all text-center font-mono text-[10px] text-slate-400">{submittedVerifyUrl}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <a
                href={submittedQrDownloadUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5" />
                Open QR PNG
              </a>
              <a
                href={submittedVerifyUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open Verify Page
              </a>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Button onClick={() => setSubmitted(null)}>Register Another Product</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl">
      <div className="mb-6 flex flex-wrap gap-2">
        {stepTitles.map((title, index) => (
          <div
            key={title}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              step >= index 
                ? "bg-slate-900 text-[#ccff00] drop-shadow-[0_0_8px_rgba(204,255,0,0.6)] border border-[#ccff00]/30" 
                : "bg-slate-800 text-[#ccff00]/40 border border-slate-700"
            }`}
          >
            <span>{index + 1}</span>
            <span>{title}</span>
          </div>
        ))}
      </div>

      {step === 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Domain
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm"
              value={form.domain}
              onChange={(event) => updateField("domain", event.target.value as DomainKey)}
            >
              {domains.map((domain) => (
                <option value={domain.key} key={domain.key}>
                  {domain.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Product Name
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm"
              placeholder="Product name"
              value={form.productName}
              onChange={(event) => updateField("productName", event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Category
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm"
              placeholder="Category"
              value={form.category}
              onChange={(event) => updateField("category", event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Description
            <textarea
              className="mt-1 min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm"
              placeholder="Describe the product and sourcing details"
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
            />
          </label>
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold text-slate-700">Product Images</p>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100">
                <Upload className="h-3.5 w-3.5" />
                Upload Images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(event) => {
                    handleProductImagesUpload(event.target.files);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-slate-500">Accepted format: image files (PNG, JPG, WebP). Multiple files allowed.</p>
            {productImages.length ? (
              <ul className="mt-3 space-y-1 text-xs text-slate-600">
                {productImages.map((file, index) => (
                  <li key={`${file.name}-${index}`} className="rounded-md bg-white px-2 py-1">
                    {file.name}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Batch / Serial Number
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm"
              value={form.batchNumber}
              onChange={(event) => updateField("batchNumber", event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Quantity
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm"
              value={form.quantity}
              onChange={(event) => updateField("quantity", event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Unit
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm"
              value={form.unit}
              onChange={(event) => updateField("unit", event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Manufacture / Harvest Date
            <input
              type="date"
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm"
              value={form.date}
              onChange={(event) => updateField("date", event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Expiry Date
            <input
              type="date"
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm"
              value={form.expiryDate}
              onChange={(event) => updateField("expiryDate", event.target.value)}
            />
          </label>
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold">Domain-specific fields</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {hints.map((hint) => (
                <li key={hint}>{hint}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Certificate Type
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm"
              value={form.certificateType}
              onChange={(event) => updateField("certificateType", event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Issuing Authority
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm"
              value={form.issuer}
              onChange={(event) => updateField("issuer", event.target.value)}
            />
          </label>
          <div className="md:col-span-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 font-semibold text-slate-700">
                <Upload className="h-4 w-4" />
                Upload Certificates (PDF/Image)
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100">
                <Upload className="h-3.5 w-3.5" />
                Upload Files
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  multiple
                  className="sr-only"
                  onChange={(event) => {
                    handleCertificateUpload(event.target.files);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
            <p>Files are expected to be hashed to IPFS and linked on-chain in production mode.</p>
            {certificateFiles.length ? (
              <ul className="mt-3 space-y-1 text-xs text-slate-600">
                {certificateFiles.map((file, index) => (
                  <li key={`${file.name}-${index}`} className="rounded-md bg-white px-2 py-1">
                    {file.name}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Facility / Origin Location
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm"
              placeholder="Farm, lab, warehouse, or store location"
              value={form.location}
              onChange={(event) => updateField("location", event.target.value)}
            />
          </label>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">Auto-detected GPS: 40.7128, -74.0060</div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">Checkpoint Type: Origin</div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-700">
            <p className="font-semibold">Review Summary</p>
            <ul className="mt-2 space-y-1">
              <li>Product: {form.productName || "-"}</li>
              <li>Domain: {form.domain}</li>
              <li>Batch: {form.batchNumber || "-"}</li>
              <li>Location: {form.location || "-"}</li>
              <li>Certificate: {form.certificateType || "-"}</li>
              <li>Images uploaded: {productImages.length || 0}</li>
              <li>Certificate files uploaded: {certificateFiles.length || 0}</li>
            </ul>
          </div>
          <div className="grid place-items-center rounded-xl border border-slate-200 p-4">
            <img src={previewQrUrl} alt={`Preview QR for ${previewProductId}`} className="h-36 w-36 rounded-lg border border-slate-200 bg-white p-1" />
            <p className="mt-2 text-center font-mono text-[10px] text-slate-500">{previewProductId}</p>
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex justify-between">
        <Button variant="secondary" onClick={() => setStep((prev) => Math.max(prev - 1, 0))} disabled={step === 0}>
          Previous
        </Button>
        {step < stepTitles.length - 1 ? (
          <Button onClick={() => setStep((prev) => Math.min(prev + 1, stepTitles.length - 1))}>
            Next Step
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={submit}>Submit to Blockchain</Button>
        )}
      </div>
    </Card>
  );
}
