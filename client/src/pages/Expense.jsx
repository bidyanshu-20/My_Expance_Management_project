import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import {
    Plus,
    DollarSign,
    Download,
    Eye,
    Calendar,
    TrendingDown,
    BarChart2,
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";
import axios from "axios";
import { exportToExcel } from "../utils/exportUtils";

import FinancialCard from "../components/FinancialCard";
import TimeFrameSelector from "../components/TimeFrame";
import TransactionItem from "../components/TransactionItem";
import AddTransactionModal from "../components/Add";

import { getTimeFrameRange, generateChartPoints } from "../components/Helpers";
import { CATEGORY_ICONS } from "../assets/color";

const API_BASE = "http://localhost:4000/api";

function toIsoWithClientTime(dateValue) {
    if (!dateValue) return new Date().toISOString();

    if (typeof dateValue === "string" && dateValue.length === 10) {
        const now = new Date();
        const hhmmss = now.toTimeString().slice(0, 8);
        return new Date(`${dateValue}T${hhmmss}`).toISOString();
    }

    try {
        return new Date(dateValue).toISOString();
    } catch {
        return new Date().toISOString();
    }
}

const Expense = () => {
    const {
        transactions: outletTransactions = [],
        timeFrame = "monthly",
        setTimeFrame = () => { },
        refreshTransactions
    } = useOutletContext();

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showAll, setShowAll] = useState(false);
    const [filter, setFilter] = useState("all");
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [loading, setLoading] = useState(false);

    const [editForm, setEditForm] = useState({
        description: "",
        amount: "",
        category: "Food",
        date: new Date().toISOString().split("T")[0],
    });

    const [newTransaction, setNewTransaction] = useState({
        date: new Date().toISOString().split("T")[0],
        description: "",
        amount: "",
        type: "expense",
        category: "Food",
    });

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
    }, []);

    // Fetch overview from server
    const fetchOverview = useCallback(async (range = timeFrame) => {
        try {
            await axios.get(`${API_BASE}/expense/overview`, {
                headers: getAuthHeaders(),
                params: { range },
            });
            // You can expand this if you want to use server overview data
        } catch (err) {
            console.error("Failed to fetch expense overview:", err);
        }
    }, [timeFrame, getAuthHeaders]);

    useEffect(() => {
        fetchOverview();
    }, [fetchOverview]);

    const timeFrameRange = useMemo(() => getTimeFrameRange(timeFrame, selectedMonth), [timeFrame, selectedMonth]);
    const chartPoints = useMemo(() => generateChartPoints(timeFrame, timeFrameRange), [timeFrame, timeFrameRange]);

    const isDateInRange = useCallback((date, start, end) => {
        const transactionDate = new Date(date);
        const startDate = new Date(start);
        const endDate = new Date(end);
        transactionDate.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        return transactionDate >= startDate && transactionDate <= endDate;
    }, []);

    const expenseTransactions = useMemo(() =>
        (outletTransactions || [])
            .filter(t => t.type === "expense")
            .sort((a, b) => new Date(b.date) - new Date(a.date)),
        [outletTransactions]
    );

    const timeFrameTransactions = useMemo(() =>
        expenseTransactions.filter(t => isDateInRange(t.date, timeFrameRange.start, timeFrameRange.end)),
        [expenseTransactions, timeFrameRange, isDateInRange]
    );

    const filteredTransactions = useMemo(() => {
        if (filter === "all") return timeFrameTransactions;

        const now = new Date();
        return timeFrameTransactions.filter(t => {
            const transDate = new Date(t.date);

            if (filter === "month") {
                const compareYear = selectedMonth ? new Date(selectedMonth).getFullYear() : now.getFullYear();
                const compareMonth = selectedMonth ? new Date(selectedMonth).getMonth() : now.getMonth();
                return transDate.getFullYear() === compareYear && transDate.getMonth() === compareMonth;
            }

            if (filter === "year") {
                const compareYear = selectedMonth ? new Date(selectedMonth).getFullYear() : now.getFullYear();
                return transDate.getFullYear() === compareYear;
            }

            return t.category.toLowerCase() === filter.toLowerCase();
        });
    }, [timeFrameTransactions, filter, selectedMonth]);

    const totalExpense = useMemo(() =>
        filteredTransactions.reduce((sum, t) => sum + Math.round(Number(t.amount || 0)), 0),
        [filteredTransactions]
    );

    const averageExpense = useMemo(() =>
        filteredTransactions.length ? Math.round(totalExpense / filteredTransactions.length) : 0,
        [filteredTransactions, totalExpense]
    );

    const chartData = useMemo(() => {
        const data = chartPoints.map(point => ({ ...point, expense: 0 }));

        filteredTransactions.forEach(transaction => {
            const transDate = new Date(transaction.date);
            const point = data.find(d => {
                if (timeFrame === "daily") return d.hour === transDate.getHours();
                if (timeFrame === "yearly") return d.date.getMonth() === transDate.getMonth();
                return d.date.getDate() === transDate.getDate() && d.date.getMonth() === transDate.getMonth();
            });
            if (point) point.expense += Math.round(Number(transaction.amount));
        });

        return data;
    }, [filteredTransactions, chartPoints, timeFrame]);

    const handleApiRequest = async (method, url, data = null) => {
        try {
            setLoading(true);
            const config = {
                method,
                url: `${API_BASE}${url}`,
                headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            };
            if (data) config.data = data;

            await axios(config);
            await refreshTransactions();
            await fetchOverview(timeFrame);
        } catch (err) {
            console.error(`Error in ${method} request:`, err);
            const msg = err?.response?.data?.message || `Failed to ${method === 'post' ? 'add' : method === 'put' ? 'update' : 'delete'} expense`;
            alert(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleAddTransaction = async () => {
        if (!newTransaction.description || !newTransaction.amount) return;

        const payload = {
            description: newTransaction.description.trim(),
            amount: parseFloat(newTransaction.amount),
            category: newTransaction.category,
            date: toIsoWithClientTime(newTransaction.date),
        };

        try {
            await handleApiRequest('post', '/expense/add', payload);

            setNewTransaction({
                date: new Date().toISOString().split("T")[0],
                description: "",
                amount: "",
                type: "expense",
                category: "Food",
            });
            setShowModal(false);
        } catch (err) { }
    };

    const handleEditTransaction = async () => {
        if (!editingId || !editForm.description || !editForm.amount) return;

        const payload = {
            description: editForm.description.trim(),
            amount: parseFloat(editForm.amount),
            category: editForm.category,
            date: toIsoWithClientTime(editForm.date),
        };

        try {
            await handleApiRequest('put', `/expense/update/${editingId}`, payload);
            setEditingId(null);
        } catch (err) { }
    };

    const handleDeleteTransaction = async (id) => {
        if (!id || !window.confirm("Delete this expense?")) return;
        await handleApiRequest('delete', `/expense/delete/${id}`);
    };

    const handleExport = async () => {
        try {
            const res = await axios.get(`${API_BASE}/expense/downloadexcel`, {
                headers: getAuthHeaders(),
                responseType: "blob",
            });

            const blob = new Blob([res.data], { type: res.headers["content-type"] || "application/octet-stream" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `expenses_${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export failed, using fallback...");
            const exportData = filteredTransactions.map(t => ({
                Date: new Date(t.date).toLocaleDateString(),
                Description: t.description,
                Category: t.category,
                Amount: t.amount,
                Type: "Expense",
            }));
            exportToExcel(exportData, `expenses_${new Date().toISOString().slice(0, 10)}`);
        }
    };

    return (
        <div className="space-y-8  dark:bg-black">
            {/* Header */}
            <div className="flex  flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold  text-gray-900">Expenses</h1>
                    <p className="text-gray-600 mt-1">Track and manage all your spending</p>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    disabled={loading}
                    className="flex items-center gap-3 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-2xl font-medium shadow-lg shadow-orange-200 transition-all active:scale-95 disabled:opacity-70"
                >
                    <Plus size={22} />
                    Add Expense
                </button>
            </div>

            {/* Time Frame Selector */}
            <div className="flex justify-center">
                <TimeFrameSelector
                    timeFrame={timeFrame}
                    setTimeFrame={(frame) => {
                        setTimeFrame(frame);
                        setSelectedMonth(null);
                    }}
                    options={["daily", "weekly", "monthly", "yearly"]}
                    color="orange"
                />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FinancialCard
                    icon={<DollarSign className="w-6 h-6 text-orange-600" />}
                    label="Total Expenses"
                    value={`₹${totalExpense.toLocaleString()}`}
                    additionalContent={
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-3">
                            <Calendar className="w-4 h-4" />
                            {timeFrameRange.label}
                        </div>
                    }
                />

                <FinancialCard
                    icon={<BarChart2 className="w-6 h-6 text-amber-600" />}
                    label="Average Expense"
                    value={`₹${averageExpense.toLocaleString()}`}
                    additionalContent={
                        <div className="text-sm text-gray-500 mt-3">
                            {filteredTransactions.length} transactions
                        </div>
                    }
                />

                <FinancialCard
                    icon={<TrendingDown className="w-6 h-6 text-red-600" />}
                    label="Total Transactions"
                    value={filteredTransactions.length}
                    additionalContent={
                        <div className="text-sm text-gray-500 mt-3">
                            {filter === "all" ? "All records" : `${filter} only`}
                        </div>
                    }
                />
            </div>

            {/* Expense Trend Chart */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <BarChart2 className="w-7 h-7 text-orange-600" />
                        <h3 className="text-2xl font-semibold text-gray-900">
                            {timeFrame === "daily" ? "Hourly" : timeFrame === "yearly" ? "Monthly" : "Daily"} Expense Trend
                            <span className="text-gray-500 text-lg ml-2">({timeFrameRange.label})</span>
                        </h3>
                    </div>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-white border border-gray-300 hover:border-orange-300 text-gray-700 hover:text-orange-600 px-5 py-2.5 rounded-2xl transition font-medium"
                    >
                        <Download size={18} />
                        Export Data
                    </button>
                </div>

                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <defs>
                                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.85} />
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.08} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#6b7280", fontSize: 12 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#6b7280", fontSize: 12 }}
                                tickFormatter={(v) => `₹${v}`}
                            />
                            <Tooltip
                                formatter={(value) => [`₹${Math.round(value).toLocaleString()}`, "Expense"]}
                                contentStyle={{
                                    backgroundColor: "#fff",
                                    border: "none",
                                    borderRadius: "12px",
                                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="expense"
                                stroke="#f97316"
                                fill="url(#expenseGradient)"
                                strokeWidth={3}
                                activeDot={{ r: 7, fill: "#f97316" }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <DollarSign className="w-7 h-7 text-orange-600" />
                        <h3 className="text-2xl font-semibold">All Expenses</h3>
                        <span className="text-gray-500">({timeFrameRange.label})</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-white border border-gray-300 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="all">All Transactions</option>
                            <option value="month">This Month</option>
                            <option value="year">This Year</option>
                            <option value="Food">Food</option>
                            <option value="Housing">Housing</option>
                            <option value="Transport">Transport</option>
                            <option value="Shopping">Shopping</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Utilities">Utilities</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Other">Other</option>
                        </select>

                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-700 px-6 py-3 rounded-2xl font-medium transition"
                        >
                            <Download size={18} />
                            Export
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    {filteredTransactions
                        .slice(0, showAll ? undefined : 8)
                        .map((transaction) => (
                            <TransactionItem
                                key={transaction.id}
                                transaction={transaction}
                                isEditing={editingId === transaction.id}
                                editForm={editForm}
                                setEditForm={setEditForm}
                                onSave={handleEditTransaction}
                                onCancel={() => setEditingId(null)}
                                onDelete={handleDeleteTransaction}
                                type="expense"
                                categoryIcons={CATEGORY_ICONS}
                                setEditingId={setEditingId}
                            />
                        ))}

                    {filteredTransactions.length === 0 && (
                        <div className="text-center py-16 text-gray-400">
                            <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-xl">No expenses found</p>
                            <p className="mt-2">Start tracking your spending by adding your first expense</p>
                        </div>
                    )}

                    {!showAll && filteredTransactions.length > 8 && (
                        <button
                            onClick={() => setShowAll(true)}
                            className="w-full py-4 text-orange-600 hover:bg-orange-50 font-medium rounded-2xl flex items-center justify-center gap-2 mt-6 border border-orange-200 hover:border-orange-300 transition"
                        >
                            <Eye size={20} />
                            View All {filteredTransactions.length} Expenses
                        </button>
                    )}
                </div>
            </div>

            {/* Add Expense Modal */}
            <AddTransactionModal
                showModal={showModal}
                setShowModal={setShowModal}
                newTransaction={newTransaction}
                setNewTransaction={setNewTransaction}
                handleAddTransaction={handleAddTransaction}
                loading={loading}
                type="expense"
                title="Add New Expense"
                buttonText="Add Expense"
                categories={[
                    "Food", "Housing", "Transport", "Shopping",
                    "Entertainment", "Utilities", "Healthcare", "Other"
                ]}
                color="orange"
            />
        </div>
    );
};

export default Expense;