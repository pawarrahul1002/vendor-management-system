import express from "express";
import {
  acknoweldgePO,
  createPurchaseOrder,
  deletePurchaseOrderById,
  getAllPOs,
  getPurchaseOrderById,
  issuePO,
  updatePOById,
} from "../controllers/purchaseOrderController.js";

const router = express.Router();

router.post("/", createPurchaseOrder);
router.get("/", getAllPOs);
router.get("/:id", getPurchaseOrderById);
router.put("/:id", updatePOById);
router.delete("/:id", deletePurchaseOrderById);
router.put("/acknowledge/:id", acknoweldgePO);
router.put("/issue-po/:id", issuePO);

export default router;
