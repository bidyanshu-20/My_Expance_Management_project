import React, { memo, useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from "react-modal";
import { Eye, EyeOff, Lock, User, X, LogOut } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import axios from 'axios';

const BASE_URL = "http://localhost:4000/api";

Modal.setAppElement('#root');

// Reusable Password Input Component
const PasswordInput = memo(({ 
    name, 
    label, 
    value, 
    error, 
    showField, 
    onToggle, 
    onChange, 
    disabled 
}) => (
    <div className="space-y-2 ">
        <label className="block text-sm font-medium text-gray-700">
            {label}
        </label>
        <div className="relative">
            <input
                type={showField ? "text" : "password"}
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all
                    ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-emerald-500'}`}
                placeholder={`Enter ${label.toLowerCase()}`}
            />
            <button
                type="button"
                onClick={onToggle}
                disabled={disabled}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
            >
                {showField ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
));

PasswordInput.displayName = 'PasswordInput';

const Profile = ({ onUpdateProfile, onLogout }) => {
    const navigate = useNavigate();

    const [user, setUser] = useState({
        name: '',
        email: '',
        joinDate: ''
    });

    const [editMode, setEditMode] = useState(false);
    const [tempUser, setTempUser] = useState({ ...user });
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [passwordErrors, setPasswordErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const getAuthToken = useCallback(() => localStorage.getItem("token"), []);

    const handleApiRequest = useCallback(async (method, endpoint, data = null) => {
        const token = getAuthToken();
        if (!token) {
            navigate("/login");
            return null;
        }

        try {
            setLoading(true);
            const config = {
                method,
                url: `${BASE_URL}${endpoint}`,
                headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
            };

            if (data) config.data = data;

            const response = await axios(config);
            return response.data;
        } catch (error) {
            console.error(`${method} request error:`, error);
            if (error.response?.status === 401) {
                navigate("/login");
            }
            throw error;
        } finally {
            setLoading(false);
        }
    }, [getAuthToken, navigate]);

    // Fetch user data
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const data = await handleApiRequest("get", "/user/me");
                if (data) {
                    const userData = data.user || data;
                    setUser(userData);
                    setTempUser(userData);
                }
            } catch (err) {
                toast.error("Failed to fetch user data");
            }
        };
        fetchUserData();
    }, [handleApiRequest]);

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setTempUser(prev => ({ ...prev, [name]: value }));
    }, []);

    const handlePasswordChange = useCallback((e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
        setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }, []);

    const togglePasswordVisibility = useCallback((field) => {
        setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
    }, []);

    // Save Profile
    const handleSaveProfile = async () => {
        try {
            const data = await handleApiRequest("put", "/user/profile", tempUser);
            if (data) {
                const updatedUser = data.user || data;
                setUser(updatedUser);
                setTempUser(updatedUser);
                setEditMode(false);
                onUpdateProfile?.(updatedUser);
                toast.success("Profile updated successfully!");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update profile");
        }
    };

    const handleCancelEdit = useCallback(() => {
        setTempUser(user);
        setEditMode(false);
    }, [user]);

    // Password Validation
    const validatePassword = useCallback(() => {
        const errors = {};
        if (!passwordData.current) errors.current = "Current password is required";
        if (!passwordData.new) errors.new = "New password is required";
        else if (passwordData.new.length < 8) errors.new = "Password must be at least 8 characters";
        if (passwordData.new !== passwordData.confirm) errors.confirm = "Passwords do not match";

        setPasswordErrors(errors);
        return Object.keys(errors).length === 0;
    }, [passwordData]);

    // Change Password
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (!validatePassword()) return;

        try {
            await handleApiRequest("put", "/user/password", {
                currentPassword: passwordData.current,
                newPassword: passwordData.new,
            });

            toast.success("Password changed successfully!");
            setShowPasswordModal(false);
            setPasswordData({ current: '', new: '', confirm: '' });
            setPasswordErrors({});
            setShowPassword({ current: false, new: false, confirm: false });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to change password");
        }
    };

    const handleLogout = useCallback(() => {
        onLogout?.();
        navigate("/login");
    }, [onLogout, navigate]);

    const closePasswordModal = useCallback(() => {
        if (!loading) {
            setShowPasswordModal(false);
            setPasswordData({ current: '', new: '', confirm: '' });
            setPasswordErrors({});
            setShowPassword({ current: false, new: false, confirm: false });
        }
    }, [loading]);

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <ToastContainer position="top-right" autoClose={2000} />

            <div className="max-w-4xl mx-auto">
                {/* Profile Header */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 mb-8">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-28 h-28 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                            <User className="w-14 h-14 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            {user.name || "Loading..."}
                        </h1>
                        <p className="text-gray-600 text-lg">{user.email || "Loading..."}</p>
                        {user.joinDate && (
                            <p className="text-sm text-gray-500 mt-2">
                                Member since {new Date(user.joinDate).getFullYear()}
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Personal Information Card */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center">
                                    <User className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h2 className="text-2xl font-semibold text-gray-900">Personal Information</h2>
                            </div>
                            {!editMode && (
                                <button 
                                    onClick={() => setEditMode(true)}
                                    disabled={loading}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-medium transition-all disabled:opacity-70"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>

                        {editMode ? (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                    <input 
                                        type="text" 
                                        name="name" 
                                        value={tempUser.name} 
                                        onChange={handleInputChange} 
                                        disabled={loading}
                                        className="w-full px-5 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                    <input 
                                        type="email" 
                                        name="email" 
                                        value={tempUser.email} 
                                        onChange={handleInputChange} 
                                        disabled={loading}
                                        className="w-full px-5 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button 
                                        onClick={handleSaveProfile} 
                                        disabled={loading}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-medium transition-all disabled:opacity-70"
                                    >
                                        {loading ? "Saving..." : "Save Changes"}
                                    </button>
                                    <button 
                                        onClick={handleCancelEdit} 
                                        disabled={loading}
                                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-2xl font-medium transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div>
                                    <p className="text-sm text-gray-500">Full Name</p>
                                    <p className="text-xl font-semibold text-gray-900 mt-1">{user.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Email Address</p>
                                    <p className="text-xl font-semibold text-gray-900 mt-1">{user.email}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Account Security Card */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center">
                                <Lock className="w-5 h-5 text-amber-600" />
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-900">Account Security</h2>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-gray-800">Password</p>
                                    <p className="text-sm text-gray-500">Last changed recently</p>
                                </div>
                                <button 
                                    onClick={() => setShowPasswordModal(true)}
                                    disabled={loading}
                                    className="px-6 py-2.5 bg-white border border-gray-300 hover:border-emerald-500 text-gray-700 hover:text-emerald-600 rounded-2xl font-medium transition-all"
                                >
                                    Change Password
                                </button>
                            </div>
                        </div>

                        <button 
                            onClick={handleLogout}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-medium transition-all disabled:opacity-70"
                        >
                            <LogOut size={20} />
                            Logout from Account
                        </button>
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            <Modal
                isOpen={showPasswordModal}
                onRequestClose={closePasswordModal}
                contentLabel="Change Password"
                className="fixed inset-0 flex items-center justify-center p-4"
                overlayClassName="fixed inset-0 bg-black/60 z-50"
                shouldCloseOnOverlayClick={!loading}
                shouldCloseOnEsc={!loading}
            >
                <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
                    <div className="flex items-center justify-between px-8 py-6 border-b">
                        <h3 className="text-2xl font-semibold text-gray-900">Change Password</h3>
                        <button 
                            onClick={closePasswordModal}
                            disabled={loading}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={28} />
                        </button>
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="p-8 space-y-6">
                        <PasswordInput
                            name="current"
                            label="Current Password"
                            value={passwordData.current}
                            error={passwordErrors.current}
                            showField={showPassword.current}
                            onToggle={() => togglePasswordVisibility('current')}
                            onChange={handlePasswordChange}
                            disabled={loading}
                        />

                        <PasswordInput
                            name="new"
                            label="New Password"
                            value={passwordData.new}
                            error={passwordErrors.new}
                            showField={showPassword.new}
                            onToggle={() => togglePasswordVisibility('new')}
                            onChange={handlePasswordChange}
                            disabled={loading}
                        />

                        <PasswordInput
                            name="confirm"
                            label="Confirm New Password"
                            value={passwordData.confirm}
                            error={passwordErrors.confirm}
                            showField={showPassword.confirm}
                            onToggle={() => togglePasswordVisibility('confirm')}
                            onChange={handlePasswordChange}
                            disabled={loading}
                        />

                        <div className="flex gap-4 pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-medium transition-all disabled:opacity-70"
                            >
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                            <button
                                type="button"
                                onClick={closePasswordModal}
                                disabled={loading}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-2xl font-medium transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
};

export default Profile;