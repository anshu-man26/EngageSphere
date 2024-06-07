import mongoose, { mongo } from "mongoose";
const connectToMongoDB=async()=>{
    try {
        await mongoose.connect(process.env.MONGO_DB_URL)
        console.log("Bhai database Changa Si")
        
    } catch (error) {
        console.log(error.message)
    }
}
export default connectToMongoDB;