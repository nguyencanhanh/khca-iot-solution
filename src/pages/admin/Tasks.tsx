import { useState, useEffect } from "react";
import { Plus, Filter, Search, MoreVertical, Calendar, User, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/integrations/supabase/types";

type TaskStatus = Database["public"]["Enums"]["task_status"];
type TaskPriority = Database["public"]["Enums"]["task_priority"];

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  project_id: string | null;
  deadline: string | null;
  created_by: string;
  created_at: string;
  assignee?: { full_name: string } | null;
  project?: { name: string; code: string } | null;
}

interface Profile {
  id: string;
  full_name: string;
}

interface Project {
  id: string;
  name: string;
  code: string;
}

const columns = [
  { id: "todo" as TaskStatus, title: "To Do", color: "bg-info" },
  { id: "in_progress" as TaskStatus, title: "In Progress", color: "bg-warning" },
  { id: "done" as TaskStatus, title: "Done", color: "bg-success" },
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
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    assignee_id: "",
    project_id: "",
    deadline: "",
  });

  useEffect(() => {
    fetchTasks();
    fetchProfiles();
    fetchProjects();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(full_name),
          project:projects!tasks_project_id_fkey(name, code)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      toast.error("Lỗi khi tải danh sách công việc");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name");
      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error("Error fetching profiles:", error);
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

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.assignee?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.project?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (status: TaskStatus) => {
    if (draggedTask && draggedTask.status !== status) {
      try {
        const { error } = await supabase
          .from("tasks")
          .update({ status })
          .eq("id", draggedTask.id);

        if (error) throw error;
        
        setTasks(tasks.map(t => 
          t.id === draggedTask.id ? { ...t, status } : t
        ));
        toast.success("Đã cập nhật trạng thái công việc");
      } catch (error: any) {
        console.error("Error updating task:", error);
        toast.error("Lỗi khi cập nhật trạng thái");
      }
    }
    setDraggedTask(null);
  };

  const handleCreateTask = async () => {
    if (!user || !newTask.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề công việc");
      return;
    }

    try {
      const { error } = await supabase.from("tasks").insert({
        title: newTask.title,
        description: newTask.description || null,
        priority: newTask.priority,
        assignee_id: newTask.assignee_id || null,
        project_id: newTask.project_id || null,
        deadline: newTask.deadline || null,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("Đã tạo công việc mới");
      setIsDialogOpen(false);
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        assignee_id: "",
        project_id: "",
        deadline: "",
      });
      fetchTasks();
    } catch (error: any) {
      console.error("Error creating task:", error);
      toast.error("Lỗi khi tạo công việc");
    }
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
          <h1 className="font-display text-2xl font-bold text-foreground">Quản lý công việc</h1>
          <p className="text-muted-foreground">Theo dõi và quản lý công việc của đội ngũ</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4" />
              Thêm công việc
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Tạo công việc mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề *</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Nhập tiêu đề công việc"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Mô tả chi tiết công việc"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Độ ưu tiên</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value: TaskPriority) => setNewTask({ ...newTask, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Cao</SelectItem>
                      <SelectItem value="medium">Trung bình</SelectItem>
                      <SelectItem value="low">Thấp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Người thực hiện</Label>
                <Select
                  value={newTask.assignee_id}
                  onValueChange={(value) => setNewTask({ ...newTask, assignee_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn người thực hiện" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dự án</Label>
                <Select
                  value={newTask.project_id}
                  onValueChange={(value) => setNewTask({ ...newTask, project_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn dự án" />
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
              <Button onClick={handleCreateTask} className="w-full">
                Tạo công việc
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
            onDrop={() => handleDrop(column.id)}
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
                      {task.description && (
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      {task.project && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            <Tag className="w-3 h-3" />
                            {task.project.name}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {task.assignee?.full_name || "Chưa phân công"}
                        </div>
                        {task.deadline && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.deadline).toLocaleDateString('vi-VN')}
                          </div>
                        )}
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
