import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Package,
  Star,
  X,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  description: string | null;
  features: string[];
  highlighted: boolean;
  image_url: string | null;
  price: number | null;
  created_at: string;
}

const PRODUCT_IMAGE_BUCKET = "product-images";

const Products = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productToRemoveImage, setProductToRemoveImage] = useState<Product | null>(null);
  const [newFeature, setNewFeature] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    features: [] as string[],
    highlighted: false,
    price: "",
  });

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Lỗi tải danh sách sản phẩm");
      console.error(error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      description: "",
      features: [],
      highlighted: false,
      price: "",
    });
    setNewFeature("");
    setImageFile(null);
    setImagePreviewUrl(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      description: product.description || "",
      features: product.features || [],
      highlighted: product.highlighted,
      price: product.price?.toString() || "",
    });
    setImageFile(null);
    setImagePreviewUrl(product.image_url);
    setDialogOpen(true);
  };

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    if (!file) {
      setImagePreviewUrl(editingProduct?.image_url ?? null);
      return;
    }

    setImagePreviewUrl((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return prev;
    });
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
  };

  const getStoragePathFromPublicUrl = (publicUrl: string) => {
    // Expected format: .../storage/v1/object/public/<bucket>/<path>
    const marker = `/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return null;
    const path = publicUrl.slice(idx + marker.length);
    return path || null;
  };

  const removeProductImage = async (product: Product) => {
    if (!product.image_url) {
      toast.error("Sản phẩm chưa có ảnh");
      return;
    }

    try {
      const path = getStoragePathFromPublicUrl(product.image_url);
      if (!path) {
        toast.error("Không xác định được đường dẫn ảnh để xóa");
        return;
      }

      const { error: removeError } = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .remove([path]);
      if (removeError) throw removeError;

      const { error: dbError } = await supabase
        .from("products")
        .update({ image_url: null })
        .eq("id", product.id);
      if (dbError) throw dbError;

      // Reset local preview (if currently editing the same product)
      if (editingProduct?.id === product.id) {
        setImageFile(null);
        setImagePreviewUrl(null);
      }

      toast.success("Đã xóa ảnh sản phẩm");
      setProductToRemoveImage(null);
      fetchProducts();
    } catch (e) {
      console.error(e);
      toast.error("Xóa ảnh thất bại");
    }
  };

  const uploadProductImage = async (productId: string, file: File) => {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const safeExt = ext.replace(/[^a-z0-9]/g, "");
    const path = `products/${productId}/${Date.now()}.${safeExt || "jpg"}`;

    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .upload(path, file, {
        upsert: true,
        contentType: file.type || undefined,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.category) {
      toast.error("Vui lòng nhập tên và danh mục sản phẩm");
      return;
    }

    const productData = {
      name: formData.name,
      category: formData.category,
      description: formData.description || null,
      features: formData.features,
      highlighted: formData.highlighted,
      price: formData.price ? parseFloat(formData.price) : null,
      created_by: user?.id,
    };

    if (editingProduct) {
      const { error } = await supabase
        .from("products")
        .update(productData)
        .eq("id", editingProduct.id);

      if (error) {
        toast.error("Lỗi cập nhật sản phẩm");
        console.error(error);
      } else {
        if (imageFile) {
          try {
            const publicUrl = await uploadProductImage(editingProduct.id, imageFile);
            const { error: imageError } = await supabase
              .from("products")
              .update({ image_url: publicUrl })
              .eq("id", editingProduct.id);
            if (imageError) throw imageError;
          } catch (e) {
            console.error(e);
            toast.error("Upload ảnh thất bại");
            return;
          }
        }
        toast.success("Đã cập nhật sản phẩm");
        setDialogOpen(false);
        fetchProducts();
      }
    } else {
      const { data: created, error } = await supabase
        .from("products")
        .insert(productData)
        .select("*")
        .single();

      if (error) {
        toast.error("Lỗi thêm sản phẩm");
        console.error(error);
      } else {
        if (imageFile && created?.id) {
          try {
            const publicUrl = await uploadProductImage(created.id, imageFile);
            const { error: imageError } = await supabase
              .from("products")
              .update({ image_url: publicUrl })
              .eq("id", created.id);
            if (imageError) throw imageError;
          } catch (e) {
            console.error(e);
            toast.error("Upload ảnh thất bại");
            // vẫn tạo sản phẩm thành công, nên không return
          }
        }
        toast.success("Đã thêm sản phẩm mới");
        setDialogOpen(false);
        fetchProducts();
      }
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productToDelete.id);

    if (error) {
      toast.error("Lỗi xóa sản phẩm");
      console.error(error);
    } else {
      toast.success("Đã xóa sản phẩm");
      setProductToDelete(null);
      fetchProducts();
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quản lý sản phẩm</h1>
          <p className="text-muted-foreground">
            Quản lý danh sách sản phẩm hiển thị trên website
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm sản phẩm
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm sản phẩm..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products Table */}
      <div className="bg-card rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Tính năng</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead className="text-center">Nổi bật</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">Chưa có sản phẩm nào</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {product.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {product.features?.slice(0, 2).map((f, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {f}
                        </Badge>
                      ))}
                      {(product.features?.length || 0) > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{product.features.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.price
                      ? new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(product.price)
                      : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {product.highlighted && (
                      <Star className="w-4 h-4 text-yellow-500 mx-auto fill-yellow-500" />
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEdit(product)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setProductToDelete(product)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Cập nhật thông tin sản phẩm"
                : "Nhập thông tin sản phẩm mới"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên sản phẩm *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="VD: AquaSense Pro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Danh mục *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, category: e.target.value }))
                  }
                  placeholder="VD: Cảm biến"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Mô tả ngắn về sản phẩm..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Ảnh sản phẩm</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
              />
              {imagePreviewUrl && (
                <div className="mt-2 overflow-hidden rounded-lg border bg-muted/20">
                  <img
                    src={imagePreviewUrl}
                    alt="Ảnh sản phẩm"
                    className="h-44 w-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              {editingProduct?.image_url && !imageFile && (
                <div className="pt-1">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setProductToRemoveImage(editingProduct)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Xóa ảnh
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Hỗ trợ JPG/PNG/WebP. Ảnh sẽ hiển thị trên Landing page.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Giá (VNĐ)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, price: e.target.value }))
                  }
                  placeholder="0"
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="highlighted"
                  checked={formData.highlighted}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, highlighted: checked }))
                  }
                />
                <Label htmlFor="highlighted">Sản phẩm nổi bật</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tính năng</Label>
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg"
                  >
                    <span className="flex-1 text-sm">{feature}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveFeature(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Thêm tính năng mới..."
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddFeature()}
                />
                <Button variant="outline" onClick={handleAddFeature}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSubmit}>
              {editingProduct ? "Cập nhật" : "Thêm sản phẩm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!productToDelete}
        onOpenChange={() => setProductToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa sản phẩm</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa sản phẩm "{productToDelete?.name}"? Hành
              động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Image Confirmation */}
      <AlertDialog
        open={!!productToRemoveImage}
        onOpenChange={() => setProductToRemoveImage(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa ảnh</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa ảnh của sản phẩm "{productToRemoveImage?.name}"?
              Ảnh sẽ bị gỡ khỏi hệ thống lưu trữ và không thể khôi phục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                productToRemoveImage && removeProductImage(productToRemoveImage)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa ảnh
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Products;
