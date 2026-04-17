import { useEffect, useMemo, useState } from "react";
import { PlugZap, RefreshCcw, ServerCog } from "lucide-react";
import Badge from "../common/Badge";
import Button from "../common/Button";
import Card from "../common/Card";
import { useToast } from "../common/Toast";
import { type IntegrationConnector, api } from "../../services/api";
import { formatDate } from "../../lib/utils";
import { getAccessTokenPayload } from "../../lib/session";

const fieldClassName =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

const connectorOptions = [
  { value: "sap", label: "SAP" },
  { value: "oracle_netsuite", label: "Oracle NetSuite" },
  { value: "erpnext", label: "ERPNext" },
  { value: "shopify", label: "Shopify" },
  { value: "salesforce", label: "Salesforce" },
  { value: "fedex", label: "FedEx" },
  { value: "webhook", label: "Custom Webhook" }
];

function badgeForStatus(status?: string): "default" | "success" | "warning" | "danger" | "info" {
  if (!status) return "default";
  if (["active", "success"].includes(status)) return "success";
  if (["configured", "pending"].includes(status)) return "warning";
  if (["error", "failed", "disconnected"].includes(status)) return "danger";
  return "info";
}

function prettyJson(input: Record<string, unknown>) {
  return JSON.stringify(input ?? {}, null, 2);
}

