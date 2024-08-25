import mongoose from "mongoose";

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: {
    type: String,
    unique: true,
    require: [true, "Required PO Number"],
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    require: [true, "Required vendor ID"],
  },
  orderDate: {
    type: Date,
    require: [true, "Required orderDate"],
  },
  deliveryDate: {
    type: Date,
    require: [true, "Required deliveryDate"],
  },
  actualDeliveryDate: {
    type: Date,
    default: null,  
  },
  items: {
    type: Array,
    require: [true, "Required items data"],
  },
  quantity: {
    type: Number,
    require: [true, "Required quantity"],
  },
  status: {
    type: String,
    enum: ["pending", "completed", "canceled"],
    default: "pending",
  },
  qualityRating: {
    type: Number,
    default: null,
  },
  issueDate: {
    type: Date,
    default: null,
  },
  acknowledgmentDate: {
    type: Date,
    default: null,
  },
});

const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);

export default PurchaseOrder;
