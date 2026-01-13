import { useState } from "react";
import { Plus, Filter, Search, MoreVertical, Calendar, User, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Task {
  id: number;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  priority: "high" | "medium" | "low";
  assignee: string;
  deadline: string;
  project: string;
}

const initialTasks: Task[] = [
  { id: 1, title: "Triển khai trạm giám sát Bình Dương", description: "Lắp đặt và cấu hình 5 trạm giám sát mới", status: "in_progress", priority: "high", assignee: "Nguyễn Văn B", deadline: "2024-12-20", project: "Dự án BD-01" },
  { id: 2, title: "Bảo trì FlowMaster #234", description: "Kiểm tra và thay thế cảm biến", status: "todo", priority: "medium", assignee: "Trần Văn C", deadline: "2024-12-22", project: "Bảo trì" },
  { id: 3, title: "Cập nhật firmware Gateway G4", description: "Nâng cấp firmware lên phiên bản 2.5.1", status: "done", priority: "low", assignee: "Lê Thị D", deadline: "2024-12-15", project: "R&D" },
  { id: 4, title: "Báo cáo dự án Q4/2024", description: "Tổng hợp và phân tích kết quả Q4", status: "in_progress", priority: "high", assignee: "Phạm Văn E", deadline: "2024-12-25", project: "Quản lý" },
  { id: 5, title: "Đào tạo nhân sự mới", description: "Hướng dẫn quy trình và công cụ", status: "todo", priority: "medium", assignee: "Nguyễn Văn A", deadline: "2024-12-28", project: "HR" },
  { id: 6, title: "Khảo sát Đà Nẵng", description: "Khảo sát vị trí lắp đặt trạm mới", status: "todo", priority: "high", assignee: "Hoàng Văn F", deadline: "2024-12-18", project: "Dự án DN-03" },
  { id: 7, title: "Hoàn thiện tài liệu API", description: "Cập nhật documentation API v3", status: "in_progress", priority: "medium", assignee: "Lê Văn G", deadline: "2024-12-21", project: "R&D" },
  { id: 8, title: "Review code sprint 12", description: "Kiểm tra và phê duyệt code", status: "done", priority: "medium", assignee: "Trần Thị H", deadline: "2024-12-14", project: "R&D" },
];

const columns = [
  { id: "todo", title: "To Do", color: "bg-info" },
  { id: "in_progress", title: "In Progress", color: "bg-warning" },
  { id: "done", title: "Done", color: "bg-success" },
];

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    high: "border-l-destructive",
    medium: "border-l-warning",
    low: "border-l-info",
  };
  return colors[priority];
};

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.assignee.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.project.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: "todo" | "in_progress" | "done") => {
    if (draggedTask) {
      setTasks(tasks.map(t => 
        t.id === draggedTask.id ? { ...t, status } : t
      ));
      setDraggedTask(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Quản lý công việc</h1>
          <p className="text-muted-foreground">Theo dõi và quản lý công việc của đội ngũ</p>
        </div>
        <Button>
          <Plus className="w-4 h-4" />
          Thêm công việc
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm công việc..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4" />
          Lọc
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid lg:grid-cols-3 gap-6">
        {columns.map((column) => (
          <div
            key={column.id}
            className="space-y-4"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id as "todo" | "in_progress" | "done")}
          >
            {/* Column Header */}
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${column.color}`} />
              <h3 className="font-semibold text-foreground">{column.title}</h3>
              <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {filteredTasks.filter(t => t.status === column.id).length}
              </span>
            </div>

            {/* Column Content */}
            <div className="space-y-3 min-h-[400px] p-3 bg-muted/30 rounded-xl">
              {filteredTasks
                .filter((task) => task.status === column.id)
                .map((task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    className={`cursor-grab active:cursor-grabbing border-l-4 ${getPriorityColor(task.priority)} hover:shadow-md transition-shadow`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-foreground text-sm leading-tight">
                          {task.title}
                        </h4>
                        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {task.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          <Tag className="w-3 h-3" />
                          {task.project}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {task.assignee}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.deadline).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tasks;
