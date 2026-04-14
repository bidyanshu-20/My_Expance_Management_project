import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, Mail } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from "axios";

const Login = ({ onLogin, API_URL = "http://localhost:4000" }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const fetchProfile = async (token) => {
    if (!token) return null;
    try {
      const res = await axios.get("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    } catch (err) {
      console.warn("Could not fetch profile:", err);
      return null;
    }
  };

  const persistAuth = (profile, token) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    try {
      if (token) storage.setItem("token", token);
      if (profile) storage.setItem("user", JSON.stringify(profile));
    } catch (error) {
      console.error("Storage Error:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await axios.post("/api/user/login", 
        { email, password }, 
        { headers: { "Content-Type": "application/json" } }
      );

      const data = res.data || {};
      let token = data.token || null;
      let profile = data.user || null;

      if (!profile) {
        const copy = { ...data };
        delete copy.token;
        delete copy.user;
        if (Object.keys(copy).length > 0) profile = copy;
      }

      if (!profile && token) {
        profile = await fetchProfile(token);
      }

      if (!profile) {
        profile = { email };
      }

      persistAuth(profile, token);

      if (typeof onLogin === "function") {
        onLogin(profile, rememberMe, token);
      } else {
        navigate("/");
      }

      setPassword("");
    } catch (err) {
      console.error("Login error:", err?.response || err);
      const serverMsg = err.response?.data?.message 
        || err.response?.data 
        || err.message 
        || "Login failed. Please try again.";
      setError(serverMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-zinc-950 to-black flex items-center justify-center p-6">
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(at_center,#14b8a610_0%,transparent_70%)]"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-zinc-900/80 backdrop-blur-2xl border border-zinc-700/50 rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="px-8 pt-10 pb-8 text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl mb-6 ring-1 ring-white/10">
              <User className="w-11 h-11 text-white" />
            </div>
            
            <h1 className="text-3xl font-semibold text-white mb-2 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-zinc-400">
              Sign in to your Expanse Tracker account
            </p>
          </div>

          {/* Form */}
          <div className="px-8 pb-10">
            {error && (
              <div className="mb-6 bg-red-950/50 border border-red-900/50 rounded-2xl p-4 flex items-start gap-3">
                <div className="text-red-400 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-teal-400 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-teal-500 text-white placeholder-zinc-500 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all duration-200 focus:ring-1 focus:ring-teal-500/30"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-400 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-teal-400 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-teal-500 text-white placeholder-zinc-500 rounded-2xl py-4 pl-12 pr-12 outline-none transition-all duration-200 focus:ring-1 focus:ring-teal-500/30"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-teal-600 bg-zinc-800 border-zinc-600 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm text-zinc-400 select-none">Remember me</span>
                </label>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg
                  ${isLoading 
                    ? 'bg-teal-600/70 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-500 active:scale-[0.985]'
                  } text-white`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : "Sign In"}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-8 text-center">
              <p className="text-zinc-400">
                Don't have an account?{' '}
                <Link 
                  to="/signup" 
                  className="font-medium text-teal-400 hover:text-teal-300 transition-colors"
                >
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-zinc-500 text-sm mt-6">
          Secure login • Expanse Tracker
        </p>
      </div>
    </div>
  );
};

export default Login;