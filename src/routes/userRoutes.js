import express from "express";
import { loginUser, registerUser } from "../controllers/userController.js";
import { isAuthorized } from "../services/authMiddleware.js";

const router = express.Router();

router.post("/register",registerUser);
router.post("/login",loginUser);
router.get("/profile",isAuthorized,(req,res)=>{
    return res.status(200).json({success:true,message:"Welcome User"});
})

export default router;