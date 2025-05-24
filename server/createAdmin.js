import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { Admin } from "./models/Admin.js";

const createFirstAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect("mongodb://127.0.0.1:27017/classroom-attendance")
     .then(()=> {
        console.log("Connected successfully")
     }).catch((error)=> {
        console.log("Cannot connect to the database to create admin")
     });

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: "admin@gmail.com" });
    if (existingAdmin) {
      console.log("Admin with email admin@gmail.com already exists");
      return;
    }

    // Create and save admin
    const admin = new Admin({
      adminType: "Super Admin",
      email: "admin@gmail.com",
      password: await bcrypt.hash("admin", 10),
      role: "admin",
    });
    await admin.save();
    console.log("Admin added successfully");
  } catch (error) {
    console.error("Error creating admin:", error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
};

// Execute the function
createFirstAdmin().then(() => {
  process.exit(0); // Exit with success
}).catch((error) => {
  console.error("Script failed:", error);
  process.exit(1); // Exit with failure
});