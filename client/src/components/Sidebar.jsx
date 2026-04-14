import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
    Home, ArrowUp, ArrowDown, User, LogOut, 
    HelpCircle, Menu, X, ChevronLeft 
} from 'lucide-react';

const MENU_ITEMS = [
    { text: "Dashboard", path: "/", icon: <Home size={20} /> },
    { text: "Income", path: "/income", icon: <ArrowUp size={20} /> },
    { text: "Expenses", path: "/expense", icon: <ArrowDown size={20} /> },
    { text: "Profile", path: "/profile", icon: <User size={20} /> },
];

const Sidebar = ({ user, isCollapsed, setIsCollapsed }) => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const sidebarRef = useRef(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    const { name: username = "User", email = "user@example.com" } = user || {};
    const initial = username.charAt(0).toUpperCase();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (mobileOpen && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
                setMobileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [mobileOpen]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const toggleSidebar = () => setIsCollapsed((prev) => !prev);

    const isActive = (path) => pathname === path;

    const sidebarWidth = isCollapsed ? 80 : 280;

    return (
        <>
            {/* Desktop Sidebar */}
            <motion.div
                ref={sidebarRef}
                animate={{ width: sidebarWidth }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="hidden lg:flex h-screen bg-white border-r border-gray-200 flex-col fixed left-0 top-0 z-40 shadow-xl overflow-hidden"
            >
                {/* ... (Header, User Profile, Menu, Footer - same as before) */}
                <div className="flex  dark:text-zinc-400 dark:bg-black flex-col h-full">
                    {/* Header */}
                    <div className="p-5 flex items-center justify-between border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center">
                                <span className="text-white font-bold text-2xl">₹</span>
                            </div>
                            {!isCollapsed && (
                                <span className="font-semibold text-xl text-gray-900 tracking-tight">
                                    ExpenseTracker
                                </span>
                            )}
                        </div>

                        <button
                            onClick={toggleSidebar}
                            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            <ChevronLeft 
                                size={20} 
                                className={`text-gray-600 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} 
                            />
                        </button>
                    </div>

                    {/* User Profile */}
                    <div className="p-5 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-md flex-shrink-0">
                                {initial}
                            </div>
                            {!isCollapsed && (
                                <div className="overflow-hidden min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">{username}</h3>
                                    <p className="text-xs text-gray-500 truncate">{email}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Menu */}
                    <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
                        <ul className="space-y-1">
                            {MENU_ITEMS.map(({ text, path, icon }) => (
                                <motion.li key={text} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Link
                                        to={path}
                                        className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200
                                            ${isActive(path) 
                                                ? 'bg-indigo-50 text-indigo-700' 
                                                : 'text-gray-700 hover:bg-gray-100'
                                            } ${isCollapsed ? 'justify-center' : ''}`}
                                    >
                                        <span className={isActive(path) ? 'text-indigo-600' : 'text-gray-500'}>
                                            {icon}
                                        </span>
                                        {!isCollapsed && <span>{text}</span>}
                                    </Link>
                                </motion.li>
                            ))}
                        </ul>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-100 mt-auto">
                        <div className="space-y-1">
                            <Link 
                                to="https://www.hexagondigitalservices.com/contact"
                                target="_blank"
                                className={`flex items-center gap-4 px-5 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors ${isCollapsed ? 'justify-center' : ''}`}
                            >
                                <HelpCircle size={20} />
                                {!isCollapsed && <span>Support</span>}
                            </Link>

                            <button 
                                onClick={handleLogout}
                                className={`flex items-center gap-4 px-5 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-2xl transition-colors w-full ${isCollapsed ? 'justify-center' : ''}`}
                            >
                                <LogOut size={20} />
                                {!isCollapsed && <span>Logout</span>}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Mobile Menu Button + Mobile Sidebar (unchanged) */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 w-11 h-11 bg-white shadow-lg rounded-2xl flex items-center justify-center border border-gray-200"
            >
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                            onClick={() => setMobileOpen(false)}
                        />
                        {/* Mobile Sidebar content - same as previous version */}
                        {/* ... (keep the mobile sidebar code from previous response) */}
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Sidebar;