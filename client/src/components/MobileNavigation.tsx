import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, BarChart2, Calendar, Settings, Users, GitBranch, User, HelpCircle, Brain, UserCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const MobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

  const navItems = [
    { name: 'Dashboard', icon: <Home className="h-5 w-5" />, path: '/dashboard' },
    { name: 'Integrations', icon: <GitBranch className="h-5 w-5" />, path: '/integrations' },
    { name: 'Service Profiles', icon: <UserCircle className="h-5 w-5" />, path: '/profiles' },
    { name: 'AI Insights', icon: <Brain className="h-5 w-5" />, path: '/ai-insights' },
    { name: 'Summaries', icon: <BarChart2 className="h-5 w-5" />, path: '/summaries' },
    { name: 'Team', icon: <Users className="h-5 w-5" />, path: '/team' },
    { name: 'Account', icon: <User className="h-5 w-5" />, path: '/account' },
    { name: 'Settings', icon: <Settings className="h-5 w-5" />, path: '/settings' },
    { name: 'Support', icon: <HelpCircle className="h-5 w-5" />, path: '/support' },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button 
        onClick={toggleMenu}
        className="lg:hidden fixed bottom-6 right-6 z-50 p-3 bg-primary text-white rounded-full shadow-lg"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile navigation overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={toggleMenu}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-900 shadow-xl z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-lg font-semibold">Daily Team Whisper</h2>
                </div>
                <nav className="flex-1 overflow-y-auto p-4">
                  <ul className="space-y-2">
                    {navItems.map((item) => (
                      <li key={item.name}>
                        <Link
                          to={item.path}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                            location.pathname === item.path
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                          onClick={toggleMenu}
                        >
                          {item.icon}
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                  <button 
                    className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm"
                    onClick={toggleMenu}
                  >
                    Close Menu
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};