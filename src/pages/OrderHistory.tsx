import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBox,
  faClock,
  faCoins,
  faExclamationCircle,
  faTimes,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import Cookies from "js-cookie";

interface Dish {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

interface OrderItem {
  _id: string;
  dishId: Dish;
  quantity: number;
  priceAtTime: number;
}

interface Booking {
  orderType: string;
  bookingDate: string;
  status: string;
}

interface Order {
  _id: string;
  totalAmount: number;
  createdAt: string;
  paymentMethod: string;
  paymentStatus: string;
  bookingId?: Booking;
  items: OrderItem[];
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState<boolean>(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = Cookies.get("token");
        if (!token) {
          setError("You need to log in to view order history");
          return;
        }

        const response = await fetch("http://localhost:3000/api/history/orders", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          Cookies.remove("token");
          return;
        }

        const data = await response.json();
        if (data.success) {
          setOrders(data.data);
        } else {
          setError(data.message || "An error occurred while loading data");
        }
      } catch (error) {
        console.error("Error fetching order history:", error);
        setError("An error occurred while loading data");
      }
    };

    fetchOrders();
  }, []);

  const openOrderDetail = async (order: Order) => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        setError("You need to log in to view order details");
        return;
      }

      const response = await fetch(`http://localhost:3000/api/history/order/${order._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSelectedOrder(data.data);
      } else {
        setError(data.message || "An error occurred while fetching order details");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError("An error occurred while fetching order details");
    }
  };

  const openFeedbackModal = (dish: Dish) => {
    setSelectedDish(dish);
    setFeedbackModalOpen(true);
    setSelectedOrder(null);
  };

  const closeModal = () => {
    if (feedbackModalOpen) {
      setFeedbackModalOpen(false);
      setSelectedOrder(selectedOrder);
    } else {
      setSelectedOrder(null);
      setFeedbackModalOpen(false);
      setSelectedDish(null);
      setRating(0);
      setComment("");
      setFeedbackError(null);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (rating < 1 || rating > 5) {
      setFeedbackError("Please select a valid rating from 1 to 5");
      return;
    }

    try {
      const token = Cookies.get("token");
      if (!token) {
        setFeedbackError("You need to log in to submit feedback");
        return;
      }

      const response = await fetch("http://localhost:3000/api/feedback/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dish_id: selectedDish?._id,
          rating,
          comment,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setFeedbackModalOpen(false);
        alert("Feedback submitted successfully!");
      } else {
        setFeedbackError(data.message || "An error occurred while submitting feedback");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setFeedbackError("An error occurred while submitting feedback");
    }
  };

  if (error) {
    return (
      <div className="bg-red-100 text-red-800 p-4 rounded-md flex items-center gap-2">
        <FontAwesomeIcon icon={faExclamationCircle} />
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-5 font-sans min-h-[350px]">
      {orders.length > 0 ? (
        <div>
          <h2 className="text-3xl text-gray-800 mb-5 flex items-center gap-2">
            <FontAwesomeIcon icon={faBox} />
            Order History
          </h2>
          <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
            <thead>
              <tr>
                <th className="p-4 text-left bg-[#A2845E] text-white font-bold">
                  <FontAwesomeIcon icon={faBox} className="mr-2" />
                  Order ID
                </th>
                <th className="p-4 text-left bg-[#A2845E] text-white font-bold">
                  <FontAwesomeIcon icon={faClock} className="mr-2" />
                  Date
                </th>
                <th className="p-4 text-left bg-[#A2845E] text-white font-bold">Payment Status</th>
                <th className="p-4 text-left bg-[#A2845E] text-white font-bold">
                  <FontAwesomeIcon icon={faCoins} className="mr-2" />
                  Total Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} onClick={() => openOrderDetail(order)} className="hover:bg-gray-100 cursor-pointer">
                  <td className="p-4 border-b border-gray-200">{order._id.slice(-6)}</td>
                  <td className="p-4 border-b border-gray-200">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td
                    className={`p-4 border-b border-gray-200 font-bold ${order.paymentStatus === "Success" ? "text-green-600" : "text-orange-600"
                      }`}
                  >
                    {order.paymentStatus}
                  </td>
                  <td className="p-4 border-b border-gray-200">{order.totalAmount.toLocaleString()} VND</td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[1000]" onClick={closeModal}>
              <div className="bg-white p-5 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto relative shadow-lg" onClick={(e) => e.stopPropagation()}>
                <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl" onClick={closeModal}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
                <h3 className="mb-4 text-xl">🧾 Order Details</h3>

                <p className="mb-1">
                  <strong>Order ID:</strong> {selectedOrder._id}
                </p>

                <p className="mb-1">
                  <strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleDateString()}
                </p>

                <p className="mb-1">
                  <strong>Total Amount:</strong> {selectedOrder.totalAmount.toLocaleString()} VND
                </p>

                <p className="mb-1">
                  <strong>Payment Status:</strong> {selectedOrder.paymentStatus}
                </p>

                <p className="mb-1">
                  <strong>Payment Method:</strong> {selectedOrder.paymentMethod}
                </p>
                {selectedOrder.bookingId && (
                  <>
                    <p className="mb-1">
                      <strong>Order Type:</strong> {selectedOrder.bookingId.orderType}
                    </p>
                    <p className="mb-1">
                      <strong>Booking Date:</strong>{" "}
                      {new Date(selectedOrder.bookingId.bookingDate).toLocaleDateString()}
                    </p>
                    <p className="mb-4">
                      <strong>Booking Status:</strong> {selectedOrder.bookingId.status}
                    </p>
                  </>
                )}

                <table className="w-full border-collapse bg-white shadow-md rounded-lg">
                  <thead>
                    <tr>
                      <th className="p-4 text-left bg-[#A2845E] text-white font-bold">Dish Name</th>
                      <th className="p-4 text-left bg-[#A2845E] text-white font-bold">Quantity</th>
                      <th className="p-4 text-left bg-[#A2845E] text-white font-bold">Price</th>
                      <th className="p-4 text-left bg-[#A2845E] text-white font-bold">Subtotal</th>
                      <th className="p-4 text-left bg-[#A2845E] text-white font-bold">Feedback</th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedOrder.items.map((item) => {
                      const price = item.dishId.price ?? 0;
                      const quantity = item.quantity ?? 0;
                      const subtotal = price * quantity;

                      return (
                        <tr key={item._id}>
                          <td className="p-4 border-b border-gray-200">{item.dishId.name}</td>
                          <td className="p-4 border-b border-gray-200 text-center">{quantity}</td>
                          <td className="p-4 border-b border-gray-200">{price.toLocaleString()} VND</td>
                          <td className="p-4 border-b border-gray-200">{subtotal.toLocaleString()} VND</td>
                          <td className="p-4 border-b border-gray-200">
                            <button
                              className="px-2 py-1 bg-[#A2845E] text-white rounded-md hover:bg-amber-800"
                              onClick={() => openFeedbackModal(item.dishId)}
                            >
                              Feedback
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {feedbackModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[1000]" onClick={closeModal}>
              <div className="bg-white p-5 rounded-lg w-full max-w-4xl relative shadow-lg" onClick={(e) => e.stopPropagation()}>
                <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl" onClick={closeModal}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
                <div>
                  <label className="font-bold text-gray-800 mb-1 block">Rating:</label>
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FontAwesomeIcon
                        key={star}
                        icon={faStar}
                        className={`text-2xl cursor-pointer hover:scale-110 transition-transform ${star <= rating ? "text-yellow-400" : "text-gray-300"
                          }`}
                        onClick={() => setRating(star)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="font-bold text-gray-800 mb-1 block">Comment:</label>
                  <textarea
                    className="w-full min-h-[100px] p-2 border border-gray-300 rounded-md resize-y mb-4"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Enter your comment..."
                  />
                </div>
                {feedbackError && (
                  <div className="bg-red-100 text-red-800 p-4 rounded-md flex items-center gap-2 mb-4">
                    {feedbackError}
                  </div>
                )}
                <button className="px-4 py-2 bg-[#A2845E] text-white rounded-md hover:bg-amber-800" onClick={handleFeedbackSubmit}>
                  Submit Feedback
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex justify-center items-center mt-32">
          <p>There are no order record in history</p>
        </div>
      )}
    </div>
  );
}