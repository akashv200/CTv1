import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  FileSignature,
  Globe2,
  Lock,
  Mail,
  MapPinned,
  Phone,
  ShieldCheck,
  Store,
  UserCircle2,
  UserPlus,
  Briefcase
} from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import { api } from "../services/api";
import { useToast } from "../components/common/Toast";
import { cn } from "../lib/utils";

const businessDomains = [
  { value: "agriculture", label: "Agriculture" },
  { value: "pharmaceutical", label: "Pharmaceutical" },
  { value: "food", label: "Food Safety" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "warehouse", label: "Warehouse IoT" }
];

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-800 dark:bg-slate-950";

export default function RegisterPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"entrepreneur" | "industry_rep">("entrepreneur");
  const [formStep, setFormStep] = useState(1);
  const [entrepreneurForm, setEntrepreneurForm] = useState({
    name: "",
    email: "",
    password: "",
    idea: "",
    industry: "agriculture"
  });
  const [industryForm, setIndustryForm] = useState({
    company_name: "",
    domain: "agriculture",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    website: "",
    country: ""
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".auth-sidebar", { x: -100, opacity: 0, duration: 1.2, ease: "power4.out" });
    tl.from(".auth-card", { scale: 0.95, opacity: 0, duration: 1, ease: "back.out(1.4)" }, "-=0.8");
    tl.from(".role-option", { y: 20, opacity: 0, stagger: 0.2, duration: 0.8, ease: "power2.out" }, "-=0.5");
  }, { scope: containerRef });

  const handleRoleSelect = (newMode: "entrepreneur" | "industry_rep") => {
    setMode(newMode);
    gsap.to(`.role-option`, { scale: 1, borderAlpha: 0.1, duration: 0.3 });
    gsap.to(`.role-option-${newMode}`, { 
      scale: 1.02, 
      duration: 0.4, 
      ease: "back.out(2)",
      borderColor: newMode === "entrepreneur" ? "#6366F1" : "#10B981"
    });
  };

  function patchIndustryForm(field: keyof typeof industryForm, value: string) {
    setIndustryForm((current) => ({ ...current, [field]: value }));
  }

  async function handleEntrepreneurSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.registerConsumer({
        name: entrepreneurForm.name,
        email: entrepreneurForm.email,
        password: entrepreneurForm.password
      });
      toast("Entrepreneur application submitted for review.", "success");
      navigate("/login");
    } catch (error: any) {
      toast(error.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleIndustrySubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.submitBusinessAccessRequest(industryForm);
      toast("Industry Representative access request submitted. Admin approval is required.", "success");
      setIndustryForm({
        company_name: "",
        domain: "agriculture",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        website: "",
        country: ""
      });
      navigate("/login");
    } catch (error: any) {
      toast(error.message || "Request submission failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={containerRef} className="mx-auto flex min-h-[calc(100vh-64px)] max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="auth-sidebar relative overflow-hidden rounded-[32px] bg-slate-950 p-8 text-white shadow-[0_40px_90px_-45px_rgba(2,6,23,0.9)]">
          <div className="absolute -left-12 top-0 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute -right-12 bottom-0 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
              <ShieldCheck className="h-3.5 w-3.5" />
              ChainTrace Verified
            </div>
            <h1 className="mt-5 text-4xl font-bold leading-tight">Trust Every Link in the Journey.</h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/72">
              ChainTrace connects entrepreneurs with verified industry representatives to build secure, transparent, and high-performance supply chains.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Select your role in the ecosystem",
                "Submit credentials for Admin verification",
                "Design and deploy your Blockchain network"
              ].map((step, index) => (
                <div key={step} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold text-white">
                    0{index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{step}</p>
                    <p className="mt-1 text-xs text-white/65">
                      {index === 0
                        ? "Choose between building a venture or providing industry services."
                        : index === 1
                          ? "Our admins verify every participant to maintain a circle of trust."
                          : "Once approved, build and anchor your supply chain to the Ethereum ledger."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Card className="auth-card w-full p-8 border-none ring-1 ring-slate-200 dark:ring-slate-800">
          <div className="mb-8">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow">
              <UserPlus className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Establish your presence</h2>
            <p className="mt-2 text-sm text-slate-500">
              Join the future of supply chain management with blockchain-backed accountability.
            </p>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => handleRoleSelect("entrepreneur")}
              className={cn(
                "role-option role-option-entrepreneur rounded-3xl border-2 p-5 text-left transition-all duration-300",
                mode === "entrepreneur"
                  ? "border-indigo-500 bg-indigo-500/5 shadow-2xl shadow-indigo-500/10"
                  : "border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950/30"
              )}
            >
              <div className={cn(
                "h-10 w-10 rounded-2xl grid place-items-center mb-4 transition-colors",
                mode === "entrepreneur" ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-400 dark:bg-slate-800"
              )}>
                <Briefcase size={20} />
              </div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Entrepreneur</p>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">Develop new business ideas, find industry partners, and create supply networks.</p>
            </button>
            
            <button
              type="button"
              onClick={() => handleRoleSelect("industry_rep")}
              className={cn(
                "role-option role-option-industry_rep rounded-3xl border-2 p-5 text-left transition-all duration-300",
                mode === "industry_rep"
                  ? "border-emerald-500 bg-emerald-500/5 shadow-2xl shadow-emerald-500/10"
                  : "border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950/30"
              )}
            >
              <div className={cn(
                "h-10 w-10 rounded-2xl grid place-items-center mb-4 transition-colors",
                mode === "industry_rep" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400 dark:bg-slate-800"
              )}>
                <Building2 size={20} />
              </div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Industry Rep</p>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">Represent an established company, offer specialized services, and join existing networks.</p>
            </button>
          </div>

          {mode === "entrepreneur" ? (
            <form onSubmit={handleEntrepreneurSubmit} className="grid gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                  <div className="relative mt-1">
                    <UserCircle2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      className={inputClassName}
                      placeholder="Your Name"
                      value={entrepreneurForm.name}
                      onChange={(e) => setEntrepreneurForm({...entrepreneurForm, name: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      className={inputClassName}
                      placeholder="name@email.com"
                      value={entrepreneurForm.email}
                      onChange={(e) => setEntrepreneurForm({...entrepreneurForm, email: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Venture Idea</label>
                <div className="relative mt-1">
                  <FileSignature className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <textarea
                    required
                    rows={3}
                    className={cn(inputClassName, "pl-10 pt-2 resize-none")}
                    placeholder="Describe your business idea or the problem you are solving..."
                    value={entrepreneurForm.idea}
                    onChange={(e) => setEntrepreneurForm({...entrepreneurForm, idea: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Industry Interest</label>
                  <div className="relative mt-1">
                    <Globe2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select
                      className={`${inputClassName} appearance-none`}
                      value={entrepreneurForm.industry}
                      onChange={(e) => setEntrepreneurForm({...entrepreneurForm, industry: e.target.value})}
                    >
                      {businessDomains.map((domain) => (
                        <option key={domain.value} value={domain.value}>
                          {domain.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      className={inputClassName}
                      placeholder="Minimum 8 characters"
                      value={entrepreneurForm.password}
                      onChange={(e) => setEntrepreneurForm({...entrepreneurForm, password: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/20 dark:text-indigo-300">
                Entrepreneurs can view verified industries and send business proposals once their account is verified by an administrator.
              </div>

              <Button type="submit" className="w-full py-3" disabled={loading}>
                {loading ? "Submitting Idea..." : "Join as Entrepreneur"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleIndustrySubmit} className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Company Name</label>
                <div className="relative mt-1">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    className={inputClassName}
                    placeholder="Global Logistics Inc"
                    value={industryForm.company_name}
                    onChange={(e) => patchIndustryForm("company_name", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Specialization</label>
                <div className="relative mt-1">
                  <Globe2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    className={`${inputClassName} appearance-none`}
                    value={industryForm.domain}
                    onChange={(e) => patchIndustryForm("domain", e.target.value)}
                  >
                    {businessDomains.map((domain) => (
                        <option key={domain.value} value={domain.value}>
                          {domain.label}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Rep Name</label>
                <div className="relative mt-1">
                  <UserCircle2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    className={inputClassName}
                    placeholder="Alexander Pierce"
                    value={industryForm.contact_name}
                    onChange={(e) => patchIndustryForm("contact_name", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Rep Email</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    className={inputClassName}
                    placeholder="rep@company.com"
                    value={industryForm.contact_email}
                    onChange={(e) => patchIndustryForm("contact_email", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Industry Phone</label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className={inputClassName}
                    placeholder="+1 (555) 000-0000"
                    value={industryForm.contact_phone}
                    onChange={(e) => patchIndustryForm("contact_phone", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">HQ Country</label>
                <div className="relative mt-1">
                  <MapPinned className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className={inputClassName}
                    placeholder="Switzerland"
                    value={industryForm.country}
                    onChange={(e) => patchIndustryForm("country", e.target.value)}
                  />
                </div>
              </div>

              <div className="md:col-span-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
                Industry Representatives can offer services to entrepreneurs and join multiple supply chain networks as a verified partner.
              </div>

              <div className="md:col-span-2">
                <Button type="submit" className="w-full py-3" disabled={loading}>
                  {loading ? "Submitting Credentials..." : "Request Representative Access"}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
