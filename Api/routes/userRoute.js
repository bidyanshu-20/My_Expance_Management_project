import express from 'express';
import { getCurrentUser, login, signup, updatePassword, updateProfile } from '../controllers/userController.js';
import authMiddleware from '../middleware/auth.js';
const userRouter = express.Router();
userRouter.post("/signup",signup);
userRouter.post("/login",login);

// protected routes
userRouter.get("/me",authMiddleware,getCurrentUser);
userRouter.put("/profile",authMiddleware,updateProfile);
userRouter.put("/password",authMiddleware,updatePassword);

export default userRouter;