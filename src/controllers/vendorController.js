import { isValidObjectId } from "mongoose";
import Vendor from "../models/vendor.js";
import ErrorHandler from "../services/errorHandler.js";
import { TryCatch } from "../services/TryCatchBlock.js";
import PerformanceModel from "../models/historicPerformanceModel.js";

export const createVendor = TryCatch(async (req, res, next) => {
  const {
    vendorCode,
    name,
    contactDetails,
    address,
    onTimeDeliveryRate,
    qualityRatingAvg,
    averageResponseTime,
    fulfillmentRate,
  } = req.body;

  if (!vendorCode) {
    return next(new ErrorHandler("Please enter valid vendor code", 400));
  }

  let vendor = await Vendor.findOne({ vendorCode });
  // console.log("vendor : ", vendor);
  if (vendor) {
    return res.status(200).json({
      success: true,
      message: `vendor ${vendor.name} is already present in database`,
    });
  }

  if (!name || !contactDetails || !address) {
    const requiredFields = ["name", "contactDetails", "address"];
    const missingFields = requiredFields.filter((field) => !req.body[field]);
    return next(
      new ErrorHandler(`Please enter: ${missingFields.join(", ")}`, 400)
    );
  }

  vendor = await Vendor.create({
    vendorCode,
    name,
    contactDetails,
    address,
    onTimeDeliveryRate,
    qualityRatingAvg,
    averageResponseTime,
    fulfillmentRate,
  });

  await createVendorPerformance(vendor);

  return res.status(201).json({
    success: true,
    message: `new vendor ${vendor.name} is created`,
  });
});

export const getAllVendors = TryCatch(async (req, res, next) => {
  let vendors = await Vendor.find({});

  return res.status(200).json({
    success: true,
    message: vendors,
  });
});

export const getVendorFromId = TryCatch(async (req, res, next) => {
  let _id = req.params.id;
  if (!isValidObjectId(_id)) {
    return next(new ErrorHandler("Please enter valid ID", 400));
  }

  let vendor = await Vendor.findById(_id);

  if (!vendor) {
    return next(new ErrorHandler("Vendor not found", 404));
  }

  return res.status(200).json({
    success: true,
    message: vendor,
  });
});

export const updateVendorFromId = TryCatch(async (req, res, next) => {
  let _id = req.params.id;
  if (!isValidObjectId(_id)) {
    return next(new ErrorHandler("Please enter valid ID", 400));
  }

  let vendor = await Vendor.findById(_id);

  if (!vendor) {
    return next(new ErrorHandler("Vendor not found", 404));
  }

  const updateData = req.body;

  vendor = await Vendor.findByIdAndUpdate(_id, updateData, {
    new: true,
    runValidators: true,
  });

  return res.status(200).json({
    success: true,
    message: `Vendor ${vendor.name} has been updated successfully!`,
  });
});

export const deleteVendorFromId = TryCatch(async (req, res, next) => {
  let _id = req.params.id;
  if (!isValidObjectId(_id)) {
    return next(new ErrorHandler("Please enter valid ID", 400));
  }

  let vendor = await Vendor.findById(_id);

  if (!vendor) {
    return next(new ErrorHandler("Vendor not found", 404));
  }

  vendor = await Vendor.findByIdAndDelete(_id);

  return res.status(200).json({
    success: true,
    message: `Vendor ${vendor.name} has been deleted successfully!`,
  });
});

export const getPerformance = TryCatch(async (req, res, next) => {
  let _id = req.params.id;
  if (!isValidObjectId(_id)) {
    return next(new ErrorHandler("Please enter valid ID", 400));
  }
  // console.log("reaching");

  let vendor = await Vendor.findById(_id);

  if (!vendor) {
    return next(new ErrorHandler("Vendor not found", 404));
  }

  const performance = await PerformanceModel.find({
    vendor: vendor._id,
  }).select(
    "onTimeDeliveryRate qualityRatingAvg avgResponseTime fulfillmentRate -_id"
  );
  // console.log(performance);
  return res.status(200).json({
    success: true,
    message: performance,
  });
});

const createVendorPerformance = async (vendor) => {
  // console.log("vendor name",vendor.name);
  await PerformanceModel.create({
    vendor: vendor._id,
    onTimeDeliveryRate: {
      value: vendor.onTimeDeliveryRate || 0,
      updatedAt: Date.now(),
    },
    qualityRatingAvg: {
      value: vendor.qualityRatingAvg || 0,
      updatedAt: Date.now(),
    },
    avgResponseTime: {
      value: vendor.avgResponseTime || 0,
      updatedAt: Date.now(),
    },
    fulfillmentRate: {
      value: vendor.fulfillmentRate || 0,
      updatedAt: Date.now(),
    },
  });
};
