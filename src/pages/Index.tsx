import { ReactNode } from "react";
import { 
  TrendingUp, 
  Shield, 
  Users, 
  PiggyBank,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Wallet,
  Target
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import logo from "@/assets/logo.png";

const FeatureCard = ({ 
  icon, 
  title, 
  description 
}: { 
  icon: ReactNode; 
  title: string; 
  description: string; 
}) => (
  <Card variant="elevated" className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
    <CardContent className="p-6">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
        {icon}
      </div>
      <h3 className="font-display text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </CardContent>
  </Card>
);

const StatCard = ({ value, label }: { value: string; label: string }) => (
  <div className="text-center">
    <div className="font-display text-4xl md:text-5xl font-bold text-accent mb-2">{value}</div>
    <div className="text-primary-foreground/70 text-sm">{label}</div>
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center gradient-hero overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/50 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 pt-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 bg-accent/20 rounded-full px-4 py-2 mb-6">
                <Shield className="w-4 h-4 text-accent" />
                <span className="text-sm text-primary-foreground/90">Trusted by 10+ members</span>
              </div>
              
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight text-balance">
                Building Wealth{" "}
                <span className="text-accent">Together</span>
              </h1>
              
              <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl leading-relaxed">
                Virtuous Deca Investment empowers members to grow their savings, access loans, 
                and achieve financial security through disciplined collective investment.
              </p>

              <div className="flex flex-wrap gap-4 mb-12">
                <Button asChild variant="gold" size="xl">
                  <Link to="/login">
                    Start Investing
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline-light" size="xl">
                  <Link to="/about">Learn More</Link>
                </Button>
              </div>

              <div className="flex flex-wrap gap-6">
                {["Minimum KES 2,000/month", "Flexible Loans", "Full Transparency"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-primary-foreground/80">
                    <CheckCircle2 className="w-5 h-5 text-accent" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:flex justify-center animate-float">
              <div className="relative">
                <div className="absolute inset-0 bg-accent/20 rounded-3xl blur-2xl scale-90" />
                <Card variant="glass" className="relative p-8 backdrop-blur-xl border-primary-foreground/10">
                  <div className="flex items-center gap-4 mb-6">
                    <img src={logo} alt="Logo" className="w-16 h-16" />
                    <div>
                      <h3 className="font-display text-xl font-semibold text-primary-foreground">Investment Summary</h3>
                      <p className="text-primary-foreground/60 text-sm">October 2024 - Present</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 rounded-xl bg-primary-foreground/5">
                      <span className="text-primary-foreground/70">Total Invested</span>
                      <span className="font-display text-2xl font-bold text-accent">KES 240,000</span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-xl bg-primary-foreground/5">
                      <span className="text-primary-foreground/70">Members Active</span>
                      <span className="font-display text-2xl font-bold text-primary-foreground">10</span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-xl bg-primary-foreground/5">
                      <span className="text-primary-foreground/70">Loans Issued</span>
                      <span className="font-display text-2xl font-bold text-primary-foreground">5</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
              fill="hsl(45, 30%, 97%)"
            />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 gradient-primary -mt-1">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard value="KES 5M+" label="Target Investment" />
            <StatCard value="10+" label="Active Members" />
            <StatCard value="98%" label="Collection Rate" />
            <StatCard value="5%" label="Loan Interest" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Why Choose Virtuous Deca?
            </h2>
            <p className="text-muted-foreground text-lg">
              Our platform provides everything you need to manage investments, track loans, 
              and achieve your financial goals together.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<PiggyBank className="w-6 h-6 text-primary" />}
              title="Monthly Contributions"
              description="Build your investment with a minimum of KES 2,000 monthly. Track your progress and never miss a payment."
            />
            <FeatureCard 
              icon={<Wallet className="w-6 h-6 text-primary" />}
              title="Flexible Loans"
              description="Access loans based on your contributions. Clear terms, fair interest rates, and easy repayment tracking."
            />
            <FeatureCard 
              icon={<Users className="w-6 h-6 text-primary" />}
              title="Guarantorship System"
              description="Support fellow members with guarantorship. Full visibility on who you've guaranteed and their repayment status."
            />
            <FeatureCard 
              icon={<BarChart3 className="w-6 h-6 text-primary" />}
              title="Real-time Analytics"
              description="Beautiful dashboards showing your investments, arrears, and the group's collective progress toward targets."
            />
            <FeatureCard 
              icon={<Target className="w-6 h-6 text-primary" />}
              title="Goal Tracking"
              description="See exactly where the group stands against investment targets with clear visual progress indicators."
            />
            <FeatureCard 
              icon={<Shield className="w-6 h-6 text-primary" />}
              title="Secure & Transparent"
              description="Role-based access ensures data integrity. Full audit trails for complete accountability."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
              Ready to Start Your Investment Journey?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8">
              Join Virtuous Deca Investment today and take the first step toward financial security.
            </p>
            <Button asChild variant="gold" size="xl">
              <Link to="/login">
                Access Your Dashboard
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-forest-dark py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Virtuous Deca Investment" className="h-10 w-10" />
              <div>
                <h3 className="font-display text-lg font-semibold text-primary-foreground">
                  Virtuous Deca Investment
                </h3>
                <p className="text-primary-foreground/60 text-sm">
                  Building wealth together since 2024
                </p>
              </div>
            </div>
            <p className="text-primary-foreground/60 text-sm">
              © 2024 Virtuous Deca Investment. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
