import { useEffect, useState } from "react";
import { FaInfoCircle } from "react-icons/fa";

interface User {
  _id: string;
  email: string;
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
}

function OrderContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const limit = 6; // luôn là 6 đơn hàng mỗi trang

  const fetchOrders = async (status: string, page = 1) => {
    try {
      let url = `http://localhost:3000/orders?page=${page}&limit=${limit}`;
      if (status) url += `&paymentStatus=${encodeURIComponent(status)}`;

      const response = await fetch(url);
      const data = await response.json();
      setOrders(data.orders);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    fetchOrders(paymentStatus, currentPage);
  }, [paymentStatus, currentPage]);

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const response = await fetch(`http://localhost:3000/orders/${orderId}`);
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
      const response = await fetch(`http://localhost:3000/${orderId}/status`, {
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

  return (
    <div className="w-[1200px] h-[567px] bg-white rounded-[15px] shadow-md p-6 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-center text-gray-800">Order List</h3>
        <div className="flex items-center gap-3">
          <label htmlFor="filter">Payment Status:</label>
          <select
            id="filter"
            value={paymentStatus}
            onChange={(e) => {
              setCurrentPage(1);
              setPaymentStatus(e.target.value);
            }}
            className="px-3 py-1 border border-gray-300 rounded"
          >
            <option value="">All</option>
            <option value="Success">Success</option>
            <option value="Deposited">Deposited</option>
            <option value="Failure">Failure</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-y-auto max-h-[450px] scrollbar-hide">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border-b">Order ID</th>
              <th className="p-3 border-b">Customer Email</th>
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
                <td colSpan={7} className="text-center py-6 text-gray-500">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50 text-center">
                  <td className="p-3 border-b">{order._id}</td>
                  <td className="p-3 border-b">{order.userId?.email || "N/A"}</td>
                  <td className="p-3 border-b">{order.paymentMethod}</td>
                  <td className="p-3 border-b">
                    {order.paymentStatus === "Deposited" ? (
                      <select
                        value={order.paymentStatus}
                        onChange={(e) => handleChangeStatus(order._id, e.target.value)}
                        className="px-2 py-1 border rounded"
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
                  <td className="p-3 border-b">{order.totalAmount.toLocaleString()} VND</td>
                  <td className="p-3 border-b">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 border-b">
                    <button
                      onClick={() => fetchOrderDetails(order._id)}
                      className="flex items-center justify-center gap-2 text-black hover:text-gray-700 px-4 py-2 rounded"
                    >
                      <FaInfoCircle className="text-lg" /> View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-4 gap-2 flex-wrap">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
        >
          &laquo; Prev
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(
            (page) =>
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 2 && page <= currentPage + 2)
          )
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
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
        >
          Next &raquo;
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[420px] shadow-md">
            <h3 className="text-lg font-bold text-center mb-4">Order Details</h3>
            <div className="space-y-2 text-sm text-gray-800">
              <p><strong>Order ID:</strong> {selectedOrder._id}</p>
              <p><strong>Email:</strong> {selectedOrder.userId?.email || "N/A"}</p>
              <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod}</p>
              <p><strong>Status:</strong> {selectedOrder.paymentStatus}</p>
              <p><strong>Total Amount:</strong> {selectedOrder.totalAmount.toLocaleString()} VND</p>
              <p><strong>Prepaid Amount:</strong> {selectedOrder.paymentStatus === "Success" ? selectedOrder.totalAmount.toLocaleString() : (selectedOrder.prepaidAmount ?? 0).toLocaleString()} VND</p>
              <p><strong>Remaining Amount:</strong> {selectedOrder.paymentStatus === "Success" ? "0" : (selectedOrder.remainingAmount ?? selectedOrder.totalAmount - (selectedOrder.prepaidAmount ?? 0)).toLocaleString()} VND</p>
              <p><strong>Created Date:</strong> {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full mt-4 bg-yellow-400 text-white font-semibold py-2 rounded hover:bg-yellow-500"
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
