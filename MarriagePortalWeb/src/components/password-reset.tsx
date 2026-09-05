"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

/**
 * Self-service password reset: verify the account's email with a 6-digit OTP, then set a new
 * password. Used by both the admin sign-in page (scope "admin") and the member sign-in dialog
 * (scope "member"). Presentation-neutral so it drops into a card or a dialog body.
 */
export function PasswordReset({
  scope,
  defaultEmail = "",
  onCancel,
}: {
  scope: "admin" | "member";
  defaultEmail?: string;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [code, setCode] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!email.trim()) return;
    setBusy(true);
    try {
      const r = await api.sendEmailOtp(email.trim());
      setSent(true);
      setToken(null);
      toast.success(r.message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send the code.");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (code.length !== 6) return;
    setBusy(true);
    try {
      const r = await api.verifyEmailOtp(email.trim(), code);
      setToken(r.token);
      toast.success("Email verified.");
    } catch (e) {
      setToken(null);
      toast.error(e instanceof Error ? e.message : "Incorrect code.");
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!token) return;
    if (pw.length < 6) return toast.error("Password must be at least 6 characters.");
    if (pw !== pw2) return toast.error("Passwords do not match.");
    setBusy(true);
    try {
      const r = await api.resetPassword(email.trim(), token, pw, scope);
      toast.success(r.message);
      onCancel();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not reset the password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Email address</Label>
        <div className="flex gap-2">
          <Input
            type="email"
            value={email}
            disabled={!!token}
            onChange={(e) => { setEmail(e.target.value); setToken(null); setSent(false); }}
            placeholder="you@example.com"
            className={`flex-1 ${token ? "border-brand-green" : ""}`}
          />
          <Button type="button" variant="outline" disabled={busy || !email.trim() || !!token} onClick={send}>
            {sent ? "Resend" : "Send code"}
          </Button>
        </div>
      </div>

      {sent && !token && (
        <div className="space-y-1.5">
          <Label>6-digit code</Label>
          <div className="flex gap-2">
            <Input
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="flex-1"
            />
            <Button type="button" variant="outline" disabled={busy || code.length !== 6} onClick={verify}>
              Verify
            </Button>
          </div>
        </div>
      )}

      {token && (
        <>
          <div className="rounded-lg border border-brand-green/30 bg-brand-green/10 px-3 py-2 text-sm text-brand-green">
            ✓ Email verified
          </div>
          <div className="space-y-1.5">
            <Label>New password</Label>
            <Input type="password" value={pw} autoComplete="new-password" onChange={(e) => setPw(e.target.value)} placeholder="At least 6 characters" />
          </div>
          <div className="space-y-1.5">
            <Label>Confirm new password</Label>
            <Input type="password" value={pw2} autoComplete="new-password" onChange={(e) => setPw2(e.target.value)} />
          </div>
          <Button type="button" className="w-full" disabled={busy || pw.length < 6 || pw !== pw2} onClick={reset}>
            {busy ? "Saving…" : "Reset password"}
          </Button>
        </>
      )}

      <button
        type="button"
        onClick={onCancel}
        className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        Back to sign in
      </button>
    </div>
  );
}
