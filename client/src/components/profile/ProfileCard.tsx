import { useState, useEffect } from "react";
import { User, Building2, Mail, Fingerprint, Receipt, Camera, Loader2, CheckCircle2 } from "lucide-react";
import { api } from "../../services/api";
import Card from "../common/Card";
import Button from "../common/Button";
import Badge from "../common/Badge";

export default function ProfileCard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [org, setOrg] = useState<any>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [userData, orgData] = await Promise.all([
          api.getMe(),
          api.getOrganization()
        ]);
        setProfile(userData);
        setOrg(orgData);
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await api.updateMe({ name: profile.name, avatarUrl: profile.avatarUrl });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, upload to S3/Cloudinary and get URL
      // Here we simulate with a temporary object URL
      const url = URL.createObjectURL(file);
      setProfile({ ...profile, avatarUrl: url });
    }
  };

  if (loading) {
    return (
      <Card className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Account Section */}
      <Card className="lg:col-span-1 border-white/40 bg-white/50 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/40">
        <div className="relative flex flex-col items-center p-6 text-center">
          <div className="group relative mb-4 h-32 w-32">
            <div className="h-full w-full overflow-hidden rounded-full border-4 border-white shadow-xl dark:border-slate-800">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800">
                  <User className="h-16 w-16" />
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-brand-blue text-white shadow-lg transition-transform hover:scale-110 active:scale-95 group-hover:bg-brand-blue/90">
              <Camera className="h-5 w-5" />
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            </label>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{profile?.name || "Anonymous User"}</h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 capitalize">{profile?.role?.replace('_', ' ') || "Operator"}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Badge variant="info">ID: {profile?.id?.slice(0, 8)}</Badge>
            <Badge variant="success">Verified</Badge>
          </div>
        </div>
      </Card>

      {/* Organization & Details Section */}
      <Card className="lg:col-span-2 border-white/40 bg-white/50 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/40">
        <form onSubmit={handleUpdateProfile} className="space-y-6 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Profile Details</h3>
            {success && (
              <span className="flex items-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Changes saved
              </span>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Display Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={profile?.name || ""}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white/60 py-2.5 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-brand-blue dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Public Email */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Public Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-100/50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-500 outline-none dark:border-slate-700 dark:bg-slate-800/40"
                />
              </div>
            </div>

            {/* Organization Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Organization Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={org?.companyName || "No Organization"}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-100/50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-500 outline-none dark:border-slate-700 dark:bg-slate-800/40"
                />
              </div>
            </div>

            {/* Registration Number */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Registration Number</label>
              <div className="relative">
                <Fingerprint className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={org?.companyCode || "Pending"}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-100/50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-500 outline-none dark:border-slate-700 dark:bg-slate-800/40"
                />
              </div>
            </div>

            {/* Tax / VAT */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tax ID / VAT</label>
              <div className="relative">
                <Receipt className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={org?.taxId || "TAX-UNSPECIFIED"}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-100/50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-500 outline-none dark:border-slate-700 dark:bg-slate-800/40"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={saving} className="min-w-[140px]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
