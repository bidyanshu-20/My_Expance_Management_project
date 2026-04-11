import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// console.log(process.env.MONGO_URI);
export const connectDB = async () => {
    await mongoose.connect(process.env.MONGO_URI).then(() => {
        console.log("DB ConnecTed");
    })
}