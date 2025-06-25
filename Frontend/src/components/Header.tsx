import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { FileText, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            ResumeAI
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-8">
          <Link 
            to="/builder" 
            className={`transition-colors hover:text-primary ${
              isActive('/builder') ? 'text-primary font-medium' : 'text-gray-600'
            }`}
          >
            Resume Builder
          </Link>
          <Link 
            to="/templates" 
            className={`transition-colors hover:text-primary ${
              isActive('/templates') ? 'text-primary font-medium' : 'text-gray-600'
            }`}
          >
            Templates
          </Link>
          <Link 
            to="/dashboard" 
            className={`transition-colors hover:text-primary ${
              isActive('/dashboard') ? 'text-primary font-medium' : 'text-gray-600'
            }`}
          >
            Dashboard
          </Link>
        </nav>
        
        <div className="hidden md:flex items-center space-x-4">
          <ThemeToggle />
          <Button variant="ghost" size="sm">
            <User className="w-4 h-4 mr-2" />
            Sign In
          </Button>
          <Link to="/builder">
            <Button size="sm" className="gradient-primary text-white border-0 hover:opacity-90">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center space-x-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <Link 
              to="/builder" 
              className={`block transition-colors hover:text-primary ${
                isActive('/builder') ? 'text-primary font-medium' : 'text-gray-600'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Resume Builder
            </Link>
            <Link 
              to="/templates" 
              className={`block transition-colors hover:text-primary ${
                isActive('/templates') ? 'text-primary font-medium' : 'text-gray-600'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Templates
            </Link>
            <Link 
              to="/dashboard" 
              className={`block transition-colors hover:text-primary ${
                isActive('/dashboard') ? 'text-primary font-medium' : 'text-gray-600'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <div className="flex flex-col space-y-2 pt-4 border-t">
              <Button variant="ghost" size="sm" className="justify-start">
                <User className="w-4 h-4 mr-2" />
                Sign In
              </Button>
              <Link to="/builder" onClick={() => setIsMobileMenuOpen(false)}>
                <Button size="sm" className="w-full gradient-primary text-white border-0 hover:opacity-90">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
