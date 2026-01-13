import { Award, Users, Building2, Globe } from "lucide-react";

const stats = [
  { icon: Building2, value: "10+", label: "Năm kinh nghiệm" },
  { icon: Users, value: "50+", label: "Kỹ sư chuyên gia" },
  { icon: Award, value: "20+", label: "Chứng nhận quốc tế" },
  { icon: Globe, value: "100+", label: "Khách hàng tin dùng" },
];

const AboutSection = () => {
  return (
    <section id="about" className="py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <span className="text-sm font-semibold">Về AquaTech IoT</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Tiên phong công nghệ,
              <span className="text-primary"> phục vụ ngành nước</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              AquaTech IoT là công ty công nghệ hàng đầu chuyên nghiên cứu, sản xuất và triển khai 
              các giải pháp IoT cho ngành nước tại Việt Nam. Với đội ngũ kỹ sư giàu kinh nghiệm 
              và cơ sở vật chất hiện đại, chúng tôi cam kết mang đến những sản phẩm chất lượng 
              cao, đáp ứng tiêu chuẩn quốc tế.
            </p>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Chúng tôi đã triển khai thành công hàng trăm dự án cho các công ty cấp thoát nước, 
              khu công nghiệp, nhà máy sản xuất trên toàn quốc và đang mở rộng ra thị trường 
              Đông Nam Á.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="relative bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl p-8 lg:p-12">
              {/* Main Image Placeholder */}
              <div className="aspect-[4/3] bg-card rounded-2xl shadow-xl overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/5 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4">
                      <Building2 className="w-12 h-12 text-primary" />
                    </div>
                    <p className="text-muted-foreground">Trụ sở & Nhà máy</p>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-4 -left-4 bg-card rounded-2xl p-4 shadow-xl border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <Award className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">ISO 9001:2015</div>
                    <div className="text-sm text-muted-foreground">Chứng nhận quốc tế</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
