import incomeModel from "../models/incomeModel.js";
import XLSX from "xlsx";
import getDateRange from "../utils/dataFilter.js";

// ==============================
// Add Income
// ==============================
export async function addIncome(req, res) {

    const userId = req.user._id;
    const { description, amount, category, date } = req.body;
    // console.log(" ai mmmmmmmm");
    // console.log(req.body);
    try {

        if (!description || !amount || !category || !date) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const newIncome = new incomeModel({
            userId,
            description,
            amount,
            category,
            date: new Date(date)
        });

        await newIncome.save();

        return res.status(201).json({
            success: true,
            message: "Income added successfully",
            data: newIncome
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }
}


// ==============================
// Get All Income
// ==============================
export async function getAllIncome(req, res) {

    const userId = req.user._id;

    try {

        const income = await incomeModel
            .find({ userId })
            .sort({ date: -1 });

        return res.json({
            success: true,
            count: income.length,
            data: income
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }
}


// ==============================
// Update Income
// ==============================
export async function updateIncome(req, res) {

    const { id } = req.params;
    const userId = req.user._id;

    const { description, amount, category, date } = req.body;

    try {

        const updatedIncome = await incomeModel.findOneAndUpdate(
            { _id: id, userId },
            {
                description,
                amount,
            },
            { new: true }
        );

        if (!updatedIncome) {
            return res.status(404).json({
                success: false,
                message: "Income not found"
            });
        }

        return res.json({
            success: true,
            message: "Income updated successfully",
            data: updatedIncome
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }
}


// ==============================
// Delete Income
// ==============================
export async function deleteIncome(req, res) {

    // const { id } = req.params;
    // const userId = req.user._id;

    try {

        const income = await incomeModel.findByIdAndDelete({
            _id: req.params.id,
        });

        if (!income) {
            return res.status(404).json({
                success: false,
                message: "Income not found"
            });
        }

        return res.json({
            success: true,
            message: "Income deleted successfully"
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }
}


// ==============================
// Download Excel
// ==============================
export async function downloadIncomeExcel(req, res) {

    const userId = req.user._id;

    try {

        const income = await incomeModel
            .find({ userId })
            .sort({ date: -1 });

        const plainData = income.map((inc) => ({
            Description: inc.description,
            Amount: inc.amount,
            Category: inc.category,
            Date: new Date(inc.date).toLocaleDateString()
        }));

        const worksheet = XLSX.utils.json_to_sheet(plainData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "incomeModel");
        XLSX.writeFile(workbook, "income_details.xlsx");
        res.download("income_details.xlsx");

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}


// to get the income overview
export async function getIncomeOverView(req, res) {
    try {
        const userId = req.user._id;
        const { range = "monthly" } = req.query;
        const { start, end } = getDateRange(range);

        const income = await incomeModel.find({
            userId,
            date: { $gte: start, $lte: end },
        }).sort({ date: -1 })

        const totalIncome = income.reduce((acc, cur) => acc + cur.amount, 0);
        const averageIncome = income.length > 0 ? totalIncome / income.length : 0;
        const numberOfTransactions = income.length;
        const recentTransactions = income.slice(0, 9);
        res.json({
            success: true,
            data: {
                totalIncome,
                averageIncome,
                numberOfTransactions,
                recentTransactions,
                range
            }
        })
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}