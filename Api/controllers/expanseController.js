import expanseModel from "../models/expanseModel.js";
// import incomeModel from "../models/incomeModel";
import getDateRange from "../utils/dataFilter.js";
import XLSX from "xlsx";

// add expanses

export async function addExpanse(req, res) {
    const userId = req.user._id;

    const { description, amount, category, date } = req.body;
    console.log("I am Expanse Controllers.");
    console.log(req.body);
    try {
        if (!description || !amount || !category || !date) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }
        const newExpanse = new expanseModel({
            userId,
            description,
            amount,
            category,
            date: new Date(date)
        });
        await newExpanse.save();
        res.json({
            success: true,
            message: "Expanse added successfully!",
        })

    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server Error.."
        });
    }
}

// to all expanse

export async function getAllExpanse(req, res) {
    const userId = req.user._id;
    try {
        const expanse = await expanseModel
            .find({ userId })
            .sort({ date: -1 });

        return res.json(expanse);

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// to update the expanse

export async function updateExpanse(req, res) {
    const { id } = req.params;
    const userId = req.user._id;

    const { description, amount } = req.body;

    try {

        const updatedExpanse = await expanseModel.findOneAndUpdate(
            { _id: id, userId },
            {
                description,
                amount,
            },
            { new: true }
        );

        if (!updatedExpanse) {
            return res.status(404).json({
                success: false,
                message: "Expanse not found"
            });
        }

        return res.json({
            success: true,
            message: "Expanse updated successfully",
            data: updatedExpanse
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

//delete an expanse
export async function deleteExpanse(req, res) {
    try {

        const expanse = await expanseModel.findByIdAndDelete({
            _id: req.params.id,
        });

        if (!expanse) {
            return res.status(404).json({
                success: false,
                message: "Expanse not found"
            });
        }

        return res.json({
            success: true,
            message: "Expanse deleted successfully",
            data: expanse,
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }
}

// download excel for expanse
export async function downloadExpanseExcel(req, res) {
    const userId = req.user._id;
    try {
        const expanse = await expanseModel
            .find({ userId })
            .sort({ date: -1 });

        const plainData = expanse.map((exp) => ({
            Description: exp.description,
            Amount: exp.amount,
            Category: exp.category,
            Date: new Date(exp.date).toLocaleDateString()
        }));

        const worksheet = XLSX.utils.json_to_sheet(plainData);

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "expanseModel");
        XLSX.writeFile(workbook, "expanse_details.xlsx");
        res.download("expanse_details.xlsx");

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// to get overview of expanses
export async function getExpanseOverview(req, res) {
    try {
        const userId = req.user._id;
        const { range = "monthly" } = req.query;
        const { start, end } = getDateRange(range);

        const expense = await expanseModel.find({
            userId,
            date: { $gte: start, $lte: end },
        }).sort({ date: -1 })

        const totalExpense = expense.reduce((acc, cur) => acc + cur.amount, 0);
        const averageExpense =
            expense.length > 0 ? totalExpense / expense.length : 0;
        const numberOfTransactions = expense.length;
        const recentTransactions = expense.slice(0, 5);

        res.json({
            success: true,
            data: {
                totalExpense,
                averageExpense,
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