import { useEffect, useMemo, useState, useRef } from "react";
import { 
  Building2, 
  Network, 
  Search, 
  Sparkles, 
  Send, 
  MessageSquare, 
  Plus, 
  Info,
  ChevronRight,
  TrendingUp,
  ShieldCheck
} from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Badge from "../common/Badge";
import Button from "../common/Button";
import Card from "../common/Card";
import { useToast } from "../common/Toast";
import { type DirectoryCompany, type SupplyChainNetwork, api } from "../../services/api";
import { cn } from "../../lib/utils";

const fieldClassName =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

const domainOptions = [
  { value: "", label: "All domains" },
  { value: "agriculture", label: "Agriculture" },
  { value: "pharmaceutical", label: "Pharmaceutical" },
  { value: "food", label: "Food Safety" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "warehouse", label: "Warehouse IoT" }
];

const partnerRoleOptions = [
  { value: "raw_material_manufacturer", label: "Raw Material Manufacturer" },
  { value: "distributor", label: "Distributor" },
  { value: "final_product_manufacturer", label: "Final Product Manufacturer" },
  { value: "retailer", label: "Retailer" },
  { value: "consumer", label: "Consumer" }
];

function domainBadge(domain: string) {
  if (domain === "agriculture") return "success";
  if (domain === "pharmaceutical") return "danger";
  if (domain === "food") return "warning";
  return "info";
}

function domainTint(domain: string) {
  if (domain === "agriculture") return { border: "#10b981", fill: "#ecfdf5" };
  if (domain === "pharmaceutical") return { border: "#ef4444", fill: "#fef2f2" };
  if (domain === "food") return { border: "#f59e0b", fill: "#fffbeb" };
  if (domain === "warehouse") return { border: "#06b6d4", fill: "#ecfeff" };
  return { border: "#6366f1", fill: "#eef2ff" };
}

function formatRole(role: string) {
  return role.replace(/_/g, " ");
}

