import incomeModel from "../models/incomeModel.js";
import expanseModel from "../models/expanseModel.js";

export async function getDashboardOverview(req, res) {
    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    try {
        const income = await incomeModel.find({
            userId,
            date: { $gte: startOfMonth, $lte: now },
        }).lean();

        const expense = await expanseModel.find({
            userId,
            date: { $gte: startOfMonth, $lte: now },
        }).lean();

        const monthlyIncome = income.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
        const monthlyExpense = expense.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
        const savings = monthlyIncome - monthlyExpense;
        const savingsRate = monthlyIncome === 0 ? 0 : Math.round((savings / monthlyIncome) * 100);

        const recentTransactions = [
            ...income.map((i) => ({ ...i, type: "income" })),
            ...expense.map((e) => ({ ...e, type: "expense" })),
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const spendByCategory = {};
        for (const exp of expense) {
            const cat = exp.category || "Other";
            spendByCategory[cat] = (spendByCategory[cat] || 0) + Number(exp.amount || 0);
        }

        const expenseDistribution = Object.entries(spendByCategory).map(([category, amount]) => ({
            category,
            amount,
            percent: monthlyExpense === 0 ? 0 : Math.round((amount / monthlyExpense) * 100),
        }));  // for chart

        return res.status(200).json({
            success:true,
            data:{
              monthlyIncome,
              monthlyExpense,
              savings,
              savingsRate,
              recentTransactions,
              spendByCategory,
              expenseDistribution
            }
        })
        
    }
    catch (error) {
       console.error("GetDashboardOverview Error",error);
       return res.status(500).json({
         success:false,
         messsage:"Dashboard fetch failed"
       })

    }
}