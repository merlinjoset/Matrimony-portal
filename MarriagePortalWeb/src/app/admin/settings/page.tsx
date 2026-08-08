"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminHeader } from "@/components/admin/admin-ui";
import { api, type EmailSettingsInput } from "@/lib/api";
import { cn } from "@/lib/utils";

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={cn("relative h-6 w-11 shrink-0 rounded-full transition", on ? "bg-brand-green" : "bg-muted-foreground/40")}
      aria-pressed={on}
    >
      <span className={cn("absolute top-0.5 size-5 rounded-full bg-white transition-all", on ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

const emptyEmail: EmailSettingsInput = {
  host: "", port: "465", secure: true, user: "", pass: "", from: "", notifyEmail: "", appBaseUrl: "",
};

export default function SettingsPage() {
  const [email, setEmail] = useState<EmailSettingsInput>(emptyEmail);
  const [hasPassword, setHasPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    api.getEmailSettings()
      .then((s) => {
        setEmail({ host: s.host, port: s.port || "465", secure: s.secure, user: s.user, pass: "", from: s.from, notifyEmail: s.notifyEmail, appBaseUrl: s.appBaseUrl });
        setHasPassword(s.hasPassword);
      })
      .catch(() => toast.error("Could not load email settings."))
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof EmailSettingsInput>(k: K, v: EmailSettingsInput[K]) {
    setEmail((e) => ({ ...e, [k]: v }));
  }

  async function save() {
    setSaving(true);
    try {
      await api.saveEmailSettings(email);
      if (email.pass) setHasPassword(true);
      setEmail((e) => ({ ...e, pass: "" }));
      toast.success("Email settings saved.");
    } catch {
      toast.error("Could not save email settings.");
    } finally {
      setSaving(false);
    }
  }

  async function test() {
    if (!testTo.trim()) return toast.error("Enter an email to send the test to.");
    setTesting(true);
    try {
      await api.sendTestEmail(testTo.trim());
      toast.success(`Test email sent to ${testTo.trim()}.`);
    } catch (e) {
      const msg = String(e);
      toast.error(msg.includes(":") ? msg.split(":").slice(1).join(":").trim() || "Test failed." : "Test failed. Check the settings.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <>
      <AdminHeader title="Settings" subtitle="Portal preferences and email delivery" />
      <div className="space-y-6 p-7">
        <Card className="max-w-3xl p-0">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-[15px] font-bold text-maroon">Email (SMTP)</h3>
            <p className="text-[12.5px] text-muted-foreground">
              Used to email the parish office when a profile is submitted for verification. Leave blank to disable email.
            </p>
          </div>

          {loading ? (
            <div className="p-5 text-sm text-muted-foreground">Loading…</div>
          ) : (
            <div className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="s-host">SMTP host</Label>
                  <Input id="s-host" value={email.host} onChange={(e) => set("host", e.target.value)} placeholder="smtp.hostinger.com" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-port">Port</Label>
                  <Input id="s-port" value={email.port} onChange={(e) => set("port", e.target.value)} placeholder="465" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Toggle on={email.secure} onChange={(v) => set("secure", v)} />
                <div>
                  <div className="text-sm font-semibold">Use SSL/TLS</div>
                  <div className="text-[12.5px] text-muted-foreground">On for port 465, off for port 587 (STARTTLS).</div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="s-user">Username</Label>
                  <Input id="s-user" value={email.user} onChange={(e) => set("user", e.target.value)} placeholder="admin@csitamilparishdubai.com" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-pass">Password {hasPassword && <span className="font-normal text-muted-foreground">(saved - leave blank to keep)</span>}</Label>
                  <Input id="s-pass" type="password" value={email.pass ?? ""} onChange={(e) => set("pass", e.target.value)} placeholder={hasPassword ? "••••••••" : "Mailbox password"} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="s-from">From address</Label>
                  <Input id="s-from" value={email.from} onChange={(e) => set("from", e.target.value)} placeholder="Defaults to username" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-notify">Notify address (parish office)</Label>
                  <Input id="s-notify" value={email.notifyEmail} onChange={(e) => set("notifyEmail", e.target.value)} placeholder="admin@csitamilparishdubai.com" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="s-base">Site base URL <span className="font-normal text-muted-foreground">(for links in emails)</span></Label>
                <Input id="s-base" value={email.appBaseUrl} onChange={(e) => set("appBaseUrl", e.target.value)} placeholder="https://matrimony.csitamilparishdubai.com" />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save settings"}</Button>
                <div className="ml-auto flex items-center gap-2">
                  <Input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@example.com" className="w-56" />
                  <Button variant="outline" onClick={test} disabled={testing}>{testing ? "Sending…" : "Send test"}</Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
