import express from "express";
import {
  createVendor,
  deleteVendorFromId,
  getAllVendors,
  getPerformance,
  getVendorFromId,
  updateVendorFromId,
} from "../controllers/vendorcontroller.js";

const router = express.Router();

// const vendorController =

router.post("/", createVendor);
router.get("/", getAllVendors);
router.get("/:id", getVendorFromId);
router.put("/:id", updateVendorFromId);
router.delete("/:id", deleteVendorFromId);
router.get("/performance/:id", getPerformance);

// router
//   .use("/:id")
//   .get(getVendorFromId)
//   .put(updateVendorFromId)
//   .delete(deleteVendorFromId);

export default router;
