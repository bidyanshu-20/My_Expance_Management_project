import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        reqired: true,
    },
    email: {
        type: String,
        reqired: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    }
});
const User = mongoose.models.user || mongoose.model("userinfo", userSchema);
export default User;