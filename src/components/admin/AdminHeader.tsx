import { Bell, Search, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminHeaderProps {
  onMenuToggle?: () => void;
}

const AdminHeader = ({ onMenuToggle }: AdminHeaderProps) => {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      {/* Left Side */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="lg:hidden min-w-[48px] min-h-[48px] p-3 rounded-md hover:bg-accent touch-manipulation active:bg-accent/80 select-none"
          onClick={() => onMenuToggle?.()}
          aria-label="Mở menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Tìm kiếm..." 
            className="w-80 pl-10 h-10"
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="hidden sm:block text-right">
            <div className="text-sm font-medium text-foreground">Nguyễn Văn A</div>
            <div className="text-xs text-muted-foreground">Admin</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
