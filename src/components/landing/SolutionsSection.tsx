import { Droplets, Gauge, Radio, Cloud, Shield, Zap } from "lucide-react";

const solutions = [
  {
    icon: Droplets,
    title: "Giám sát chất lượng nước",
    description: "Theo dõi liên tục các thông số pH, độ đục, chlorine, DO và nhiều chỉ tiêu khác theo thời gian thực.",
  },
  {
    icon: Gauge,
    title: "Đo lường lưu lượng",
    description: "Hệ thống đo lưu lượng chính xác với công nghệ siêu âm và điện từ, phù hợp mọi kích thước ống.",
  },
  {
    icon: Radio,
    title: "Mạng cảm biến IoT",
    description: "Triển khai mạng lưới cảm biến không dây với khả năng truyền dữ liệu ổn định, tiết kiệm năng lượng.",
  },
  {
    icon: Cloud,
    title: "Nền tảng dữ liệu đám mây",
    description: "Lưu trữ, phân tích và trực quan hóa dữ liệu trên nền tảng cloud an toàn, truy cập mọi lúc mọi nơi.",
  },
  {
    icon: Shield,
    title: "Cảnh báo & Bảo mật",
    description: "Hệ thống cảnh báo tự động khi có sự cố, bảo mật dữ liệu theo tiêu chuẩn quốc tế.",
  },
  {
    icon: Zap,
    title: "Tích hợp SCADA",
    description: "Kết nối seamless với hệ thống SCADA hiện có, hỗ trợ đa giao thức Modbus, OPC-UA, MQTT.",
  },
];

const SolutionsSection = () => {
  return (
    <section id="solutions" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <span className="text-sm font-semibold">Giải pháp toàn diện</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Giải pháp IoT cho ngành nước
          </h2>
          <p className="text-lg text-muted-foreground">
            Cung cấp đầy đủ các giải pháp từ thiết bị phần cứng, phần mềm đến dịch vụ tích hợp,
            đáp ứng mọi nhu cầu quản lý hệ thống nước.
          </p>
        </div>

        {/* Solutions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {solutions.map((solution, index) => (
            <div
              key={index}
              className="group relative bg-card rounded-2xl p-8 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <solution.icon className="w-7 h-7 text-primary" />
              </div>

              {/* Content */}
              <h3 className="font-display text-xl font-bold text-foreground mb-3">
                {solution.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {solution.description}
              </p>

              {/* Hover Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolutionsSection;
