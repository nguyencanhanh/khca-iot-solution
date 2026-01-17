-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  features TEXT[] DEFAULT '{}',
  highlighted BOOLEAN DEFAULT false,
  image_url TEXT,
  price NUMERIC(12,2),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public can view products
CREATE POLICY "Anyone can view products"
  ON public.products
  FOR SELECT
  USING (true);

-- Only admin/manager can insert products
CREATE POLICY "Admin and manager can insert products"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- Only admin/manager can update products
CREATE POLICY "Admin and manager can update products"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_manager(auth.uid()));

-- Only admin/manager can delete products
CREATE POLICY "Admin and manager can delete products"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_manager(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample products
INSERT INTO public.products (name, category, description, features, highlighted) VALUES
  ('AquaSense Pro', 'Cảm biến đa thông số', 'Đo pH, DO, độ đục, nhiệt độ trong một thiết bị compact.', ARRAY['IP68 chống nước', 'Pin 2 năm', 'LoRa/NB-IoT', 'Auto-calibration'], false),
  ('FlowMaster 5000', 'Đồng hồ đo lưu lượng', 'Đồng hồ siêu âm chính xác cao cho ống DN50-DN2000.', ARRAY['Độ chính xác ±0.5%', 'Không tiếp xúc', 'Data logging 1 năm', 'RS485/Modbus'], true),
  ('IoT Gateway G4', 'Thiết bị trung tâm', 'Gateway công nghiệp kết nối đa giao thức, xử lý edge computing.', ARRAY['4G/LTE/WiFi/Ethernet', 'Edge AI', '128 thiết bị', '99.99% uptime'], false);