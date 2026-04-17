import { type PropsWithChildren, useEffect, useState } from "react";
import { Bell, Bot, Database, Menu, Search, Server, UserCircle2, X, Zap } from "lucide-react";
import { domains } from "../../data/domainConfig";
import { useChainTraceStore } from "../../store/useChainTraceStore";
import { usePlatformSettingsStore } from "../../store/usePlatformSettingsStore";
import { cn } from "../../lib/utils";

interface ServiceStatus {
  postgresql: boolean;
  ganache: boolean;
  aiService: boolean;
}

const navItems = [
  { label: "Overview", targetId: "overview-section" },
  { label: "Products", targetId: "products-section" },
  { label: "Checkpoints", targetId: "checkpoints-section" },
  { label: "Verification", targetId: "verification-section" },
  { label: "3D Warehouse", targetId: "warehouse-section" },
  { label: "Reports", targetId: "reports-section" },
  { label: "AI Assistant", targetId: "ai-assistant-section" },
  { label: "Integrations", targetId: "integrations-section" }
];

export default function AppShell({ children }: PropsWithChildren) {
  const activeDomain = useChainTraceStore((state) => state.activeDomain);
  const setDomain = useChainTraceStore((state) => state.setDomain);
  const domain = domains.find((item) => item.key === activeDomain) ?? domains[0];
  const notifications = useChainTraceStore((state) => state.notifications);
  const profile = usePlatformSettingsStore((state) => state.settings.profile);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeTarget, setActiveTarget] = useState(navItems[0].targetId);
  const [showAI, setShowAI] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    postgresql: false,
    ganache: false,
    aiService: false
  });

  // Check service health on mount and periodically
  useEffect(() => {
    async function checkServiceHealth() {
      const status: ServiceStatus = { postgresql: false, ganache: false, aiService: false };

      // Check PostgreSQL via backend API
      try {
        const response = await fetch("/api/health");
        if (response.ok) {
          status.postgresql = true;
        }
      } catch {
        // PostgreSQL not reachable
      }

      // Check Ganache
      try {
        const response = await fetch("http://127.0.0.1:7545", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 })
        });
        if (response.ok) {
          status.ganache = true;
        }
      } catch {
        // Ganache not reachable
      }

      // Check AI Service
      try {
        const response = await fetch("http://localhost:5000/health");
        if (response.ok) {
          status.aiService = true;
        }
      } catch {
        // AI service not reachable
      }

      setServiceStatus(status);
    }

    void checkServiceHealth();
    const interval = setInterval(checkServiceHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  function navigateToSection(targetId: string) {
    const section = document.getElementById(targetId);
    if (!section) return;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveTarget(targetId);
    setIsMenuOpen(false);
  }

  function handleBotClick() {
    const currentPath = window.location.pathname;
    if (currentPath === "/dashboard") {
      navigateToSection("ai-assistant-section");
    } else {
      window.location.href = "/dashboard";
    }
    setShowAI(!showAI);
  }

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login";
  }

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest(".relative")) {
        setShowNotifications(false);
        setShowProfile(false);
        setShowStatus(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-4 py-6 lg:flex-row lg:px-6">
      {/* Mobile Menu Backdrop */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-[70] w-72 transform bg-white p-4 shadow-2xl transition-transform duration-300 ease-in-out dark:bg-slate-900 lg:relative lg:inset-auto lg:z-0 lg:w-[280px] lg:translate-x-0 lg:rounded-2xl lg:border lg:border-slate-200 lg:shadow-card lg:dark:border-slate-800",
        isMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between mb-6 lg:hidden">
          <span className="text-lg font-bold bg-brand-gradient bg-clip-text text-transparent italic">ChainTrace</span>
          <button onClick={() => setIsMenuOpen(false)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="mb-6 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase text-slate-500">Active Domain</p>
          <select
            value={activeDomain}
            onChange={(event) => setDomain(event.target.value as typeof activeDomain)}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {domains.map((item) => (
              <option key={item.key} value={item.key}>
                {item.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{domain.subtitle}</p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.targetId}
              type="button"
              onClick={() => navigateToSection(item.targetId)}
              className={cn(
                "w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition",
                activeTarget === item.targetId
                  ? "bg-brand-gradient text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 space-y-5 overflow-hidden">
        <header className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setIsMenuOpen(true)}
                className="mr-3 rounded-lg border border-slate-200 p-2 lg:hidden dark:border-slate-700 dark:text-slate-300"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-[10px] uppercase text-slate-500 md:text-xs">Domain dashboard</p>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 md:text-2xl">{domain.name} Control Center</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="hidden h-10 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-600 sm:inline-flex md:flex-none dark:border-slate-700 dark:text-slate-300">
                <Search className="h-4 w-4" />
                <span className="truncate">Search products, tx hash...</span>
              </div>
              <div className="flex items-center gap-2 ml-auto md:ml-0">
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={cn(
                      "relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 transition md:h-10 md:w-10 dark:border-slate-700 dark:text-slate-300",
                      showNotifications && "bg-slate-100 dark:bg-slate-800"
                    )}
                  >
                    <Bell className="h-4 w-4" />
                    {notifications.length > 0 && (
                      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"></span>
                    )}
                  </button>
                  
                  {showNotifications && (
                    <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl md:w-80 dark:border-slate-800 dark:bg-slate-900">
                      <div className="border-b border-slate-100 p-3 dark:border-slate-800">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Live Notifications</p>
                      </div>
                      <div className="max-h-80 overflow-y-auto pt-2">
                        {notifications.length > 0 ? (
                          notifications.map((n) => (
                            <div key={n.id} className="mb-1 rounded-xl p-3 transition hover:bg-slate-50 dark:hover:bg-slate-800">
                              <div className="flex items-start gap-2">
                                <div className={cn(
                                  "mt-1 h-2 w-2 shrink-0 rounded-full",
                                  n.severity === 'critical' ? 'bg-red-500' : n.severity === 'warning' ? 'bg-amber-500' : 'bg-brand-blue'
                                )} />
                                <div>
                                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{n.title}</p>
                                  <p className="mt-0.5 text-[10px] leading-tight text-slate-500 md:text-[11px] dark:text-slate-400">{n.message}</p>
                                  <p className="mt-1 text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleTimeString()}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-8 text-center">
                            <p className="text-xs text-slate-400">No active alerts.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowStatus(!showStatus)}
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 rounded-full border px-2 text-xs font-medium transition md:h-10 md:px-2.5",
                      serviceStatus.postgresql && serviceStatus.ganache
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                        : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
                    )}
                    title="System Status"
                  >
                    <Zap className={cn("h-3.5 w-3.5", serviceStatus.postgresql && serviceStatus.ganache ? "text-emerald-500" : "text-amber-500")} />
                    <span className="hidden sm:inline">System</span>
                  </button>

                  {showStatus && (
                    <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl md:w-80 dark:border-slate-800 dark:bg-slate-900">
                      <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Infrastructure Status</p>
                      </div>
                      <div className="mt-3 space-y-2">
                        {/* PostgreSQL */}
                        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800">
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-slate-500" />
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">PostgreSQL</p>
                          </div>
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                            serviceStatus.postgresql ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                          )}>
                            {serviceStatus.postgresql ? "Connected" : "Offline"}
                          </span>
                        </div>
                        {/* Ganache */}
                        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800">
                          <div className="flex items-center gap-2">
                            <Server className="h-4 w-4 text-slate-500" />
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Ganache</p>
                          </div>
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                            serviceStatus.ganache ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                          )}>
                            {serviceStatus.ganache ? "Live" : "Offline"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowProfile(!showProfile)}
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 transition hover:bg-slate-100 md:h-10 md:w-10 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800",
                      showProfile && "bg-slate-100 dark:bg-slate-800"
                    )}
                  >
                    <UserCircle2 className="h-5 w-5" />
                  </button>

                  {showProfile && (
                    <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl md:w-72 dark:border-slate-800 dark:bg-slate-900">
                      <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{profile.displayName}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{profile.email}</p>
                      </div>
                      <div className="mt-3 space-y-1">
                        <a href="/settings" className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Settings</a>
                        <button
                          onClick={handleLogout}
                          className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="w-full overflow-hidden px-1 pb-10">
          {children}
        </main>
      </div>
    </div>
  );
}
