import { useEffect, useState } from "react";
import { FaInfoCircle } from "react-icons/fa";
import { useLocation } from "react-router";

interface CustomerInfo {
  type: "User" | "Guest" | "Unknown";
  name: string;
  email: string;
  contactPhone: string;
  deliveryAddress?: string;
  notes?: string;
}

interface BookingInfo {
  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  table?: string | null;
  orderType?: string;
  deliveryAddress?: string;
  notes?: string;
}

interface User {
  _id: string;
  fullname?: string;
  email: string;
  phoneNumber?: string;
}

interface Order {
  _id: string;
  userId?: User | null;
  totalAmount: number;
  prepaidAmount?: number;
  paymentMethod: string;
  paymentStatus: string;
  remainingAmount?: number;
  createdAt: string;

  bookingId?: {
    _id: string;
    orderType?: string;
    bookingDate?: string;
    startTime?: string;
    endTime?: string;
    contactPhone?: string;
    deliveryAddress?: string;
    notes?: string;
    tableId?: {
      tableNumber?: string;
      capacity?: number;
    } | null;
  } | null;

  // Thêm các field format cho đồng nhất với getOrders
  customerInfo?: CustomerInfo;
  bookingInfo?: BookingInfo;

  // Bổ sung orderType cho dễ truy cập
  orderType?: string;
}


const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:3000";

function OrderContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentStatus,] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const location = useLocation();
  const limit = 6;
  const [filters, setFilters] = useState({
    dateRange: "",
    fromDate: "",
    toDate: "",
    orderType: "",
    status: "",
  });
  const [, setAppliedFilters] = useState({
    dateRange: "",
    fromDate: "",
    toDate: "",
    orderType: "",
    status: "",
  });

  const fetchOrders = async (status: string, page = 1) => {
    try {
      let url = `${backendApiUrl}/orders?page=${page}&limit=${limit}`;
      if (status) url += `&paymentStatus=${encodeURIComponent(status)}`;

      const response = await fetch(url);
      const data = await response.json();
      setOrders(data.orders);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const handleApplyFilter = async (page = 1, customFilters = filters) => {
    setAppliedFilters(customFilters);
    let url = `${backendApiUrl}/orders?page=${page}&limit=${limit}`;
    if (customFilters.status) url += `&paymentStatus=${encodeURIComponent(customFilters.status)}`;
    if (customFilters.orderType) url += `&orderType=${encodeURIComponent(customFilters.orderType)}`;
    if (customFilters.dateRange) url += `&dateRange=${encodeURIComponent(customFilters.dateRange)}`;
    if (customFilters.fromDate) url += `&fromDate=${encodeURIComponent(customFilters.fromDate)}`;
    if (customFilters.toDate) url += `&toDate=${encodeURIComponent(customFilters.toDate)}`;
    const response = await fetch(url);
    const data = await response.json();
    setOrders(data.orders);
    setTotalPages(data.totalPages || 1);
    setCurrentPage(page);
  };

  useEffect(() => {
    handleApplyFilter(currentPage, filters);
  }, [paymentStatus, currentPage]);

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const response = await fetch(`${backendApiUrl}/orders/${orderId}`);
      const data = await response.json();
      if (data.success && data.order) {
        setSelectedOrder(data.order);
        setIsModalOpen(true);
      } else {
        console.error("Error fetching order details:", data);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    }
  };

  const handleChangeStatus = async (orderId: string, newStatus: string) => {
    if (newStatus === "Success") {
      const confirm = window.confirm("Are you sure you want to mark this order as Paid?");
      if (!confirm) return;
    }

    try {
      const response = await fetch(`${backendApiUrl}/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Order status updated to ${newStatus} successfully!`);
        fetchOrders(paymentStatus, currentPage);
      } else {
        alert("Failed to update order status. Please try again.");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const getContainerClass = () => {
    if (location.pathname.startsWith("/staff")) {
      return "mx-auto bg-white px-7 pt-6 pb-4 rounded-lg shadow-md flex flex-col min-h-[80vh]";
    }
    switch (location.pathname) {
      case "/manage":
        return "relative w-[1200px] h-[570px] p-5 max-w-[1210px] bg-white rounded-2xl shadow-md";
      default:
        return "bg-white p-5 rounded-2xl shadow-md";
    }
  };

  return (
    <div className={getContainerClass()}>
      <div className="flex flex-wrap items-center gap-3 mb-4 justify-between">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">List of Order</h3>
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="px-3 py-2 text-sm border border-gray-300 rounded bg-white hover:border-orange-400 cursor-pointer transition"
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value, fromDate: '', toDate: '' })}
            value={filters.dateRange}
            disabled={!!filters.fromDate || !!filters.toDate}
          >
            <option value="">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 Days</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
          </select>

          <select
            className="px-3 py-2 text-sm border border-gray-300 rounded bg-white hover:border-orange-400 cursor-pointer transition"
            onChange={(e) => setFilters({ ...filters, orderType: e.target.value })}
            value={filters.orderType}
          >
            <option value="">All Orders</option>
            <option value="dine-in">Dine-In</option>
            <option value="delivery">Delivery</option>
          </select>

          <select
            className="px-3 py-2 text-sm border border-gray-300 rounded bg-white hover:border-orange-400 cursor-pointer transition"
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            value={filters.status}
          >
            <option value="">All Status</option>
            <option value="Success">Success</option>
            <option value="Deposited">Deposited</option>
            <option value="Failure">Failure</option>
            <option value="Expired">Expired</option>
          </select>

          <button
            className="px-4 py-[7px] text-sm rounded border border-gray-300 bg-[#f0f0f0] hover:bg-[#F0924C] hover:text-white transition duration-200 shadow-sm"
            onClick={() => handleApplyFilter(1, filters)}
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border-b">Order ID</th>
              <th className="p-3 border-b">Customer Name</th>
              <th className="p-3 border-b">Order Type</th>
              <th className="p-3 border-b">Payment Method</th>
              <th className="p-3 border-b">Status</th>
              <th className="p-3 border-b">Total Amount</th>
              <th className="p-3 border-b">Created Date</th>
              <th className="p-3 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-6 text-gray-500">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50 text-center">
                  <td className="p-4 border-b whitespace-nowrap">{order._id.slice(-4)}</td>
                  <td className="p-4 border-b whitespace-nowrap">
                    {order.customerInfo?.name || "Guest"}
                  </td>
                  <td
                    className={`p-4 border-b whitespace-nowrap capitalize font-semibold ${order.bookingId?.orderType === "dine-in"
                      ? "text-green-700"
                      : order.bookingId?.orderType === "delivery"
                        ? "text-blue-900"
                        : ""
                      }`}
                  >
                    {order.bookingId?.orderType
                      ? order.bookingId.orderType.charAt(0).toUpperCase() +
                      order.bookingId.orderType.slice(1)
                      : "N/A"}
                  </td>
                  <td className="p-4 border-b whitespace-nowrap">{order.paymentMethod}</td>
                  <td className="p-4 border-b whitespace-nowrap">
                    {order.paymentStatus === "Deposited" ? (
                      <select
                        value={order.paymentStatus}
                        onChange={(e) => handleChangeStatus(order._id, e.target.value)}
                        className="px-4 py-1 border rounded"
                      >
                        <option value="Deposited">Deposited</option>
                        <option value="Success">Success</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold mx-auto ${order.paymentStatus === "Success"
                          ? "bg-green-100 text-green-800"
                          : order.paymentStatus === "Failure"
                            ? "bg-red-100 text-red-700"
                            : order.paymentStatus === "Expired"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${order.paymentStatus === "Success"
                            ? "bg-green-700"
                            : order.paymentStatus === "Failure"
                              ? "bg-red-700"
                              : order.paymentStatus === "Expired"
                                ? "bg-orange-700"
                                : "bg-gray-500"
                            }`}
                        ></span>
                        {order.paymentStatus}
                      </span>
                    )}
                  </td>
                  <td className="p-4 border-b whitespace-nowrap">
                    {order.totalAmount.toLocaleString()} VND
                  </td>
                  <td className="p-4 border-b whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <button
                      className="flex items-center gap-1 hover:scale-110 hover:text-[#f0924c] bg-none"
                      onClick={() => fetchOrderDetails(order._id)}
                    >
                      <FaInfoCircle className="text-sm" /> View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>


      {/* Mobile Cards */}
      <div className="md:hidden space-y-4 mt-4">
        {orders.map((order) => (
          <div key={order._id} className="bg-gray-50 p-4 rounded shadow">
            <div><strong>Order ID:</strong> {order._id.slice(-4)}</div>
            <div><strong>Customer Name: </strong>{order.customerInfo?.name || "Guest"}</div>
            <div><strong>Order Type:</strong>  <span
              className={`${order.bookingId?.orderType === "dine-in"
                ? "text-green-700 font-semibold"
                : order.bookingId?.orderType === "delivery"
                  ? "text-blue-900 font-semibold"
                  : "text-gray-600"
                }`}
            >
              {order.bookingId?.orderType
                ? order.bookingId.orderType.charAt(0).toUpperCase() +
                order.bookingId.orderType.slice(1)
                : "N/A"}
            </span>
            </div>
            <div><strong>Method:</strong> {order.paymentMethod}</div><div className="mt-2">
              <strong>Status:</strong>{" "}
              {order.paymentStatus === "Deposited" ? (
                <select
                  value={order.paymentStatus}
                  onChange={(e) => handleChangeStatus(order._id, e.target.value)}
                  className="px-2 py-1 border rounded mt-1"
                >
                  <option value="Deposited">Deposited</option>
                  <option value="Success">Success</option>
                </select>
              ) : (
                <span
                  className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${order.paymentStatus === "Success"
                    ? "bg-green-100 text-green-700"
                    : order.paymentStatus === "Failure"
                      ? "bg-red-100 text-red-700"
                      : order.paymentStatus === "Expired"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                >
                  {order.paymentStatus}
                </span>
              )}
            </div>

            <div><strong>Status:</strong> {order.paymentStatus}</div>
            <div><strong>Total:</strong> {order.totalAmount.toLocaleString()} VND</div>
            <div><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</div>
            <div className="mt-4 flex justify-end">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#f09c42] hover:scale-110 hover:text-white transition duration-200"
                onClick={() => fetchOrderDetails(order._id)}
              >
                <FaInfoCircle className="text-sm" /> View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-4 gap-2 flex-wrap">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm md:text-base"
        >
          &laquo; Prev
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((page) => page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2))
          .map((page, index, arr) => {
            const isEllipsisBefore = index > 0 && arr[index - 1] !== page - 1;
            return (
              <span key={page}>
                {isEllipsisBefore && <span className="px-2">...</span>}
                <button
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded ${currentPage === page
                    ? "bg-[#f0924c] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  {page}
                </button>
              </span>
            );
          })}

        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm md:text-base"
        >
          Next &raquo;
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[90%] max-w-md shadow-md animate-fadeInModal">
            <h3 className="text-lg font-bold text-center mb-4">Order Details</h3>
            <div className="space-y-2 text-sm text-gray-800">
              <p><strong>Order ID:</strong> {selectedOrder._id.slice(-4)}</p>
              <p>
                <strong>Name:</strong>{" "}
                {selectedOrder.customerInfo?.name ? (
                  selectedOrder.customerInfo.name
                ) : (
                  <span className="italic ">No user information</span>
                )}
              </p>
              <p>
                <strong>Email:</strong>{" "}
                {selectedOrder.customerInfo?.email ? (
                  selectedOrder.customerInfo.email
                ) : (
                  <span className="italic ">No user information</span>
                )}
              </p>
              <p>
                <strong>Phone:</strong>{" "}
                {selectedOrder.customerInfo?.contactPhone ? (
                  selectedOrder.customerInfo.contactPhone
                ) : (
                  <span className="italic">No phone number provided</span>
                )}
              </p>
              <p>
                <strong>Delivery Address:</strong>{" "}
                {selectedOrder.customerInfo?.deliveryAddress ? (
                  selectedOrder.customerInfo.deliveryAddress
                ) : (
                  <span className="italic">No delivery address provided</span>
                )}
              </p>
              <p>
                <strong>Note:</strong>{" "}
                {selectedOrder.customerInfo?.notes ? (
                  selectedOrder.customerInfo.notes
                ) : (
                  <span className="italic">No notes available</span>
                )}
              </p>

              {/* Other Order Info */}
              <p className="text-sm flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <strong>Order Type:</strong>
                <span
                  className={`${selectedOrder.orderType === "dine-in"
                    ? "text-green-700 font-semibold"
                    : selectedOrder.orderType === "delivery"
                      ? "text-blue-900 font-semibold"
                      : "text-gray-600"
                    }`}
                >
                  {selectedOrder.orderType
                    ? selectedOrder.orderType.charAt(0).toUpperCase() + selectedOrder.orderType.slice(1)
                    : "N/A"}
                </span>
              </p>

              <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod}</p>
              <p><strong>Status:</strong> {selectedOrder.paymentStatus}</p>
              <p><strong>Total Amount:</strong> {selectedOrder.totalAmount.toLocaleString()} VND</p>
              <p><strong>Prepaid: </strong>
                {selectedOrder.paymentStatus === "Success"
                  ? selectedOrder.totalAmount.toLocaleString()
                  : (selectedOrder.prepaidAmount ?? 0).toLocaleString()} VND
              </p>
              <p><strong>Remaining: </strong>
                {selectedOrder.paymentStatus === "Success"
                  ? "0"
                  : (selectedOrder.remainingAmount ?? selectedOrder.totalAmount - (selectedOrder.prepaidAmount ?? 0)).toLocaleString()} VND
              </p>
              <p><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full mt-4 bg-[#f0924c] text-white font-semibold py-2 rounded hover:bg-orange-500"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default OrderContent;
