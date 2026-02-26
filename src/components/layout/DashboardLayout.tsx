import { ReactNode, useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { TopNav } from "./TopNav";
import { CommandPalette } from "./CommandPalette";
import { useAppStore } from "@/store/useAppStore";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarCollapsed, setCommandPaletteOpen } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setCommandPaletteOpen]);

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? "ml-[68px]" : "ml-[260px]"
        }`}
      >
        <TopNav />
        <main className="flex-1 p-6 overflow-auto scrollbar-thin">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
