import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';


const ConnectDB = async () => {
    try{

        //waiting for mongoose to connect
        await mongoose.connect(process.env.MONGODB_URI)

        console.log('✅ Database connected successfully.');


    }
    catch(error) {
        console.error('❌ Database connection error:', error); 
        process.exit(1); //exit after connection is not established
    }
}

export default ConnectDB;