import { useState, useEffect } from "react";
import { Plus, Filter, Search, Download, MoreVertical, Package, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/integrations/supabase/types";

type InventoryStatus = Database["public"]["Enums"]["inventory_status"];

interface InventoryItem {
  id: string;
  name: string;
  serial: string;
  firmware: string | null;
  status: InventoryStatus;
  location: string;
  project_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  project?: { name: string; code: string } | null;
}

interface Project {
  id: string;
  name: string;
  code: string;
}

const getStatusBadge = (status: string) => {
  const config: Record<string, { class: string; label: string }> = {
    in_stock: { class: "status-badge success", label: "Còn kho" },
    deployed: { class: "status-badge info", label: "Đã xuất" },
    deploying: { class: "status-badge warning", label: "Đang triển khai" },
    maintenance: { class: "status-badge error", label: "Bảo trì" },
  };
  const { class: className, label } = config[status] || { class: "", label: "" };
  return <span className={className}>{label}</span>;
};

const Inventory = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    serial: "",
    firmware: "",
    status: "in_stock" as InventoryStatus,
    location: "",
    project_id: "",
    notes: "",
  });

  useEffect(() => {
    fetchInventory();
    fetchProjects();
  }, []);

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .select(`
          *,
          project:projects!inventory_items_project_id_fkey(name, code)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error("Error fetching inventory:", error);
      toast.error("Lỗi khi tải danh sách thiết bị");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, code");
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.serial.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    toast.success("Đang xuất file Excel...");
  };

  const handleCreateItem = async () => {
    if (!user || !newItem.name.trim() || !newItem.serial.trim() || !newItem.location.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    try {
      const { error } = await supabase.from("inventory_items").insert({
        name: newItem.name,
        serial: newItem.serial,
        firmware: newItem.firmware || null,
        status: newItem.status,
        location: newItem.location,
        project_id: newItem.project_id || null,
        notes: newItem.notes || null,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("Đã thêm thiết bị mới");
      setIsDialogOpen(false);
      setNewItem({
        name: "",
        serial: "",
        firmware: "",
        status: "in_stock",
        location: "",
        project_id: "",
        notes: "",
      });
      fetchInventory();
    } catch (error: any) {
      console.error("Error creating inventory item:", error);
      if (error.code === "23505") {
        toast.error("Serial number đã tồn tại");
      } else {
        toast.error("Lỗi khi thêm thiết bị");
      }
    }
  };

  const handleUpdateStatus = async (id: string, status: InventoryStatus) => {
    try {
      const { error } = await supabase
        .from("inventory_items")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      
      setItems(items.map(item => 
        item.id === id ? { ...item, status } : item
      ));
      toast.success("Đã cập nhật trạng thái");
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error("Lỗi khi cập nhật trạng thái");
    }
  };

  const statusCounts = {
    all: items.length,
    in_stock: items.filter(i => i.status === "in_stock").length,
    deployed: items.filter(i => i.status === "deployed").length,
    deploying: items.filter(i => i.status === "deploying").length,
    maintenance: items.filter(i => i.status === "maintenance").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Quản lý kho</h1>
          <p className="text-muted-foreground">Theo dõi thiết bị IoT và lịch sử nhập xuất</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Xuất Excel
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4" />
                Thêm thiết bị
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Thêm thiết bị mới</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên thiết bị *</Label>
                  <Input
                    id="name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="VD: AquaSense Pro"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serial">Serial *</Label>
                    <Input
                      id="serial"
                      value={newItem.serial}
                      onChange={(e) => setNewItem({ ...newItem, serial: e.target.value })}
                      placeholder="VD: ASP-2024-0001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firmware">Firmware</Label>
                    <Input
                      id="firmware"
                      value={newItem.firmware}
                      onChange={(e) => setNewItem({ ...newItem, firmware: e.target.value })}
                      placeholder="VD: v2.3.1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Trạng thái</Label>
                    <Select
                      value={newItem.status}
                      onValueChange={(value: InventoryStatus) => setNewItem({ ...newItem, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_stock">Còn kho</SelectItem>
                        <SelectItem value="deployed">Đã xuất</SelectItem>
                        <SelectItem value="deploying">Đang triển khai</SelectItem>
                        <SelectItem value="maintenance">Bảo trì</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Vị trí *</Label>
                    <Input
                      id="location"
                      value={newItem.location}
                      onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                      placeholder="VD: Kho HCM"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Dự án</Label>
                  <Select
                    value={newItem.project_id}
                    onValueChange={(value) => setNewItem({ ...newItem, project_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn dự án (nếu có)" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name} ({project.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Ghi chú</Label>
                  <Textarea
                    id="notes"
                    value={newItem.notes}
                    onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                    placeholder="Ghi chú thêm về thiết bị"
                  />
                </div>
                <Button onClick={handleCreateItem} className="w-full">
                  Thêm thiết bị
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { key: "all", label: "Tất cả", icon: Package },
          { key: "in_stock", label: "Còn kho", color: "text-success" },
          { key: "deployed", label: "Đã xuất", color: "text-info" },
          { key: "deploying", label: "Đang triển khai", color: "text-warning" },
          { key: "maintenance", label: "Bảo trì", color: "text-destructive" },
        ].map((status) => (
          <button
            key={status.key}
            onClick={() => setStatusFilter(status.key)}
            className={`p-4 rounded-xl border transition-all ${
              statusFilter === status.key 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/30"
            }`}
          >
            <div className={`text-2xl font-bold ${status.color || "text-foreground"}`}>
              {statusCounts[status.key as keyof typeof statusCounts]}
            </div>
            <div className="text-sm text-muted-foreground">{status.label}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên, serial, vị trí..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="in_stock">Còn kho</SelectItem>
            <SelectItem value="deployed">Đã xuất</SelectItem>
            <SelectItem value="deploying">Đang triển khai</SelectItem>
            <SelectItem value="maintenance">Bảo trì</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Filter className="w-4 h-4" />
          Lọc nâng cao
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <button className="flex items-center gap-1 hover:text-foreground">
                    Thiết bị
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th>Serial</th>
                <th>Firmware</th>
                <th>Trạng thái</th>
                <th>Vị trí</th>
                <th>Cập nhật</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="font-medium text-foreground">{item.name}</div>
                    {item.project && (
                      <div className="text-xs text-muted-foreground">{item.project.name}</div>
                    )}
                  </td>
                  <td>
                    <span className="font-mono text-xs">{item.serial}</span>
                  </td>
                  <td>
                    <span className="text-xs bg-muted px-2 py-1 rounded">{item.firmware || "N/A"}</span>
                  </td>
                  <td>{getStatusBadge(item.status)}</td>
                  <td className="text-muted-foreground">{item.location}</td>
                  <td className="text-muted-foreground text-sm">
                    {new Date(item.updated_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Hiển thị {filteredItems.length} / {items.length} thiết bị
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>Trước</Button>
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
            <Button variant="outline" size="sm">Sau</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
