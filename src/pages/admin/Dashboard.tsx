import { 
  FileText, 
  CheckSquare, 
  Package, 
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useRecentTasks, useRecentInventory } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    todo: "status-badge info",
    in_progress: "status-badge warning",
    done: "status-badge success",
    in_stock: "status-badge success",
    deployed: "status-badge info",
    deploying: "status-badge warning",
    maintenance: "status-badge error",
  };
  const labels: Record<string, string> = {
    todo: "To Do",
    in_progress: "Đang làm",
    done: "Hoàn thành",
    in_stock: "Còn kho",
    deployed: "Đã xuất",
    deploying: "Đang triển khai",
    maintenance: "Bảo trì",
  };
  return <span className={styles[status] || "status-badge info"}>{labels[status] || status}</span>;
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

const StatCardSkeleton = () => (
  <div className="stat-card">
    <div className="flex items-start justify-between mb-4">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <Skeleton className="w-16 h-4" />
    </div>
    <Skeleton className="w-20 h-8 mb-1" />
    <Skeleton className="w-24 h-4" />
  </div>
);

const TaskItemSkeleton = () => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
    <div className="flex-1 min-w-0">
      <Skeleton className="w-3/4 h-5 mb-2" />
      <Skeleton className="w-1/3 h-3" />
    </div>
    <div className="flex items-center gap-2 ml-4">
      <Skeleton className="w-16 h-5 rounded-full" />
      <Skeleton className="w-16 h-5 rounded-full" />
    </div>
  </div>
);

const Dashboard = () => {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentTasks, isLoading: tasksLoading } = useRecentTasks();
  const { data: recentInventory, isLoading: inventoryLoading } = useRecentInventory();

  type ChangeType = "positive" | "negative" | "warning" | "neutral";

  const statCards: Array<{
    title: string;
    value: number;
    change: string;
    changeType: ChangeType;
    icon: typeof FileText;
  }> = [
    {
      title: "Tài liệu",
      value: stats?.documentsCount ?? 0,
      change: "",
      changeType: "neutral",
      icon: FileText,
    },
    {
      title: "Công việc đang làm",
      value: stats?.tasksInProgress ?? 0,
      change: stats?.overdueTasksCount ? `${stats.overdueTasksCount} quá hạn` : "",
      changeType: stats?.overdueTasksCount ? "warning" : "neutral",
      icon: CheckSquare,
    },
    {
      title: "Thiết bị trong kho",
      value: stats?.inventoryInStock ?? 0,
      change: stats?.inventoryDeployedThisWeek ? `-${stats.inventoryDeployedThisWeek} tuần này` : "",
      changeType: stats?.inventoryDeployedThisWeek ? "negative" : "neutral",
      icon: Package,
    },
    {
      title: "Sản phẩm",
      value: stats?.productsCount ?? 0,
      change: "",
      changeType: "neutral",
      icon: ShoppingBag,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Tổng quan</h1>
        <p className="text-muted-foreground">Xin chào! Đây là tổng quan hoạt động của công ty.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          statCards.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                {stat.change && (
                  <div className={`flex items-center gap-1 text-sm ${
                    stat.changeType === 'positive' ? 'text-success' : 
                    stat.changeType === 'negative' ? 'text-destructive' : 
                    stat.changeType === 'warning' ? 'text-warning' :
                    'text-muted-foreground'
                  }`}>
                    {stat.changeType === 'positive' && <TrendingUp className="w-4 h-4" />}
                    {stat.changeType === 'negative' && <TrendingDown className="w-4 h-4" />}
                    {stat.changeType === 'warning' && <AlertCircle className="w-4 h-4" />}
                    <span>{stat.change}</span>
                  </div>
                )}
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">
                {stat.value.toLocaleString("vi-VN")}
              </div>
              <div className="text-sm text-muted-foreground">{stat.title}</div>
            </div>
          ))
        )}
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
              {tasksLoading ? (
                <>
                  <TaskItemSkeleton />
                  <TaskItemSkeleton />
                  <TaskItemSkeleton />
                </>
              ) : recentTasks && recentTasks.length > 0 ? (
                recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">{task.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {task.assignee?.full_name || "Chưa phân công"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {getPriorityBadge(task.priority)}
                      {getStatusBadge(task.status)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có công việc nào
                </div>
              )}
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
              {inventoryLoading ? (
                <>
                  <TaskItemSkeleton />
                  <TaskItemSkeleton />
                  <TaskItemSkeleton />
                </>
              ) : recentInventory && recentInventory.length > 0 ? (
                recentInventory.map((item) => (
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
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có thiết bị nào
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
