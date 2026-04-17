import ProductWizard from "../components/forms/ProductWizard";

export default function RegisterProductPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 dark:[&_*]:text-white dark:[&_input]:border-slate-700 dark:[&_input]:bg-slate-800 dark:[&_input]:placeholder:text-white/70 dark:[&_textarea]:border-slate-700 dark:[&_textarea]:bg-slate-800 dark:[&_textarea]:placeholder:text-white/70 dark:[&_select]:border-slate-700 dark:[&_select]:bg-slate-800 dark:[&_.bg-slate-50]:!bg-slate-800 dark:[&_.bg-white]:!bg-slate-800 dark:[&_.border-slate-200]:!border-slate-700 dark:[&_.border-slate-300]:!border-slate-700">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wide text-slate-500">Product Registration</p>
        <h1 className="text-3xl font-semibold text-slate-900">Multi-step Product Onboarding</h1>
        <p className="mt-2 text-slate-600">
          Register products with domain-specific fields, certificates, location proofs, and blockchain transaction metadata.
        </p>
      </div>
      <ProductWizard />
    </main>
  );
}
