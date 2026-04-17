import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Mail, Lock, ShieldCheck } from "lucide-react";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import { api } from "../services/api";
import { useToast } from "../components/common/Toast";
import { getAccessTokenPayload } from "../lib/session";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.login(email, password);
      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);
      const session = getAccessTokenPayload();
      toast("Successfully logged in!", "success");
      navigate(session?.role === "super_admin" ? "/admin/onboarding" : "/dashboard");
    } catch (err: any) {
      toast(err.message || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow">
            <LogIn className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Welcome back to ContractChain Hub</h1>
          <p className="mt-2 text-sm text-slate-500">Continue to approvals, ecosystem setup, and your operations dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-800 dark:bg-slate-950"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-800 dark:bg-slate-950"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-500">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-blue accent-brand-blue" />
              Remember me
            </label>
            <a href="#" className="text-xs font-medium text-brand-blue hover:underline">Forgot password?</a>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Authenticating..." : "Log In"}
          </Button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200 dark:border-slate-800"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500 dark:bg-slate-900">Trusted Access</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <p className="text-[10px] leading-tight text-slate-500">
                Secure role-based access for admins, Starters, producers, manufacturers, distributors, and retailers.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold text-brand-blue hover:underline">
            Sign Up
          </Link>
        </p>
      </Card>
    </div>
  );
}
