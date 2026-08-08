"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminHeader, Pill } from "@/components/admin/admin-ui";
import { api } from "@/lib/api";
import type { MemberAccount } from "@/lib/types";

function tone(status: string): "green" | "amber" | "red" {
  return status === "Active" ? "green" : status === "Pending" ? "amber" : "red";
}

export default function MemberAccountsPage() {
  const [rows, setRows] = useState<MemberAccount[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pwAccount, setPwAccount] = useState<MemberAccount | null>(null);
  const [pwValue, setPwValue] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const load = useCallback(() => {
    api.getMemberAccounts().then(setRows).catch(() => setRows([]));
  }, []);

  useEffect(load, [load]);

  async function act(a: MemberAccount, status: "Active" | "Disabled") {
    setBusy(a.id);
    try {
      await api.setMemberAccountStatus(a.id, status);
      setRows((rs) => (rs ? rs.map((r) => (r.id === a.id ? { ...r, status } : r)) : rs));
      toast.success(status === "Active" ? `${a.name} activated.` : `${a.name} disabled.`);
    } catch {
      toast.error("Action failed.");
    } finally {
      setBusy(null);
    }
  }

  async function savePassword() {
    if (!pwAccount) return;
    if (pwValue.length < 6) return toast.error("Password must be at least 6 characters.");
    setPwSaving(true);
    try {
      await api.setMemberAccountPassword(pwAccount.id, pwValue);
      toast.success(`Password reset for ${pwAccount.name}. Share the new password with them.`);
      setPwAccount(null);
      setPwValue("");
    } catch {
      toast.error("Could not reset password. Is the API running?");
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <>
      <AdminHeader title="Member Accounts" subtitle="Activate member logins created at registration." />
      <div className="p-7">
        <Card className="p-0">
          {rows === null ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">No member accounts yet.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-bold">Member</th>
                  <th className="px-5 py-3 font-bold">Username</th>
                  <th className="px-5 py-3 font-bold">Card #</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30">
                    <td className="px-5 py-3 text-sm font-semibold">{a.name}</td>
                    <td className="px-5 py-3 text-sm">{a.username}</td>
                    <td className="px-5 py-3 text-sm">{a.membershipNo}</td>
                    <td className="px-5 py-3"><Pill tone={tone(a.status)}>{a.status}</Pill></td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        {a.status !== "Active" && (
                          <Button
                            size="sm"
                            disabled={busy === a.id}
                            onClick={() => act(a, "Active")}
                            className="bg-brand-green text-white hover:bg-brand-green/90"
                          >
                            Activate
                          </Button>
                        )}
                        {a.status !== "Disabled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy === a.id}
                            onClick={() => act(a, "Disabled")}
                            className="border-destructive/40 text-destructive hover:bg-destructive/5"
                          >
                            Disable
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setPwAccount(a); setPwValue(""); }}
                        >
                          Reset password
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <Dialog open={!!pwAccount} onOpenChange={(o) => { if (!o) { setPwAccount(null); setPwValue(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password{pwAccount ? ` - ${pwAccount.name}` : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-muted-foreground">
              Set a new login password for <b>{pwAccount?.username}</b> (card {pwAccount?.membershipNo}). Share it with the
              member so they can sign in and change it.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="reset-pw">New password</Label>
              <Input id="reset-pw" type="password" value={pwValue} onChange={(e) => setPwValue(e.target.value)} placeholder="At least 6 characters" autoFocus />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPwAccount(null); setPwValue(""); }}>Cancel</Button>
            <Button onClick={savePassword} disabled={pwSaving}>{pwSaving ? "Saving…" : "Reset password"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
