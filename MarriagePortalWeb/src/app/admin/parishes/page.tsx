import { Card } from "@/components/ui/card";
import { AdminHeader, Pill } from "@/components/admin/admin-ui";

const PARISHES = [
  { name: "CSI Tamil Parish, Dubai (Main)", loc: "Oud Metha, Dubai", presbyter: "Parish Presbyter", members: 480, active: true },
  { name: "CSI Tamil Congregation, Fujairah", loc: "Fujairah", presbyter: "Lay Pastor", members: 120, active: true },
  { name: "CSI Tamil Congregation, Ras Al Khaimah", loc: "Ras Al Khaimah", presbyter: "Lay Pastor", members: 95, active: true },
];

export default function ParishesPage() {
  return (
    <>
      <AdminHeader title="Parishes" subtitle="The CSI Tamil congregations in the UAE" />
      <div className="p-7">
        <Card className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-bold">Parish</th>
                <th className="px-5 py-3 font-bold">Location</th>
                <th className="px-5 py-3 font-bold">Presbyter</th>
                <th className="px-5 py-3 font-bold">Members</th>
                <th className="px-5 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PARISHES.map((p) => (
                <tr key={p.name} className="hover:bg-muted/30">
                  <td className="px-5 py-3 text-sm font-semibold">⛪ {p.name}</td>
                  <td className="px-5 py-3 text-sm">{p.loc}</td>
                  <td className="px-5 py-3 text-sm">{p.presbyter}</td>
                  <td className="px-5 py-3 text-sm">{p.members}</td>
                  <td className="px-5 py-3"><Pill tone="green">● Active</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
