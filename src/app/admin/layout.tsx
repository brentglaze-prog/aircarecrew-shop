import Link from "next/link";
import { SignOutButton } from "@/components/admin/sign-out-button";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-offwhite">
      <header className="bg-graphite-950 text-offwhite">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href="/admin" className="font-display font-bold tracking-tight">
            AirCareCrew<span className="text-amber-500">.</span> Admin
          </Link>
          <div className="flex items-center gap-6">
            <nav className="hidden gap-5 sm:flex">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="text-sm font-medium hover:text-amber-400">
                  {item.label}
                </Link>
              ))}
            </nav>
            <SignOutButton />
          </div>
        </div>
        <nav className="container-page flex gap-4 overflow-x-auto pb-3 sm:hidden">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium whitespace-nowrap hover:text-amber-400">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="container-page py-8">{children}</main>
    </div>
  );
}
