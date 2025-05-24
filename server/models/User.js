import mongoose from "mongoose";



const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  department: { type: String, required: true },
  matric: { type: String, required: true, unique: true },
  role: {
    type: String,
    default: "student",
    required: true,
    immutable: true, // Prevent changing role
  },
  attendance: [{
    token: String,
    courseCode: String,
    date: Date,
    submittedAt: Date,
  }]
});




const User = mongoose.model("User", userSchema);

export default User;