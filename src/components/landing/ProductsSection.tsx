import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ProductDetailDialog, { Product } from "./ProductDetailDialog";

const ProductsSection = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("highlighted", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching products:", error);
      } else {
        // Map database products to component format
        const mappedProducts: Product[] = (data || []).map((p, index) => ({
          id: index + 1,
          dbId: p.id,
          name: p.name,
          category: p.category,
          description: p.description || "",
          features: p.features || [],
          highlighted: p.highlighted,
          imageUrl: p.image_url,
        }));
        setProducts(mappedProducts);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  const handleViewDetail = (product: Product) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleSaveProduct = (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    setSelectedProduct(updatedProduct);
  };

  if (loading) {
    return (
      <section id="products" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">Đang tải sản phẩm...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="products" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent mb-6">
            <span className="text-sm font-semibold">Sản phẩm nổi bật</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Thiết bị IoT chất lượng cao
          </h2>
          <p className="text-lg text-muted-foreground">
            Được nghiên cứu và sản xuất với tiêu chuẩn công nghiệp, 
            đảm bảo hoạt động ổn định trong mọi điều kiện môi trường.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className={`relative bg-card rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-xl ${
                product.highlighted 
                  ? 'border-primary shadow-glow' 
                  : 'border-border/50 hover:border-primary/30'
              }`}
            >
              {/* Highlighted Badge */}
              {product.highlighted && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                  Bán chạy nhất
                </div>
              )}

              {/* Product Image */}
              {product.imageUrl ? (
                <div className="h-48 overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={`Ảnh sản phẩm ${product.name}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-2xl bg-white/80 shadow-lg flex items-center justify-center">
                    <div className="w-16 h-16 rounded-xl bg-primary/20" />
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                <div className="text-sm text-primary font-medium mb-2">
                  {product.category}
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground mb-3">
                  {product.name}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {product.description}
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {product.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button 
                  variant={product.highlighted ? "default" : "outline"} 
                  className="w-full"
                  onClick={() => handleViewDetail(product)}
                >
                  Xem chi tiết
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Detail Dialog */}
      <ProductDetailDialog
        product={selectedProduct}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveProduct}
      />
    </section>
  );
};

export default ProductsSection;
