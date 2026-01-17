import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, Pencil, X, Plus } from "lucide-react";
import { toast } from "sonner";

export interface Product {
  id: number;
  name: string;
  category: string;
  description: string;
  features: string[];
  highlighted: boolean;
}

interface ProductDetailDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (product: Product) => void;
}

const ProductDetailDialog = ({
  product,
  open,
  onOpenChange,
  onSave,
}: ProductDetailDialogProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState<Product | null>(null);
  const [newFeature, setNewFeature] = useState("");

  const handleEdit = () => {
    setEditedProduct(product);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedProduct(null);
    setIsEditing(false);
  };

  const handleSave = () => {
    if (editedProduct) {
      onSave(editedProduct);
      setIsEditing(false);
      setEditedProduct(null);
      toast.success("Đã lưu thay đổi sản phẩm");
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim() && editedProduct) {
      setEditedProduct({
        ...editedProduct,
        features: [...editedProduct.features, newFeature.trim()],
      });
      setNewFeature("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    if (editedProduct) {
      setEditedProduct({
        ...editedProduct,
        features: editedProduct.features.filter((_, i) => i !== index),
      });
    }
  };

  if (!product) return null;

  const displayProduct = isEditing && editedProduct ? editedProduct : product;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">
              {isEditing ? "Chỉnh sửa sản phẩm" : "Chi tiết sản phẩm"}
            </DialogTitle>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Pencil className="w-4 h-4 mr-2" />
                Chỉnh sửa
              </Button>
            )}
          </div>
          <DialogDescription>
            {isEditing
              ? "Cập nhật thông tin sản phẩm bên dưới"
              : "Xem thông tin chi tiết sản phẩm"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product Image Placeholder */}
          <div className="h-48 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl flex items-center justify-center">
            <div className="w-32 h-32 rounded-2xl bg-white/80 shadow-lg flex items-center justify-center">
              <div className="w-16 h-16 rounded-xl bg-primary/20" />
            </div>
          </div>

          {/* Product Info */}
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên sản phẩm</Label>
                  <Input
                    id="name"
                    value={editedProduct?.name || ""}
                    onChange={(e) =>
                      setEditedProduct((prev) =>
                        prev ? { ...prev, name: e.target.value } : null
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Danh mục</Label>
                  <Input
                    id="category"
                    value={editedProduct?.category || ""}
                    onChange={(e) =>
                      setEditedProduct((prev) =>
                        prev ? { ...prev, category: e.target.value } : null
                      )
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={editedProduct?.description || ""}
                  onChange={(e) =>
                    setEditedProduct((prev) =>
                      prev ? { ...prev, description: e.target.value } : null
                    )
                  }
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="highlighted"
                  checked={editedProduct?.highlighted || false}
                  onCheckedChange={(checked) =>
                    setEditedProduct((prev) =>
                      prev ? { ...prev, highlighted: checked } : null
                    )
                  }
                />
                <Label htmlFor="highlighted">Sản phẩm nổi bật</Label>
              </div>

              {/* Features Editing */}
              <div className="space-y-2">
                <Label>Tính năng</Label>
                <div className="space-y-2">
                  {editedProduct?.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg"
                    >
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
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
                  <Button variant="outline" size="icon" onClick={handleAddFeature}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-primary font-medium mb-1">
                  {displayProduct.category}
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground">
                  {displayProduct.name}
                </h3>
                {displayProduct.highlighted && (
                  <span className="inline-block mt-2 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                    Bán chạy nhất
                  </span>
                )}
              </div>

              <p className="text-muted-foreground">{displayProduct.description}</p>

              <div>
                <h4 className="font-semibold text-foreground mb-3">Tính năng</h4>
                <ul className="space-y-2">
                  {displayProduct.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {isEditing && (
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Hủy
            </Button>
            <Button onClick={handleSave}>Lưu thay đổi</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailDialog;
