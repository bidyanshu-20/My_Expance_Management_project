import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import {
    Plus,
    DollarSign,
    Download,
    Eye,
    Calendar,
    TrendingUp,
    BarChart2,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    Cell,
    ReferenceLine,
} from "recharts";
import axios from "axios";
import { exportToExcel } from "../utils/exportUtils";

import AddTransactionModal from "../components/Add";
import TransactionItem from "../components/TransactionItem";
import TimeFrame from "../components/TimeFrame";
import FinancialCard from "../components/FinancialCard";

import { getTimeFrameRange, generateChartPoints } from "../components/Helpers";
import { INCOME_COLORS, CATEGORY_ICONS_Inc } from "../assets/color";

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

const Income = () => {
    const {
        transactions: outletTransactions = [],
        timeFrame = "monthly",
        setTimeFrame = () => { },
        refreshTransactions,
    } = useOutletContext();

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showAll, setShowAll] = useState(false);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(false);

    const [newTransaction, setNewTransaction] = useState({
        date: new Date().toISOString().split("T")[0],
        description: "",
        amount: "",
        type: "income",
        category: "Salary",
    });

    const [editForm, setEditForm] = useState({
        description: "",
        amount: "",
        category: "Salary",
        date: new Date().toISOString().split("T")[0],
    });

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
    }, []);

    const timeFrameRange = useMemo(() => getTimeFrameRange(timeFrame, null), [timeFrame]);
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

    const incomeTransactions = useMemo(() =>
        (outletTransactions || [])
            .filter((t) => t.type === "income")
            .sort((a, b) => new Date(b.date) - new Date(a.date)),
        [outletTransactions]
    );

    const timeFrameTransactions = useMemo(() =>
        incomeTransactions.filter((t) => isDateInRange(t.date, timeFrameRange.start, timeFrameRange.end)),
        [incomeTransactions, timeFrameRange, isDateInRange]
    );

    const filteredTransactions = useMemo(() => {
        if (filter === "all") return timeFrameTransactions;

        return timeFrameTransactions.filter((t) => {
            const transDate = new Date(t.date);
            if (filter === "month") {
                return (
                    transDate.getMonth() === timeFrameRange.start.getMonth() &&
                    transDate.getFullYear() === timeFrameRange.start.getFullYear()
                );
            }
            if (filter === "year") {
                return transDate.getFullYear() === timeFrameRange.start.getFullYear();
            }
            return t.category.toLowerCase() === filter.toLowerCase();
        });
    }, [timeFrameTransactions, filter, timeFrameRange]);

    const chartData = useMemo(() => {
        const data = chartPoints.map((point) => ({ ...point, income: 0 }));

        filteredTransactions.forEach((transaction) => {
            const transDate = new Date(transaction.date);
            const point = data.find((d) =>
                timeFrame === "daily"
                    ? d.hour === transDate.getHours()
                    : timeFrame === "yearly"
                        ? d.date.getMonth() === transDate.getMonth()
                        : d.date.getDate() === transDate.getDate() &&
                        d.date.getMonth() === transDate.getMonth()
            );
            if (point) point.income += Math.round(Number(transaction.amount));
        });

        return data;
    }, [filteredTransactions, chartPoints, timeFrame]);

    const fetchOverview = useCallback(async (range = timeFrame ?? "monthly") => {
        try {
            const res = await axios.get(`${API_BASE}/income/overview`, {
                headers: getAuthHeaders(),
                params: { range },
            });

            if (res.data?.success) {
                const payload = res.data.data ?? {};
                // You can store this in state if needed
            }
        } catch (err) {
            console.error("Failed to fetch income overview:", err);
        }
    }, [timeFrame, getAuthHeaders]);

    useEffect(() => {
        fetchOverview();
    }, [fetchOverview]);

    const totalIncome = useMemo(() =>
        filteredTransactions.reduce((sum, t) => sum + Math.round(Number(t.amount || 0)), 0),
        [filteredTransactions]
    );

    const averageIncome = useMemo(() =>
        filteredTransactions.length
            ? Math.round(totalIncome / filteredTransactions.length)
            : 0,
        [filteredTransactions, totalIncome]
    );

    const transactionsCount = filteredTransactions.length;

    const handleAddTransaction = useCallback(async () => {
        if (!newTransaction.description || !newTransaction.amount) return;

        try {
            setLoading(true);
            const payload = {
                description: newTransaction.description.trim(),
                amount: parseFloat(newTransaction.amount),
                category: newTransaction.category,
                date: toIsoWithClientTime(newTransaction.date),
            };

            await axios.post(`${API_BASE}/income/add`, payload, {
                headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            });

            await refreshTransactions();
            await fetchOverview();

            setNewTransaction({
                date: new Date().toISOString().split("T")[0],
                description: "",
                amount: "",
                type: "income",
                category: "Salary",
            });
            setShowModal(false);
        } catch (err) {
            console.error("Add income error:", err);
            alert(err?.response?.data?.message || "Failed to add income");
        } finally {
            setLoading(false);
        }
    }, [newTransaction, getAuthHeaders, refreshTransactions, fetchOverview]);

    const handleEditTransaction = useCallback(async () => {
        if (!editingId || !editForm.description || !editForm.amount) return;

        try {
            setLoading(true);
            const payload = {
                description: editForm.description.trim(),
                amount: parseFloat(editForm.amount),
                category: editForm.category,
                date: toIsoWithClientTime(editForm.date),
            };

            await axios.put(`${API_BASE}/income/update/${editingId}`, payload, {
                headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            });

            await refreshTransactions();
            await fetchOverview();
            setEditingId(null);
        } catch (err) {
            console.error("Update income error:", err);
            alert(err?.response?.data?.message || "Failed to update income");
        } finally {
            setLoading(false);
        }
    }, [editingId, editForm, getAuthHeaders, refreshTransactions, fetchOverview]);

    const handleDeleteTransaction = useCallback(async (id) => {
        if (!id || !window.confirm("Delete this income?")) return;

        try {
            setLoading(true);
            await axios.delete(`${API_BASE}/income/delete/${id}`, {
                headers: getAuthHeaders(),
            });
            await refreshTransactions();
            await fetchOverview();
        } catch (err) {
            console.error("Delete income error:", err);
            alert(err?.response?.data?.message || "Failed to delete income");
        } finally {
            setLoading(false);
        }
    }, [getAuthHeaders, refreshTransactions, fetchOverview]);

    const handleExport = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE}/income/downloadexcel`, {
                headers: getAuthHeaders(),
                responseType: "blob",
            });

            const blob = new Blob([res.data], { type: res.headers["content-type"] || "application/octet-stream" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `income_${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export failed, using fallback...");
            const exportData = filteredTransactions.map((t) => ({
                Date: new Date(t.date).toLocaleDateString(),
                Description: t.description,
                Category: t.category,
                Amount: t.amount,
                Type: "Income",
            }));
            exportToExcel(exportData, `income_${new Date().toISOString().slice(0, 10)}`);
        }
    }, [getAuthHeaders, filteredTransactions]);

    return (
        <div className="space-y-8  dark:bg-black">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900">Income</h1>
                    <p className="text-gray-600 mt-1">Track and manage all your income sources</p>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    disabled={loading}
                    className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-medium shadow-lg shadow-emerald-200 transition-all active:scale-95 disabled:opacity-70"
                >
                    <Plus size={22} />
                    Add Income
                </button>
            </div>

            {/* Time Frame Selector */}
            <div className="flex justify-center">
                <TimeFrame
                    timeFrame={timeFrame}
                    setTimeFrame={setTimeFrame}
                    options={["daily", "weekly", "monthly", "yearly"]}
                    color="teal"
                />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FinancialCard
                    icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
                    label="Total Income"
                    value={`₹${totalIncome.toLocaleString()}`}
                    additionalContent={
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-3">
                            <Calendar className="w-4 h-4" />
                            {timeFrameRange.label}
                        </div>
                    }
                />

                <FinancialCard
                    icon={<BarChart2 className="w-6 h-6 text-blue-600" />}
                    label="Average Income"
                    value={`₹${averageIncome.toLocaleString()}`}
                    additionalContent={
                        <div className="text-sm text-gray-500 mt-3">
                            {transactionsCount} transactions
                        </div>
                    }
                />

                <FinancialCard
                    icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
                    label="Total Transactions"
                    value={transactionsCount}
                    additionalContent={
                        <div className="text-sm text-gray-500 mt-3">
                            {filter === "all" ? "All records" : `${filter} only`}
                        </div>
                    }
                />
            </div>

            {/* Income Trend Chart */}
            <div className="bg-white rounded-3xl shadow-sm border  dark:bg-zinc-900 border-gray-100 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <BarChart2 className="w-7 h-7 text-emerald-600" />
                        <h3 className="text-2xl font-semibold text-gray-900  dark:text-white">
                            {timeFrame === "daily" ? "Hourly" : timeFrame === "yearly" ? "Monthly" : "Daily"} Income Trend
                            <span className="text-gray-500 text-lg ml-2">({timeFrameRange.label})</span>
                        </h3>
                    </div>
                </div>

                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <defs>
                                <linearGradient id="incomeBarGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" />
                                    <stop offset="100%" stopColor="#059669" />
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
                                formatter={(value) => [`₹${Math.round(value).toLocaleString()}`, "Income"]}
                                contentStyle={{
                                    backgroundColor: "#fff",
                                    border: "none",
                                    borderRadius: "12px",
                                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                                }}
                            />
                            <Bar
                                dataKey="income"
                                radius={[6, 6, 0, 0]}
                                barSize={24}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={INCOME_COLORS[index % INCOME_COLORS.length]}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100  dark:bg-black  p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <DollarSign className="w-7 h-7 text-emerald-600" />
                        <h3 className="text-2xl font-semibold">Income Transactions</h3>
                        <span className="text-gray-500">({timeFrameRange.label})</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-white border border-gray-300 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="all">All Transactions</option>
                            <option value="month">This Month</option>
                            <option value="year">This Year</option>
                            <option value="Salary">Salary</option>
                            <option value="Freelance">Freelance</option>
                            <option value="Investment">Investment</option>
                            <option value="Bonus">Bonus</option>
                            <option value="Other">Other</option>
                        </select>

                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-6 py-3 rounded-2xl font-medium transition"
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
                                type="income"
                                categoryIcons={CATEGORY_ICONS_Inc}
                                setEditingId={setEditingId}
                            />
                        ))}

                    {filteredTransactions.length === 0 && (
                        <div className="text-center py-16 text-gray-400">
                            <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-xl">No income recorded yet</p>
                            <p className="mt-2">Add your first income to get started</p>
                        </div>
                    )}

                    {!showAll && filteredTransactions.length > 8 && (
                        <button
                            onClick={() => setShowAll(true)}
                            className="w-full py-4 text-emerald-600 hover:bg-emerald-50 font-medium rounded-2xl flex items-center justify-center gap-2 mt-6 border border-emerald-200 hover:border-emerald-300 transition"
                        >
                            <Eye size={20} />
                            View All {filteredTransactions.length} Incomes
                        </button>
                    )}
                </div>
            </div>

            {/* Add Income Modal */}
            <AddTransactionModal
                showModal={showModal}
                setShowModal={setShowModal}
                newTransaction={newTransaction}
                setNewTransaction={setNewTransaction}
                handleAddTransaction={handleAddTransaction}
                loading={loading}
                type="income"
                title="Add New Income"
                buttonText="Add Income"
                categories={["Salary", "Freelance", "Investment", "Bonus", "Other"]}
                color="teal"
            />
        </div>
    );
};

export default Income;