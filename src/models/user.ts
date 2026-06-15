import mongoose from "mongoose";
export interface IUser {
    email: string;
    fullName?: string;
    password: string;
    role?: "user" | "admin";
}
const userSchema = new mongoose.Schema<IUser>({
    email: { type: String, required: true, unique: true },
    fullName: { type: String },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;