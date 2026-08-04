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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminHeader, Avatar, Pill } from "@/components/admin/admin-ui";
import { api } from "@/lib/api";
import { ADMIN_CONGREGATIONS, ADMIN_ROLES, type AdminUser, type CreateUserInput } from "@/lib/types";

const ROLE_COLOR: Record<string, string> = {
  "Diocese Admin": "#8a2a38",
  "Parish Presbyter": "#3f6b54",
  Moderator: "#9c6b1f",
  "Office Staff": "#4a5d7a",
};

const emptyUser: CreateUserInput = { name: "", email: "", role: "Moderator", congregation: "Dubai (Main)" };

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateUserInput>(emptyUser);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.getUsers().then(setUsers).catch(() => setUsers([]));
  }, []);
  useEffect(load, [load]);

  async function submit() {
    if (!form.name.trim()) return toast.error("Please enter a name.");
    if (!form.email.includes("@")) return toast.error("Please enter a valid email.");
    setSaving(true);
    try {
      await api.createUser(form);
      toast.success(`${form.name} invited.`);
      setOpen(false);
      setForm(emptyUser);
      load();
    } catch (e) {
      toast.error(String(e).includes("409") ? "A user with that email already exists." : "Could not add user. Is the API running?");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminHeader
        title="Users & Roles"
        subtitle="Staff who can sign in to this admin portal"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button className="bg-gold text-maroon hover:bg-gold! hover:brightness-105" size="sm">
                  + Add user
                </Button>
              }
            />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add staff user</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Rev. John" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@csitamilparishdubai.com" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Role</Label>
                    <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v ?? "Moderator" })}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ADMIN_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Congregation</Label>
                    <Select value={form.congregation} onValueChange={(v) => setForm({ ...form, congregation: v ?? "Dubai (Main)" })}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ADMIN_CONGREGATIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button disabled={saving} onClick={submit} className="bg-gold text-maroon hover:bg-gold! hover:brightness-105">
                  {saving ? "Adding…" : "Add user"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="p-7">
        <div className="mb-4 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-[#7a5a10]">
          🔐 These are staff accounts (presbyters, moderators, office staff) - not matrimony members. New users start as <b>Invited</b>.
        </div>
        <Card className="p-0">
          {users === null ? (
            <div className="space-y-3 p-5">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : users.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">No users yet. Click “Add user” to invite staff.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-bold">Name</th>
                  <th className="px-5 py-3 font-bold">Email</th>
                  <th className="px-5 py-3 font-bold">Role</th>
                  <th className="px-5 py-3 font-bold">Congregation</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u, i) => (
                  <tr key={u.id} className="hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3"><Avatar name={u.name} i={i} /><span className="text-sm font-semibold">{u.name}</span></div>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex rounded-full px-2.5 py-1 text-[11.5px] font-bold"
                        style={{ background: `${ROLE_COLOR[u.role] ?? "#666"}1a`, color: ROLE_COLOR[u.role] ?? "#666" }}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm">{u.congregation}</td>
                    <td className="px-5 py-3">
                      <Pill tone={u.status === "Active" ? "green" : u.status === "Invited" ? "amber" : "red"}>{u.status}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  );
}
