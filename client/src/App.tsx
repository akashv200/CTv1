import { useEffect } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Boxes, Home, LayoutDashboard, LogOut, QrCode, Settings, UserCircle, Wallet } from "lucide-react";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import RegisterProductPage from "./pages/RegisterProductPage";
import VerifyProductPage from "./pages/VerifyProductPage";
import SettingsPage from "./pages/SettingsPage";
import { cn } from "./lib/utils";
import { useThemeStore } from "./store/useThemeStore";
import { useWalletStore } from "./store/useWalletStore";
import { useChainTraceStore } from "./store/useChainTraceStore";
import Button from "./components/common/Button";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SetupPasswordPage from "./pages/SetupPasswordPage";
import { getAccessTokenPayload } from "./lib/session";
import FloatingBackground from "./components/common/FloatingBackground";

const baseNavItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/register", label: "Products", icon: Boxes },
  { to: "/verify", label: "Verify", icon: QrCode },
  { to: "/settings", label: "Settings", icon: Settings }
];

function AppNav() {
  const location = useLocation();
  const session = getAccessTokenPayload();
  const isMetaMaskInstalled = useWalletStore((state) => state.isMetaMaskInstalled);
  const address = useWalletStore((state) => state.address);
  const chainId = useWalletStore((state) => state.chainId);
  const isConnecting = useWalletStore((state) => state.isConnecting);
  const connectWallet = useWalletStore((state) => state.connect);
  const navItems = baseNavItems;

  const chainLabel = (() => {
    if (!chainId) return "Chain ?";
    const numericChain = Number.parseInt(chainId, 16);
    if (Number.isNaN(numericChain)) return chainId;
    return `Chain ${numericChain}`;
  })();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/90 shadow-sm backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex h-16 w-full items-center justify-between px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-gradient text-xs font-bold text-white shadow-glow">CH</div>
          <div>
            <p className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100">ContractChain Hub</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Pre-vetted supply chain launch ecosystem</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <nav className="flex items-center gap-1.5">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = to === "/"
                ? location.pathname === to
                : location.pathname === to || location.pathname.startsWith(`${to}/`);
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "relative inline-flex h-9 items-center gap-2 rounded-xl px-3.5 text-sm font-medium transition",
                    active ? "text-white" : "text-slate-600 hover:text-brand-blue dark:text-slate-300 dark:hover:text-slate-100"
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="active-nav-pill"
                      className="absolute inset-0 rounded-xl bg-brand-gradient"
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    />
                  ) : null}
                  <Icon className="relative z-10 h-4 w-4" />
                  <span className="relative z-10">{label}</span>
                </Link>
              );
            })}
          </nav>
          {!isMetaMaskInstalled ? (
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:border-brand-blue hover:text-brand-blue dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-500"
            >
              <Wallet className="h-4 w-4" />
              Install MetaMask
            </a>
          ) : address ? (
            <div className="inline-flex h-9 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300">
              <Wallet className="h-4 w-4" />
              {`${address.slice(0, 6)}...${address.slice(-4)}`}
              <span className="text-emerald-600/80 dark:text-emerald-300/80">({chainLabel})</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {session ? (
                <>
                  <Link to="/settings">
                    <Button variant="secondary" size="sm" className="h-9 px-3">
                      <UserCircle className="mr-2 h-4 w-4" />
                      Profile
                    </Button>
                  </Link>
                  <Button variant="secondary" size="sm" className="h-9 px-3 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="secondary" size="sm" className="h-9 px-3">
                      Log In
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button size="sm" className="h-9 px-3">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
              <Button type="button" size="sm" className="h-9 px-3 bg-slate-100 text-slate-700 hover:bg-slate-200 border-none shadow-none" onClick={() => void connectWallet()} disabled={isConnecting}>
                <Wallet className="mr-2 h-4 w-4" />
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            </div>
          )}
        </div>
      </div>

    </header>
  );
}

export default function App() {
  const initializeTheme = useThemeStore((state) => state.initializeTheme);
  const initializeWallet = useWalletStore((state) => state.initialize);
  const initializeStore = useChainTraceStore((state) => state.initialize);

  useEffect(() => {
    initializeTheme();
    void initializeWallet();
    void initializeStore();
  }, [initializeTheme, initializeWallet, initializeStore]);

  return (
    <div className="min-h-screen bg-slate-50 bg-mesh-gradient dark:bg-none dark:bg-slate-950 relative isolate overflow-hidden">
      <FloatingBackground />
      <AppNav />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/register" element={<RegisterProductPage />} />
        <Route path="/verify" element={<VerifyProductPage />} />
        <Route path="/verify/:productId" element={<VerifyProductPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/password/complete" element={<SetupPasswordPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

    </div>
  );
}
