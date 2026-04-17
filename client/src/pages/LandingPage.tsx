import { type ComponentType, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  Coins,
  FileCheck2,
  FileSignature,
  Handshake,
  Leaf,
  MapPinned,
  Network,
  Package,
  PackageCheck,
  PackageSearch,
  Pill,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  UserRoundPlus,
  Users2,
  UtensilsCrossed,
  Warehouse,
  LogOut,
  UserCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import { getAccessTokenPayload } from "../lib/session";
import { domains } from "../data/domainConfig";
import NetworkGlobeScene from "../components/three/NetworkGlobeScene";
import type { DomainKey } from "../types";

const differentiators = [
  {
    icon: FileSignature,
    title: "Launch from contract bundles",
    description: "Start with pre-vetted supply agreements instead of negotiating every supplier relationship from scratch."
  },
  {
    icon: ShieldCheck,
    title: "Admin-approved ecosystem access",
    description: "Individuals become trusted Starters only after approval, keeping the network curated and business-ready."
  },
  {
    icon: Network,
    title: "SCM + B2B in one workspace",
    description: "Partner discovery, orders, inventory, shipments, payouts, and connectors live in one operating surface."
  }
];

const launchSteps = [
  {
    icon: UserRoundPlus,
    title: "Apply as a Starter",
    description: "Register your business intent, choose a domain, and request approval to access the ecosystem."
  },
  {
    icon: Handshake,
    title: "Browse approved partners",
    description: "Discover raw material suppliers, manufacturers, logistics partners, distributors, and retailers in one network."
  },
  {
    icon: FileCheck2,
    title: "Activate contract bundles",
    description: "Review MOQ, margin, lead time, and terms, then activate the operating model for your business."
  }
];

const proofPoints = [
  { value: "6", label: "core roles in one ecosystem" },
  { value: "5", label: "operational business domains" },
  { value: "1", label: "workspace from contract to fulfillment" }
];

const roles = [
  { icon: BriefcaseBusiness, title: "Starter", description: "Launches a new business by activating approved contract pathways." },
  { icon: Leaf, title: "Producer", description: "Supplies source materials and creates the first leg of the commercial chain." },
  { icon: Building2, title: "Manufacturer", description: "Transforms inputs into finished or semi-finished products and manages production-linked contracts." },
  { icon: Truck, title: "Distributor", description: "Moves bulk inventory across regions and coordinates downstream fulfillment." },
  { icon: Store, title: "Retailer", description: "Resells into local markets or B2B channels using active upstream relationships." },
  { icon: ShieldCheck, title: "Admin", description: "Approves access, maintains compliance, and keeps the marketplace trusted." }
];

const bundleShowcase = [
  {
    title: "Kerala Spice Distribution Chain",
    domain: "Agriculture",
    summary: "Farm sourcing, processing, warehousing, and retailer supply for spices and value-added goods.",
    metrics: ["MOQ-backed", "regional sourcing", "retail-ready"]
  },
  {
    title: "Cold-Chain Wellness Bundle",
    domain: "Pharmaceutical",
    summary: "Temperature-sensitive manufacturing and logistics chain for regulated products.",
    metrics: ["compliance-first", "telemetry-enabled", "audit-ready"]
  },
  {
    title: "Food Safety Retail Channel",
    domain: "Food Safety",
    summary: "Traceable ingredient flow with fulfillment, recall readiness, and freshness control.",
    metrics: ["batch traceability", "quality checks", "delivery routing"]
  }
];

const operatingModules = [
  {
    icon: PackageSearch,
    title: "Partner and contract discovery",
    description: "Browse approved companies, compare bundles, and evaluate launch economics before activation."
  },
  {
    icon: MapPinned,
    title: "Operational supply chain tracking",
    description: "Watch orders, checkpoints, shipments, warehouses, and partner status in real time."
  },
  {
    icon: CircleDollarSign,
    title: "Commercial settlement visibility",
    description: "Design for split payments, margin visibility, escrow flows, and GST-ready invoicing."
  },
  {
    icon: Coins,
    title: "Scale with enterprise connectors",
    description: "Hook into ERP, logistics, e-commerce, and warehouse systems as the business grows."
  }
];

const domainIcons: Record<DomainKey, ComponentType<{ className?: string }>> = {
  agriculture: Leaf,
  pharmaceutical: Pill,
  food: UtensilsCrossed,
  ecommerce: ShoppingCart,
  warehouse: Warehouse
};

export default function LandingPage() {
  const container = useRef<HTMLElement>(null);
  const session = getAccessTokenPayload();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    window.location.href = "/";
  };

  useGSAP(() => {
    // Hero Section
    gsap.from(".hero-content > *", {
      y: 40,
      opacity: 0,
      duration: 1,
      stagger: 0.15,
      ease: "power3.out"
    });

    gsap.from(".hero-globe", {
      scale: 0.9,
      opacity: 0,
      duration: 1.2,
      delay: 0.2,
      ease: "back.out(1.2)"
    });

    // Staggered Sections with ScrollTrigger
    gsap.utils.toArray<HTMLElement>(".scroll-section").forEach((section) => {
      gsap.from(section.querySelectorAll(".stagger-card"), {
        scrollTrigger: {
          trigger: section,
          start: "top 80%"
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out"
      });
    });
  }, { scope: container });

  return (
    <main ref={container} className="mx-auto w-full max-w-[1600px] space-y-24 px-4 pb-20 pt-10 sm:px-6 lg:px-8 relative isolate">
      
      <section className="relative w-full">
        <div className="hero-content relative z-10 w-full overflow-hidden py-8 sm:py-12 text-center lg:py-16">
          <div className="relative z-20 mx-auto w-full max-w-7xl space-y-6">
            
            {/* Container 1: Headings & Text */}
            <div className="glass-card shadow-none bg-white/50 dark:bg-slate-900/40 p-8 sm:p-10 border-white/40 dark:border-white/10 hover:border-white/80 transition-all duration-300">
              <p className="mb-6 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20">
                B2B Supply Chain Launch Platform
              </p>
              <h1 className="text-4xl font-extrabold leading-[1.1] text-slate-900 dark:text-slate-100 md:text-5xl lg:text-6xl">
                Launch a new business from <br className="hidden md:block"/>
                <span className="text-gradient">pre-vetted supply chain contracts</span>
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-slate-700 dark:text-slate-200">
                ContractChain Hub combines partner discovery, contract activation, supply chain operations, and business launch workflows in a single ecosystem.
                New founders enter as Starters, get approved, browse trusted companies, and assemble a working supply chain without starting from zero.
              </p>
            </div>

            {/* Container 2: Actions */}
            <div className="glass-card shadow-none flex flex-col items-center justify-center gap-4 sm:flex-row bg-white/50 dark:bg-slate-900/40 p-6 border-white/40 dark:border-white/10 hover:border-white/80 transition-all duration-300">
              {!session ? (
                <>
                  <Link to="/signup">
                    <Button size="lg" className="neo-button h-14 px-8 text-lg w-full sm:w-auto">
                      Sign Up Now
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="secondary" size="lg" className="neo-button h-14 px-8 text-lg w-full sm:w-auto">
                      Log In
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/settings">
                    <Button size="lg" className="neo-button h-14 px-8 text-lg w-full sm:w-auto">
                      <UserCircle className="mr-2 h-5 w-5" />
                      View My Profile
                    </Button>
                  </Link>
                  <Link to="/scm/ecosystem">
                    <Button variant="secondary" size="lg" className="neo-button h-14 px-8 text-lg w-full sm:w-auto">
                      Open Ecosystem
                    </Button>
                  </Link>
                  <Button 
                    variant="secondary" 
                    size="lg" 
                    className="h-14 px-8 text-lg w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-900/30 dark:text-red-400"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    Logout
                  </Button>
                </>
              )}
            </div>

            {/* Container 3: Stats */}
            <div className="glass-card shadow-none grid gap-4 sm:grid-cols-3 bg-white/50 dark:bg-slate-900/40 p-6 border-white/40 dark:border-white/10 hover:border-white/80 transition-all duration-300">
              {proofPoints.map((item) => (
                <div key={item.label} className="rounded-[20px] bg-white/60 p-5 dark:bg-slate-800/60 transition-transform duration-300 hover:-translate-y-1">
                  <p className="text-4xl font-bold text-slate-900 dark:text-slate-100">{item.value}</p>
                  <p className="mt-2 text-sm font-medium leading-tight text-slate-600 dark:text-slate-300">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Container 4: Badges */}
            <div className="glass-card shadow-none flex flex-wrap items-center justify-center gap-3 bg-white/50 dark:bg-slate-900/40 p-6 border-white/40 dark:border-white/10 hover:border-white/80 transition-all duration-300">
              <span className="domain-pill bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm py-2 px-4">admin approval</span>
              <span className="domain-pill bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-sm py-2 px-4">partner browsing</span>
              <span className="domain-pill bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-sm py-2 px-4">contract bundles</span>
            </div>

          </div>
        </div>

        {/* Globe Visualization */}
        <div className="hero-globe mx-auto mt-12 w-full max-w-3xl">
          <div className="glass-card relative overflow-hidden p-6">
            <div className="absolute -left-16 top-0 h-44 w-44 rounded-full bg-emerald-200/50 blur-3xl dark:bg-emerald-600/20" />
            <div className="absolute -right-10 top-10 h-40 w-40 rounded-full bg-cyan-200/50 blur-3xl dark:bg-cyan-500/20" />
            <div className="relative">
              <div className="mb-4 flex items-center justify-between rounded-2xl bg-slate-950/80 backdrop-blur px-5 py-4 text-white dark:bg-slate-800/80">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/70">Launch path</p>
                  <p className="mt-1 text-sm font-semibold">Starter approval to supply chain activation</p>
                </div>
                <BadgeCheck className="h-6 w-6 text-emerald-300" />
              </div>
              <div className="rounded-[28px] border border-white/30 bg-white/30 p-3 dark:border-white/10 dark:bg-black/20 backdrop-blur">
                <NetworkGlobeScene />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="scroll-section w-full pt-14">
        <div className="w-full overflow-hidden py-8 sm:py-12 text-center lg:py-16">
          <div className="mx-auto w-full max-w-7xl space-y-8">
            
            {/* Header Text Container */}
            <div className="glass-card shadow-none bg-white/50 dark:bg-slate-900/40 p-8 sm:p-10 border-white/40 dark:border-white/10 hover:border-white/80 transition-all duration-300 mx-auto max-w-5xl text-center">
              <p className="mb-4 inline-flex rounded-full border border-brand-blue/20 bg-brand-blue/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-blue dark:border-brand-blue/40 dark:bg-brand-blue/20 dark:text-cyan-300">
                Why this model works
              </p>
              <h2 className="text-3xl font-extrabold leading-[1.2] text-slate-900 dark:text-slate-100 md:text-4xl">
                This is not a listing directory. <br className="hidden sm:block"/> It is a business-launch system.
              </h2>
              <p className="mx-auto mt-6 text-lg leading-relaxed text-slate-700 dark:text-slate-200 lg:px-12">
                ContractChain Hub is built for the moment after a person decides to start a business. Instead of sending cold inquiries and stitching tools together manually, the user enters a managed ecosystem where partners, contracts, and operations are already structured.
              </p>
            </div>

            {/* Feature Sub-cards */}
            <div className="grid gap-6 md:grid-cols-3">
              {differentiators.map((item) => (
                <div key={item.title} className="stagger-card">
                  <div className="glass-card h-full shadow-sm bg-white/90 dark:bg-slate-800/90 p-8 text-left border-white/80 dark:border-slate-700 hover:border-brand-blue/50 dark:hover:border-cyan-400/50 hover:shadow-glow dark:hover:shadow-glow-dark transition-all duration-300">
                    <div className="inline-flex rounded-2xl bg-slate-50 dark:bg-slate-900 p-4 shadow-sm text-brand-blue dark:text-cyan-400">
                      <item.icon className="h-7 w-7" />
                    </div>
                    <h3 className="mt-6 text-xl font-bold text-slate-950 dark:text-white">{item.title}</h3>
                    <p className="mt-3 text-base leading-relaxed text-slate-800 font-medium dark:text-slate-200">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      <section className="scroll-section w-full pt-14">
        <div className="w-full overflow-hidden py-8 sm:py-12 text-center lg:py-16">
          <div className="mx-auto w-full max-w-7xl space-y-8">
            
            {/* Header Text Container */}
            <div className="glass-card shadow-none bg-white/50 dark:bg-slate-900/40 p-8 sm:p-10 border-white/40 dark:border-white/10 hover:border-white/80 transition-all duration-300 mx-auto max-w-5xl text-center">
              <p className="mb-4 inline-flex rounded-full border border-brand-blue/20 bg-brand-blue/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-blue dark:border-brand-blue/40 dark:bg-brand-blue/20 dark:text-cyan-300">
                Launch flow
              </p>
              <h2 className="text-3xl font-extrabold leading-[1.2] text-slate-900 dark:text-slate-100 md:text-4xl">
                From approval request to operating business
              </h2>
              <p className="mx-auto mt-6 text-lg leading-relaxed text-slate-700 dark:text-slate-200 lg:px-12">
                The platform is designed around the Starter journey. Approval unlocks trusted partner browsing, contract activation, and full participation in a running supply chain.
              </p>
            </div>

            {/* Launch Step Sub-cards */}
            <div className="grid gap-6 md:grid-cols-3">
              {launchSteps.map((step, index) => (
                <div key={step.title} className="stagger-card">
                  <div className="glass-card shadow-sm bg-white/90 dark:bg-slate-800/90 p-8 text-left border-white/80 dark:border-slate-700 hover:border-brand-blue/50 dark:hover:border-cyan-400/50 hover:shadow-glow dark:hover:shadow-glow-dark transition-all duration-300 relative overflow-hidden h-full">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-9xl font-extrabold text-slate-900 dark:text-white pointer-events-none">
                      {index + 1}
                    </div>
                    <div className="inline-flex rounded-2xl bg-brand-gradient p-4 shadow-sm text-white">
                      <step.icon className="h-7 w-7" />
                    </div>
                    <div className="mt-8">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-blue dark:text-cyan-400">Step {index + 1}</p>
                      <h3 className="mt-2 text-xl font-bold text-slate-950 dark:text-white">{step.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-slate-800 font-medium dark:text-slate-200">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      <section className="scroll-section w-full pt-14">
        <div className="w-full overflow-hidden py-8 sm:py-12 text-center lg:py-16">
          <div className="mx-auto w-full max-w-7xl space-y-8">
            
            {/* Header Text Container */}
            <div className="glass-card shadow-none bg-white/50 dark:bg-slate-900/40 p-8 sm:p-10 border-white/40 dark:border-white/10 hover:border-white/80 transition-all duration-300 mx-auto max-w-5xl text-center">
              <p className="mb-4 inline-flex rounded-full border border-brand-blue/20 bg-brand-blue/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-blue dark:border-brand-blue/40 dark:bg-brand-blue/20 dark:text-cyan-300">
                Role model
              </p>
              <h2 className="text-3xl font-extrabold leading-[1.2] text-slate-900 dark:text-slate-100 md:text-4xl">
                Every business role fits inside the same operating network
              </h2>
              <p className="mx-auto mt-6 text-lg leading-relaxed text-slate-700 dark:text-slate-200 lg:px-12">
                The platform stays Starter-first while still supporting upstream and downstream participants required for end-to-end B2B execution.
              </p>
            </div>

            {/* Role Sub-cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {roles.map((role) => {
                const isHighlighted = role.title === "Distributor" || role.title === "Retailer";
                return (
                  <div key={role.title} className="stagger-card">
                    <div className={`glass-card p-8 text-left transition-all duration-300 relative overflow-hidden flex flex-col h-full ${isHighlighted ? "border-2 border-brand-blue/80 dark:border-cyan-400/80 shadow-glow dark:shadow-glow-dark bg-brand-blue/5 dark:bg-cyan-400/10 z-10 lg:scale-[1.03]" : "shadow-sm bg-white/90 dark:bg-slate-800/90 border-white/80 dark:border-slate-700 hover:border-brand-blue/50 dark:hover:border-cyan-400/50 hover:shadow-glow dark:hover:shadow-glow-dark"}`}>
                      <div className={`inline-flex self-start rounded-2xl p-4 shadow-sm ${isHighlighted ? "bg-brand-gradient text-white" : "bg-slate-50 dark:bg-slate-900 text-brand-blue dark:text-cyan-400"}`}>
                        <role.icon className="h-7 w-7" />
                      </div>
                      <h3 className={`mt-6 text-xl font-bold ${isHighlighted ? "text-brand-blue dark:text-cyan-400" : "text-slate-950 dark:text-white"}`}>{role.title}</h3>
                      <p className={`mt-3 text-base leading-relaxed font-medium ${isHighlighted ? "text-slate-900 dark:text-slate-100" : "text-slate-800 dark:text-slate-200"}`}>{role.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Domain Network */}
      <section className="scroll-section w-full pt-14">
        <div className="w-full overflow-hidden py-8 sm:py-12 text-center lg:py-16">
          <div className="mx-auto w-full max-w-7xl space-y-8">
            
            <div className="glass-card shadow-none bg-white/50 dark:bg-slate-900/40 p-8 sm:p-10 border-white/40 dark:border-white/10 hover:border-white/80 transition-all duration-300 mx-auto max-w-5xl text-center">
              <p className="mb-4 inline-flex rounded-full border border-cyan-600/20 bg-cyan-600/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 dark:border-cyan-400/40 dark:bg-cyan-400/20 dark:text-cyan-300">
                Multi-domain network
              </p>
              <h2 className="text-3xl font-extrabold leading-[1.2] text-slate-900 dark:text-slate-100 md:text-4xl">
                One contract ecosystem across five operating domains
              </h2>
              <p className="mx-auto mt-6 text-lg leading-relaxed text-slate-700 dark:text-slate-200 lg:px-12">
                Contract bundles and partner networks can be specialized for agriculture, food safety, pharmaceuticals, e-commerce authenticity, and warehouse-led logistics.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
              {domains.map((domain) => {
                const Icon = domainIcons[domain.key];
                return (
                  <div key={domain.key} className="stagger-card">
                    <div className="glass-card shadow-sm bg-white/90 dark:bg-slate-800/90 p-8 text-center border-white/80 dark:border-slate-700 hover:border-cyan-400/50 hover:shadow-glow dark:hover:shadow-glow-dark transition-all duration-300 relative overflow-hidden flex flex-col items-center h-full">
                      <div className="inline-flex rounded-2xl bg-cyan-50 dark:bg-slate-900 p-4 shadow-sm text-cyan-600 dark:text-cyan-400">
                        <Icon className="h-7 w-7" />
                      </div>
                      <h3 className="mt-6 text-xl font-bold text-slate-950 dark:text-white">{domain.name}</h3>
                      <p className="mt-1 text-sm font-bold tracking-widest text-brand-blue uppercase dark:text-cyan-400">{domain.subtitle}</p>
                      <p className="mt-4 text-base leading-relaxed text-slate-800 font-medium dark:text-slate-200">{domain.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </section>

      {/* Bundle Showcase */}
      <section className="scroll-section w-full pt-14">
        <div className="w-full overflow-hidden py-8 sm:py-12 text-center lg:py-16">
          <div className="mx-auto w-full max-w-7xl space-y-8">
            
            <div className="glass-card shadow-none bg-white/50 dark:bg-slate-900/40 p-8 sm:p-10 border-white/40 dark:border-white/10 hover:border-white/80 transition-all duration-300 mx-auto max-w-5xl text-center">
              <p className="mb-4 inline-flex rounded-full border border-violet-600/20 bg-violet-600/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-violet-700 dark:border-violet-400/40 dark:bg-violet-400/20 dark:text-violet-300">
                Bundle showcase
              </p>
              <h2 className="text-3xl font-extrabold leading-[1.2] text-slate-900 dark:text-slate-100 md:text-4xl">
                Ready-to-deploy operating bundles
              </h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {bundleShowcase.map((bundle) => (
                <div key={bundle.title} className="stagger-card">
                  <div className="glass-card shadow-sm bg-white/90 dark:bg-slate-800/90 p-8 text-left border-white/80 dark:border-slate-700 hover:border-violet-400/50 hover:shadow-glow dark:hover:shadow-glow-dark transition-all duration-300 relative overflow-hidden flex flex-col h-full">
                    <p className="text-sm font-black uppercase tracking-[0.1em] text-slate-500 mb-2">{bundle.domain}</p>
                    <h3 className="text-2xl font-extrabold text-slate-950 dark:text-white leading-tight">{bundle.title}</h3>
                    <p className="mt-4 text-base leading-relaxed text-slate-800 font-medium dark:text-slate-200 flex-grow">{bundle.summary}</p>
                    <div className="mt-6 flex flex-wrap gap-2">
                       {bundle.metrics.map(metric => (
                         <span key={metric} className="rounded-full border border-slate-300 dark:border-slate-700 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
                           {metric}
                         </span>
                       ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* Operating Modules */}
      <section className="scroll-section w-full pt-14 pb-20">
        <div className="w-full overflow-hidden py-8 sm:py-12 text-center lg:py-16">
          <div className="mx-auto w-full max-w-7xl space-y-8">
            <div className="glass-card shadow-none bg-white/50 dark:bg-slate-900/40 p-8 sm:p-10 border-white/40 dark:border-white/10 hover:border-white/80 transition-all duration-300 mx-auto max-w-5xl text-center">
              <p className="mb-4 inline-flex rounded-full border border-rose-600/20 bg-rose-600/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-rose-700 dark:border-rose-400/40 dark:bg-rose-400/20 dark:text-rose-400">
                Operating modules
              </p>
              <h2 className="text-3xl font-extrabold leading-[1.2] text-slate-900 dark:text-slate-100 md:text-4xl">
                After activation, the same platform runs the business
              </h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {operatingModules.map((module) => (
                <div key={module.title} className="stagger-card">
                  <div className="glass-card shadow-sm bg-white/90 dark:bg-slate-800/90 p-8 text-left border-white/80 dark:border-slate-700 hover:border-rose-400/50 hover:shadow-glow dark:hover:shadow-glow-dark transition-all duration-300 relative overflow-hidden flex gap-6 h-full items-start">
                    <div className="flex shrink-0 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-900 p-4 shadow-sm text-rose-600 dark:text-rose-400">
                      <module.icon className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-950 dark:text-white">{module.title}</h3>
                      <p className="mt-3 text-base leading-relaxed text-slate-800 font-medium dark:text-slate-200">{module.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="scroll-section relative overflow-hidden rounded-[32px] bg-brand-gradient px-6 py-14 text-white sm:px-10">
        <div className="absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_45%)]" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.14),transparent_45%)]" />
        <div className="relative mx-auto max-w-4xl">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">ContractChain Hub</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Give new businesses an operating network on day one.</h2>
              <p className="mt-4 max-w-2xl text-white/88">
                Approve Starters, expose trusted companies, activate contract pathways, and run sourcing, fulfillment, and settlement workflows in one ecosystem.
              </p>
              <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row">
                <Link to="/signup">
                  <Button variant="secondary" size="lg" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                    Request Starter Access
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button variant="secondary" size="lg" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                    View Operations Dashboard
                  </Button>
                </Link>
              </div>
            </div>
            <div className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur">
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                  <Users2 className="h-4 w-4" />
                  Admin-approved partner discovery
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                  <FileSignature className="h-4 w-4" />
                  Contract bundles with operational logic
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                  <PackageCheck className="h-4 w-4" />
                  Inventory, orders, and shipment control
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                  <CircleDollarSign className="h-4 w-4" />
                  Settlement and business visibility
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
