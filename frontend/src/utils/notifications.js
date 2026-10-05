import api from "../api/api";

const sendNotification = async (payload) => {
  try {
    await api.post("/api/notifications/send", {
      sendEmail: false,
      ...payload,
    });
  } catch {
    // Notifications should never block the order or payment flow.
  }
};

const getHotelsForOrder = async (order) => {
  const hotelIds = [...new Set((order.items || []).map((item) => item.hotelId).filter(Boolean))];
  const hotelResults = await Promise.allSettled(
    hotelIds.map((hotelId) => api.get(`/api/hotels/${hotelId}`)),
  );

  return hotelResults
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value.data.hotel)
    .filter(Boolean);
};

export const notifyUserOrderPlaced = (order) =>
  sendNotification({
    receiverId: order.userId,
    receiverRole: "USER",
    title: "Order placed",
    message: `Your GoEat order #${order._id.slice(-6)} has been placed successfully.`,
    type: "ORDER_PLACED",
    metadata: { orderId: order._id, status: order.orderStatus },
  });

export const notifyHotelsNewOrder = async (order) => {
  const hotels = await getHotelsForOrder(order);

  await Promise.all(
    hotels.map((hotel) => {
      const hotelItems = (order.items || []).filter((item) => item.hotelId === hotel._id);
      const itemText = hotelItems.map((item) => `${item.foodName} x ${item.quantity}`).join(", ");

      return sendNotification({
        receiverId: hotel.ownerId,
        receiverRole: "HOTEL",
        title: "New order received",
        message: `Order #${order._id.slice(-6)} is ready for ${hotel.hotelName}: ${itemText || "new items"}.`,
        type: "NEW_ORDER",
        metadata: { orderId: order._id, hotelId: hotel._id, items: hotelItems },
      });
    }),
  );
};

export const notifyUserOrderStatus = (order, orderStatus) =>
  sendNotification({
    receiverId: order.userId,
    receiverRole: "USER",
    title: "Order status updated",
    message: `Your order #${order._id.slice(-6)} is now ${orderStatus.replaceAll("_", " ").toLowerCase()}.`,
    type: "ORDER_STATUS",
    metadata: { orderId: order._id, status: orderStatus },
  });

export const notifyUserPayment = (order, status) =>
  sendNotification({
    receiverId: order.userId,
    receiverRole: "USER",
    title:
      status === "SUCCESS"
        ? "Payment successful"
        : status === "PENDING"
          ? "Payment pending"
          : "Payment update",
    message:
      status === "SUCCESS"
        ? `Payment for order #${order._id.slice(-6)} was successful.`
        : status === "PENDING"
          ? `Payment for order #${order._id.slice(-6)} will be collected on delivery.`
        : `Payment for order #${order._id.slice(-6)} is ${status.toLowerCase()}.`,
    type: status === "SUCCESS" ? "PAYMENT_SUCCESS" : status === "FAILED" ? "PAYMENT_FAILED" : "GENERAL",
    metadata: { orderId: order._id, paymentStatus: status },
  });

export const notifyHotelsPayment = async (order, status) => {
  const hotels = await getHotelsForOrder(order);

  await Promise.all(
    hotels.map((hotel) =>
      sendNotification({
        receiverId: hotel.ownerId,
        receiverRole: "HOTEL",
        title: status === "SUCCESS" ? "Payment received" : status === "PENDING" ? "COD payment pending" : "Payment update",
        message:
          status === "PENDING"
            ? `Order #${order._id.slice(-6)} is cash on delivery. Collect payment at delivery.`
            : `Payment for order #${order._id.slice(-6)} is ${status.toLowerCase()}.`,
        type: status === "SUCCESS" ? "PAYMENT_SUCCESS" : status === "FAILED" ? "PAYMENT_FAILED" : "GENERAL",
        metadata: { orderId: order._id, hotelId: hotel._id, paymentStatus: status },
      }),
    ),
  );
};
