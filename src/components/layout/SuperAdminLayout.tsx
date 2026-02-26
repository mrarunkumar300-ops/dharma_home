import { ReactNode } from "react";
import { SuperAdminSidebar } from "./SuperAdminSidebar";
import { TopNav } from "./TopNav";
import { useAppStore } from "@/store/useAppStore";
import { motion } from "framer-motion";

export const SuperAdminLayout = ({ children }: { children: ReactNode }) => {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="min-h-screen bg-background">
      <SuperAdminSidebar />
      <motion.div
        initial={false}
        animate={{ marginLeft: sidebarCollapsed ? 68 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col min-h-screen"
      >
        <TopNav />
        <main className="flex-1 p-6 pt-4">
          {children}
        </main>
      </motion.div>
    </div>
  );
};
