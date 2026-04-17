import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound, ShieldCheck, UserCheck } from "lucide-react";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import { useToast } from "../components/common/Toast";
import { api } from "../services/api";

export default function SetupPasswordPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [info, setInfo] = useState<{ name: string; email: string; companyName?: string; purpose: string } | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        toast("No token provided", "error");
        navigate("/login");
        return;
      }

      try {
        const data = await api.inspectPasswordToken(token);
        setInfo(data);
      } catch (error: any) {
        toast(error.message || "Invalid or expired token", "error");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    }

    void verifyToken();
  }, [token, navigate, toast]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    if (password.length < 8) {
      toast("Password must be at least 8 characters", "error");
      return;
    }

    if (password !== confirmPassword) {
      toast("Passwords do not match", "error");
      return;
    }

    setSubmitting(true);
    try {
      await api.completePasswordFlow(token, password);
      toast("Password set successfully! You can now log in.", "success");
      navigate("/login");
    } catch (error: any) {
      toast(error.message || "Failed to set password", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center px-4">
        <p className="text-slate-500 animate-pulse">Verifying security token...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8 shadow-glow">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-lg">
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {info?.purpose === "invite_setup" ? "Set Your Password" : "Reset Your Password"}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {info?.purpose === "invite_setup" 
              ? `Finish setting up your account for ${info.companyName || "your organization"}.` 
              : "Choose a new password to secure your account."}
          </p>
        </div>

        <div className="mt-8 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-200 p-2 dark:bg-slate-800">
              <UserCheck className="h-full w-full text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{info?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{info?.email}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
            <input
              type="password"
              required
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password</label>
            <input
              type="password"
              required
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full py-2.5 mt-4" disabled={submitting}>
            {submitting ? "Finalizing Security..." : "Secure My Account"}
          </Button>
        </form>

        <div className="mt-8 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-400">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <p>This is a secure one-time setup link. After setting your password, this link will expire and you can use your new credentials to log in.</p>
        </div>
      </Card>
    </main>
  );
}
