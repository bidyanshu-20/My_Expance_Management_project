import React, { useEffect, useState } from 'react'
import { navbarStyles } from '../assets/dummyStyles';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { User,LogOut } from 'lucide-react';
import axios from 'axios';



const BASE_URL = "/api";

const Navbar = ({ user: propUser, onLogout }) => {
    const navigate = useNavigate();
    const menuRef = useRef();
    const [menuOpen, setMenuOpen] = useState(false);
    // const [user,setUser] = useState(null);
    const user = propUser || {
        name: "",
        email: "",
    }

    const toggleMenu = () => {
        setMenuOpen((prev) => !prev);
    }
    // fetchUSERDATA
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    return;
                }
                const response = await axios.get(`${BASE_URL}/user/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const userData = response.data.user || (response).data;
                SpeechSynthesisUtterance()
            } catch (error) {
                console.log("Failed to load Profile page.", error);
            }
        }
    })
    const handleLogout = () => {
        setMenuOpen(false);
        localStorage.removeItem("token");
        onLogout?.();
        navigate("/login");
    }
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
        <header className={navbarStyles.header}>
            <div className={navbarStyles.container}>
                <div className={navbarStyles.logoContainer} onClick={() => navigate("/")}>

                    <div className={navbarStyles.logoImage}>
                        <img src="https://github.com/HexagonDigitalServices/ExpenseTracker/blob/main/frontend/src/assets/logo.png?raw=true" alt="logo" />
                    </div>
                    <span className={navbarStyles.logoText}>Expense Tracker</span>
                </div>
                {/* // if the user is present */}
                {user && (
                    <div className={navbarStyles.userContainer} ref={menuRef}>
                        <button onClick={toggleMenu} className={navbarStyles.userButton}>
                            <div className='relative'>
                                <div className={navbarStyles.userAvatar}>
                                    {user?.name?.[0]?.toUpperCase() || "U"}
                                </div>
                                <div className={navbarStyles.statusIndicator}></div>
                            </div>
                            <div className={navbarStyles.userTextContainer}>
                                <p className={navbarStyles.userName}>
                                    {user?.name || "USER"}
                                </p>
                                <p className={navbarStyles.userEmail}>
                                    {user?.email || "user@megmail.com"}
                                </p>
                            </div>
                            <ChevronDown className={navbarStyles.chevronIcon(menuOpen)} />
                        </button>
                        {menuOpen && (
                            <div className={navbarStyles.dropdownMenu}>
                                <div className={navbarStyles.dropdownHeader}>
                                    <div className='flex items-center gap-3'>
                                        <div className={navbarStyles.dropdownAvatar}>
                                            {user?.name?.[0]?.toUpperCase() || "U"}
                                        </div>

                                        <div>
                                            <div className={navbarStyles.dropdownName}>
                                                {user?.name || "USER"}
                                            </div>
                                            <div className={navbarStyles.dropdownEmail}>
                                                {user?.email || "user@megmail.com"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className={navbarStyles.menuItemContainer}>
                                    <button className={navbarStyles.menuItem} onClick={() => {
                                        setMenuOpen(false);
                                        navigate("/profile")
                                    }}>
                                        <User className="w-4 h-4"/>
                                        <span>My Profile</span>
                                    </button>
                                </div>

                                <div className={navbarStyles.menuItemBorder}>
                                    <button onClick={handleLogout} className={navbarStyles.logoutButton}>
                                        <LogOut className="w-4 h-4"/>
                                        <span>LogOut</span>
                                    </button>
                                </div>



                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    )
}

export default Navbar