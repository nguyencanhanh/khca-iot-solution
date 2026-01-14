import { useState, useEffect } from "react";
import { Plus, Search, MoreVertical, User, Shield, Mail, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  department_id: string | null;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'technical' | 'accounting' | 'manager';
}

interface Department {
  id: string;
  name: string;
}

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  technical: 'Kỹ thuật',
  accounting: 'Kế toán',
  manager: 'Quản lý'
};

const roleBadgeColors: Record<string, string> = {
  admin: 'status-badge error',
  technical: 'status-badge info',
  accounting: 'status-badge warning',
  manager: 'status-badge success'
};

const Users = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    full_name: "",
    password: "",
    role: "" as string,
    department_id: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profilesRes, rolesRes, deptsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('*'),
        supabase.from('departments').select('id, name').order('name')
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;
      if (deptsRes.error) throw deptsRes.error;

      setProfiles(profilesRes.data || []);
      setUserRoles(rolesRes.data || []);
      setDepartments(deptsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const getUserRole = (userId: string) => {
    return userRoles.find(r => r.user_id === userId);
  };

  const getDepartmentName = (deptId: string | null) => {
    if (!deptId) return null;
    return departments.find(d => d.id === deptId)?.name;
  };

  const handleInviteUser = async () => {
    if (!inviteForm.email || !inviteForm.full_name || !inviteForm.password || !inviteForm.role) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setInviting(true);
    try {
      // Create user via signUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: inviteForm.email,
        password: inviteForm.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: inviteForm.full_name }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Không thể tạo người dùng');

      // Update profile with department
      if (inviteForm.department_id) {
        await supabase
          .from('profiles')
          .update({ department_id: inviteForm.department_id })
          .eq('user_id', authData.user.id);
      }

      // Add role
      await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: inviteForm.role as 'admin' | 'technical' | 'accounting' | 'manager'
        });

      toast.success('Đã thêm người dùng mới!');
      setInviteDialogOpen(false);
      setInviteForm({
        email: "",
        full_name: "",
        password: "",
        role: "",
        department_id: ""
      });
      fetchData();
    } catch (error: any) {
      console.error('Error inviting user:', error);
      toast.error('Lỗi: ' + error.message);
    } finally {
      setInviting(false);
    }
  };

  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch = 
      profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (roleFilter === "all") return matchesSearch;
    
    const userRole = getUserRole(profile.user_id);
    return matchesSearch && userRole?.role === roleFilter;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Quản lý người dùng</h1>
          <p className="text-muted-foreground">Quản lý tài khoản và phân quyền nhân viên</p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4" />
              Thêm người dùng
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Thêm người dùng mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Họ và tên *</Label>
                <Input
                  value={inviteForm.full_name}
                  onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="email@company.vn"
                />
              </div>
              <div className="space-y-2">
                <Label>Mật khẩu *</Label>
                <Input
                  type="password"
                  value={inviteForm.password}
                  onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                  placeholder="Mật khẩu ban đầu"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vai trò *</Label>
                  <Select
                    value={inviteForm.role}
                    onValueChange={(value) => setInviteForm({ ...inviteForm, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Quản lý</SelectItem>
                      <SelectItem value="technical">Kỹ thuật</SelectItem>
                      <SelectItem value="accounting">Kế toán</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Phòng ban</Label>
                  <Select
                    value={inviteForm.department_id}
                    onValueChange={(value) => setInviteForm({ ...inviteForm, department_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phòng ban" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                onClick={handleInviteUser} 
                disabled={inviting}
                className="w-full"
              >
                {inviting ? "Đang tạo..." : "Thêm người dùng"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div 
          onClick={() => setRoleFilter("all")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            roleFilter === "all" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
          }`}
        >
          <div className="text-2xl font-bold text-foreground">{profiles.length}</div>
          <div className="text-sm text-muted-foreground">Tất cả</div>
        </div>
        {['admin', 'manager', 'technical', 'accounting'].map((role) => (
          <div
            key={role}
            onClick={() => setRoleFilter(role)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              roleFilter === role ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
            }`}
          >
            <div className="text-2xl font-bold text-foreground">
              {userRoles.filter(r => r.role === role).length}
            </div>
            <div className="text-sm text-muted-foreground">{roleLabels[role]}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Đang tải...</p>
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có người dùng</h3>
          <p className="text-muted-foreground">
            {searchQuery ? "Không tìm thấy người dùng phù hợp" : "Hãy thêm người dùng đầu tiên"}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Vai trò</th>
                  <th>Phòng ban</th>
                  <th>Ngày tham gia</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.map((profile) => {
                  const userRole = getUserRole(profile.user_id);
                  return (
                    <tr key={profile.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {profile.avatar_url ? (
                              <img 
                                src={profile.avatar_url} 
                                alt={profile.full_name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <User className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{profile.full_name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {profile.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {userRole ? (
                          <span className={roleBadgeColors[userRole.role]}>
                            <Shield className="w-3 h-3 mr-1" />
                            {roleLabels[userRole.role]}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td>
                        {getDepartmentName(profile.department_id) ? (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Building2 className="w-4 h-4" />
                            {getDepartmentName(profile.department_id)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="text-muted-foreground text-sm">
                        {new Date(profile.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <User className="w-4 h-4 mr-2" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Shield className="w-4 h-4 mr-2" />
                              Đổi vai trò
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              Vô hiệu hóa
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
      )}
    </div>
  );
};

export default Users;
