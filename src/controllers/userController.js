import { UserModel, isPasswordMatching } from "../models/UserModel.js";
import ErrorHandler from "../services/errorHandler.js";
import { TryCatch } from "../services/TryCatchBlock.js";
import jwt from "jsonwebtoken";

export const registerUser = TryCatch(async (req, res, next) => {
  const { username, password } = req.body;
  // console.log(username,password);
  if (!username || !password) {
    next(new ErrorHandler("Please add username and password", 400));
  }

  const isUserExists = await UserModel.findOne({ username });

  if (isUserExists) {
    return next(new ErrorHandler("User already exists", 400));
  }

  const newUser = new UserModel({ username, password });
  await newUser.save();
  return res
    .status(201)
    .json({ success: true, message: "User registered successfully" });
});

export const loginUser = TryCatch(async (req, res, next) => {
  const { username, password } = req.body;
  // console.log(username, password);
  if (!username || !password) {
    next(new ErrorHandler("Please add username and password", 400));
  }

  const user = await UserModel.findOne({ username });

  if (!user) {
    return next(new ErrorHandler("Invalid username or password", 400));
  }

  const isMatch = await isPasswordMatching(password, user.password);
  // const isMatch =  await bcrypt.compare(password, user.password);
  // console.log("reached");

  if (!isMatch) {
    return next(new ErrorHandler("Invalid username or password", 400));
  }

  // console.log(process.env.JWT_SECRET);

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  // res.json({ token });

  return res
    .status(201)
    .json({ success: true, message: "User login successfully", token: token });
});
