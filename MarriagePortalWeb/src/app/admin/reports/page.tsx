import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminHeader, Avatar } from "@/components/admin/admin-ui";

const REPORTS = [
  { name: "Vimal T.", reason: "Spam messages", by: "Rebecca A." },
  { name: "(unverified) Anon", reason: "Suspected fake photo", by: "Sharon P." },
];

export default function ReportsPage() {
  return (
    <>
      <AdminHeader title="Reports" subtitle="Concerns raised by members · sample data" />
      <div className="p-7">
        <Card className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-bold">Member</th>
                <th className="px-5 py-3 font-bold">Reason</th>
                <th className="px-5 py-3 font-bold">Reported by</th>
                <th className="px-5 py-3 font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {REPORTS.map((r, i) => (
                <tr key={i} className="hover:bg-muted/30">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3"><Avatar name={r.name} i={i + 3} /><span className="text-sm font-semibold">{r.name}</span></div>
                  </td>
                  <td className="px-5 py-3 text-sm">{r.reason}</td>
                  <td className="px-5 py-3 text-sm">{r.by}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/5">Suspend</Button>
                      <Button size="sm" variant="ghost">Dismiss</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
