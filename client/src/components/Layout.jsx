import React, { useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import axios from 'axios';

import Navbar from './Navbar';
import Sidebar from './Sidebar';

import { 
    ArrowDown, ArrowUp, Clock, DollarSign, PiggyBank, 
    RefreshCw, ChevronDown, ChevronUp, PieChart, Info 
} from 'lucide-react';

const API_BASE = "/api";

const CATEGORY_ICONS = {
    Food: <span className="text-orange-500">🍔</span>,
    Housing: <span className="text-blue-500">🏠</span>,
    Transport: <span className="text-purple-500">🚗</span>,
    Shopping: <span className="text-pink-500">🛍️</span>,
    Entertainment: <span className="text-amber-500">🎁</span>,
    Utilities: <span className="text-cyan-500">⚡</span>,
    Healthcare: <span className="text-red-500">🩺</span>,
    Salary: <span className="text-green-500">💰</span>,
    Freelance: <span className="text-indigo-500">💼</span>,
    Savings: <span className="text-emerald-500">🏦</span>,
    Other: <DollarSign className="w-4 h-4" />,
};

const filterTransactions = (transactions, frame) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (frame) {
        case "daily":
            return transactions.filter((t) => new Date(t.date) >= today);
        case "weekly": {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            return transactions.filter((t) => new Date(t.date) >= startOfWeek);
        }
        case "monthly":
            return transactions.filter(
                (t) => new Date(t.date).getMonth() === now.getMonth() &&
                       new Date(t.date).getFullYear() === now.getFullYear()
            );
        default:
            return transactions;
    }
};

const safeArrayFromResponse = (res) => {
    const body = res?.data;
    if (!body) return [];
    if (Array.isArray(body)) return body;
    if (Array.isArray(body.data)) return body.data;
    if (Array.isArray(body.incomes)) return body.incomes;
    if (Array.isArray(body.expenses)) return body.expenses;
    return [];
};

