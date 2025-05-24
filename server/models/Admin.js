import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  adminType: { type: String, required: true }, // e.g., "lecturer", "department_head"
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    default: "admin",
    required: true,
    immutable: true, // Prevent changing role
  },
  createdAt: { type: Date, default: Date.now },
});



// Export models
export const Admin = mongoose.model("Admin", adminSchema);
