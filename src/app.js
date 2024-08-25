import express from "express";
import { connectDB } from "./config/db.js";
import { config } from "dotenv";
import vendorRoutes from "./routes/vendorRoutes.js"
import purchaseOrder from "./routes/purchaseOrderRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import { ErrorMiddleware } from "./services/ErrorMiddleware.js";
import { isAuthorized } from "./services/authMiddleware.js";

const app = express();

//pushing .env file to git as it is not containg any sensitive data
config();

app.use(express.json());
const port = process.env.PORT;

app.get("/", (req, res) => {
  // console.log("This is  deffault route");
  res.send("This is default route");
});

app.use('/user',userRoutes);
app.use("/vendors",isAuthorized,vendorRoutes);
app.use("/purchase-orders",isAuthorized,purchaseOrder);
connectDB();

app.use(ErrorMiddleware);
app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});
