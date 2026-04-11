import express from 'express';
import authMiddleware from "../middleware/auth.js";
import { addExpanse, deleteExpanse, downloadExpanseExcel, getAllExpanse, getExpanseOverview, updateExpanse } from '../controllers/expanseController.js';
const expenseRouter = express.Router();

expenseRouter.post("/add",authMiddleware,addExpanse);
expenseRouter.get("/get",authMiddleware,getAllExpanse);
expenseRouter.put("/update/:id",authMiddleware,updateExpanse);
expenseRouter.get("/downloadexcel",authMiddleware,downloadExpanseExcel);

expenseRouter.delete("/delete/:id",authMiddleware,deleteExpanse);
expenseRouter.get("/overview",authMiddleware,getExpanseOverview);


export default expenseRouter;