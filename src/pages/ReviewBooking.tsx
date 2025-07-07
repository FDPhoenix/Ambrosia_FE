import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import vnpayLogo from "../assets/Icon-VNPAY-QR.webp";
import { toast, ToastContainer } from "react-toastify";
interface Dish {
  dishId: string;
  name: string;
  quantity: number;
  price: number;
}

interface Booking {
  _id: string;
  tableId: { _id: string; tableNumber: string } | null;
  bookingDate: string;
  startTime: string;
  notes: string;
  status: string;
  dishes: Dish[];
  customer?: { name: string; email: string; contactPhone: string };
}

interface ReviewBookingProps {
  bookingId: string;
  closeModal: () => void;
  openReviewExperienceModal: (bookingId: string) => void;
}

const ReviewBooking: React.FC<ReviewBookingProps> = ({ bookingId, closeModal }) => {
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [availableTables, setAvailableTables] = useState<{ _id: string; tableNumber: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedBooking, setEditedBooking] = useState<Booking | null>(null);
  const [dishToDelete, setDishToDelete] = useState<string | null>(null);
  const [noTablesAvailable, setNoTablesAvailable] = useState(false);
  const [, setOriginalBooking] = useState<Booking | null>(null);
  const [isVNPaySelected, setIsVNPaySelected] = useState(false);
  const [billDetails, setBillDetails] = useState({ totalAmount: 0, prepaidAmount: 0 });
  const isOrderAtRestaurant = (isEditing ? editedBooking?.dishes?.length : booking?.dishes?.length) === 0;
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);


  const calculateBill = (dishes: Dish[]) => {
    const totalAmount = dishes.reduce((sum, dish: Dish) => sum + dish.price * dish.quantity, 0);
    const prepaidAmount = Math.round(totalAmount * 0.3);
    return { totalAmount, prepaidAmount };
  };

  useEffect(() => {
    const dishes = isEditing ? editedBooking?.dishes || [] : booking?.dishes || [];
    if (dishes.length > 0) {
      setBillDetails(calculateBill(dishes));
    } else {
      setBillDetails({ totalAmount: 0, prepaidAmount: 0 });
    }
  }, [booking, editedBooking, isEditing]);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const response = await axios.get<Booking>(`http://localhost:3000/bookings/${bookingId}`);
        setBooking(response.data);
        setEditedBooking(response.data);
        setOriginalBooking(response.data);
        setLoading(false);
      } catch (error) {
        setError("Unable to load booking information!");
        setLoading(false);
      }
    };
    fetchBookingDetails();
  }, [bookingId]);

  useEffect(() => {
    if (isEditing && (!editedBooking?.bookingDate || !editedBooking?.tableId)) {
      fetchBookingDetailsForEditing();
    }
  }, [isEditing]);

  const fetchBookingDetailsForEditing = async () => {
    try {
      const response = await axios.get<Booking>(`http://localhost:3000/bookings/${bookingId}`);
      if (response.data.bookingDate) {
        response.data.bookingDate = new Date(response.data.bookingDate).toISOString().split("T")[0];
      }
      setEditedBooking(response.data);
    } catch (error) {
      console.error("Error retrieving booking information:", error);
    }
  };

  useEffect(() => {
    if (isEditing && editedBooking?.bookingDate && editedBooking?.startTime) {
      fetchAvailableTablesForEditing(editedBooking.bookingDate, editedBooking.startTime, editedBooking.tableId?._id || null);
    }
  }, [isEditing, editedBooking?.bookingDate, editedBooking?.startTime]);

  const fetchAvailableTablesForEditing = async (date: string, time: string, currentTableId: string | null) => {
    try {
      if (!date || !time) return;
      const response = await axios.get(`http://localhost:3000/bookings/available-tables`, {
        params: { bookingDate: date, startTime: time },
      });
      let filteredTables = (response.data as { isAvailable: boolean; _id: string; tableNumber: string }[])
        .filter((table) => table.isAvailable);
      if (currentTableId && !filteredTables.some((t) => t._id === currentTableId)) {
        const currentTableResponse = await axios.get(`http://localhost:3000/tables/${currentTableId}`);
        filteredTables.push(currentTableResponse.data);
      }
      setAvailableTables(filteredTables);
      setNoTablesAvailable(filteredTables.length === 0);
    } catch (error) {
      console.error("Error retrieving table list:", error);
    }
  };

  const handleUpdateBooking = async () => {
    try {
      if (!editedBooking) return;
      const response = await axios.put(`http://localhost:3000/bookings/${bookingId}`, {
        tableId: editedBooking.tableId?._id,
        bookingDate: editedBooking.bookingDate,
        startTime: editedBooking.startTime,
        notes: editedBooking.notes,
        dishes: editedBooking.dishes.map((d) => ({
          dishId: d.dishId,
          quantity: d.quantity,
        })),
      });
      toast.success("Update successful!");
      setBooking({
        ...response.data.booking,
        dishes: editedBooking.dishes,
        customer: booking?.customer,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating!", error);
      toast.error("Error updating!");
    }
  };

  const handleDeleteDish = (dishId: string) => {
    if (!editedBooking) return;
    setEditedBooking({
      ...editedBooking,
      dishes: editedBooking.dishes.filter((dish) => dish.dishId !== dishId),
    });
    setDishToDelete(null);
  };

  const handleConfirmBooking = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      console.log("Processing booking for bookingId:", bookingId);

      if (isOrderAtRestaurant) {
        await axios.put(`http://localhost:3000/bookings/${bookingId}/confirm`);
        toast.success("Booking has been confirmed!");
        setTimeout(() => {
          navigate("/", { state: { bookingId, showReviewExperience: true } });
        }, 400);
      } else {
        if (!isVNPaySelected) {
          toast.warning("Please select VNPay as the payment method before confirming!");
          return;
        }

        const checkoutResponse = await axios.post(`http://localhost:3000/payment/checkoutBooking`, {
          bookingId: bookingId,
        });
        const { orderId } = checkoutResponse.data;

        await axios.put(`http://localhost:3000/bookings/${bookingId}/confirm`);
        toast.success("Booking has been confirmed. Redirecting to VNPay......");

        const paymentResponse = await axios.post(
          `http://localhost:3000/payment/vnpay-create?orderId=${orderId}`
        );

        const paymentUrl = paymentResponse.data.paymentUrl;
        if (paymentUrl) {
          window.location.href = paymentUrl; // redirect
        } else {
          toast.error("Unable to generate payment link!");
        }
      }
    } catch (error: unknown) {
      console.error("Error in booking confirmation process:", error);
      toast.error("An error occurred while confirming or processing payment!");
    } finally {
      setIsProcessing(false);
    }
  };


  const handleCancelBooking = async () => {
    if (!bookingId) {
      toast.error("Error: Booking ID is missing!");
      return;
    }
    try {
      const response = await axios.delete(`http://localhost:3000/bookings/${bookingId}`);
      console.log("Booking deleted:", response.data);
      toast.success("Booking has been cancelled!");
      closeModal();
    } catch (error: unknown) {
      console.error("Error cancelling booking:", error);
      if (axios.isAxiosError(error)) {
        toast.error(`Server Error: ${error.response?.status} - ${error.response?.data?.message || "Unknown error"}`);
      } else {
        toast.error("Network error. Please try again!");
      }
    }

  };

  const handleDishChange = (dishId: string, newQuantity: number) => {
    if (!editedBooking) return;
    if (newQuantity === 0) {
      setDishToDelete(dishId);
    } else {
      const updatedDishes = editedBooking.dishes.map((dish) =>
        dish.dishId === dishId ? { ...dish, quantity: newQuantity } : dish
      );
      setEditedBooking((prev) => ({ ...prev!, dishes: updatedDishes }));
    }
  };

  const confirmDeleteDish = (dishId: string) => {
    setDishToDelete(dishId);
  };

  {
    loading && (
      <p className="text-center text-base text-[#634a3e] font-medium italic">
        Loading information...
      </p>
    )
  }

  {
    error && (
      <p className="text-center text-red-600 font-semibold mt-2">
        {error}
      </p>
    )
  }


  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[1000] animate-fadeInOverlay">
        <div className="bg-white p-6 rounded-xl max-w-[600px] w-[90%] max-h-[80vh] shadow-xl border border-gray-200 flex flex-col overflow-hidden animate-fadeInOverlay">
          <h2 className="text-center text-[27px] font-bold mb-7 text-[#634a3e] uppercase tracking-wide">
            Review Booking
          </h2>
          <div className="flex-1 overflow-y-auto px-2 scrollbar-thin scrollbar-thumb-[#947260] scrollbar-track-[#f0f0f0] scrollbar-hide">

            {!isEditing && (
              <>
                <div className="flex justify-between items-center mb-4 py-2 border-b border-dashed border-gray-300">
                  <label className="font-semibold text-[#947260] text-base">Customer:</label>
                  <span className="text-base text-gray-800 text-right max-w-[60%]">{booking?.customer?.name || "No name"}</span>
                </div>
                <div className="flex justify-between items-center mb-4 py-2 border-b border-dashed border-gray-300">
                  <label className="font-semibold text-[#947260] text-base">Email:</label>
                  <span className="text-base text-gray-800 text-right max-w-[60%]">{booking?.customer?.email || "No email"}</span>
                </div>
                <div className="flex justify-between items-center mb-4 py-2 border-b border-dashed border-gray-300">
                  <label className="font-semibold text-[#947260] text-base">Phone number:</label>
                  <span className="text-base text-gray-800 text-right max-w-[60%]">{booking?.customer?.contactPhone || "No phone number"}</span>
                </div>
              </>
            )}

            <div className="flex justify-between items-center mb-4 py-2 border-b border-dashed border-gray-300">
              <label className="font-semibold text-[#947260] text-base">Booking Date:</label>
              <span className="text-base text-gray-800 text-right max-w-[60%]">
                {isEditing ? (
                  <input
                    type="date"
                    value={editedBooking?.bookingDate || ""}
                    onChange={(e) =>
                      setEditedBooking((prev) => {
                        if (!prev) return prev; // hoặc null

                        return {
                          ...prev,
                          bookingDate: e.target.value,
                          tableId: null,
                        };
                      })
                    }

                    min={new Date().toISOString().split("T")[0]}
                    className="border px-2 py-1 rounded text-sm"
                  />
                ) : (
                  booking?.bookingDate
                    ? new Date(booking.bookingDate).toLocaleDateString("vi-VN")
                    : "Unknown"
                )}
              </span>
            </div>

            <div className="flex justify-between items-center mb-4 py-2 border-b border-dashed border-gray-300">
              <label className="font-semibold text-[#947260] text-base">Select time:</label>
              <span className="text-base text-gray-800 text-right max-w-[60%]">
                {isEditing ? (
                  <select
                    value={editedBooking?.startTime || ""}
                    onChange={(e) =>
                      setEditedBooking((prev) => {
                        if (!prev) return prev; // hoặc return null;
                        return {
                          ...prev,
                          startTime: e.target.value,
                          tableId: null,
                        };
                      })
                    }

                    className="border px-2 py-1 rounded text-sm"
                  >
                    <option value="" disabled>Select time</option>
                    {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"].map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                ) : (
                  booking?.startTime
                )}
              </span>
            </div>

            <div className="flex justify-between items-center mb-4 py-2 border-b border-dashed border-gray-300">
              <label className="font-semibold text-[#947260] text-base">Table Number:</label>
              <span className="text-base text-gray-800 text-right max-w-[60%]">
                {isEditing ? (
                  noTablesAvailable ? (
                    <span className="text-red-600 font-semibold text-sm">No available tables</span>
                  ) : (
                    <select
                      value={editedBooking?.tableId?._id || ""}
                      onChange={(e) => {
                        const selectedTable = availableTables.find((t) => t._id === e.target.value) || null;
                        setEditedBooking((prev) => (prev ? { ...prev, tableId: selectedTable } : prev));
                      }}
                      className="border px-2 py-1 rounded text-sm"
                    >
                      {editedBooking?.tableId && !noTablesAvailable ? (
                        <option value={editedBooking.tableId._id}>{editedBooking.tableId.tableNumber}</option>
                      ) : (
                        <option value="">Select table</option>
                      )}
                      {availableTables.map((table) => (
                        <option key={table._id} value={table._id}>{table.tableNumber}</option>
                      ))}
                    </select>
                  )
                ) : (
                  booking?.tableId?.tableNumber || "Unknown"
                )}
              </span>
            </div>

            {!isEditing && (
              <div className="flex justify-between items-center mb-4 py-2 border-b border-dashed border-gray-300">
                <label className="font-semibold text-[#947260] text-base">Status:</label>
                <span
                  className={`text-xs font-semibold uppercase px-3 py-1 rounded-full ${booking?.status === 'pending'
                    ? 'bg-orange-100 text-yellow-700'
                    : booking?.status === 'confirmed'
                      ? 'bg-green-100 text-green-700'
                      : booking?.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : ''
                    }`}
                >
                  {booking?.status}
                </span>
              </div>
            )}


            <div className="bg-[#fefdfc] border border-[#e0dcd4] p-4 rounded-xl my-6 shadow-sm ">
              <h4 className="text-[#947260] font-semibold text-base mb-3">Customer Notes:</h4>

              {isEditing ? (
                <textarea
                  value={editedBooking?.notes || ""}
                  onChange={(e) => {
                    if (!editedBooking) return;
                    setEditedBooking({ ...editedBooking, notes: e.target.value });
                  }}
                  placeholder="Enter any special requests or notes..."
                  className="w-full h-24 p-3 border border-[#d6c5b8] rounded-md text-sm text-[#634a3e] bg-white resize-none shadow-inner focus:outline-none focus:ring-2 focus:ring-[#c7a186]"
                />
              ) : (
                <p className="text-[#634a3e] text-sm mt-1">
                  {booking?.notes ? booking.notes : <em className="text-gray-400">No notes provided.</em>}
                </p>
              )}
            </div>


            <h3 className="text-2xl font-semibold text-[#634a3e] text-center my-5">Dish List</h3>

            <div className="w-full overflow-x-auto overflow-x-scroll">
              {isEditing ? (
                editedBooking?.dishes?.length === 0 ? (
                  // Edit mode - Không có món ăn
                  <div className="w-full overflow-x-auto">
                    <table className="min-w-full table-fixed border-collapse bg-white rounded-md shadow-sm text-sm">
                      <thead className="bg-[#e09f3e] text-white text-base">
                        <tr>
                          <th className="p-3 text-center w-1/4">Dish</th>
                          <th className="p-3 text-center w-1/4">Quantity</th>
                          <th className="p-3 text-center w-1/4">Price</th>
                          <th className="p-3 text-center w-1/4">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td colSpan={4} className="italic text-center py-4 text-[#947260] bg-orange-50 font-semibold">
                            Order at the restaurant
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  // Edit mode - Có món ăn
                  <table className="min-w-full table-fixed border-collapse bg-white rounded-md shadow-sm text-sm">
                    <thead className="bg-[#e09f3e] text-white text-base">
                      <tr>
                        <th className="p-3 text-center w-1/5">Dish</th>
                        <th className="p-3 text-center w-1/5">Quantity</th>
                        <th className="p-3 text-center w-1/5">Price</th>
                        <th className="p-3 text-center w-1/5">Total</th>
                        <th className="p-3 text-center w-1/5">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editedBooking?.dishes.map((dish) => (
                        <tr key={dish.dishId} className="border-b border-gray-200 text-[#634a3e] text-base">
                          <td className="p-4">{dish.name}</td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2 border border-gray-300 rounded-full px-3 py-1 bg-[#f9f9f9]">
                              <button
                                onClick={() => handleDishChange(dish.dishId, dish.quantity - 1)}
                                className="text-[#634a3e] text-base font-bold hover:text-blue-500"
                              >
                                -
                              </button>
                              <span className="text-base font-semibold min-w-[20px] text-center">{dish.quantity}</span>
                              <button
                                onClick={() => handleDishChange(dish.dishId, dish.quantity + 1)}
                                className="text-[#634a3e] text-base font-bold hover:text-blue-500"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="p-4 text-center">{dish.price.toLocaleString()} VND</td>
                          <td className="p-4 text-center">{(dish.price * dish.quantity).toLocaleString()} VND</td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => confirmDeleteDish(dish.dishId)}
                              className="text-red-600 font-bold hover:text-red-700"
                            >
                              X
                            </button>
                          </td>
                        </tr>
                      ))}
                      {/* Tổng tiền sài chung cho Edit mode */}
                      <tr className="font-semibold bg-gray-100">
                        <td colSpan={5} className="p-4 text-base">
                          <div className="flex justify-between items-center">
                            <span>Total Amount:</span>
                            <span>{billDetails.totalAmount.toLocaleString()} VND</span>
                          </div>
                        </td>
                      </tr>
                      <tr className="font-semibold bg-gray-200">
                        <td colSpan={5} className="p-4 text-base">
                          <div className="flex justify-between items-center">
                            <span>Prepaid Amount (30%):</span>
                            <span>{billDetails.prepaidAmount.toLocaleString()} VND</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )
              ) : booking?.dishes?.length === 0 ? (
                // View mode - Không có món ăn
                <table className="w-full border-collapse bg-white rounded-md shadow-sm text-sm">
                  <thead className="bg-[#947260] text-white text-base">
                    <tr>
                      <th className="p-3 text-center w-1/4">Dish</th>
                      <th className="p-3 text-center w-1/4">Quantity</th>
                      <th className="p-3 text-center w-1/4">Price</th>
                      <th className="p-3 text-center w-1/4">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={4} className="italic text-center py-4 text-[#947260] bg-orange-50 font-semibold">
                        Order at the restaurant
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                // View mode - Có món ăn
                <table className="w-full border-collapse bg-white rounded-md shadow-sm text-sm">
                  <thead className="bg-[#947260] text-white text-base">
                    <tr>
                      <th className="p-3 text-center w-1/4">Dish</th>
                      <th className="p-3 text-center w-1/4">Quantity</th>
                      <th className="p-3 text-center w-1/4">Price</th>
                      <th className="p-3 text-center w-1/4">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {booking?.dishes.map((dish) => (
                      <tr key={dish.dishId} className="border-b border-gray-200 text-[#634a3e] text-base text-center">
                        <td className="p-4">{dish.name}</td>
                        <td className="p-4">x{dish.quantity}</td>
                        <td className="p-4 whitespace-nowrap text-right">{dish.price.toLocaleString()} VND</td>
                        <td className="p-4 whitespace-nowrap text-right">{(dish.price * dish.quantity).toLocaleString()} VND</td>
                      </tr>
                    ))}
                    {/* Tổng tiền sài chung cho View mode */}
                    <tr className="font-semibold bg-gray-100">
                      <td colSpan={4} className="p-4 text-base">
                        <div className="flex justify-between items-center">
                          <span>Total Amount:</span>
                          <span>{billDetails.totalAmount.toLocaleString()} VND</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="font-semibold bg-gray-200">
                      <td colSpan={4} className="p-4 text-base">
                        <div className="flex justify-between items-center">
                          <span>Prepaid Amount (30%):</span>
                          <span>{billDetails.prepaidAmount.toLocaleString()} VND</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>


            {dishToDelete && (
              <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg text-center w-[84%] max-w-[465px]">
                  <h3 className="text-lg font-bold mb-2 text-[#634a3e]">Confirm Dish Deletion</h3>
                  <p className="text-sm mb-4 text-gray-700">
                    Are you sure you want to remove this dish from the order list?
                  </p>
                  <div className="flex justify-center gap-4">
                    <button
                      className="bg-[#947260] hover:bg-[#7e5b47] text-white px-5 py-2 rounded font-semibold"
                      onClick={() => handleDeleteDish(dishToDelete)}
                    >
                      Confirm
                    </button>
                    <button
                      className="bg-gray-300 text-black hover:bg-[#e4d3c3] text-black px-5 py-2 rounded font-semibold"
                      onClick={() => setDishToDelete(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!isEditing && !isOrderAtRestaurant && (
              <div className="my-6 p-4 border border-[#e0e0e0] rounded-lg bg-[#faf9f7]">
                <h4 className="text-base font-semibold text-[#634a3e] mb-4">
                  Select Payment Method
                </h4>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      checked={isVNPaySelected}
                      onChange={(e) => setIsVNPaySelected(e.target.checked)}
                      className="accent-[#947260] w-4 h-4"
                    />
                    <img
                      src={vnpayLogo}
                      alt="VNPay"
                      className="w-10 h-10 rounded shadow-sm"
                    />
                    <span className="text-sm text-[#634a3e] font-medium">VNPay</span>
                  </label>
                </div>
              </div>
            )}




            <div className="mt-6 flex flex-col gap-4">
              {!isEditing ? (
                <>
                  <button
                    className="bg-[#947260] hover:bg-[#7e5b47] text-white w-full py-3 rounded text-lg font-bold disabled:opacity-60"
                    onClick={handleConfirmBooking}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Processing..." : "Confirm"}
                  </button>

                  <div className="flex gap-3 justify-center">
                    <button
                      className="bg-[#947260] hover:bg-[#7e5b47] text-white flex-1 py-2 rounded font-semibold text-sm"
                      onClick={() => {
                        if (!booking) return;

                        const formattedDate = new Date(booking.bookingDate).toISOString().split("T")[0];

                        setEditedBooking({
                          ...booking,
                          bookingDate: formattedDate,
                          dishes: booking.dishes.map((d) => ({ ...d })), // deep clone
                        });

                        setIsEditing(true);
                      }}
                    >
                      Edit
                    </button>

                    <button
                      className="bg-[#947260] hover:bg-[#7e5b47] text-white flex-1 py-2 rounded font-semibold text-sm"
                      onClick={() => setShowCancelConfirmModal(true)}
                    >
                      Cancel
                    </button>

                  </div>
                </>
              ) : (
                <>
                  <button
                    className="bg-[#e09f3e] hover:bg-[#cf8c2d]  text-white w-full py-2 rounded font-semibold text-base"
                    onClick={async () => {
                      try {
                        const response = await axios.get(`http://localhost:3000/bookings/${bookingId}`);
                        setEditedBooking((prev) => {
                          if (!prev) return prev; // hoặc return null;
                          return {
                            ...prev,
                            notes: response.data.notes,
                          };
                        });
                      } catch (error) {
                        console.error("Error fetching latest note:", error);
                      }
                      setIsEditing(false);
                    }}
                  >
                    Cancel Edit
                  </button>
                  <button
                    className="bg-[#e09f3e] hover:bg-[#cf8c2d] text-white w-full py-2 rounded font-semibold text-base"
                    onClick={() => {
                      if (!editedBooking?.tableId) {
                        toast.error("Error: Please select a table before saving!");
                        return;
                      }
                      handleUpdateBooking();
                    }}
                  >
                    Save
                  </button>

                </>
              )}
            </div>


            {showCancelConfirmModal && (
              <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center text-center z-[1000] animate-fadeInOverlay">
                <div className="bg-white rounded-md p-6 shadow-lg w-[84%] max-w-md animate-scaleIn">
                  <h3 className="text-lg font-bold text-[#634a3e] mb-4">Confirm Cancellation</h3>
                  <p className="text-sm text-gray-700 mb-6">Are you sure you want to cancel this booking?</p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => setShowCancelConfirmModal(false)}
                      className="bg-gray-300 text-black hover:bg-[#e4d3c3] px-10 py-2 rounded  font-semibold"
                    >
                      No
                    </button>
                    <button
                      onClick={() => {
                        setShowCancelConfirmModal(false);
                        handleCancelBooking();
                      }}
                      className="bg-[#947260] hover:bg-[#7e5b47] text-white px-10 py-2 rounded  font-semibold"
                    >
                      Yes
                    </button>
                  </div>
                </div>
              </div>
            )}


          </div>
        </div>
      </div>
      <ToastContainer theme="colored" />
    </>
  );
};

export default ReviewBooking;