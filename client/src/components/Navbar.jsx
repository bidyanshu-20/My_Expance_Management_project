import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, User, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import axios from 'axios';

const BASE_URL = "/api";

const Navbar = ({ user: propUser, onLogout }) => {
    const navigate = useNavigate();
    const menuRef = useRef(null);
    const [menuOpen, setMenuOpen] = useState(false);
    // const [darkMode, setdarkMode] = useState(false);

    const { darkMode, toggleDarkMode } = useTheme();
    // Use propUser if passed, otherwise fallback
    const user = propUser || {
        name: "",
        email: "",
    };

    const toggleMenu = () => {
        setMenuOpen((prev) => !prev);
    };

    // Fetch user data if not provided via props
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token || propUser) return; // Skip if user is already passed via props

                const response = await axios.get(`${BASE_URL}/user/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                // You can set user state here if needed in future
                console.log("User fetched:", response.data);
            } catch (error) {
                console.log("Failed to load user data:", error);
            }
        };

        fetchUserData();
    }, [propUser]);

    const handleLogout = () => {
        setMenuOpen(false);
        localStorage.removeItem("token");
        onLogout?.();
        navigate("/login");
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="bg-white border-b text-black border-gray-200 dark:bg-black dark:text-white  shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                {/* Logo */}
                <div
                    className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => navigate("/")}
                >
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">₹</span>
                    </div>
                    <span className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                        Expense Tracker
                    </span>
                </div>

                {/* // dark theme */}


                <button
                    onClick={toggleDarkMode}
                    className="hidden md:block p-2.5 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                    aria-label="Toggle dark mode"
                >
                    {darkMode ? (
                        <Sun className="w-5 h-5 text-yellow-400" />
                    ) : (
                        <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    )}
                </button>



                {/* User Menu */}
                {user && (
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={toggleMenu}
                            className="flex items-center gap-3 px-4 py-2 rounded-2xl hover:bg-gray-100  dark:hover:bg-black transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-semibold text-lg shadow-md">
                                    {user?.name?.[0]?.toUpperCase() || "U"}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                            </div>

                            <div className="hidden md:block text-left">
                                <p className="text-sm font-semibold text-gray-900  dark:text-white">
                                    {user?.name || "User"}
                                </p>
                                <p className="text-xs  text-gray-500 -mt-0.5">
                                    {user?.email || "user@example.com"}
                                </p>
                            </div>

                            <ChevronDown
                                className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {/* Dropdown Menu */}
                        {menuOpen && (
                            <div className="absolute right-0 mt-3 w-80 rounded-3xl shadow-2xl border bg-white dark:bg-gray-800 border-gray-100 py-2 z-50 overflow-hidden">
                                {/* Dropdown Header */}
                                <div className="px-6 py-5 border-b border-gray-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-inner">
                                            {user?.name?.[0]?.toUpperCase() || "U"}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-lg text-gray-900 dark:text-white ">
                                                {user?.name || "User"}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {user?.email || "user@example.com"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Menu Items */}
                                <div className="py-2">
                                    <button
                                        onClick={() => {
                                            setMenuOpen(false);
                                            navigate("/profile");
                                        }}
                                        className="w-full px-6 py-3 flex items-center gap-3 hover:bg-gray-50 text-left transition-colors"
                                    >
                                        <User className="w-5 h-5 text-gray-600" />
                                        <span className="text-gray-700 font-medium">My Profile</span>
                                    </button>
                                </div>

                                <div className="border-t border-gray-100 my-1"></div>

                                <button
                                    onClick={handleLogout}
                                    className="w-full px-6 py-3 flex items-center gap-3 hover:bg-red-50 text-left transition-colors group"
                                >
                                    <LogOut className="w-5 h-5 text-red-500 group-hover:text-red-600" />
                                    <span className="text-red-600 font-medium group-hover:text-red-700">Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};

export default Navbar;