import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Megaphone, Settings, UserCircle, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/app', end: true },
    { label: 'Campaigns', icon: Megaphone, path: '/app/campaigns' },
    { label: 'Settings', icon: Settings, path: '/app/settings' },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden bg-deep-void">
      {/* Mobile Sidebar Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Persistent SideNavBar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 256 : isMobile ? 0 : 80,
          x: isMobile && !isSidebarOpen ? -256 : 0
        }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className={cn(
          "fixed left-0 top-0 h-full bg-charcoal-ink border-r border-[rgba(255,255,255,0.08)] flex flex-col p-4 z-50 overflow-hidden whitespace-nowrap",
          isMobile ? "" : "relative"
        )}
      >
        <div className="flex items-center justify-between mb-8">
          <AnimatePresence mode="popLayout">
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="px-2"
              >
                <h1 className="text-2xl font-bold text-primary font-cabinet tracking-tight">Velora</h1>
                <p className="text-xs text-muted-steel tracking-widest uppercase mt-1">Automation Engine</p>
              </motion.div>
            )}
          </AnimatePresence>
          {!isMobile && (
            <button 
              onClick={toggleSidebar}
              className={cn(
                "p-2 rounded-lg text-muted-steel hover:bg-[rgba(255,255,255,0.05)] hover:text-white transition-colors",
                !isSidebarOpen && "mx-auto"
              )}
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          {isMobile && isSidebarOpen && (
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-lg text-muted-steel hover:bg-[rgba(255,255,255,0.05)] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="flex-1 flex flex-col space-y-2 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => isMobile && setIsSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center px-4 py-3 space-x-3 rounded-lg transition-all duration-150',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-steel hover:bg-[rgba(255,255,255,0.03)] hover:text-on-surface',
                  !isSidebarOpen && !isMobile && "justify-center px-0"
                )
              }
              title={!isSidebarOpen && !isMobile ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <item.icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                  <AnimatePresence>
                    {isSidebarOpen && (
                      <motion.span 
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="text-sm font-medium overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-[rgba(255,255,255,0.08)]">
          <div className={cn(
            "flex items-center px-2", 
            isSidebarOpen ? "space-x-3" : "justify-center px-0"
          )}>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 shadow-sm">
              <UserCircle className="w-5 h-5 text-primary" />
            </div>
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden"
                >
                  <p className="text-sm font-medium text-on-surface truncate">Admin Console</p>
                  <p className="text-[10px] text-muted-steel truncate uppercase tracking-widest mt-0.5">Pro Account</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Canvas */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-deep-void relative min-w-0">
        {/* Mobile Header Toolbar */}
        {isMobile && (
          <div className="h-16 flex items-center px-4 bg-charcoal-ink border-b border-[rgba(255,255,255,0.08)] shrink-0 absolute top-0 left-0 right-0 z-10 lg:hidden">
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-lg text-muted-steel hover:bg-[rgba(255,255,255,0.05)] hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="ml-4 font-cabinet font-bold text-lg text-zinc-50">Velora</div>
          </div>
        )}
        <div className={cn("flex-1 overflow-hidden", isMobile && "mt-16")}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
