import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  CheckSquare, 
  Package, 
  DollarSign, 
  Users, 
  Settings, 
  LogOut,
  Droplets,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const menuItems = [
  { icon: LayoutDashboard, label: "Tổng quan", path: "/admin" },
  { icon: Package, label: "Sản phẩm", path: "/admin/products" },
  { icon: FileText, label: "Tài liệu", path: "/admin/documents" },
  { icon: CheckSquare, label: "Công việc", path: "/admin/tasks" },
  { icon: Droplets, label: "Kho hàng", path: "/admin/inventory" },
  { icon: DollarSign, label: "Thu chi", path: "/admin/finance" },
  { icon: Users, label: "Người dùng", path: "/admin/users" },
];

interface AdminSidebarProps {
  collapsed?: boolean;
  fixed?: boolean;
  onToggle?: () => void;
}

const AdminSidebar = ({ collapsed = false, fixed = true, onToggle }: AdminSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <aside className={cn(
      "bg-sidebar flex flex-col border-r border-sidebar-border transition-all duration-300 z-40",
      fixed && "fixed left-0 top-0 h-screen",
      !fixed && "h-full",
      collapsed ? "w-20" : "w-64"
    )}>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <Link to="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <Droplets className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-lg text-sidebar-foreground">
              Admin
            </span>
          )}
        </Link>
        <button
          type="button"
          className="min-w-[48px] min-h-[48px] p-3 rounded-md text-sidebar-foreground hover:bg-sidebar-accent touch-manipulation active:bg-sidebar-accent/80 select-none"
          onClick={() => onToggle?.()}
          onTouchEnd={(e) => {
            e.preventDefault();
            onToggle?.();
          }}
          aria-label="Thu gọn sidebar"
        >
          <ChevronLeft className={cn("w-5 h-5 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all",
                isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
                collapsed && "justify-center"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <Link
          to="/admin/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-all",
            collapsed && "justify-center"
          )}
        >
          <Settings className="w-5 h-5" />
          {!collapsed && <span className="font-medium">Cài đặt</span>}
        </Link>
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-all",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="font-medium">Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
