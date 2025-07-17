import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faCoins,
  faExclamationCircle,
  faTimes,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import Cookies from "js-cookie";
import Pagination from "../components/Pagination";
import LoadingAnimation from "../components/LoadingAnimation";

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentOrders, setCurrentOrders] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [userFeedbacks, setUserFeedbacks] = useState<{[dishId: string]: {hasFeedback: boolean, feedback: any}}>({});
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const itemsPerPage = 10;
  const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000';
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const token = Cookies.get("token");
        if (!token) {
          setError("You need to log in to view order history");
          return;
        }

        const response = await fetch(`${backendApiUrl}/api/history/orders`, {
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
      } finally {
        setIsLoading(false);
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

      const response = await fetch(`${backendApiUrl}/api/history/order/${order._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSelectedOrder(data.data);
        // Check feedback for all dishes in this order
        data.data.items.forEach((item: OrderItem) => {
          checkUserFeedback(item.dishId._id, order._id);
        });
      } else {
        setError(data.message || "An error occurred while fetching order details");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError("An error occurred while fetching order details");
    }
  };

  const openFeedbackModal = (dish: Dish, orderId: string) => {
    setSelectedDish(dish);
    setFeedbackModalOpen(true);
    setSelectedOrder(null);
    setIsEditMode(false);
    setEditingFeedbackId(null);
    setRating(0);
    setComment("");
    // Store orderId for later use in submit
    setCurrentOrderId(orderId);
  };

  const openEditFeedbackModal = async (dish: Dish, orderId: string) => {
    const token = Cookies.get("token");
    if (!token) {
      setError("You need to log in to edit feedback");
      return;
    }

    try {
      const response = await fetch(`${backendApiUrl}/api/feedback/check/${dish._id}/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.hasFeedback) {
          setSelectedDish(dish);
          setFeedbackModalOpen(true);
          setSelectedOrder(null);
          setIsEditMode(true);
          setEditingFeedbackId(data.feedback._id);
          setRating(data.feedback.rating);
          setComment(data.feedback.comment || "");
        }
      }
    } catch (error) {
      console.error("Error checking feedback:", error);
    }
  };

  const checkUserFeedback = async (dishId: string, orderId: string) => {
    const token = Cookies.get("token");
    if (!token) return;

    try {
      const response = await fetch(`${backendApiUrl}/api/feedback/check/${dishId}/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUserFeedbacks(prev => ({
            ...prev,
            [`${dishId}_${orderId}`]: {
              hasFeedback: data.hasFeedback,
              feedback: data.feedback
            }
          }));
        }
      }
    } catch (error) {
      console.error("Error checking feedback:", error);
    }
  };

  const closeFeedbackModal = () => {
    setFeedbackModalOpen(false);
    setIsEditMode(false);
    setEditingFeedbackId(null);
    setRating(0);
    setComment("");
    setFeedbackError(null);
    setCurrentOrderId(null);
    setSelectedDish(null);
    // Không reset selectedOrder để giữ modal order detail
  };

  const closeModal = () => {
    if (feedbackModalOpen) {
      closeFeedbackModal();
    } else {
      setSelectedOrder(null);
      setFeedbackModalOpen(false);
      setSelectedDish(null);
      setRating(0);
      setComment("");
      setFeedbackError(null);
      setIsEditMode(false);
      setEditingFeedbackId(null);
      setCurrentOrderId(null);
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

      let response;
      if (isEditMode && editingFeedbackId) {
        // Update existing feedback
        response = await fetch(`${backendApiUrl}/api/feedback/update/${editingFeedbackId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating,
            comment,
          }),
        });
      } else {
        // Add new feedback
        response = await fetch(`${backendApiUrl}/api/feedback/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            dish_id: selectedDish?._id,
            orderId: currentOrderId,
            rating,
            comment,
          }),
        });
      }

      const data = await response.json();
      if (data.success) {
        closeFeedbackModal();
        // Update the userFeedbacks state
        if (selectedDish && currentOrderId) {
          setUserFeedbacks(prev => ({
            ...prev,
            [`${selectedDish._id}_${currentOrderId}`]: {
              hasFeedback: true,
              feedback: data.feedback
            }
          }));
        }
        alert(isEditMode ? "Feedback updated successfully!" : "Feedback submitted successfully!");
      } else {
        setFeedbackError(data.message || "An error occurred while submitting feedback");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setFeedbackError("An error occurred while submitting feedback");
    }
  };

  const handlePageChange = useCallback((paginatedOrders: any[], page: number) => {
      setCurrentOrders(paginatedOrders);
      setCurrentPage(page);
    }, []);

  if (error) {
    return (
      <div className="bg-red-100 text-red-800 p-4 rounded-md flex items-center gap-2">
        <FontAwesomeIcon icon={faExclamationCircle} />
        {error}
      </div>
    );
  }

  return (
    <div className="relative max-w-6xl mx-auto p-5 font-sans min-h-[380px] pb-[4.5rem]">
      {orders.length > 0 ? (
        <>
          <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
            <thead>
              <tr>
                <th className="p-2 py-3 md:p-4 text-center md:text-left bg-[#A2845E] text-white font-bold">
                  No
                </th>
                <th className="p-2 py-3 md:p-4 text-center md:text-left bg-[#A2845E] text-white font-bold">
                  <FontAwesomeIcon icon={faClock} className="hidden md:inline mr-2" />
                  Date
                </th>
                <th className="p-2 py-3 md:p-4 text-center md:text-left bg-[#A2845E] text-white font-bold">Payment Status</th>
                <th className="p-2 py-3 md:p-4 text-center md:text-left bg-[#A2845E] text-white font-bold">
                  <FontAwesomeIcon icon={faCoins} className="hidden md:inline mr-2" />
                  Total Amount
                </th>
              </tr>
            </thead>
            <tbody className="w-full">
              {currentOrders.map((order, index) => (
                <tr key={order._id} onClick={() => openOrderDetail(order)} className="hover:bg-gray-100 cursor-pointer">
                  <td className="p-2 py-3 md:p-4 text-center text-sm md:text-base md:text-left border-b border-gray-200">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="p-2 py-3 md:p-4 text-center text-sm md:text-base md:text-left border-b border-gray-200">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td
                    className={`p-2 py-3 md:p-4 text-center text-sm md:text-base md:text-left border-b border-gray-200 font-bold ${order.paymentStatus === "Success" ? "text-green-600" : order.paymentStatus === "Deposited" ? "text-yellow-400" : "text-red-500"
                      }`}
                  >
                    {order.paymentStatus}
                  </td>
                  <td className="p-2 py-3 md:p-4 text-center text-sm md:text-base md:text-left border-b border-gray-200">{order.totalAmount.toLocaleString()} VND</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Modal order detail */}
          {selectedOrder && (
            <div className="fixed inset-0 px-1 sm:px-3 bg-black bg-opacity-50 flex justify-center items-center z-[1000]">
              <div className="bg-white p-2 sm:p-5 rounded-lg sm:rounded-lg w-full max-w-lg sm:max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-lg [&::-webkit-scrollbar]:hidden" onClick={(e) => e.stopPropagation()}>
                <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl" onClick={closeModal}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
                <h3 className="mb-4 text-lg sm:text-xl font-semibold">🧾 Order Details</h3>
                <p className="mb-1 text-xs sm:text-sm md:text-base">
                  <strong>Order ID:</strong> {selectedOrder._id}
                </p>
                <p className="mb-1 text-xs sm:text-sm md:text-base">
                  <strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleDateString()}
                </p>
                <p className="mb-1 text-xs sm:text-sm md:text-base">
                  <strong>Total Amount:</strong> {selectedOrder.totalAmount.toLocaleString()} VND
                </p>
                <p className="mb-1 text-xs sm:text-sm md:text-base">
                  <strong>Payment Status:</strong> {selectedOrder.paymentStatus}
                </p>
                <p className="mb-1 text-xs sm:text-sm md:text-base">
                  <strong>Payment Method:</strong> {selectedOrder.paymentMethod}
                </p>
                {selectedOrder.bookingId && (
                  <>
                    <p className="mb-1 text-xs sm:text-sm md:text-base">
                      <strong>Order Type:</strong> {selectedOrder.bookingId.orderType}
                    </p>
                    <p className="mb-1 text-xs sm:text-sm md:text-base">
                      <strong>Booking Date:</strong>{" "}
                      {new Date(selectedOrder.bookingId.bookingDate).toLocaleDateString()}
                    </p>
                    <p className="mb-4 text-xs sm:text-sm md:text-base">
                      <strong>Booking Status:</strong> {selectedOrder.bookingId.status}
                    </p>
                  </>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse bg-white shadow-md rounded-lg table-fixed text-xs sm:text-sm md:text-base">
                    <thead>
                      <tr>
                        <th className="p-2 md:p-4 text-left bg-[#A2845E] text-white font-bold w-2/6">Dish Name</th>
                        <th className="p-2 md:p-4 text-left bg-[#A2845E] text-white font-bold w-1/12">Quantity</th>
                        <th className="p-2 md:p-4 text-center bg-[#A2845E] text-white font-bold w-1/5">Price</th>
                        <th className="p-2 md:p-4 text-left bg-[#A2845E] text-white font-bold w-1/5 hidden md:table-cell">Subtotal</th>
                        <th className="p-2 md:p-4 text-left bg-[#A2845E] text-white font-bold w-1/5">Feedback</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item) => {
                        const price = item.dishId.price ?? 0;
                        const quantity = item.quantity ?? 0;
                        const subtotal = price * quantity;
                        return (
                          <tr key={item._id}>
                            <td className="p-2 text-xs sm:text-sm md:text-base md:p-4 border-b border-gray-200">{item.dishId.name}</td>
                            <td className="p-2 text-xs sm:text-sm md:text-base md:p-4 border-b border-gray-200 text-center">{quantity}</td>
                            <td className="p-2 text-xs sm:text-sm md:text-base md:p-4 border-b border-gray-200">{price.toLocaleString()} VND</td>
                            <td className="p-2 text-xs sm:text-sm md:text-base md:p-4 border-b border-gray-200 hidden md:table-cell">{subtotal.toLocaleString()} VND</td>
                            <td className="p-2 text-xs sm:text-sm md:text-base md:p-4 border-b border-gray-200">
                              {selectedOrder.paymentStatus === "Success" ? (
                                (() => {
                                  const userFeedback = userFeedbacks[`${item.dishId._id}_${selectedOrder._id}`];
                                  if (userFeedback && userFeedback.hasFeedback) {
                                    return (
                                      <button
                                        className="px-2 py-1 bg-[#A2845E] text-white rounded-md hover:bg-amber-800 min-w-[70px] sm:min-w-[90px] text-xs sm:text-sm"
                                        onClick={() => openEditFeedbackModal(item.dishId, selectedOrder._id)}
                                      >
                                        Update
                                      </button>
                                    );
                                  } else {
                                    return (
                                      <button
                                        className="px-2 py-1 bg-[#A2845E] text-white rounded-md hover:bg-amber-800 min-w-[70px] sm:min-w-[90px] text-xs sm:text-sm"
                                        onClick={() => openFeedbackModal(item.dishId, selectedOrder._id)}
                                      >
                                        Feedback
                                      </button>
                                    );
                                  }
                                })()
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Modal feedback luôn render sau modal detail */}
          {feedbackModalOpen && (
            <div className="fixed inset-0 px-3 bg-black bg-opacity-50 flex justify-center items-center z-[9999]" onClick={closeFeedbackModal}>
              <div className="bg-white p-5 rounded-lg w-full max-w-4xl relative shadow-lg" onClick={(e) => e.stopPropagation()}>
                <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl" onClick={closeFeedbackModal}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
                <h3 className="mb-4 text-xl font-semibold">
                  {isEditMode ? "Edit Feedback" : "Add Feedback"} - {selectedDish?.name}
                </h3>
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
                  {isEditMode ? "Update Feedback" : "Submit Feedback"}
                </button>
              </div>
            </div>
          )}
        </>
      ) : isLoading ? (
        <div className="min-h-[150px] flex justify-center items-center mt-28">
          <LoadingAnimation />
        </div>
      ) : (
        <div className="flex justify-center items-center mt-32">
          <p>There are no order record in history</p>
        </div>
      )}

      <Pagination items={orders} itemsPerPage={10} onPageChange={handlePageChange}/>
    </div>
  );
}