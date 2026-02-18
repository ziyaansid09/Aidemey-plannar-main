import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Brain, Calendar, BookOpen, Sparkles, FileText, LogOut, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const { signOut, user } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/planner', label: 'Planner', icon: Calendar },
    { path: '/subjects', label: 'Subjects', icon: BookOpen },
    { path: '/ai-suggest', label: 'AI Suggest', icon: Sparkles },
    { path: '/notes', label: 'Notes', icon: FileText },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="glass border-b border-border sticky top-0 z-50 backdrop-blur-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:block">AI Study Planner</span>
          </Link>

          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive(item.path) ? 'default' : 'ghost'}
                    size="sm"
                    className="gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden md:inline">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
