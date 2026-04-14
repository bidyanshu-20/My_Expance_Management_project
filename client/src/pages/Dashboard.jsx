import React, { useEffect, useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';

import AddTransactionModel from '../components/Add';
import { 
    GAUGE_COLORS, 
    COLORS, 
    INCOME_CATEGORY_ICONS, 
    EXPENSE_CATEGORY_ICONS 
} from '../assets/color';

import { 
    ArrowDown, 
    TrendingUp, 
    TrendingDown, 
    PieChart as PieChartIcon, 
    BarChart2, 
    ChevronDown, 
    ChevronUp, 
    DollarSign, 
    PiggyBank, 
    Plus, 
    ShoppingCart, 
    Wallet 
} from 'lucide-react';

import { 
    getTimeFrameRange, 
    getPreviousTimeFrameRange, 
    calculateData 
} from '../components/Helpers';

import FinancialCard from '../components/FinancialCard';
import GaugeCard from '../components/GaugeCard';

import { Legend, Pie, ResponsiveContainer, Tooltip, PieChart, Cell } from 'recharts';

const getAuthHeader = () => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

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

const Dashboard = () => {
    const {
        transactions: outletTransactions = [],
        timeFrame = "monthly",
        setTimeFrame = () => {},
        refreshTransactions
    } = useOutletContext();

    const [showModal, setShowModal] = useState(false);
    const [gaugeData, setGaugeData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [overviewMeta, setOverviewMeta] = useState({});
    const [showAllIncome, setShowAllIncome] = useState(false);
    const [showAllExpense, setShowAllExpense] = useState(false);

    const [newTransaction, setNewTransaction] = useState({
        date: new Date().toISOString().split("T")[0],
        description: "",
        amount: "",
        type: "expense",
        category: "Food",
    });

    const timeFrameRange = useMemo(() => getTimeFrameRange(timeFrame), [timeFrame]);
    const prevTimeFrameRange = useMemo(() => getPreviousTimeFrameRange(timeFrame), [timeFrame]);

    const isDateInRange = (date, start, end) => {
        const transactionDate = new Date(date);
        const startDate = new Date(start);
        const endDate = new Date(end);
        transactionDate.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        return transactionDate >= startDate && transactionDate <= endDate;
    };

    const filteredTransactions = useMemo(() =>
        (outletTransactions || []).filter((t) =>
            isDateInRange(t.date, timeFrameRange.start, timeFrameRange.end)
        ), [outletTransactions, timeFrameRange]);

    const prevFilteredTransactions = useMemo(() =>
        (outletTransactions || []).filter((t) =>
            isDateInRange(t.date, prevTimeFrameRange.start, prevTimeFrameRange.end)
        ), [outletTransactions, prevTimeFrameRange]);

    const currentTimeFrameData = useMemo(() => {
        const data = calculateData(filteredTransactions);
        data.savings = data.income - data.expenses;
        return data;
    }, [filteredTransactions]);

    const prevTimeFrameData = useMemo(() => {
        const data = calculateData(prevFilteredTransactions);
        data.savings = data.income - data.expenses;
        return data;
    }, [prevFilteredTransactions]);

    // Gauge Data
    useEffect(() => {
        const maxValues = {
            income: Math.max(currentTimeFrameData.income, 5000),
            expenses: Math.max(currentTimeFrameData.expenses, 3000),
            savings: Math.max(Math.abs(currentTimeFrameData.savings), 2000),
        };

        setGaugeData([
            { name: "Income", value: currentTimeFrameData.income, max: maxValues.income },
            { name: "Spent", value: currentTimeFrameData.expenses, max: maxValues.expenses },
            { name: "Savings", value: currentTimeFrameData.savings, max: maxValues.savings },
        ]);
    }, [currentTimeFrameData]);

    const displayIncome = timeFrame === "monthly" && typeof overviewMeta.monthlyIncome === "number"
        ? overviewMeta.monthlyIncome
        : currentTimeFrameData.income;

    const displayExpenses = timeFrame === "monthly" && typeof overviewMeta.monthlyExpense === "number"
        ? overviewMeta.monthlyExpense
        : currentTimeFrameData.expenses;

    const displaySavings = timeFrame === "monthly" && typeof overviewMeta.savings === "number"
        ? overviewMeta.savings
        : currentTimeFrameData.savings;

    const expenseChange = useMemo(() => {
        const prev = prevTimeFrameData.expenses;
        const curr = displayExpenses;
        if (!prev) return curr ? 100 : 0;
        return Math.round(((curr - prev) / prev) * 100);
    }, [prevTimeFrameData.expenses, displayExpenses]);

    // Expense Distribution for Pie Chart
    const financialOverviewData = useMemo(() => {
        if (timeFrame === "monthly" && overviewMeta.expenseDistribution?.length > 0) {
            return overviewMeta.expenseDistribution.map((d) => ({
                name: d.category,
                value: Math.round(Number(d.amount) || 0),
            }));
        }

        const categories = {};
        filteredTransactions.forEach((t) => {
            if (t.type === "expense") {
                categories[t.category] = (categories[t.category] || 0) + t.amount;
            }
        });

        return Object.keys(categories).map((category) => ({
            name: category,
            value: Math.round(categories[category]),
        }));
    }, [filteredTransactions, overviewMeta, timeFrame]);

    // Recent Transactions
    const incomeListForDisplay = timeFrame === "monthly" && overviewMeta.recentTransactions
        ? overviewMeta.recentTransactions.filter(t => t.type === "income")
        : filteredTransactions.filter(t => t.type === "income").sort((a, b) => new Date(b.date) - new Date(a.date));

    const expenseListForDisplay = timeFrame === "monthly" && overviewMeta.recentTransactions
        ? overviewMeta.recentTransactions.filter(t => t.type === "expense")
        : filteredTransactions.filter(t => t.type === "expense").sort((a, b) => new Date(b.date) - new Date(a.date));

    const displayedIncome = showAllIncome ? incomeListForDisplay : incomeListForDisplay.slice(0, 3);
    const displayedExpense = showAllExpense ? expenseListForDisplay : expenseListForDisplay.slice(0, 3);

    // Fetch Dashboard Overview
    const fetchDashboardOverview = async () => {
        try {
            setLoading(true);
            const res = await axios.get("/api/dashboard", { headers: getAuthHeader() });

            if (res?.data?.success) {
                const data = res.data.data;
                const recent = (data.recentTransactions || []).map((item) => ({
                    id: item._id || Date.now(),
                    date: item.date || item.createdAt || new Date().toISOString(),
                    description: item.description || item.note || item.title || "Transaction",
                    amount: Number(item.amount) || 0,
                    type: item.type || (item.category ? "expense" : "income"),
                    category: item.category || (item.type === "income" ? "Salary" : "Other"),
                }));

                setOverviewMeta({
                    monthlyIncome: Number(data.monthlyIncome || 0),
                    monthlyExpense: Number(data.monthlyExpense || 0),
                    savings: Number(data.savings ?? (data.monthlyIncome - data.monthlyExpense)),
                    savingsRate: data.savingsRate,
                    expenseDistribution: data.expenseDistribution || [],
                    recentTransactions: recent,
                });
            }
        } catch (err) {
            console.error("Failed to fetch dashboard overview:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardOverview();
    }, []);

    const handleAddTransaction = async () => {
        if (!newTransaction.description || !newTransaction.amount) return;

        const payload = {
            date: toIsoWithClientTime(newTransaction.date),
            description: newTransaction.description,
            amount: parseFloat(newTransaction.amount),
            category: newTransaction.category,
        };

        try {
            setLoading(true);
            if (newTransaction.type === "income") {
                await axios.post("/api/income/add", payload, { headers: getAuthHeader() });
            } else {
                await axios.post("/api/expense/add", payload, { headers: getAuthHeader() });
            }

            await refreshTransactions();
            await fetchDashboardOverview();
            setShowModal(false);

            setNewTransaction({
                date: new Date().toISOString().split("T")[0],
                description: "",
                amount: "",
                type: "expense",
                category: "Food",
            });
        } catch (err) {
            console.error("Failed to add transaction:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen dark:bg-black bg-gray-50 p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900">Finance Dashboard</h1>
                    <p className="text-gray-600 mt-1">Track your income and expenses effortlessly</p>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-medium shadow-lg shadow-indigo-200 transition-all active:scale-95"
                >
                    <Plus size={22} />
                    Add Transaction
                </button>
            </div>

            {/* Time Frame Selector */}
            <div className="flex justify-center mb-10">
                <div className="inline-flex bg-white rounded-3xl p-1 shadow-sm border border-gray-100">
                    {["daily", "weekly", "monthly"].map((frame) => (
                        <button
                            key={frame}
                            onClick={() => setTimeFrame(frame)}
                            className={`px-8 py-3 text-sm font-semibold rounded-3xl transition-all ${
                                timeFrame === frame
                                    ? "bg-indigo-600 text-white shadow"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            {frame.charAt(0).toUpperCase() + frame.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <FinancialCard
                    icon={<Wallet className="w-6 h-6 text-teal-600" />}
                    label="Total Balance"
                    value={`₹${Math.round(displayIncome - displayExpenses).toLocaleString()}`}
                    additionalContent={
                        <div className="flex items-center gap-3 text-sm mt-3">
                            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
                                +₹{Math.round(displayIncome).toLocaleString()}
                            </span>
                            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                                -₹{Math.round(displayExpenses).toLocaleString()}
                            </span>
                        </div>
                    }
                />

                <FinancialCard
                    icon={<ArrowDown className="w-6 h-6 text-orange-600" />}
                    label={`${timeFrameRange.label} Expenses`}
                    value={`₹${Math.round(displayExpenses).toLocaleString()}`}
                    additionalContent={
                        <div className={`mt-3 flex items-center gap-2 text-sm ${expenseChange >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {expenseChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            <span>{Math.abs(expenseChange)}% from last {prevTimeFrameRange.label}</span>
                        </div>
                    }
                />

                <FinancialCard
                    icon={<PiggyBank className="w-6 h-6 text-cyan-600" />}
                    label={`${timeFrameRange.label} Savings`}
                    value={`₹${Math.round(displaySavings).toLocaleString()}`}
                    additionalContent={
                        <div className="mt-3 flex items-center gap-2 text-sm text-cyan-600">
                            <BarChart2 className="w-4 h-4" />
                            <span>{displayIncome > 0 ? Math.round((displaySavings / displayIncome) * 100) : 0}% of Income</span>
                        </div>
                    }
                />
            </div>

            {/* Gauge Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {gaugeData.map((gauge) => (
                    <GaugeCard
                        key={gauge.name}
                        gauge={gauge}
                        colorInfo={GAUGE_COLORS[gauge.name]}
                        timeFrameLabel={timeFrameRange.label}
                    />
                ))}
            </div>

            {/* Expense Distribution Pie Chart */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-12">
                <div className="flex items-center gap-3 mb-8">
                    <PieChartIcon className="w-7 h-7 text-teal-600" />
                    <h3 className="text-2xl font-semibold text-gray-900">
                        Expense Distribution <span className="text-gray-500 text-lg">({timeFrameRange.label})</span>
                    </h3>
                </div>

                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={financialOverviewData}
                                cx="50%"
                                cy="50%"
                                innerRadius={75}
                                outerRadius={120}
                                paddingAngle={4}
                                dataKey="value"
                            >
                                {financialOverviewData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                        stroke="#fff"
                                        strokeWidth={3}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value) => [`₹${value.toLocaleString()}`, "Amount"]}
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                                }}
                            />
                            <Legend
                                layout="horizontal"
                                verticalAlign="bottom"
                                align="center"
                                iconType="circle"
                                iconSize={10}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Income */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-7 h-7 text-green-600" />
                            <h3 className="text-2xl font-semibold">Recent Income</h3>
                        </div>
                        <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-2xl text-sm font-medium">
                            {incomeListForDisplay.length} records
                        </span>
                    </div>

                    <div className="space-y-4">
                        {displayedIncome.length > 0 ? (
                            displayedIncome.map((t) => {
                                const Icon = INCOME_CATEGORY_ICONS[t.category] || INCOME_CATEGORY_ICONS.Other;
                                return (
                                    <div key={t.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
                                                {Icon}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{t.description}</p>
                                                <p className="text-sm text-gray-500">{t.category}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-green-600">+₹{Math.abs(t.amount).toLocaleString()}</p>
                                            <p className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString('en-IN')}</p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                No income transactions yet
                            </div>
                        )}
                    </div>

                    {incomeListForDisplay.length > 3 && (
                        <button
                            onClick={() => setShowAllIncome(!showAllIncome)}
                            className="mt-6 w-full py-3 text-indigo-600 font-medium hover:bg-indigo-50 rounded-2xl transition flex items-center justify-center gap-2"
                        >
                            {showAllIncome ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            {showAllIncome ? "Show Less" : `View All (${incomeListForDisplay.length})`}
                        </button>
                    )}
                </div>

                {/* Recent Expenses */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <ArrowDown className="w-7 h-7 text-orange-600" />
                            <h3 className="text-2xl font-semibold">Recent Expenses</h3>
                        </div>
                        <span className="bg-orange-100 text-orange-700 px-4 py-1.5 rounded-2xl text-sm font-medium">
                            {expenseListForDisplay.length} records
                        </span>
                    </div>

                    <div className="space-y-4">
                        {displayedExpense.length > 0 ? (
                            displayedExpense.map((t) => {
                                const Icon = EXPENSE_CATEGORY_ICONS[t.category] || EXPENSE_CATEGORY_ICONS.Other;
                                return (
                                    <div key={t.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                                                {Icon}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{t.description}</p>
                                                <p className="text-sm text-gray-500">{t.category}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-red-600">-₹{Math.abs(t.amount).toLocaleString()}</p>
                                            <p className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString('en-IN')}</p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                No expense transactions yet
                            </div>
                        )}
                    </div>

                    {expenseListForDisplay.length > 3 && (
                        <button
                            onClick={() => setShowAllExpense(!showAllExpense)}
                            className="mt-6 w-full py-3 text-indigo-600 font-medium hover:bg-indigo-50 rounded-2xl transition flex items-center justify-center gap-2"
                        >
                            {showAllExpense ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            {showAllExpense ? "Show Less" : `View All (${expenseListForDisplay.length})`}
                        </button>
                    )}
                </div>
            </div>

            <AddTransactionModel
                showModal={showModal}
                setShowModal={setShowModal}
                newTransaction={newTransaction}
                setNewTransaction={setNewTransaction}
                handleAddTransaction={handleAddTransaction}
                loading={loading}
            />
        </div>
    );
};

export default Dashboard;