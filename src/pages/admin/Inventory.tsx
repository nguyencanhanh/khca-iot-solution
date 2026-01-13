import { useState } from "react";
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

interface InventoryItem {
  id: number;
  name: string;
  serial: string;
  firmware: string;
  status: "in_stock" | "deployed" | "deploying" | "maintenance";
  location: string;
  lastUpdated: string;
  project?: string;
}

const inventoryData: InventoryItem[] = [
  { id: 1, name: "AquaSense Pro", serial: "ASP-2024-0892", firmware: "v2.3.1", status: "in_stock", location: "Kho HCM", lastUpdated: "2024-12-10" },
  { id: 2, name: "FlowMaster 5000", serial: "FM5-2024-0156", firmware: "v1.8.0", status: "deployed", location: "Dự án BD-01", project: "Bình Dương", lastUpdated: "2024-12-08" },
  { id: 3, name: "IoT Gateway G4", serial: "GTW-2024-0423", firmware: "v2.5.0", status: "deploying", location: "Dự án DN-03", project: "Đà Nẵng", lastUpdated: "2024-12-12" },
  { id: 4, name: "AquaSense Pro", serial: "ASP-2024-0893", firmware: "v2.3.1", status: "in_stock", location: "Kho HN", lastUpdated: "2024-12-11" },
  { id: 5, name: "FlowMaster 5000", serial: "FM5-2024-0157", firmware: "v1.8.0", status: "maintenance", location: "Xưởng HCM", lastUpdated: "2024-12-09" },
  { id: 6, name: "IoT Gateway G4", serial: "GTW-2024-0424", firmware: "v2.5.0", status: "deployed", location: "Dự án HN-02", project: "Hà Nội", lastUpdated: "2024-12-05" },
  { id: 7, name: "AquaSense Pro", serial: "ASP-2024-0894", firmware: "v2.3.0", status: "deployed", location: "Dự án BD-01", project: "Bình Dương", lastUpdated: "2024-12-07" },
  { id: 8, name: "FlowMaster 5000", serial: "FM5-2024-0158", firmware: "v1.8.0", status: "in_stock", location: "Kho HCM", lastUpdated: "2024-12-13" },
  { id: 9, name: "AquaSense Basic", serial: "ASB-2024-0234", firmware: "v1.2.0", status: "in_stock", location: "Kho HCM", lastUpdated: "2024-12-12" },
  { id: 10, name: "IoT Gateway G4", serial: "GTW-2024-0425", firmware: "v2.4.2", status: "maintenance", location: "Xưởng HN", lastUpdated: "2024-12-10" },
];

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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [items] = useState<InventoryItem[]>(inventoryData);

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

  const statusCounts = {
    all: items.length,
    in_stock: items.filter(i => i.status === "in_stock").length,
    deployed: items.filter(i => i.status === "deployed").length,
    deploying: items.filter(i => i.status === "deploying").length,
    maintenance: items.filter(i => i.status === "maintenance").length,
  };

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
          <Button>
            <Plus className="w-4 h-4" />
            Thêm thiết bị
          </Button>
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
                      <div className="text-xs text-muted-foreground">{item.project}</div>
                    )}
                  </td>
                  <td>
                    <span className="font-mono text-xs">{item.serial}</span>
                  </td>
                  <td>
                    <span className="text-xs bg-muted px-2 py-1 rounded">{item.firmware}</span>
                  </td>
                  <td>{getStatusBadge(item.status)}</td>
                  <td className="text-muted-foreground">{item.location}</td>
                  <td className="text-muted-foreground text-sm">
                    {new Date(item.lastUpdated).toLocaleDateString('vi-VN')}
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
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">Sau</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
