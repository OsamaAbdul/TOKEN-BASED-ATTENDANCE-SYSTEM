import mongoose from "mongoose";

const codeSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  courseCode: { type: String, required: true },
  isUsed: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
  usedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  usedAt: Date,
});

export default mongoose.model("Code", codeSchema);