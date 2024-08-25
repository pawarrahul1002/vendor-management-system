import jwt from "jsonwebtoken";

// import { TryCatch } from "./TryCatchBlock";

// const auth = (req, res, next) => {
//     const token = req.header('Authorization').replace('Bearer ', '');
//     if (!token) return res.status(401).json({ error: 'No token, authorization denied' });

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         req.user = decoded.userId;
//         next();
//     } catch (error) {
//         res.status(401).json({ error: 'Token is not valid' });
//     }
// };

export const isAuthorized = (req, res, next) => {


  try {
    // console.log("reached");
  const token = req.header("Authorization").replace("Bearer ", "");
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No token found, access denied" });
  }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedToken.userId;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "No token found, access denied" });
  }
};
