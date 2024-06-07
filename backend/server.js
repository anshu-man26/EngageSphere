import express from "express"
import dotenv from "dotenv"
import authRoutes from "./routes/auth.routes.js"
import messageRoutes from "./routes/message.routes.js"

import connectToMongoDB from "./DB/mongoDB.js";
const app=express();
const PORT=process.env.PORT || 5000;
dotenv.config();
app.use(express.json());
app.use("/",authRoutes)
app.use("/api/messages",messageRoutes)
// app.get('/',(req,res)=>{
//     res.send("helo world");
// })

app.listen(PORT,()=>{
    connectToMongoDB()
    console.log('server running on port '+ PORT)

}); 