import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle, Waves, Cpu, BarChart3 } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center hero-gradient overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="container mx-auto px-4 pt-32 pb-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-white animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-sm font-medium">Công nghệ IoT hàng đầu ngành nước</span>
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Giải pháp 
              <span className="block text-accent">IoT thông minh</span>
              cho ngành nước
            </h1>

            <p className="text-lg text-white/80 mb-8 max-w-xl leading-relaxed">
              Nghiên cứu, sản xuất và triển khai các thiết bị IoT giám sát chất lượng nước, 
              đo lường lưu lượng và quản lý hệ thống cấp thoát nước thông minh.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Button variant="hero" size="xl">
                Khám phá giải pháp
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="heroOutline" size="xl">
                <PlayCircle className="w-5 h-5" />
                Xem demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8">
              <div>
                <div className="text-3xl font-display font-bold text-accent">500+</div>
                <div className="text-sm text-white/60">Dự án triển khai</div>
              </div>
              <div>
                <div className="text-3xl font-display font-bold text-accent">99.9%</div>
                <div className="text-sm text-white/60">Uptime hệ thống</div>
              </div>
              <div>
                <div className="text-3xl font-display font-bold text-accent">24/7</div>
                <div className="text-sm text-white/60">Hỗ trợ kỹ thuật</div>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative hidden lg:block">
            <div className="relative">
              {/* Main Card */}
              <div className="glass-card rounded-3xl p-8 bg-white/10 backdrop-blur-xl border border-white/20">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                        <Waves className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">Trạm giám sát #12</div>
                        <div className="text-sm text-white/60">Hoạt động bình thường</div>
                      </div>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="text-sm text-white/60 mb-1">Lưu lượng</div>
                      <div className="text-2xl font-bold text-white">2,450 m³/h</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="text-sm text-white/60 mb-1">Áp suất</div>
                      <div className="text-2xl font-bold text-white">4.2 bar</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="text-sm text-white/60 mb-1">Chất lượng</div>
                      <div className="text-2xl font-bold text-accent">Tốt</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="text-sm text-white/60 mb-1">pH</div>
                      <div className="text-2xl font-bold text-white">7.2</div>
                    </div>
                  </div>

                  {/* Chart Placeholder */}
                  <div className="h-32 bg-white/5 rounded-xl flex items-end justify-around p-4 gap-2">
                    {[40, 65, 45, 80, 55, 70, 60, 75, 50, 85, 65, 90].map((h, i) => (
                      <div 
                        key={i}
                        className="w-full bg-accent/60 rounded-t"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Cards */}
              <div className="absolute -top-6 -right-6 glass-card rounded-2xl p-4 bg-white/10 backdrop-blur-xl border border-white/20 animate-float">
                <div className="flex items-center gap-3">
                  <Cpu className="w-8 h-8 text-accent" />
                  <div>
                    <div className="text-sm font-semibold text-white">IoT Gateway</div>
                    <div className="text-xs text-white/60">Online</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-6 glass-card rounded-2xl p-4 bg-white/10 backdrop-blur-xl border border-white/20 animate-float" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-accent" />
                  <div>
                    <div className="text-sm font-semibold text-white">Real-time Data</div>
                    <div className="text-xs text-white/60">1,234 điểm đo</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
