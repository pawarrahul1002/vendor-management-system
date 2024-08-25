import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { TryCatch } from "../services/TryCatchBlock.js";

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "required username"],
    unique: true,
  },

  password: {
    type: String,
    required: [true, "required password"],
  },
});

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);

  this.password = await bcrypt.hash(this.password, salt);

  next();
});

export const UserModel = mongoose.model("User", UserSchema);

export const isPasswordMatching = TryCatch(async(realPassword, hashPassword)=>{

  //always passed stored hash password as second param -- imp
  const isMatch = await bcrypt.compare(realPassword, hashPassword);
  return isMatch;
})