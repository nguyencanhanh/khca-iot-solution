import { useState, useEffect } from "react";
import { 
  Plus, 
  Filter, 
  Search, 
  Download, 
  MoreVertical, 
  FileText, 
  Image, 
  FileSpreadsheet,
  File,
  Folder,
  Upload,
  Eye,
  Edit,
  Trash2,
  Share2,
  Grid,
  List,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DepartmentManager, Department } from "@/components/admin/DepartmentManager";

interface Document {
  id: string;
  name: string;
  description: string | null;
  file_path: string;
  file_size: number;
  file_type: string;
  department_id: string | null;
  sub_department_id: string | null;
  project_id: string | null;
  uploaded_by: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  name: string;
  code: string;
}

const getFileIcon = (fileType: string) => {
  if (fileType.includes('image')) return Image;
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return FileSpreadsheet;
  if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('word')) return FileText;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const Documents = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [subDepartmentFilter, setSubDepartmentFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    name: "",
    description: "",
    department_id: "",
    sub_department_id: "",
    project_id: "",
    is_public: false
  });

  // Get main departments (parent_id is null)
  const mainDepartments = departments.filter(d => d.parent_id === null);
  
  // Get sub-departments for selected main department
  const getSubDepartments = (parentId: string | null) => {
    if (!parentId) return [];
    return departments.filter(d => d.parent_id === parentId);
  };

  // Sub-departments for upload form
  const uploadSubDepartments = getSubDepartments(uploadForm.department_id || null);
  
  // Sub-departments for filter
  const filterSubDepartments = departmentFilter !== "all" 
    ? getSubDepartments(departmentFilter) 
    : [];

  useEffect(() => {
    fetchDocuments();
    fetchDepartments();
    fetchProjects();
  }, []);

  // Reset sub-department when main department changes in upload form
  useEffect(() => {
    setUploadForm(prev => ({ ...prev, sub_department_id: "" }));
  }, [uploadForm.department_id]);

  // Reset sub-department filter when main department filter changes
  useEffect(() => {
    setSubDepartmentFilter("all");
  }, [departmentFilter]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Không thể tải danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, parent_id, created_at')
        .order('name');
      
      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, code')
        .order('name');
      
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm({
        ...uploadForm,
        file,
        name: uploadForm.name || file.name.replace(/\.[^/.]+$/, "")
      });
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !user) {
      toast.error('Vui lòng chọn file để upload');
      return;
    }

    setUploading(true);
    try {
      // Upload file to storage
      const fileExt = uploadForm.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, uploadForm.file);

      if (uploadError) throw uploadError;

      // Create document record
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          name: uploadForm.name || uploadForm.file.name,
          description: uploadForm.description || null,
          file_path: filePath,
          file_size: uploadForm.file.size,
          file_type: uploadForm.file.type,
          department_id: uploadForm.department_id || null,
          sub_department_id: uploadForm.sub_department_id || null,
          project_id: uploadForm.project_id || null,
          uploaded_by: user.id,
          is_public: uploadForm.is_public
        });

      if (dbError) throw dbError;

      toast.success('Upload tài liệu thành công!');
      setUploadDialogOpen(false);
      setUploadForm({
        file: null,
        name: "",
        description: "",
        department_id: "",
        sub_department_id: "",
        project_id: "",
        is_public: false
      });
      setActiveTab("upload");
      fetchDocuments();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error('Lỗi upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm('Bạn có chắc muốn xóa tài liệu này?')) return;

    try {
      // Delete from storage
      await supabase.storage.from('documents').remove([doc.file_path]);
      
      // Delete from database
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;

      toast.success('Đã xóa tài liệu');
      fetchDocuments();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast.error('Lỗi xóa tài liệu: ' + error.message);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name + '.' + doc.file_path.split('.').pop();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast.error('Lỗi tải xuống: ' + error.message);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDepartment = departmentFilter === "all" || doc.department_id === departmentFilter;
    const matchesSubDepartment = subDepartmentFilter === "all" || doc.sub_department_id === subDepartmentFilter;
    const matchesProject = projectFilter === "all" || doc.project_id === projectFilter;
    return matchesSearch && matchesDepartment && matchesSubDepartment && matchesProject;
  });

  const getDepartmentName = (id: string | null) => {
    if (!id) return null;
    return departments.find(d => d.id === id)?.name;
  };

  const getFullDepartmentPath = (deptId: string | null, subDeptId: string | null) => {
    const deptName = getDepartmentName(deptId);
    const subDeptName = getDepartmentName(subDeptId);
    if (deptName && subDeptName) {
      return `${deptName} / ${subDeptName}`;
    }
    return deptName || subDeptName || null;
  };

  const getProjectName = (id: string | null) => {
    if (!id) return null;
    const project = projects.find(p => p.id === id);
    return project ? `${project.code} - ${project.name}` : null;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Quản lý tài liệu</h1>
          <p className="text-muted-foreground">Upload, phân loại và quản lý tài liệu công ty</p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="w-4 h-4" />
              Upload tài liệu
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Quản lý tài liệu</DialogTitle>
            </DialogHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="departments">
                  <Settings className="w-4 h-4 mr-2" />
                  Phòng ban
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-4 pt-4">
                {/* File Input */}
                <div className="space-y-2">
                  <Label>Chọn file *</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {uploadForm.file ? (
                        <div className="flex items-center justify-center gap-2">
                          <File className="w-8 h-8 text-primary" />
                          <div className="text-left">
                            <div className="font-medium">{uploadForm.file.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatFileSize(uploadForm.file.size)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Click để chọn file hoặc kéo thả vào đây
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label>Tên tài liệu</Label>
                  <Input
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                    placeholder="Tên hiển thị của tài liệu"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Mô tả</Label>
                  <Textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    placeholder="Mô tả ngắn về tài liệu"
                    rows={2}
                  />
                </div>

                {/* Department & Sub-department */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phòng ban</Label>
                    <Select
                      value={uploadForm.department_id}
                      onValueChange={(value) => setUploadForm({ ...uploadForm, department_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn phòng ban" />
                      </SelectTrigger>
                      <SelectContent>
                        {mainDepartments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Phòng nhỏ</Label>
                    <Select
                      value={uploadForm.sub_department_id}
                      onValueChange={(value) => setUploadForm({ ...uploadForm, sub_department_id: value })}
                      disabled={!uploadForm.department_id || uploadSubDepartments.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !uploadForm.department_id 
                            ? "Chọn phòng ban trước" 
                            : uploadSubDepartments.length === 0 
                              ? "Không có phòng nhỏ" 
                              : "Chọn phòng nhỏ"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {uploadSubDepartments.map((subDept) => (
                          <SelectItem key={subDept.id} value={subDept.id}>
                            {subDept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Project */}
                <div className="space-y-2">
                  <Label>Dự án</Label>
                  <Select
                    value={uploadForm.project_id}
                    onValueChange={(value) => setUploadForm({ ...uploadForm, project_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn dự án (tùy chọn)" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((proj) => (
                        <SelectItem key={proj.id} value={proj.id}>
                          {proj.code} - {proj.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Public checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is-public"
                    checked={uploadForm.is_public}
                    onChange={(e) => setUploadForm({ ...uploadForm, is_public: e.target.checked })}
                    className="w-4 h-4 rounded border-input"
                  />
                  <Label htmlFor="is-public" className="text-sm cursor-pointer">
                    Công khai cho tất cả nhân viên
                  </Label>
                </div>

                <Button 
                  onClick={handleUpload} 
                  disabled={!uploadForm.file || uploading}
                  className="w-full"
                >
                  {uploading ? "Đang upload..." : "Upload tài liệu"}
                </Button>
              </TabsContent>
              
              <TabsContent value="departments" className="pt-4">
                <DepartmentManager 
                  departments={departments} 
                  onDepartmentsChange={fetchDepartments} 
                />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{documents.length}</div>
              <div className="text-sm text-muted-foreground">Tổng tài liệu</div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Folder className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{mainDepartments.length}</div>
              <div className="text-sm text-muted-foreground">Phòng ban</div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Folder className="w-5 h-5 text-info" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{projects.length}</div>
              <div className="text-sm text-muted-foreground">Dự án</div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {documents.filter(d => d.is_public).length}
              </div>
              <div className="text-sm text-muted-foreground">Công khai</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm tài liệu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Phòng ban" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả phòng ban</SelectItem>
            {mainDepartments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {departmentFilter !== "all" && filterSubDepartments.length > 0 && (
          <Select value={subDepartmentFilter} onValueChange={setSubDepartmentFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Phòng nhỏ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả phòng nhỏ</SelectItem>
              {filterSubDepartments.map((subDept) => (
                <SelectItem key={subDept.id} value={subDept.id}>
                  {subDept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Dự án" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả dự án</SelectItem>
            {projects.map((proj) => (
              <SelectItem key={proj.id} value={proj.id}>
                {proj.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 border border-border rounded-lg p-1">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
            className="h-8 w-8"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
            className="h-8 w-8"
          >
            <Grid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Documents List/Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Đang tải...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có tài liệu nào</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "Không tìm thấy tài liệu phù hợp" : "Hãy upload tài liệu đầu tiên của bạn"}
          </p>
          {!searchQuery && (
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="w-4 h-4" />
              Upload tài liệu
            </Button>
          )}
        </div>
      ) : viewMode === "list" ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tài liệu</th>
                  <th>Phòng ban</th>
                  <th>Dự án</th>
                  <th>Kích thước</th>
                  <th>Ngày tạo</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => {
                  const FileIcon = getFileIcon(doc.file_type);
                  return (
                    <tr key={doc.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FileIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{doc.name}</div>
                            {doc.description && (
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {doc.description}
                              </div>
                            )}
                          </div>
                          {doc.is_public && (
                            <span className="status-badge info">Công khai</span>
                          )}
                        </div>
                      </td>
                      <td className="text-muted-foreground">
                        {getFullDepartmentPath(doc.department_id, doc.sub_department_id) || "-"}
                      </td>
                      <td className="text-muted-foreground">
                        {getProjectName(doc.project_id) || "-"}
                      </td>
                      <td className="text-muted-foreground text-sm">
                        {formatFileSize(doc.file_size)}
                      </td>
                      <td className="text-muted-foreground text-sm">
                        {new Date(doc.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownload(doc)}>
                              <Download className="w-4 h-4 mr-2" />
                              Tải xuống
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="w-4 h-4 mr-2" />
                              Chia sẻ
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(doc)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.map((doc) => {
            const FileIcon = getFileIcon(doc.file_type);
            return (
              <div 
                key={doc.id} 
                className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileIcon className="w-6 h-6 text-primary" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDownload(doc)}>
                        <Download className="w-4 h-4 mr-2" />
                        Tải xuống
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 className="w-4 h-4 mr-2" />
                        Chia sẻ
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(doc)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="font-medium text-foreground mb-1 truncate">{doc.name}</h3>
                {doc.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {doc.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatFileSize(doc.file_size)}</span>
                  <span>{new Date(doc.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
                {(getFullDepartmentPath(doc.department_id, doc.sub_department_id) || doc.is_public) && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {getFullDepartmentPath(doc.department_id, doc.sub_department_id) && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">
                        {getFullDepartmentPath(doc.department_id, doc.sub_department_id)}
                      </span>
                    )}
                    {doc.is_public && (
                      <span className="status-badge info text-xs">Công khai</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Documents;