export default function ConnectorWorkspace() {
  const { toast } = useToast();
  const session = useMemo(() => getAccessTokenPayload(), []);
  const isSuperAdmin = session?.role === "super_admin";
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scopeAll, setScopeAll] = useState(false);
  const [connectors, setConnectors] = useState<IntegrationConnector[]>([]);
  const [form, setForm] = useState({
    id: "",
    companyId: "",
    provider: "sap",
    connectorType: "erp",
    displayName: "",
    status: "configured",
    baseUrl: "",
    authType: "api_key",
    credentialsJson: "{\n  \"apiKey\": \"\"\n}",
    settingsJson: "{\n  \"syncMode\": \"incremental\"\n}"
  });

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listIntegrationConnectors(isSuperAdmin && scopeAll ? { scope: "all" } : undefined);
      setConnectors(data);
    } catch (err: any) {
      setError(err.message || "Failed to load connectors.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [scopeAll]);

  async function saveConnector(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const credentials = JSON.parse(form.credentialsJson || "{}") as Record<string, unknown>;
      const settings = JSON.parse(form.settingsJson || "{}") as Record<string, unknown>;

      await api.saveIntegrationConnector({
        id: form.id || undefined,
        companyId: isSuperAdmin ? form.companyId || undefined : undefined,
        provider: form.provider,
        connectorType: form.connectorType,
        displayName: form.displayName,
        status: form.status,
        baseUrl: form.baseUrl || undefined,
        authType: form.authType,
        credentials,
        settings
      });

      toast(form.id ? "Connector updated." : "Connector created.", "success");
      setForm({
        id: "",
        companyId: "",
        provider: "sap",
        connectorType: "erp",
        displayName: "",
        status: "configured",
        baseUrl: "",
        authType: "api_key",
        credentialsJson: "{\n  \"apiKey\": \"\"\n}",
        settingsJson: "{\n  \"syncMode\": \"incremental\"\n}"
      });
      await loadData();
    } catch (err: any) {
      toast(err.message || "Failed to save connector", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTest(id: string) {
    setTestingId(id);
    try {
      const result = await api.testIntegrationConnector(id);
      toast(result.message, result.ok ? "success" : "error");
      await loadData();
    } catch (err: any) {
      toast(err.message || "Failed to test connector", "error");
    } finally {
      setTestingId(null);
    }
  }

  function editConnector(connector: IntegrationConnector) {
    setForm({
      id: connector.id,
      companyId: connector.company_id ?? "",
      provider: connector.provider,
      connectorType: connector.connector_type,
      displayName: connector.display_name,
      status: connector.status,
      baseUrl: connector.base_url ?? "",
      authType: connector.auth_type,
      credentialsJson: prettyJson(connector.credentials ?? {}),
      settingsJson: prettyJson(connector.settings ?? {})
    });
  }

  if (error) return <Card className="mt-6 text-sm text-slate-600 dark:text-slate-300">{error}</Card>;

  return (
    <section className="mt-6 grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
      <div className="space-y-5">
        <Card>
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-blue/10 text-brand-blue">
              <PlugZap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Connector Studio</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Configure ERP, commerce, logistics, and webhook integrations.</p>
            </div>
          </div>

          <form className="mt-4 space-y-3" onSubmit={saveConnector}>
            {isSuperAdmin ? (
              <input
                className={fieldClassName}
                placeholder="Target Company ID"
                value={form.companyId}
                onChange={(event) => setForm((current) => ({ ...current, companyId: event.target.value }))}
              />
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <select className={fieldClassName} value={form.provider} onChange={(event) => setForm((current) => ({ ...current, provider: event.target.value }))}>
                {connectorOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select className={fieldClassName} value={form.connectorType} onChange={(event) => setForm((current) => ({ ...current, connectorType: event.target.value }))}>
                <option value="erp">ERP</option>
                <option value="crm">CRM</option>
                <option value="ecommerce">E-commerce</option>
                <option value="logistics">Logistics</option>
                <option value="webhook">Webhook</option>
              </select>
            </div>
            <input className={fieldClassName} placeholder="Display Name" required value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} />
            <input className={fieldClassName} placeholder="Base URL" value={form.baseUrl} onChange={(event) => setForm((current) => ({ ...current, baseUrl: event.target.value }))} />
            <div className="grid gap-3 sm:grid-cols-2">
              <select className={fieldClassName} value={form.authType} onChange={(event) => setForm((current) => ({ ...current, authType: event.target.value }))}>
                <option value="api_key">API Key</option>
                <option value="basic">Basic Auth</option>
                <option value="oauth2">OAuth 2.0</option>
                <option value="webhook_secret">Webhook Secret</option>
              </select>
              <select className={fieldClassName} value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="configured">Configured</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="disconnected">Disconnected</option>
                <option value="error">Error</option>
              </select>
            </div>
            <textarea
              className={`${fieldClassName} min-h-28 resize-y font-mono text-xs`}
              placeholder='{"apiKey": ""}'
              value={form.credentialsJson}
              onChange={(event) => setForm((current) => ({ ...current, credentialsJson: event.target.value }))}
            />
            <textarea
              className={`${fieldClassName} min-h-28 resize-y font-mono text-xs`}
              placeholder='{"syncMode": "incremental"}'
              value={form.settingsJson}
              onChange={(event) => setForm((current) => ({ ...current, settingsJson: event.target.value }))}
            />
            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? "Saving..." : form.id ? "Update Connector" : "Create Connector"}
              </Button>
              {form.id ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() =>
                    setForm({
                      id: "",
                      companyId: "",
                      provider: "sap",
                      connectorType: "erp",
                      displayName: "",
                      status: "configured",
                      baseUrl: "",
                      authType: "api_key",
                      credentialsJson: "{\n  \"apiKey\": \"\"\n}",
                      settingsJson: "{\n  \"syncMode\": \"incremental\"\n}"
                    })
                  }
                >
                  Clear
                </Button>
              ) : null}
            </div>
          </form>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Connector Notes</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <li>Use ERP connectors for procurement, inventory, and production sync.</li>
            <li>Use logistics connectors for freight and carrier events.</li>
            <li>Webhook connectors are a lightweight way to plug in custom systems first.</li>
          </ul>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Integration Registry</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Persisted ERP, CRM, e-commerce, and logistics connectors.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isSuperAdmin ? (
              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                <input type="checkbox" checked={scopeAll} onChange={(event) => setScopeAll(event.target.checked)} />
                View all companies
              </label>
            ) : null}
            <Badge variant="info">{connectors.length} connectors</Badge>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading connectors...</p>
        ) : connectors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
            <ServerCog className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">No connectors configured yet.</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create one from the left panel to start syncing enterprise systems.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {connectors.map((connector) => (
              <div key={connector.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{connector.display_name}</p>
                      <Badge variant={badgeForStatus(connector.status)}>{connector.status}</Badge>
                      {connector.last_test_status ? <Badge variant={badgeForStatus(connector.last_test_status)}>{connector.last_test_status}</Badge> : null}
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Provider: {connector.provider} | Type: {connector.connector_type} | Auth: {connector.auth_type}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Company: {connector.company_name ?? connector.company_id ?? "Current organization"} | Last update: {formatDate(connector.updated_at)}
                    </p>
                    {connector.base_url ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Base URL: {connector.base_url}</p> : null}
                    {connector.last_error ? <p className="mt-2 text-xs text-red-600 dark:text-red-400">Last error: {connector.last_error}</p> : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => editConnector(connector)}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void handleTest(connector.id)}
                      disabled={testingId === connector.id}
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      {testingId === connector.id ? "Testing..." : "Test"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}
