import mongoose from "mongoose";

const performanceScehma = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: true,
  },
  onTimeDeliveryRate: {
    value: {
      type: Number,
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  qualityRatingAvg: {
    value: {
      type: Number,
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  avgResponseTime: {
    value: { type: Number, required: true },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  fulfillmentRate: {
    value: { type: Number, required: true },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
});

const PerformanceModel = mongoose.model("PerformanceModel", performanceScehma);

performanceScehma.pre("save", function (next) {
  const fieldsToUpdate = Object.keys(this._update || {});

  fieldsToUpdate.forEach((field) => {
    if (this.isModified(`${field}.value`)) {
      this.set(`${field}.updatedAt`, Date.now());
    }
  });

  next();
  
});

export default PerformanceModel;
