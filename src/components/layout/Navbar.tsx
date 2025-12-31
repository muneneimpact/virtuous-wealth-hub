import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const Navbar = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isHome ? "bg-transparent" : "bg-card/95 backdrop-blur-md shadow-sm"
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img 
              src={logo} 
              alt="Virtuous Deca Investment" 
              className="h-12 w-12 object-contain"
            />
            <div className="hidden sm:block">
              <h1 className={`font-display text-lg font-semibold ${
                isHome ? "text-primary-foreground" : "text-foreground"
              }`}>
                Virtuous Deca
              </h1>
              <p className={`text-xs ${
                isHome ? "text-primary-foreground/70" : "text-muted-foreground"
              }`}>
                Investment Group
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link 
              to="/" 
              className={`text-sm font-medium transition-colors hover:text-accent ${
                isHome ? "text-primary-foreground/90" : "text-muted-foreground"
              }`}
            >
              Home
            </Link>
            <Link 
              to="/about" 
              className={`text-sm font-medium transition-colors hover:text-accent ${
                isHome ? "text-primary-foreground/90" : "text-muted-foreground"
              }`}
            >
              About
            </Link>
            <Link 
              to="/contact" 
              className={`text-sm font-medium transition-colors hover:text-accent ${
                isHome ? "text-primary-foreground/90" : "text-muted-foreground"
              }`}
            >
              Contact
            </Link>
          </div>

          {/* CTA Button */}
          <div className="flex items-center gap-3">
            <Button 
              asChild 
              variant={isHome ? "outline-light" : "outline"}
              size="sm"
            >
              <Link to="/login">Sign In</Link>
            </Button>
            <Button 
              asChild 
              variant="gold"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <Link to="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
