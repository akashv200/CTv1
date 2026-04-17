import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, Clock3, ShieldCheck, XCircle } from "lucide-react";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import { useToast } from "../components/common/Toast";
import { type OnboardingRequest, type OnboardingSummary, api } from "../services/api";
import { cn, formatDate } from "../lib/utils";
import { getAccessTokenPayload } from "../lib/session";

const filters = ["pending", "approved", "rejected", "all"] as const;
type FilterKey = (typeof filters)[number];
type BadgeTone = "default" | "success" | "warning" | "danger" | "info";

function summaryCards(summary: OnboardingSummary) {
  return [
    {
      label: "Pending Reviews",
      value: summary.pending,
      icon: Clock3,
      tone: "info" as const
    },
    {
      label: "Approved",
      value: summary.approved,
      icon: CheckCircle2,
      tone: "success" as const
    },
    {
      label: "Rejected",
      value: summary.rejected,
      icon: XCircle,
      tone: "danger" as const
    }
  ];
}

function statusVariant(status: string): BadgeTone {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  if (status === "pending") return "warning";
  return "info";
}

export default function AdminOnboardingPage() {
  const { toast } = useToast();
  const session = useMemo(() => getAccessTokenPayload(), []);
  const [filter, setFilter] = useState<FilterKey>("pending");
  const [summary, setSummary] = useState<OnboardingSummary>({ pending: 0, approved: 0, rejected: 0 });
  const [requests, setRequests] = useState<OnboardingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function loadData(activeFilter = filter) {
    setLoading(true);
    try {
      const [summaryData, requestRows] = await Promise.all([
        api.getOnboardingSummary(),
        api.listOnboardingRequests(activeFilter)
      ]);
      setSummary(summaryData);
      setRequests(requestRows);
    } catch (error: any) {
      toast(error.message || "Failed to load onboarding requests", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session?.role === "super_admin") {
      void loadData(filter);
    }
  }, [filter, session?.role]);

  async function handleApprove(id: string) {
    setActionId(id);
    try {
      const response = await api.approveOnboardingRequest(id);
      toast(`Request approved. Organization ${response.companyId} is ready.`, "success");
      await loadData();
    } catch (error: any) {
      toast(error.message || "Failed to approve request", "error");
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(id: string) {
    setActionId(id);
    try {
      await api.rejectOnboardingRequest(id, notes[id]);
      toast("Request rejected.", "success");
      await loadData();
    } catch (error: any) {
      toast(error.message || "Failed to reject request", "error");
    } finally {
      setActionId(null);
    }
  }

  if (session?.role !== "super_admin") {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-6">
        <Card>
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Super-admin access required</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                This dashboard is reserved for platform approval workflows. Sign in with a super-admin account to review new business requests.
              </p>
            </div>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue/5 px-3 py-1 text-xs font-semibold text-brand-blue">
          <ShieldCheck className="h-4 w-4" />
          Super Admin Workspace
        </div>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-slate-100">Onboarding And Approval Dashboard</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
          Review new business requests, approve organizations into the ChainTrace network, and keep the partner ecosystem clean before access is granted.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {summaryCards(summary).map((item) => (
            <Card key={item.label} className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">{item.value}</p>
                </div>
                <Badge variant={item.tone}>
                  <item.icon className="mr-1 h-4 w-4" />
                  {item.label}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Review Controls</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Switch between request states and process approvals. Approved requests automatically create an organization and its first org-admin account.
          </p>

          <div className="mt-5 space-y-2">
            {filters.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-medium transition",
                  filter === value
                    ? "border-brand-blue bg-brand-blue/5 text-brand-blue"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-brand-blue hover:text-brand-blue dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                )}
              >
                <span className="capitalize">{value}</span>
                <Badge variant={filter === value ? "info" : "default"}>
                  {value === "all"
                    ? summary.pending + summary.approved + summary.rejected
                    : value === "pending"
                      ? summary.pending
                      : value === "approved"
                        ? summary.approved
                        : summary.rejected}
                </Badge>
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
            Current backend flow provisions a default org-admin password after approval. Replace that with an email invite or password reset flow before production use.
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Business Requests</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Showing {filter} requests</p>
            </div>
            <Badge variant="info">{requests.length}</Badge>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading requests...</p>
          ) : requests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
              <Building2 className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">No requests in this state right now.</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">New business access requests will show up here for review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{request.company_name}</p>
                        <Badge variant={statusVariant(request.status)}>{request.status}</Badge>
                        <Badge variant="default">{request.domain}</Badge>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                        <p>Contact: {request.contact_name}</p>
                        <p>Email: {request.contact_email}</p>
                        <p>Phone: {request.contact_phone ?? "-"}</p>
                        <p>Country: {request.country ?? "-"}</p>
                        <p>Website: {request.website ?? "-"}</p>
                        <p>Submitted: {formatDate(request.created_at)}</p>
                      </div>
                      {request.notes ? (
                        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                          Notes: {request.notes}
                        </p>
                      ) : null}
                    </div>

                    {request.status === "pending" ? (
                      <div className="w-full max-w-md space-y-3">
                        <textarea
                          className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          placeholder="Optional rejection notes"
                          value={notes[request.id] ?? ""}
                          onChange={(event) => setNotes((current) => ({ ...current, [request.id]: event.target.value }))}
                        />
                        <div className="flex flex-wrap gap-3">
                          <Button
                            type="button"
                            className="flex-1"
                            disabled={actionId === request.id}
                            onClick={() => void handleApprove(request.id)}
                          >
                            {actionId === request.id ? "Processing..." : "Approve And Create Organization"}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            className="flex-1"
                            disabled={actionId === request.id}
                            onClick={() => void handleReject(request.id)}
                          >
                            Reject Request
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-right text-sm text-slate-500 dark:text-slate-400">
                        <p>Reviewed: {request.reviewed_at ? formatDate(request.reviewed_at) : "-"}</p>
                        <p className="mt-1">Reviewer: {request.reviewed_by ?? "-"}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </main>
  );
}
