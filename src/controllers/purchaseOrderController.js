import { isValidObjectId } from "mongoose";
import PurchaseOrder from "../models/purchaseOrder.js";
import Vendor from "../models/vendor.js";
import ErrorHandler from "../services/errorHandler.js";
import { TryCatch } from "../services/TryCatchBlock.js";
import PerformanceModel from "../models/historicPerformanceModel.js";

export const createPurchaseOrder = TryCatch(async (req, res, next) => {
  const {
    poNumber,
    vendor,
    orderDate,
    deliveryDate,
    items,
    quantity,
    status,
    qualityRating,
    issueDate,
    acknoweldgementDate,
  } = req.body;

  if (
    !poNumber ||
    !vendor ||
    !orderDate ||
    !deliveryDate ||
    !items ||
    !quantity
  ) {
    return next(new ErrorHandler("Please provide all required fields", 400));
  }

  if (!isValidObjectId(vendor)) {
    return next(new ErrorHandler("Please enter valid vendor ID", 400));
  }

  // Check if the vendor exists
  const existingVendor = await Vendor.findById(vendor);
  if (!existingVendor) {
    return next(new ErrorHandler("Vendor not found", 404));
  }

  const purchaseOrder = await PurchaseOrder.create({
    poNumber,
    vendor,
    orderDate,
    deliveryDate,
    items,
    quantity,
    status,
    qualityRating,
    issueDate,
    acknoweldgementDate,
  });

  return res.status(201).json({
    success: true,
    message: "Purchase order created successfully",
    purchaseOrder,
  });
});

export const getAllPOs = TryCatch(async (req, res, next) => {
  const purchaseOrder = await PurchaseOrder.find({});
  return res.status(200).json({
    success: true,
    message: purchaseOrder,
  });
});

export const getPurchaseOrderById = TryCatch(async (req, res, next) => {
  let _id = req.params.id;
  if (!isValidObjectId(_id)) {
    return next(new ErrorHandler("Please enter valid ID", 400));
  }

  const purchaseOrder = await PurchaseOrder.findById(_id);

  if (!purchaseOrder) {
    return next(new ErrorHandler("Purchase Order not found", 404));
  }

  return res.status(200).json({
    success: true,
    message: purchaseOrder,
  });
});

