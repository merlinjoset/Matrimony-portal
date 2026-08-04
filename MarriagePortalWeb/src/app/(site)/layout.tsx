import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MemberShortlistProvider } from "@/lib/member-shortlist";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <MemberShortlistProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </MemberShortlistProvider>
  );
}
