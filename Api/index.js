import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db.js';
import userRouter from './routes/userRoute.js';
import incomeRouter from './routes/incomeRoute.js'
import expenseRouter from './routes/expenseRoute.js';
import dashboardRouter from './routes/dashboardRoute.js';
dotenv.config();
const app = express();



app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
connectDB();


app.use("/api/user", userRouter);
app.use("/api/income", incomeRouter);
app.use("/api/expense",expenseRouter);
app.use("/api/dashboard",dashboardRouter);

app.get("/", (req, res) => {
    res.send({ name: "Bidyanshu", bestGirl: "Prachi" });
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is Running At Port ${PORT}`);
});