const Layout = ({ onLogout, user }) => {
    const [transactions, setTransactions] = useState([]);
    const [timeFrame, setTimeFrame] = useState("monthly");
    const [loading, setLoading] = useState(false);
    const [showAllTransactions, setShowAllTransactions] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [isCollapsed, setIsCollapsed] = useState(false);   // Fixed naming

    // Fetch all transactions
    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const [incomeRes, expenseRes] = await Promise.all([
                axios.get(`${API_BASE}/income/get`, { headers }),
                axios.get(`${API_BASE}/expense/get`, { headers }),
            ]);

            const incomes = safeArrayFromResponse(incomeRes).map((i) => ({ ...i, type: "income" }));
            const expenses = safeArrayFromResponse(expenseRes).map((e) => ({ ...e, type: "expense" }));

            const allTransactions = [...incomes, ...expenses]
                .map((t) => ({
                    id: t._id || t.id || Math.random().toString(36).slice(2),
                    description: t.description || t.title || t.note || "Transaction",
                    amount: Number(t.amount || t.value || 0),
                    date: t.date || t.createdAt || new Date().toISOString(),
                    category: t.category || "Other",
                    type: t.type,
                }))
                .sort((a, b) => new Date(b.date) - new Date(a.date));

            setTransactions(allTransactions);
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Failed to fetch transactions:", err);
        } finally {
            setLoading(false);
        }
    };

    const addTransaction = async (transaction) => {
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const endpoint = transaction.type === "income" ? "income/add" : "expense/add";
            await axios.post(`${API_BASE}/${endpoint}`, transaction, { headers });
            await fetchTransactions();
            return true;
        } catch (err) {
            console.error("Failed to add transaction:", err);
            throw err;
        }
    };

    const editTransaction = async (id, transaction) => {
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const endpoint = transaction.type === "income" ? "income/update" : "expense/update";
            await axios.put(`${API_BASE}/${endpoint}/${id}`, transaction, { headers });
            await fetchTransactions();
            return true;
        } catch (err) {
            console.error("Failed to edit transaction:", err);
            throw err;
        }
    };

    const deleteTransaction = async (id, type) => {
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const endpoint = type === "income" ? "income/delete" : "expense/delete";
            await axios.delete(`${API_BASE}/${endpoint}/${id}`, { headers });
            await fetchTransactions();
            return true;
        } catch (err) {
            console.error("Failed to delete transaction:", err);
            throw err;
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const filteredTransactions = useMemo(
        () => filterTransactions(transactions, timeFrame),
        [transactions, timeFrame]
    );

    const stats = useMemo(() => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const last30DaysTransactions = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
        const last30DaysIncome = last30DaysTransactions
            .filter(t => t.type === "income")
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const last30DaysExpenses = last30DaysTransactions
            .filter(t => t.type === "expense")
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const allTimeIncome = transactions
            .filter(t => t.type === "income")
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const allTimeExpenses = transactions
            .filter(t => t.type === "expense")
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const savingsRate = last30DaysIncome > 0 
            ? Math.round(((last30DaysIncome - last30DaysExpenses) / last30DaysIncome) * 100) 
            : 0;

        const expenseChange = 12; // You can enhance this calculation later

        return {
            totalTransactions: transactions.length,
            last30DaysIncome,
            last30DaysExpenses,
            last30DaysSavings: last30DaysIncome - last30DaysExpenses,
            allTimeIncome,
            allTimeExpenses,
            allTimeSavings: allTimeIncome - allTimeExpenses,
            savingsRate,
            expenseChange,
        };
    }, [transactions]);

    const timeFrameLabel = timeFrame === "daily" ? "Today" 
        : timeFrame === "weekly" ? "This Week" : "This Month";

    const outletContext = {
        transactions: filteredTransactions,
        addTransaction,
        editTransaction,
        deleteTransaction,
        refreshTransactions: fetchTransactions,
        timeFrame,
        setTimeFrame,
        lastUpdated,
    };

    const topCategories = useMemo(() => {
        const expenseByCategory = transactions
            .filter(t => t.type === "expense")
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
                return acc;
            }, {});

        return Object.entries(expenseByCategory)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    }, [transactions]);

    const displayedTransactions = showAllTransactions ? transactions : transactions.slice(0, 4);

    return (
        <div className="flex dark:text-zinc-500 dark:bg-black h-screen overflow-hidden bg-gray-50">
            {/* Sidebar */}
            <Sidebar 
                user={user} 
                isCollapsed={isCollapsed} 
                setIsCollapsed={setIsCollapsed} 
            />

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-[280px]'}`}>
                {/* Navbar */}
                <Navbar user={user} onLogout={onLogout} />

                {/* Page Content */}
                <main className="flex-1  overflow-auto p-6 lg:p-8">
                    {/* Page Header */}
                    <div className="mb-10">
                        <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-gray-600 mt-1">Welcome back! Here's your financial overview.</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        <div className="bg-white dark:text-zinc-400 dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-500 text-sm">Total Balance</p>
                                    <p className="text-3xl font-semibold text-gray-900 mt-2">
                                        ₹{stats.allTimeSavings.toLocaleString()}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-teal-600" />
                                </div>
                            </div>
                            <p className="text-teal-600 text-sm mt-4">
                                +₹{stats.last30DaysSavings.toLocaleString()} this month
                            </p>
                        </div>

                        <div className="bg-white rounded-3xl  dark:text-zinc-400 dark:bg-gray-800 shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-500 text-sm">Monthly Income</p>
                                    <p className="text-3xl font-semibold text-gray-900 mt-2">
                                        ₹{stats.last30DaysIncome.toLocaleString()}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                                    <ArrowUp className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                            <p className="text-green-600 text-sm mt-4">+12.5% from last month</p>
                        </div>

                        <div className="bg-white dark:text-zinc-400 dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-500 text-sm">Monthly Expenses</p>
                                    <p className="text-3xl font-semibold text-gray-900 mt-2">
                                        ₹{stats.last30DaysExpenses.toLocaleString()}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                                    <ArrowDown className="w-6 h-6 text-orange-600" />
                                </div>
                            </div>
                            <p className={`text-sm mt-4 ${stats.expenseChange > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {stats.expenseChange > 0 ? '+' : ''}{stats.expenseChange}% from last month
                            </p>
                        </div>
                        <div className="bg-white  dark:text-zinc-400 dark:bg-gray-800  rounded-3xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-500 text-sm">Savings Rate</p>
                                    <p className="text-3xl font-semibold text-gray-900 mt-2">
                                        {stats.savingsRate}%
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                                    <PiggyBank className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                            <p className="text-blue-600 text-sm mt-4">
                                {stats.savingsRate > 30 ? "Excellent" : stats.savingsRate > 20 ? "Good" : "Needs improvement"}
                            </p>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                        {/* Left Column - Outlet (Dashboard Page) */}
                        <div className="xl:col-span-8">
                            <div className="bg-white rounded-3xl shadow-sm border dark:text-zinc-400 dark:bg-black border-gray-100 p-8">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 bg-teal-100 rounded-2xl flex items-center justify-center">
                                        <PieChart className="w-6 h-6 text-teal-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-semibold text-gray-900">Financial Overview</h3>
                                        <p className="text-gray-500">({timeFrameLabel})</p>
                                    </div>
                                </div>
                                <Outlet context={outletContext} />
                            </div>
                        </div>

                        {/* Right Column - Recent Transactions & Categories */}
                        <div className="xl:col-span-4 space-y-8">
                            {/* Recent Transactions */}
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100  dark:text-zinc-400 dark:bg-gray-800 p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-6 h-6 text-purple-600" />
                                        <h3 className="text-xl font-semibold">Recent Transactions</h3>
                                    </div>
                                    <button 
                                        onClick={fetchTransactions} 
                                        disabled={loading}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition"
                                    >
                                        <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                                    <Info className="w-4 h-4" />
                                    Newest first
                                </div>

                                <div className="space-y-4">
                                    {displayedTransactions.length > 0 ? (
                                        displayedTransactions.map((t) => (
                                            <div key={t.id} className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-2xl transition">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${t.type === 'income' ? 'bg-green-100' : 'bg-orange-100'}`}>
                                                        {CATEGORY_ICONS[t.category] || <DollarSign className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{t.description}</p>
                                                        <p className="text-sm text-gray-500">{t.category} • {new Date(t.date).toLocaleDateString('en-IN')}</p>
                                                    </div>
                                                </div>
                                                <span className={`font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {t.type === 'income' ? '+' : '-'}₹{Number(t.amount).toLocaleString()}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center py-8 text-gray-400">No transactions yet</p>
                                    )}
                                </div>

                                {transactions.length > 4 && (
                                    <button
                                        onClick={() => setShowAllTransactions(!showAllTransactions)}
                                        className="mt-6 w-full py-3 text-indigo-600 hover:bg-indigo-50 rounded-2xl font-medium flex items-center justify-center gap-2 transition"
                                    >
                                        {showAllTransactions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        {showAllTransactions ? "Show Less" : `View All (${transactions.length})`}
                                    </button>
                                )}
                            </div>

                            {/* Spending by Category */}
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 dark:text-zinc-400 dark:bg-gray-800">
                                <h3 className="flex items-center gap-3 text-xl font-semibold mb-6">
                                    <PieChart className="w-6 h-6 text-purple-600" />
                                    Top Spending Categories
                                </h3>

                                <div className="space-y-5">
                                    {topCategories.map(([category, amount]) => (
                                        <div key={category} className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center">
                                                    {CATEGORY_ICONS[category] || <DollarSign className="w-5 h-5 text-gray-500" />}
                                                </div>
                                                <span className="font-medium text-gray-700">{category}</span>
                                            </div>
                                            <span className="font-semibold text-gray-900">₹{amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-10">
                                    <div className="bg-emerald-50 rounded-2xl p-5">
                                        <p className="text-emerald-600 text-sm">Total Income</p>
                                        <p className="text-2xl font-semibold text-emerald-700 mt-1">
                                            ₹{stats.allTimeIncome.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="bg-orange-50 rounded-2xl p-5">
                                        <p className="text-orange-600 text-sm">Total Expenses</p>
                                        <p className="text-2xl font-semibold text-orange-700 mt-1">
                                            ₹{stats.allTimeExpenses.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;