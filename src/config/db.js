import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        // console.log("MONGO_URI :: ",process.env.MONGO_URI);
        const connection = await mongoose.connect(process.env.MONGO_URI, { dbName: "vms_db" });
        // console.log(`db connected to ${connection.connection.host}`);
    } catch (error) {
        console.error('Error connecting to the database:', error);
    }
};
