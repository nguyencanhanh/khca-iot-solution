import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { cn } from "@/lib/utils";

const AdminLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden touch-manipulation"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMobileSidebarOpen(false);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            setMobileSidebarOpen(false);
          }}
        />
      )}

      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <AdminSidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
      </div>

      {/* Sidebar - Mobile */}
      <div className={cn(
        "lg:hidden fixed inset-y-0 left-0 z-40 transform transition-transform duration-300",
        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <AdminSidebar 
          collapsed={false} 
          onToggle={() => setMobileSidebarOpen(false)} 
        />
      </div>

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300",
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        <AdminHeader onMenuToggle={() => setMobileSidebarOpen(true)} />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
