import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

type UserRole = "member" | "treasurer" | "admin";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Demo credentials for testing
  const demoUsers: Record<string, { password: string; role: UserRole; name: string }> = {
    "member@virtuous.co.ke": { password: "member123", role: "member", name: "John Mwangi" },
    "treasurer@virtuous.co.ke": { password: "treasurer123", role: "treasurer", name: "Mary Wanjiku" },
    "admin@virtuous.co.ke": { password: "admin123", role: "admin", name: "Peter Ochieng" },
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const user = demoUsers[email.toLowerCase()];
    
    if (user && user.password === password) {
      // Store user info in localStorage (will be replaced with proper auth)
      localStorage.setItem("user", JSON.stringify({ 
        email, 
        role: user.role, 
        name: user.name 
      }));
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.name}`,
      });

      // Redirect based on role
      switch (user.role) {
        case "admin":
          navigate("/admin");
          break;
        case "treasurer":
          navigate("/treasurer");
          break;
        default:
          navigate("/dashboard");
      }
    } else {
      toast({
        title: "Login failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const handleDemoLogin = (role: UserRole) => {
    const emails: Record<UserRole, string> = {
      member: "member@virtuous.co.ke",
      treasurer: "treasurer@virtuous.co.ke",
      admin: "admin@virtuous.co.ke",
    };
    const passwords: Record<UserRole, string> = {
      member: "member123",
      treasurer: "treasurer123",
      admin: "admin123",
    };
    setEmail(emails[role]);
    setPassword(passwords[role]);
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/50 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-3">
            <img src={logo} alt="Virtuous Deca Investment" className="w-20 h-20" />
            <div>
              <h1 className="font-display text-2xl font-bold text-primary-foreground">
                Virtuous Deca Investment
              </h1>
              <p className="text-primary-foreground/70 text-sm">
                Building Wealth Together
              </p>
            </div>
          </Link>
        </div>

        <Card variant="elevated" className="backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access your investment dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="gold"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Demo Logins */}
            <div className="mt-8 pt-6 border-t">
              <p className="text-center text-sm text-muted-foreground mb-4">
                Quick access for demo
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin("member")}
                  className="text-xs"
                >
                  Member
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin("treasurer")}
                  className="text-xs"
                >
                  Treasurer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin("admin")}
                  className="text-xs"
                >
                  Admin
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center mt-6 text-primary-foreground/70 text-sm">
          Don't have an account?{" "}
          <Link to="/contact" className="text-accent hover:underline font-medium">
            Contact the Treasurer
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
