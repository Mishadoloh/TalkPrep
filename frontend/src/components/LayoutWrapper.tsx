"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noSidebarRoutes = ["/", "/login", "/register"];
  const hideSidebar = noSidebarRoutes.includes(pathname);

  const content = hideSidebar ? (
    <div className="marketing-layout">{children}</div>
  ) : (
    <div className="app-shell">
      {/* Fixed sidebar + topbar */}
      <Sidebar />

      {/* Scrollable main area — offset for sidebar + topbar */}
      <div className="main-content" style={{ paddingTop: "var(--topbar-h)" }}>
        {children}
      </div>
    </div>
  );

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {content}
    </GoogleOAuthProvider>
  );
}
