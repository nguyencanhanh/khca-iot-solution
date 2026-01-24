import { useState } from "react";
import { Plus, Trash2, ChevronRight, Building2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [newSubDeptName, setNewSubDeptName] = useState("");
  const [addingSubTo, setAddingSubTo] = useState<string | null>(null);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);

  // Get main departments (parent_id is null)
  const mainDepartments = departments.filter(d => d.parent_id === null);
  
  // Get sub-departments for a main department
  const getSubDepartments = (parentId: string) => 
    departments.filter(d => d.parent_id === parentId);

  const toggleExpand = (deptId: string) => {
    const newExpanded = new Set(expandedDepts);
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId);
    } else {
      newExpanded.add(deptId);
    }
    setExpandedDepts(newExpanded);
  };

  const handleAddMainDept = async () => {
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

  const handleAddSubDept = async (parentId: string) => {
    if (!newSubDeptName.trim()) {
      toast.error("Vui lòng nhập tên phòng nhỏ");
      return;
    }

    try {
      const { error } = await supabase
        .from("departments")
        .insert({ name: newSubDeptName.trim(), parent_id: parentId });

      if (error) {
        if (error.code === "23505") {
          toast.error("Tên phòng nhỏ đã tồn tại trong phòng ban này");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Đã thêm phòng nhỏ");
      setNewSubDeptName("");
      setAddingSubTo(null);
      // Auto expand the parent
      setExpandedDepts(prev => new Set([...prev, parentId]));
      onDepartmentsChange();
    } catch (error: any) {
      console.error("Error adding sub-department:", error);
      toast.error("Lỗi thêm phòng nhỏ: " + error.message);
    }
  };

  const handleDeleteDept = async (dept: Department) => {
    setDeleting(dept.id);
    try {
      const { error } = await supabase
        .from("departments")
        .delete()
        .eq("id", dept.id);

      if (error) {
        if (error.code === "23503") {
          toast.error(
            dept.parent_id 
              ? "Không thể xóa: phòng nhỏ đang được sử dụng bởi tài liệu hoặc profile"
              : "Không thể xóa: phòng ban đang có phòng nhỏ hoặc đang được sử dụng"
          );
        } else {
          throw error;
        }
        return;
      }

      toast.success(`Đã xóa ${dept.parent_id ? "phòng nhỏ" : "phòng ban"}`);
      onDepartmentsChange();
    } catch (error: any) {
      console.error("Error deleting department:", error);
      toast.error("Lỗi xóa: " + error.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Building2 className="w-4 h-4" />
        Quản lý phòng ban
      </div>

      {/* Add new main department */}
      <div className="flex gap-2">
        <Input
          placeholder="Tên phòng ban mới..."
          value={newDeptName}
          onChange={(e) => setNewDeptName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddMainDept()}
          className="flex-1"
        />
        <Button size="sm" onClick={handleAddMainDept}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Department list */}
      <div className="space-y-1 max-h-64 overflow-y-auto border border-border rounded-lg p-2">
        {mainDepartments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Chưa có phòng ban nào
          </p>
        ) : (
          mainDepartments.map((dept) => {
            const subDepts = getSubDepartments(dept.id);
            const isExpanded = expandedDepts.has(dept.id);
            const isAddingSub = addingSubTo === dept.id;

            return (
              <Collapsible
                key={dept.id}
                open={isExpanded}
                onOpenChange={() => toggleExpand(dept.id)}
              >
                <div className="flex items-center gap-1 p-2 rounded-md hover:bg-muted/50 group">
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
                  <Building2 className="w-4 h-4 text-primary shrink-0" />
                  <span className="flex-1 text-sm font-medium truncate">
                    {dept.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {subDepts.length} phòng nhỏ
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddingSubTo(isAddingSub ? null : dept.id);
                      setNewSubDeptName("");
                    }}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
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
                        <AlertDialogTitle>Xóa phòng ban?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc muốn xóa phòng ban "{dept.name}"? Hành động này không thể hoàn tác.
                          Lưu ý: Không thể xóa nếu phòng ban đang có phòng nhỏ hoặc đang được sử dụng.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteDept(dept)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Xóa
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <CollapsibleContent>
                  <div className="ml-6 pl-2 border-l border-border space-y-1">
                    {/* Add sub-department input */}
                    {isAddingSub && (
                      <div className="flex gap-2 p-2">
                        <Input
                          placeholder="Tên phòng nhỏ..."
                          value={newSubDeptName}
                          onChange={(e) => setNewSubDeptName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddSubDept(dept.id);
                            if (e.key === "Escape") setAddingSubTo(null);
                          }}
                          autoFocus
                          className="h-8 text-sm"
                        />
                        <Button size="sm" className="h-8" onClick={() => handleAddSubDept(dept.id)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    )}

                    {/* Sub-departments list */}
                    {subDepts.map((subDept) => (
                      <div
                        key={subDept.id}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 group"
                      >
                        <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="flex-1 text-sm truncate">{subDept.name}</span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                              disabled={deleting === subDept.id}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xóa phòng nhỏ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc muốn xóa phòng nhỏ "{subDept.name}"?
                                Lưu ý: Không thể xóa nếu phòng nhỏ đang được sử dụng bởi tài liệu hoặc profile.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteDept(subDept)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}

                    {subDepts.length === 0 && !isAddingSub && (
                      <p className="text-xs text-muted-foreground py-2 px-2">
                        Chưa có phòng nhỏ
                      </p>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })
        )}
      </div>
    </div>
  );
}
