import { useEffect, useState, useMemo } from "react";
import { Search, Globe, MapPin, Building2, UserPlus, ExternalLink, Filter, CheckCircle2 } from "lucide-react";
import { api, type DirectoryCompany } from "../../services/api";
import Card from "../common/Card";
import Button from "../common/Button";
import Badge from "../common/Badge";
import { useToast } from "../common/Toast";
import { cn } from "../../lib/utils";

const DOMAINS = [
  { id: "all", label: "All Industries" },
  { id: "agriculture", label: "Agriculture" },
  { id: "electronics", label: "Electronics" },
  { id: "pharma", label: "Pharmaceuticals" },
  { id: "textiles", label: "Textiles" },
  { id: "logistics", label: "Logistics" }
];

export default function DirectoryWorkspace() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [companies, setCompanies] = useState<DirectoryCompany[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");

  async function loadDirectory() {
    setLoading(true);
    try {
      const data = await api.listB2bDirectory();
      setCompanies(data);
    } catch (err: any) {
      toast(err.message || "Failed to load directory", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDirectory();
  }, []);

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const matchesSearch = c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           c.domain.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDomain = selectedDomain === "all" || c.domain.toLowerCase() === selectedDomain.toLowerCase();
      return matchesSearch && matchesDomain;
    });
  }, [companies, searchQuery, selectedDomain]);

  async function handleConnect(companyId: string, companyName: string) {
    setConnecting(companyId);
    try {
      await api.createSupplierRelationship({
        supplierCompanyId: companyId,
        relationshipType: "supplier",
        riskLevel: "medium"
      });
      toast(`Connection request sent to ${companyName}`, "success");
      // Update local state to show as linked
      setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, already_linked: true } : c));
    } catch (err: any) {
      toast(err.message || `Failed to connect with ${companyName}`, "error");
    } finally {
      setConnecting(null);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search companies, domains, or industry tags..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm transition focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 dark:border-slate-800 dark:bg-slate-900">
            {DOMAINS.map((domain) => (
              <button
                key={domain.id}
                onClick={() => setSelectedDomain(domain.id)}
                className={cn(
                  "whitespace-nowrap rounded-xl px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition",
                  selectedDomain === domain.id
                    ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/20"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                )}
              >
                {domain.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-[32px] bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : filteredCompanies.length === 0 ? (
        <Card className="flex h-64 flex-col items-center justify-center text-center">
          <Building2 className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No companies found</h3>
          <p className="mt-1 text-sm text-slate-500">Try adjusting your search or filters to find partners.</p>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCompanies.map((company) => (
            <Card key={company.id} className="group overflow-hidden transition-all hover:border-brand-blue/30 hover:shadow-xl dark:hover:border-brand-blue/20">
              <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue transition-transform group-hover:scale-110">
                <Building2 className="h-8 w-8" />
                <div className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white p-1 shadow-sm dark:bg-slate-800">
                  <div className="h-full w-full rounded-full bg-emerald-500" />
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{company.company_name}</h3>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <Badge variant="info" className="uppercase tracking-widest">{company.domain}</Badge>
                  <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <p>{company.company_code}</p>
                </div>
              </div>

              <div className="mt-6 space-y-3 border-t border-slate-100 pt-6 dark:border-slate-800">
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <MapPin className="h-4 w-4" />
                  {company.city}, {company.country}
                </div>
                {company.website && (
                  <a 
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-3 text-sm text-slate-600 transition hover:text-brand-blue dark:text-slate-400 dark:hover:text-brand-blue"
                  >
                    <Globe className="h-4 w-4" />
                    {company.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>

              <div className="mt-8 flex gap-3">
                {company.already_linked ? (
                  <Button variant="secondary" className="flex-1 gap-2 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-950 dark:text-emerald-400" disabled>
                    <CheckCircle2 className="h-4 w-4" />
                    Connected
                  </Button>
                ) : (
                  <Button 
                    className="flex-1 gap-2" 
                    disabled={connecting === company.id}
                    onClick={() => handleConnect(company.id, company.company_name)}
                  >
                    {connecting === company.id ? (
                      "Connecting..."
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Connect
                      </>
                    )}
                  </Button>
                )}
                <Button variant="icon" className="h-12 w-12 rounded-2xl">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Stats/Promo Section */}
      <div className="rounded-[40px] bg-brand-gradient p-10 text-white shadow-2xl">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight">Expand Your Ecosystem</h2>
          <p className="mt-4 text-brand-blue-light/90">
            ChainTrace partners are pre-vetted businesses that have met our quality and transparency standards. 
            Connect with manufacturers, suppliers, and logistics providers to build a resilient supply chain.
          </p>
          <div className="mt-8 flex flex-wrap gap-8">
            <div>
              <p className="text-4xl font-black">2.4k+</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-brand-blue-light">Verified Partners</p>
            </div>
            <div>
              <p className="text-4xl font-black">450+</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-brand-blue-light">Industries</p>
            </div>
            <div>
              <p className="text-4xl font-black">98%</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-brand-blue-light">Uptime Reliability</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
