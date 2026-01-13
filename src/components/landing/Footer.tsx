import { Link } from "react-router-dom";
import { Droplets, Facebook, Linkedin, Youtube, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Droplets className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl">
                AquaTech<span className="text-accent">IoT</span>
              </span>
            </Link>
            <p className="text-background/70 mb-6 leading-relaxed">
              Công ty công nghệ hàng đầu chuyên nghiên cứu, sản xuất và triển khai 
              các giải pháp IoT cho ngành nước tại Việt Nam.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-lg bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-6">Liên kết nhanh</h4>
            <ul className="space-y-3">
              <li><a href="#solutions" className="text-background/70 hover:text-background transition-colors">Giải pháp</a></li>
              <li><a href="#products" className="text-background/70 hover:text-background transition-colors">Sản phẩm</a></li>
              <li><a href="#about" className="text-background/70 hover:text-background transition-colors">Về chúng tôi</a></li>
              <li><a href="#contact" className="text-background/70 hover:text-background transition-colors">Liên hệ</a></li>
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="font-semibold text-lg mb-6">Giải pháp</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-background/70 hover:text-background transition-colors">Giám sát chất lượng nước</a></li>
              <li><a href="#" className="text-background/70 hover:text-background transition-colors">Đo lường lưu lượng</a></li>
              <li><a href="#" className="text-background/70 hover:text-background transition-colors">Mạng cảm biến IoT</a></li>
              <li><a href="#" className="text-background/70 hover:text-background transition-colors">Nền tảng dữ liệu</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-6">Liên hệ</h4>
            <ul className="space-y-3 text-background/70">
              <li>Tòa nhà ABC, 123 Đường XYZ</li>
              <li>Quận 1, TP. Hồ Chí Minh</li>
              <li className="pt-2">(028) 1234 5678</li>
              <li>info@aquatechiot.vn</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-background/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-background/60 text-sm">
            © 2024 AquaTech IoT. Tất cả quyền được bảo lưu.
          </p>
          <div className="flex items-center gap-6 text-sm text-background/60">
            <a href="#" className="hover:text-background transition-colors">Chính sách bảo mật</a>
            <a href="#" className="hover:text-background transition-colors">Điều khoản sử dụng</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
