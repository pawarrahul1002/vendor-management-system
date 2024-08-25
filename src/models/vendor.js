import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema({
    
    vendorCode: { 
        type: String, 
        required: [true,"Vendor id is required"], 
        unique: true 
    },
    name: {
        type: String,
        required: [true,"Name is required"],
    },
    contactDetails: {
        type: String,
        required: [true,"Contact details are required"],
    },
    address: {
        type: String,
        required: [true, "Address required"],
    },
    onTimeDeliveryRate: {
        type: Number,
        default: 0,
    },
    qualityRatingAvg: {
        type: Number,
        default: 0,
    },
    averageResponseTime:
    {
        type: Number,
        default: 0
    },
    fulfillmentRate: {
        type: Number,
        default: 0,
    },
});

const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;
