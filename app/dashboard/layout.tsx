"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RunwayLogo } from "@/components/RunwayLogo";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const { user, loading, signOut, isConfigured } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user && isConfigured) {
      router.replace("/login");
      return;
    }
  }, [user, loading, isConfigured, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const workspaceId = pathname.split("/")[2];
  const nav = [
    { href: "/dashboard", label: "Workspaces" },
    ...(workspaceId
      ? [
          { href: `/dashboard/${workspaceId}`, label: "Overview" },
          { href: `/dashboard/${workspaceId}/sprints`, label: "Sprints" },
          { href: `/dashboard/${workspaceId}/analytics`, label: "Analytics" },
          { href: `/dashboard/${workspaceId}/investor`, label: "Investor view" },
          { href: `/dashboard/${workspaceId}/ledger`, label: "Ledger" },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
      <header className="sticky top-0 z-50 border-b border-[#f0f2f4] dark:border-white/10 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-6 md:px-10 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-primary">
            <RunwayLogo className="size-6" />
            <h2 className="text-[#111418] dark:text-white text-xl font-extrabold tracking-tight">
              Runway
            </h2>
          </Link>
          <nav className="hidden md:flex gap-6">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-semibold transition-colors ${
                  pathname === item.href
                    ? "text-primary"
                    : "text-[#111418] dark:text-gray-300 hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 truncate max-w-[120px]">
              {user.email}
            </span>
            <button
              onClick={() => signOut().then(() => router.push("/"))}
              className="rounded-lg h-10 px-4 bg-[#f0f2f4] dark:bg-white/10 text-[#111418] dark:text-white text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/20"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-10 py-8">
        {children}
      </main>
    </div>
  );
}
