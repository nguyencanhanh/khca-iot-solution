import { useState } from "react";
import { Plus, Trash2, ChevronRight, Building2, FolderOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export interface Department {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
}

interface DepartmentManagerProps {
  departments: Department[];
  onDepartmentsChange: () => void;
}

export function DepartmentManager({ departments, onDepartmentsChange }: DepartmentManagerProps) {
  const [newDeptName, setNewDeptName] = useState("");
  const [newChildName, setNewChildName] = useState("");
  const [addingChildTo, setAddingChildTo] = useState<string | null>(null);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);

  // Level 0: Root departments (parent_id is null)
  const rootDepartments = departments.filter(d => d.parent_id === null);
  
  // Get children of any department
  const getChildren = (parentId: string) => 
    departments.filter(d => d.parent_id === parentId);

  // Get level of a department (0 = root, 1 = child, 2 = grandchild)
  const getDeptLevel = (dept: Department): number => {
    if (!dept.parent_id) return 0;
    const parent = departments.find(d => d.id === dept.parent_id);
    if (!parent) return 0;
    if (!parent.parent_id) return 1;
    return 2;
  };

  const toggleExpand = (deptId: string) => {
    const newExpanded = new Set(expandedDepts);
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId);
    } else {
      newExpanded.add(deptId);
    }
    setExpandedDepts(newExpanded);
  };

  const handleAddRootDept = async () => {
    if (!newDeptName.trim()) {
      toast.error("Vui lòng nhập tên phòng ban");
      return;
    }

    try {
      const { error } = await supabase
        .from("departments")
        .insert({ name: newDeptName.trim(), parent_id: null });

      if (error) {
        if (error.code === "23505") {
          toast.error("Tên phòng ban đã tồn tại");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Đã thêm phòng ban mới");
      setNewDeptName("");
      onDepartmentsChange();
    } catch (error: any) {
      console.error("Error adding department:", error);
      toast.error("Lỗi thêm phòng ban: " + error.message);
    }
  };

  const handleAddChild = async (parentId: string, parentLevel: number) => {
    if (!newChildName.trim()) {
      const levelName = parentLevel === 0 ? "bộ phận" : "tổ";
      toast.error(`Vui lòng nhập tên ${levelName}`);
      return;
    }

    try {
      const { error } = await supabase
        .from("departments")
        .insert({ name: newChildName.trim(), parent_id: parentId });

      if (error) {
        if (error.code === "23505") {
          toast.error("Tên đã tồn tại trong cấp này");
        } else {
          throw error;
        }
        return;
      }

      const levelName = parentLevel === 0 ? "bộ phận" : "tổ";
      toast.success(`Đã thêm ${levelName}`);
      setNewChildName("");
      setAddingChildTo(null);
      setExpandedDepts(prev => new Set([...prev, parentId]));
      onDepartmentsChange();
    } catch (error: any) {
      console.error("Error adding child:", error);
      toast.error("Lỗi thêm: " + error.message);
    }
  };

  const handleDelete = async (dept: Department) => {
    setDeleting(dept.id);
    try {
      const { error } = await supabase
        .from("departments")
        .delete()
        .eq("id", dept.id);

      if (error) {
        if (error.code === "23503") {
          const level = getDeptLevel(dept);
          const messages = [
            "Không thể xóa: phòng ban đang có bộ phận hoặc đang được sử dụng",
            "Không thể xóa: bộ phận đang có tổ hoặc đang được sử dụng",
            "Không thể xóa: tổ đang được sử dụng bởi tài liệu hoặc profile"
          ];
          toast.error(messages[level] || "Không thể xóa");
        } else {
          throw error;
        }
        return;
      }

      const level = getDeptLevel(dept);
      const names = ["phòng ban", "bộ phận", "tổ"];
      toast.success(`Đã xóa ${names[level]}`);
      onDepartmentsChange();
    } catch (error: any) {
      console.error("Error deleting:", error);
      toast.error("Lỗi xóa: " + error.message);
    } finally {
      setDeleting(null);
    }
  };

  const getLevelIcon = (level: number) => {
    switch (level) {
      case 0: return Building2;
      case 1: return FolderOpen;
      case 2: return Users;
      default: return FolderOpen;
    }
  };

  const getLevelLabel = (level: number) => {
    switch (level) {
      case 0: return { name: "phòng ban", child: "bộ phận" };
      case 1: return { name: "bộ phận", child: "tổ" };
      case 2: return { name: "tổ", child: null };
      default: return { name: "mục", child: null };
    }
  };

  // Recursive render for department tree
  const renderDepartment = (dept: Department, level: number) => {
    const children = getChildren(dept.id);
    const isExpanded = expandedDepts.has(dept.id);
    const isAddingChild = addingChildTo === dept.id;
    const Icon = getLevelIcon(level);
    const labels = getLevelLabel(level);
    const canAddChild = level < 2; // Max 3 levels (0, 1, 2)

    return (
      <Collapsible
        key={dept.id}
        open={isExpanded}
        onOpenChange={() => toggleExpand(dept.id)}
      >
        <div className={cn(
          "flex items-center gap-1 p-2 rounded-md hover:bg-muted/50 group",
          level > 0 && "ml-4"
        )}>
          {(canAddChild || children.length > 0) ? (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                <ChevronRight
                  className={cn(
                    "w-4 h-4 transition-transform",
                    isExpanded && "rotate-90"
                  )}
                />
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className="w-6" />
          )}
          <Icon className={cn(
            "w-4 h-4 shrink-0",
            level === 0 ? "text-primary" : level === 1 ? "text-blue-500" : "text-green-500"
          )} />
          <span className="flex-1 text-sm font-medium truncate">
            {dept.name}
          </span>
          {canAddChild && (
            <span className="text-xs text-muted-foreground">
              {children.length} {labels.child}
            </span>
          )}
          {canAddChild && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                setAddingChildTo(isAddingChild ? null : dept.id);
                setNewChildName("");
              }}
              title={`Thêm ${labels.child}`}
            >
              <Plus className="w-3 h-3" />
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                disabled={deleting === dept.id}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xóa {labels.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc muốn xóa {labels.name} "{dept.name}"? Hành động này không thể hoàn tác.
                  {canAddChild && ` Lưu ý: Không thể xóa nếu đang có ${labels.child} hoặc đang được sử dụng.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(dept)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Xóa
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <CollapsibleContent>
          <div className={cn("pl-2 border-l border-border space-y-1", level > 0 ? "ml-6" : "ml-4")}>
            {/* Add child input */}
            {isAddingChild && (
              <div className="flex gap-2 p-2">
                <Input
                  placeholder={`Tên ${labels.child}...`}
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddChild(dept.id, level);
                    if (e.key === "Escape") setAddingChildTo(null);
                  }}
                  autoFocus
                  className="h-8 text-sm"
                />
                <Button size="sm" className="h-8" onClick={() => handleAddChild(dept.id, level)}>
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            )}

            {/* Render children recursively */}
            {children.map((child) => renderDepartment(child, level + 1))}

            {children.length === 0 && !isAddingChild && (
              <p className="text-xs text-muted-foreground py-2 px-2">
                Chưa có {labels.child}
              </p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Building2 className="w-4 h-4" />
        Quản lý phòng ban (3 cấp: Phòng → Bộ phận → Tổ)
      </div>

      {/* Add new root department */}
      <div className="flex gap-2">
        <Input
          placeholder="Tên phòng ban mới..."
          value={newDeptName}
          onChange={(e) => setNewDeptName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddRootDept()}
          className="flex-1"
        />
        <Button size="sm" onClick={handleAddRootDept}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Department tree */}
      <div className="space-y-1 max-h-72 overflow-y-auto border border-border rounded-lg p-2">
        {rootDepartments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Chưa có phòng ban nào
          </p>
        ) : (
          rootDepartments.map((dept) => renderDepartment(dept, 0))
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Building2 className="w-3 h-3 text-primary" />
          <span>Phòng ban</span>
        </div>
        <div className="flex items-center gap-1">
          <FolderOpen className="w-3 h-3 text-blue-500" />
          <span>Bộ phận</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3 text-green-500" />
          <span>Tổ</span>
        </div>
      </div>
    </div>
  );
}
