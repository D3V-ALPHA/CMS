import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { GraduationCap, LogOut, User, Moon, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuthStore } from '@/stores/authStore';

interface NavbarProps {
  userRole: 'student' | 'teacher';
}

export function Navbar({ userRole }: NavbarProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white dark:bg-card border-b border-border shadow-sm sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-lg p-2">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">CMS</h1>
              <p className="text-xs text-muted-foreground">
                {userRole === 'teacher' ? 'Teacher Portal' : 'Student Portal'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg">
              <User className="w-4 h-4 text-accent-foreground" />
              <span className="text-sm text-accent-foreground">{user?.email}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="relative"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}