export const updatePOById = TryCatch(async (req, res, next) => {
  let _id = req.params.id;
  if (!isValidObjectId(_id)) {
    return next(new ErrorHandler("Please enter valid ID", 400));
  }

  let purchaseOrder = await PurchaseOrder.findById(_id);

  if (!purchaseOrder) {
    return next(new ErrorHandler("Purchase Order not found", 404));
  }

  const { vendor, status, ...updateData } = req.body;

  // Check if the vendor exists
  if (vendor) {
    if (!isValidObjectId(vendor)) {
      return next(new ErrorHandler("Please enter valid vendor ID", 400));
    }

    const existingVendor = await Vendor.findById(vendor);
    if (!existingVendor) {
      return next(new ErrorHandler("Vendor not found", 404));
    }
  }

  if (status === "completed") {
    purchaseOrder.actualDeliveryDate = Date.now();
  }

  purchaseOrder = await PurchaseOrder.findByIdAndUpdate(
    _id,
    {
      vendor,
      status,
      actualDeliveryDate: purchaseOrder.actualDeliveryDate,
      ...updateData,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  let msgOnTimeDeliveryUpdate;
  let msgOnQualityRatingUpdate;
  if (status === "completed") {
    msgOnTimeDeliveryUpdate = await updateOnTimeDeliveryRateOnCompleted(
      purchaseOrder
    );

    // also calculate avg of quality ratiing
    // console.log(
    //   "purchaseOrder.qualityRating!=null",
    //   purchaseOrder.qualityRating != null
    // );

    if (purchaseOrder.qualityRating != null) {
      // console.log("update quality rating");
      msgOnQualityRatingUpdate = await updateQualityRating(purchaseOrder);
    }

    if (status && (status === "completed" || status === "canceled")) {
      // fulfillment rate
      updateFullfillmentRate(purchaseOrder);
    }
  }

  return res.status(200).json({
    success: true,
    message:
      `Purchase Order No : ${purchaseOrder.poNumber} has been updated successfully!` +
      (msgOnTimeDeliveryUpdate ? ` And ${msgOnTimeDeliveryUpdate}` : "") +
      (msgOnQualityRatingUpdate ? ` And ${msgOnQualityRatingUpdate}` : ""),
  });
});

export const deletePurchaseOrderById = TryCatch(async (req, res, next) => {
  let _id = req.params.id;
  if (!isValidObjectId(_id)) {
    return next(new ErrorHandler("Please enter valid ID", 400));
  }

  let purchaseOrder = await PurchaseOrder.findById(_id);

  if (!purchaseOrder) {
    return next(new ErrorHandler("Purchase Order not found", 404));
  }

  purchaseOrder = await PurchaseOrder.findByIdAndDelete(_id);

  return res.status(200).json({
    success: true,
    message: `Purchase Order No : ${purchaseOrder.poNumber} has been updated successfully!`,
  });
});

//calculating on time delivery rate -->  that when actual delivery is with delivery date

const updateOnTimeDeliveryRateOnCompleted = async (purchaseOrder) => {
  const completedPOs = await PurchaseOrder.find({
    vendor: purchaseOrder.vendor,
    status: "completed",
  });

  const onTimePos = completedPOs.filter(
    (po) => po.actualDeliveryDate <= po.deliveryDate
  );

  const vendor = await Vendor.findById(purchaseOrder.vendor);
  vendor.onTimeDeliveryRate = (onTimePos.length / completedPOs.length) * 100;
  await vendor.save();

  const vendorPerformance = await PerformanceModel.findOne({
    vendor: vendor._id,
  });

  if (
    vendorPerformance &&
    vendorPerformance.onTimeDeliveryRate.value !== vendor.onTimeDeliveryRate
  ) {
    // console.log("on-time-delivery-rate", vendor.onTimeDeliveryRate);
    await PerformanceModel.findByIdAndUpdate(vendorPerformance._id, {
      "onTimeDeliveryRate.value": vendor.onTimeDeliveryRate,
      "onTimeDeliveryRate.updatedAt": Date.now(),
    });

    return `Vendor ${vendor.name} -update- On-Time-Delivery-Rate changed`;
  }
};

// calculate avg of quality ratiing -->
const updateQualityRating = async (purchaseOrder) => {
  // console.log("purchaseOrder.vendor :: ", purchaseOrder.vendor);
  const completedPOsByThisVendor = await PurchaseOrder.find({
    vendor: purchaseOrder.vendor,
    qualityRating: { $ne: null, $gte: 0 },
  });

  if (completedPOsByThisVendor.length > 0) {
    const totalRating = completedPOsByThisVendor.reduce(
      (total, po) => total + po.qualityRating,
      0
    );
    const avgRating = totalRating / completedPOsByThisVendor.length;

    await Vendor.findByIdAndUpdate(purchaseOrder.vendor, {
      qualityRatingAvg: avgRating,
    });

    const vendorPerformance = await PerformanceModel.findOne({
      vendor: purchaseOrder.vendor,
    });

    if (
      vendorPerformance &&
      vendorPerformance.qualityRatingAvg.value !== avgRating
    ) {
      const updatedPerformance = await PerformanceModel.findByIdAndUpdate(
        vendorPerformance._id,
        {
          "qualityRatingAvg.value": avgRating,
          "qualityRatingAvg.updatedAt": Date.now(),
        },
        { new: true }
      );

      // console.log(
      //   "updatedPerformance.qualityRatingAvg.value :: ",
      //   updatedPerformance.qualityRatingAvg.value
      // );

      return `vendorPerformance -update- QualityRating changed`;
    }
  }
};

export const issuePO = TryCatch(async (req, res, next) => {
  let _id = req.params.id;
  if (!isValidObjectId(_id)) {
    return next(new ErrorHandler("Please enter valid PO ID", 400));
  }

  let purchaseOrder = await PurchaseOrder.findById(_id);

  if (!purchaseOrder) {
    return next(new ErrorHandler("Purchase Order not found", 404));
  }

  let { issueDate } = req.body;

  if (!issueDate) {
    // console.log("Issue date not present");
    issueDate = Date.now();
  } else {
    const parsedDate = getDate(issueDate);

    // Check if the parsedDate is valid
    if (isNaN(parsedDate)) {
      return next(new ErrorHandler("Invalid date format provided", 400));
    }

    issueDate = parsedDate;
  }

  purchaseOrder = await PurchaseOrder.findByIdAndUpdate(
    _id,
    {
      issueDate: new Date(issueDate),
    },
    {
      new: true,
    }
  );

  return res.status(200).json({
    success: true,
    message: `Purchase Order No : ${purchaseOrder.poNumber} has been issued on ${purchaseOrder.issueDate}!`,
  });
});

export const acknoweldgePO = TryCatch(async (req, res, next) => {
  let _id = req.params.id;
  if (!isValidObjectId(_id)) {
    return next(new ErrorHandler("Please enter valid ID", 400));
  }

  let purchaseOrder = await PurchaseOrder.findById(_id);

  if (!purchaseOrder) {
    return next(new ErrorHandler("Purchase Order not found", 404));
  }

  let { acknowledgmentDate } = req.body;

  if (!acknowledgmentDate) {
    // console.log("Issue date not present");
    acknowledgmentDate = Date.now();
  } else {
    const parsedDate = getDate(acknowledgmentDate);

    // Check if the parsedDate is valid
    if (isNaN(parsedDate)) {
      return next(new ErrorHandler("Invalid date format provided", 400));
    }

    acknowledgmentDate = parsedDate;
  }

  purchaseOrder = await PurchaseOrder.findByIdAndUpdate(
    _id,
    {
      acknowledgmentDate: acknowledgmentDate,
    },
    {
      new: true,
    }
  );

  await avgResponseTime(purchaseOrder);

  return res.status(200).json({
    success: true,
    message: `Purchase Order No : ${purchaseOrder.poNumber} has been aknowledged!`,
  });
});

// Calculated each time a PO is acknowledged by the vendor.
const avgResponseTime = async (purchaseOrder) => {
  const vendorId = purchaseOrder.vendor;
  const allPOs = await PurchaseOrder.find({
    vendor: vendorId,
    issueDate: { $ne: null },
    acknowledgmentDate: { $ne: null },
  });

  //get all times aknowledge - issue
  const timeDiff = allPOs.map((po) => po.acknowledgmentDate - po.issueDate);

  const totalTime = timeDiff.reduce((sum, t) => sum + t, 0);
  const averageResponseTimeInMiliSec = totalTime / allPOs.length;

  const averageResponseTimeInDays = convertSecondsToDay(
    averageResponseTimeInMiliSec
  );

  // update avg response time of the vendor
  await Vendor.findByIdAndUpdate(vendorId, {
    averageResponseTime: averageResponseTimeInDays,
  });

  // update avg response time in peformance schema
  const vendorPerformance = await PerformanceModel.findOne({
    vendor: vendorId,
  });

  if (
    vendorPerformance &&
    vendorPerformance.avgResponseTime.value !== averageResponseTimeInDays
  ) {
    const updatedPerformance = await PerformanceModel.findByIdAndUpdate(
      vendorPerformance._id,
      {
        "avgResponseTime.value": averageResponseTimeInDays,
        "avgResponseTime.updatedAt": Date.now(),
      },
      { new: true }
    );

    // console.log(
    //   "updatedPerformance.avgResponseTime.value :: ",
    //   updatedPerformance.avgResponseTime.value
    // );

    return `vendorPerformance -update- Avarage Response Time changed`;
  }

  // console.log("avg response time :: ", averageResponseTimeInDays);
};

const updateFullfillmentRate = async (purchaseOrder) => {
  const vendorId = purchaseOrder.vendor;

  const allPOs = await PurchaseOrder.find({
    vendor: vendorId,
    status: { $in: ["completed", "canceled"] },
  });

  // console.log("POs with campleted or canceled count", allPOs.length);

  const completedPOs = allPOs.filter((po) => po.status === "completed");

  const ffRate = completedPOs.length / allPOs.length;

  // update avg response time of the vendor
  await Vendor.findByIdAndUpdate(vendorId, {
    fulfillmentRate: ffRate,
  });

  // update avg response time in peformance schema
  const vendorPerformance = await PerformanceModel.findOne({
    vendor: vendorId,
  });

  if (vendorPerformance && vendorPerformance.fulfillmentRate.value !== ffRate) {
    const updatedPerformance = await PerformanceModel.findByIdAndUpdate(
      vendorPerformance._id,
      {
        "fulfillmentRate.value": ffRate,
        "fulfillmentRate.updatedAt": Date.now(),
      },
      { new: true }
    );

    // console.log(
    //   "updatedPerformance.fulfillmentRate.value :: ",
    //   updatedPerformance.fulfillmentRate.value
    // );

    return `vendorPerformance -update- fulfillmentRate changed`;
  }
};

const getDate = (dateString) => {
  const date = new Date(dateString);
  const utcDate = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  return utcDate;
};

const convertSecondsToDay = (miliSec) => {
  // Convert milliseconds to days
  const millisecondsInADay = 24 * 60 * 60 * 1000;
  const timeInDays = miliSec / millisecondsInADay;
  return timeInDays;
};
