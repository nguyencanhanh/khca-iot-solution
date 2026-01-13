import { 
  FileText, 
  CheckSquare, 
  Package, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  {
    title: "Tài liệu",
    value: "1,234",
    change: "+12%",
    changeType: "positive",
    icon: FileText,
  },
  {
    title: "Công việc đang làm",
    value: "48",
    change: "5 quá hạn",
    changeType: "warning",
    icon: CheckSquare,
  },
  {
    title: "Thiết bị trong kho",
    value: "892",
    change: "-23 tuần này",
    changeType: "negative",
    icon: Package,
  },
  {
    title: "Lợi nhuận tháng",
    value: "₫2.4B",
    change: "+18%",
    changeType: "positive",
    icon: DollarSign,
  },
];

const recentTasks = [
  { id: 1, title: "Triển khai trạm giám sát Bình Dương", status: "in_progress", priority: "high", assignee: "Nguyễn Văn B" },
  { id: 2, title: "Bảo trì FlowMaster #234", status: "todo", priority: "medium", assignee: "Trần Văn C" },
  { id: 3, title: "Cập nhật firmware Gateway G4", status: "done", priority: "low", assignee: "Lê Thị D" },
  { id: 4, title: "Báo cáo dự án Q4/2024", status: "in_progress", priority: "high", assignee: "Phạm Văn E" },
  { id: 5, title: "Đào tạo nhân sự mới", status: "todo", priority: "medium", assignee: "Nguyễn Văn A" },
];

const recentInventory = [
  { id: 1, name: "AquaSense Pro", serial: "ASP-2024-0892", status: "in_stock", location: "Kho HCM" },
  { id: 2, name: "FlowMaster 5000", serial: "FM5-2024-0156", status: "deployed", location: "Dự án BD-01" },
  { id: 3, name: "IoT Gateway G4", serial: "GTW-2024-0423", status: "deploying", location: "Dự án DN-03" },
  { id: 4, name: "AquaSense Pro", serial: "ASP-2024-0893", status: "in_stock", location: "Kho HN" },
];

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    todo: "status-badge info",
    in_progress: "status-badge warning",
    done: "status-badge success",
    in_stock: "status-badge success",
    deployed: "status-badge info",
    deploying: "status-badge warning",
  };
  const labels: Record<string, string> = {
    todo: "To Do",
    in_progress: "Đang làm",
    done: "Hoàn thành",
    in_stock: "Còn kho",
    deployed: "Đã xuất",
    deploying: "Đang triển khai",
  };
  return <span className={styles[status]}>{labels[status]}</span>;
};

const getPriorityBadge = (priority: string) => {
  const styles: Record<string, string> = {
    high: "status-badge error",
    medium: "status-badge warning",
    low: "status-badge info",
  };
  const labels: Record<string, string> = {
    high: "Cao",
    medium: "Trung bình",
    low: "Thấp",
  };
  return <span className={styles[priority]}>{labels[priority]}</span>;
};

const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Tổng quan</h1>
        <p className="text-muted-foreground">Xin chào! Đây là tổng quan hoạt động của công ty.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                stat.changeType === 'positive' ? 'text-success' : 
                stat.changeType === 'negative' ? 'text-destructive' : 
                'text-warning'
              }`}>
                {stat.changeType === 'positive' && <TrendingUp className="w-4 h-4" />}
                {stat.changeType === 'negative' && <TrendingDown className="w-4 h-4" />}
                {stat.changeType === 'warning' && <AlertCircle className="w-4 h-4" />}
                <span>{stat.change}</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.title}</div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-primary" />
              Công việc gần đây
            </CardTitle>
            <a href="/admin/tasks" className="text-sm text-primary hover:underline">
              Xem tất cả
            </a>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">{task.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{task.assignee}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {getPriorityBadge(task.priority)}
                    {getStatusBadge(task.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Inventory */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Thiết bị gần đây
            </CardTitle>
            <a href="/admin/inventory" className="text-sm text-primary hover:underline">
              Xem tất cả
            </a>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInventory.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground">{item.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono text-muted-foreground">{item.serial}</span>
                      <span className="text-xs text-muted-foreground">• {item.location}</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    {getStatusBadge(item.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
