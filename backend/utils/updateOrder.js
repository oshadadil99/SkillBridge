import mongoose from "mongoose";

const normalizeItems = (items = []) => items.map(({ id, order }) => ({ id, order }));

export const updateOrder = async ({ Model, items, entityName }) => {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      success: false,
      statusCode: 400,
      message: `${entityName} array is required`
    };
  }

  const normalizedItems = normalizeItems(items);

  for (const item of normalizedItems) {
    if (!item?.id || !mongoose.Types.ObjectId.isValid(item.id)) {
      return {
        success: false,
        statusCode: 400,
        message: `Invalid ${entityName} id`
      };
    }

    if (typeof item.order !== "number" || Number.isNaN(item.order)) {
      return {
        success: false,
        statusCode: 400,
        message: "Order must be a number"
      };
    }
  }

  const ids = normalizedItems.map((item) => item.id);

  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    return {
      success: false,
      statusCode: 400,
      message: `Duplicate ${entityName} ids are not allowed`
    };
  }

  const existingDocs = await Model.find({ _id: { $in: ids } }).select("_id").lean();
  const existingIdSet = new Set(existingDocs.map((doc) => String(doc._id)));

  const missingIds = ids.filter((id) => !existingIdSet.has(String(id)));
  if (missingIds.length > 0) {
    return {
      success: false,
      statusCode: 404,
      message: `Some ${entityName} items do not exist`
    };
  }

  await Promise.all(
    normalizedItems.map((item) =>
      Model.findByIdAndUpdate(
        item.id,
        { order: item.order },
        {
          runValidators: true
        }
      )
    )
  );

  return {
    success: true,
    statusCode: 200,
    message: "order updated"
  };
};