function SupplyChainGraph({ network }: { network: SupplyChainNetwork }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const partnerNodes = [...network.partners].sort((left, right) => left.stage_order - right.stage_order);
  const nodes = [
    {
      id: `owner-${network.id}`,
      company_name: network.name,
      company_domain: network.domain,
      partner_role: "your business",
      stage_order: 0
    },
    ...partnerNodes
  ];
  const width = Math.max(760, nodes.length * 210);
  const positions = nodes.map((node, index) => ({
    ...node,
    x: 110 + index * 190,
    y: index % 2 === 0 ? 88 : 178
  }));

  useGSAP(() => {
    gsap.from(".chain-path", {
      strokeDashoffset: 100,
      opacity: 0,
      stagger: 0.1,
      duration: 1.5,
      ease: "power2.inOut"
    });
    gsap.from(".chain-node", {
      scale: 0.8,
      opacity: 0,
      stagger: 0.1,
      duration: 1,
      ease: "back.out(1.7)"
    });
  }, { scope: containerRef, dependencies: [network.id, nodes.length] });

  return (
    <div ref={containerRef} className="overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="relative h-[260px] min-w-[760px]" style={{ width }}>
        <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${width} 260`} preserveAspectRatio="none">
          <defs>
            <marker id="chaintrace-arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#6366f1" />
            </marker>
          </defs>
          {positions.slice(0, -1).map((node, index) => {
            const next = positions[index + 1];
            return (
              <line
                key={`${node.id}-${next.id}`}
                className="chain-path"
                x1={node.x + 74}
                y1={node.y}
                x2={next.x - 74}
                y2={next.y}
                stroke="#6366f1"
                strokeWidth="2"
                strokeDasharray="8 4"
                markerEnd="url(#chaintrace-arrow)"
              />
            );
          })}
        </svg>

        {positions.map((node) => {
          const tint = domainTint(node.company_domain);
          return (
            <div
              key={node.id}
              className="chain-node absolute w-44 -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-white p-4 shadow-xl dark:bg-slate-900"
              style={{ left: node.x, top: node.y, borderColor: tint.border }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">{formatRole(node.partner_role)}</p>
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{node.company_name}</p>
              <div className="mt-3 flex items-center justify-between">
                <Badge variant={domainBadge(node.company_domain) as any} className="text-[8px] py-0 px-1.5">
                  {node.company_domain}
                </Badge>
                {"stage_order" in node && node.stage_order > 0 ? (
                  <p className="text-[10px] font-bold text-slate-400">STAGE {node.stage_order}</p>
                ) : (
                  <ShieldCheck size={14} className="text-indigo-500" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function EcosystemWorkspace() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [addingCompanyId, setAddingCompanyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<DirectoryCompany[]>([]);
  const [networks, setNetworks] = useState<SupplyChainNetwork[]>([]);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>("");
  const [filters, setFilters] = useState({ domain: "", search: "" });
  const [networkForm, setNetworkForm] = useState({
    name: "",
    domain: "agriculture",
    description: ""
  });
  const [partnerDrafts, setPartnerDrafts] = useState<Record<string, { partnerRole: string; stageOrder: string; notes: string }>>({});

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".workspace-module", {
      y: 30,
      opacity: 0,
      stagger: 0.15,
      duration: 1,
      ease: "power3.out"
    });
  }, { scope: containerRef });

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [directoryRows, networkRows] = await Promise.all([
        api.listB2bDirectory({
          domain: filters.domain || undefined,
          search: filters.search || undefined
        }),
        api.listSupplyChainNetworks()
      ]);
      setCompanies(directoryRows);
      setNetworks(networkRows);
      setSelectedNetworkId((current) => current || networkRows[0]?.id || "");
    } catch (err: any) {
      const message = err.message || "Failed to load ecosystem workspace.";
      setError(message);
      toast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [filters.domain, filters.search]);

  const selectedNetwork = useMemo(
    () => networks.find((network) => network.id === selectedNetworkId) ?? null,
    [networks, selectedNetworkId]
  );

  async function createNetwork(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    try {
      const response = await api.createSupplyChainNetwork({
        name: networkForm.name,
        domain: networkForm.domain,
        description: networkForm.description || undefined
      });
      toast("Supply chain network created.", "success");
      setNetworkForm({ name: "", domain: "agriculture", description: "" });
      await loadData();
      setSelectedNetworkId(response.id);
    } catch (err: any) {
      toast(err.message || "Failed to create network", "error");
    } finally {
      setCreating(false);
    }
  }

  async function addPartnerToNetwork(companyId: string) {
    if (!selectedNetworkId) {
      toast("Create a supply chain network first.", "error");
      return;
    }

    const draft = partnerDrafts[companyId] ?? {
      partnerRole: "raw_material_supplier",
      stageOrder: String((selectedNetwork?.partners.length ?? 0) + 1),
      notes: ""
    };

    setAddingCompanyId(companyId);
    try {
      await api.addSupplyChainPartner(selectedNetworkId, {
        partnerCompanyId: companyId,
        partnerRole: draft.partnerRole,
        stageOrder: Number(draft.stageOrder) || 1,
        notes: draft.notes || undefined
      });
      toast("Partner added to your ecosystem.", "success");
      await loadData();
    } catch (err: any) {
      toast(err.message || "Failed to add partner", "error");
    } finally {
      setAddingCompanyId(null);
    }
  }

  function patchPartnerDraft(companyId: string, field: "partnerRole" | "stageOrder" | "notes", value: string) {
    setPartnerDrafts((current) => ({
      ...current,
      [companyId]: {
        partnerRole: current[companyId]?.partnerRole ?? "raw_material_supplier",
        stageOrder: current[companyId]?.stageOrder ?? String((selectedNetwork?.partners.length ?? 0) + 1),
        notes: current[companyId]?.notes ?? "",
        [field]: value
      }
    }));
  }

  const handleSendProposal = (companyName: string) => {
    toast(`Proposal request sent to ${companyName}.`, "success");
  };

  const handleContact = (companyName: string) => {
    toast(`Opening secure channel with ${companyName}...`, "info");
  };

  if (error) return <Card className="mt-6 text-sm text-slate-600 dark:text-slate-300">{error}</Card>;

  return (
    <section ref={containerRef} className="mt-6 grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <div className="space-y-6">
        <Card className="workspace-module border-none ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-500 shadow-inner">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Venture</h2>
              <p className="text-xs text-slate-500 font-medium">Build an on-chain supply network.</p>
            </div>
          </div>
          <form className="mt-6 space-y-4" onSubmit={createNetwork}>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Network Name</label>
              <input className={fieldClassName} placeholder="Ex: Organic Coffee Alliance" required value={networkForm.name} onChange={(event) => setNetworkForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Industry Domain</label>
              <select className={fieldClassName} value={networkForm.domain} onChange={(event) => setNetworkForm((current) => ({ ...current, domain: event.target.value }))}>
                {domainOptions.filter((option) => option.value).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Operational Vision</label>
              <textarea className={`${fieldClassName} min-h-24 resize-none`} placeholder="Describe the supply chain goals..." value={networkForm.description} onChange={(event) => setNetworkForm((current) => ({ ...current, description: event.target.value }))} />
            </div>
            <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700" disabled={creating}>
              {creating ? "Forging Network..." : "Initialize Network"}
            </Button>
          </form>
        </Card>

        <Card className="workspace-module border-none ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">My Ecosystems</h2>
          <div className="space-y-3">
            {networks.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No supply-chain networks forged yet.</p>
            ) : (
              networks.map((network) => (
                <button
                  key={network.id}
                  type="button"
                  onClick={() => setSelectedNetworkId(network.id)}
                  className={cn(
                    "w-full rounded-2xl border-2 p-4 text-left transition-all group",
                    network.id === selectedNetworkId
                      ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10"
                      : "border-slate-50 bg-white hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-900"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{network.name}</p>
                    <Badge variant={domainBadge(network.domain) as any} className="text-[9px]">{network.domain}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      {network.partners.length} Linked Nodes
                    </p>
                    <ChevronRight size={14} className={cn(
                      "transition-transform",
                      network.id === selectedNetworkId ? "text-indigo-500 translate-x-1" : "text-slate-300"
                    )} />
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="workspace-module border-none ring-1 ring-slate-200 dark:ring-slate-800 shadow-2xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500 grid place-items-center text-white">
                <Search size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Industry Directory</h2>
                <p className="text-xs text-slate-500 font-medium">Browse verified partners for your venture.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <Badge variant="info" className="h-6">{companies.length} ACTIVE PARTNERS</Badge>
               <div className="flex -space-x-2">
                  {[1,2,3].map(i => <div key={i} className="h-6 w-6 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200" />)}
               </div>
            </div>
          </div>
          
          <div className="mb-6 grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
            <select className={fieldClassName} value={filters.domain} onChange={(event) => setFilters((current) => ({ ...current, domain: event.target.value }))}>
              {domainOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input className={`${fieldClassName} pl-10`} placeholder="Filter by company name or region..." value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <div className="h-8 w-8 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mb-4" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Accessing Ledger...</p>
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-950/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
               <Info className="mx-auto h-8 w-8 text-slate-300 mb-2" />
               <p className="text-sm text-slate-500">No verified partners found for this criteria.</p>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {companies.map((company) => {
                const draft = partnerDrafts[company.id] ?? {
                  partnerRole: "raw_material_supplier",
                  stageOrder: String((selectedNetwork?.partners.length ?? 0) + 1),
                  notes: ""
                };
                const alreadyInSelectedNetwork = selectedNetwork?.partners.some((partner) => partner.company_id === company.id);

                return (
                  <div key={company.id} className="group relative rounded-3xl border border-slate-100 bg-white p-5 transition-all hover:shadow-2xl hover:shadow-indigo-500/5 dark:border-slate-800 dark:bg-slate-900/50">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 grid place-items-center text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                          <Building2 size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{company.company_name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{company.city || "Global"}, {company.country}</p>
                        </div>
                      </div>
                      <Badge variant={domainBadge(company.domain) as any} className="text-[9px]">{company.domain}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <button 
                        onClick={() => handleSendProposal(company.company_name)}
                        className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500/10 py-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-500 hover:text-white"
                      >
                        <Send size={14} />
                        Proposal
                      </button>
                      <button 
                        onClick={() => handleContact(company.company_name)}
                        className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <MessageSquare size={14} />
                        Contact
                      </button>
                    </div>

                    <div className="space-y-3 pb-3 border-b border-slate-50 dark:border-slate-800">
                       <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Ecosystem Role</label>
                            <select className={cn(fieldClassName, "py-1.5 h-9")} value={draft.partnerRole} onChange={(event) => patchPartnerDraft(company.id, "partnerRole", event.target.value)}>
                              {partnerRoleOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Stage Pos</label>
                            <input className={cn(fieldClassName, "py-1.5 h-9")} type="number" min="1" value={draft.stageOrder} onChange={(event) => patchPartnerDraft(company.id, "stageOrder", event.target.value)} />
                          </div>
                       </div>
                    </div>

                    <Button 
                      type="button" 
                      className={cn(
                        "mt-4 w-full h-9 text-xs",
                        alreadyInSelectedNetwork ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10" : "bg-slate-900 dark:bg-indigo-600"
                      )} 
                      disabled={!selectedNetworkId || alreadyInSelectedNetwork || addingCompanyId === company.id} 
                      onClick={() => void addPartnerToNetwork(company.id)}
                    >
                      {addingCompanyId === company.id ? "Syncing..." : alreadyInSelectedNetwork ? "Already In Blueprint" : "Attach to Blueprint"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="workspace-module border-none ring-1 ring-slate-200 dark:ring-slate-800 shadow-2xl bg-white/50 backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-xl bg-emerald-500 grid place-items-center text-white">
                 <TrendingUp size={20} />
               </div>
               <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Live Network Blueprint</h2>
                  <p className="text-xs text-slate-500 font-medium">Visualizing your end-to-end supply chain architecture.</p>
               </div>
            </div>
            {selectedNetwork && <Badge variant="success" className="h-6 uppercase font-black">{selectedNetwork.partners.length} NODES LINKED</Badge>}
          </div>

          {!selectedNetwork ? (
            <div className="rounded-[32px] border-2 border-dashed border-slate-200 p-16 text-center dark:border-slate-800">
              <Building2 className="mx-auto h-12 w-12 text-slate-200 mb-4" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Forge a Network to Commence Modeling</p>
            </div>
          ) : selectedNetwork.partners.length === 0 ? (
            <div className="rounded-[32px] border-2 border-dashed border-indigo-200 bg-indigo-50/20 p-16 text-center dark:border-indigo-950/20">
              <Sparkles className="mx-auto h-12 w-12 text-indigo-300 mb-4 animate-pulse" />
              <p className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Blueprint is Empty. Start Attaching Nodes.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <SupplyChainGraph network={selectedNetwork} />
              <div className="grid gap-4 xl:grid-cols-2">
                {selectedNetwork.partners.map((partner) => (
                  <div key={partner.id} className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="absolute right-0 top-0 h-20 w-20 bg-indigo-500/5 blur-2xl" />
                    <div className="flex items-center justify-between gap-3 relative">
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-white">{partner.company_name}</p>
                        <p className="text-[10px] font-bold text-slate-400 lowercase tracking-tight">{partner.company_domain}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <Badge variant="info" className="text-[8px] py-0 px-1 mb-1">STAGE {partner.stage_order}</Badge>
                        <Badge variant="warning" className="text-[8px] py-0 px-1">{partner.partner_role}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
