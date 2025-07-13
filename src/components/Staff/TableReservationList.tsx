import { useEffect, useState } from "react";
import Modal from "react-modal";
import axios from "axios";
import { FaInfoCircle } from 'react-icons/fa';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Booking {
    _id: string;
    userId?: { fullname: string; email: string; phoneNumber: string };
    tableId?: {
        _id: string;
        tableNumber: string;
        capacity: number;
    };
    bookingDate: string;
    startTime: string;
    endTime: string;
    orderType: string;
    status: string;
    dishes?: { dishId: { name: string; price: number }; quantity: number }[];
    guest?: { name: string; contactPhone: string, email: string };
    notes?: string;
    deliveryAddress?: string;
}

const TableReservationList = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [, setFilterModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        dateRange: "",
        fromDate: "",
        toDate: "",
        orderType: "",
        status: "",
        searchText: "",
    });
    const [noResultsFound, setNoResultsFound] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [pendingStatusChange, setPendingStatusChange] = useState<{ id: string, status: string } | null>(null);
    const [isEditingTable, setIsEditingTable] = useState(false);
    const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000';
    const [availableTables, setAvailableTables] = useState<{
        _id: string;
        tableNumber: string;
        capacity: number;
        status: string;
    }[]>([]);
    const [newTableId, setNewTableId] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const limit = 6;

    const [appliedFilters, setAppliedFilters] = useState({
        dateRange: "",
        fromDate: "",
        toDate: "",
        orderType: "",
        status: "",
        searchText: "",
    });

    useEffect(() => {
        const hasApplied =
            appliedFilters.dateRange ||
            appliedFilters.fromDate ||
            appliedFilters.toDate ||
            appliedFilters.orderType ||
            appliedFilters.status ||
            appliedFilters.searchText.trim();

        if (hasApplied) {
            handleApplyFilter(currentPage, appliedFilters);
        } else {
            fetchTables(currentPage);
        }
    }, [currentPage]);

    const fetchTables = async (page = 1) => {
        try {
            const response = await axios.get(`${backendApiUrl}/reservation?page=${page}&limit=${limit}`);
            const { data, totalPages } = response.data;

            if (Array.isArray(data)) {
                setBookings(data);
                setTotalPages(totalPages || 1);
            } else {
                console.warn("API returned an incorrect format:", response.data);
                setBookings([]);
            }
        } catch (error) {
            console.error("Error fetching bookings:", error);
            setBookings([]);
        }
    };

    const handleApplyFilter = async (page = 1, customFilters = filters) => {
        try {
            setAppliedFilters(customFilters);

            const queryParams = new URLSearchParams();
            queryParams.append("page", page.toString());
            queryParams.append("limit", limit.toString());

            if (customFilters.dateRange) queryParams.append("dateRange", customFilters.dateRange);
            if (customFilters.fromDate) queryParams.append("fromDate", customFilters.fromDate);
            if (customFilters.toDate) queryParams.append("toDate", customFilters.toDate);
            if (customFilters.orderType) queryParams.append("orderType", customFilters.orderType);
            if (customFilters.status) queryParams.append("status", customFilters.status);
            if (customFilters.searchText.trim()) queryParams.append("searchText", customFilters.searchText.trim());

            const response = await axios.get(`${backendApiUrl}/reservation/filter?${queryParams.toString()}`);
            const { data, totalPages } = response.data;

            setBookings(data);
            setTotalPages(totalPages || 1);
            setCurrentPage(page);
            setNoResultsFound(data.length === 0);
            setFilterModalOpen(false);
        } catch (error) {
            console.error("Error filtering reservations:", error);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedBooking(null);
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            await axios.put(`${backendApiUrl}/reservation/${id}/status`, { status: newStatus });

            setBookings(prevBookings =>
                prevBookings.map(booking =>
                    booking._id === id ? { ...booking, status: newStatus } : booking
                )
            );
            handleApplyFilter(currentPage);
            toast.success("Status updated successfully!");
        } catch (error: unknown) {
            console.error("Error updating status:", error);

            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Failed to update status. Please try again.");
            } else if (error instanceof Error) {
                toast.error(`Error: ${error.message}`);
            } else {
                toast.error("An unexpected error occurred.");
            }
        }
    };

    const statusModelStyles = {
        Confirmed: { color: "green" },
        Pending: { color: "#ffad00" },
        Canceled: { color: "red" },
        Unknown: { color: "rgb(147 147 147)" }
    };

    const getStatus = (status: string) => {
        const normalizedStatus = status?.toLowerCase();
        if (normalizedStatus === "confirmed") return "Confirmed";
        if (normalizedStatus === "pending") return "Pending";
        if (normalizedStatus === "canceled") return "Canceled";
        return "Unknown";
    };

    const fetchAvailableTables = async (bookingDate: string, startTime: string) => {
        try {
            const res = await axios.get(`${backendApiUrl}/reservation/available`, {
                params: {
                    bookingDate,
                    startTime,
                }
            });
            const available = res.data.filter((t: any) => t.isAvailable);
            setAvailableTables(available);
        } catch (err) {
            toast.error("Failed to fetch available tables");
        }
    };

    const handleChangeTable = async () => {
        if (!selectedBooking) return;
        if (!newTableId) {
            toast.error("Please select a table");
            return;
        }

        try {
            await axios.put(
                `${backendApiUrl}/bookings/${selectedBooking._id}`,
                {
                    tableId: newTableId,
                    bookingDate: selectedBooking.bookingDate,
                    startTime: selectedBooking.startTime,
                    notes: selectedBooking.notes,
                    dishes: selectedBooking.dishes?.map((d) => ({
                        dishId: d.dishId,
                        quantity: d.quantity,
                    })),
                }
            );

            toast.success("Table updated successfully!");
            setIsEditingTable(false);

            const updatedTable = availableTables.find(t => t._id === newTableId);

            if (updatedTable) {
                setSelectedBooking(prev =>
                    prev ? {
                        ...prev,
                        tableId: {
                            _id: updatedTable._id,
                            tableNumber: updatedTable.tableNumber,
                            capacity: updatedTable.capacity ?? 0,
                        },
                    } : null
                );
            }

            setBookings(prevBookings =>
                prevBookings.map(booking =>
                    booking._id === selectedBooking._id
                        ? {
                            ...booking,
                            tableId: updatedTable ? {
                                _id: updatedTable._id,
                                tableNumber: updatedTable.tableNumber,
                                capacity: updatedTable.capacity ?? 0,
                            } : booking.tableId,
                        }
                        : booking
                )
            );
        } catch (error) {
            console.error("Error updating table:", error);
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Failed to update table");
            } else {
                toast.error("Unknown error occurred!");
            }
        }
    };

    const getSelectedCapacity = () => {
        if (!newTableId) return selectedBooking?.tableId?.capacity ?? "N/A";

        const found = availableTables.find(t => t._id === newTableId);
        return found?.capacity ?? selectedBooking?.tableId?.capacity ?? "N/A";
    };

    return (
        <div className="mx-auto bg-white p-6 rounded-lg shadow-md flex flex-col min-h-[82vh]">
            <div className="flex flex-wrap items-center gap-3 mb-2 flex justify-between">
                <h3 className="text-2xl font-bold text-gray-800 mb-1">List of Reservation</h3>
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
                        <option value="dine-in">Dine-in</option>
                        <option value="delivery">Delivery</option>
                    </select>

                    <select
                        className="px-4 py-2 text-sm border border-gray-300 rounded bg-white hover:border-orange-400 cursor-pointer transition"
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        value={filters.status}
                    >
                        <option value="">All Status</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Pending">Pending</option>
                        <option value="Canceled">Canceled</option>
                    </select>

                    <button
                        className="px-4 py-[7px] text-sm rounded border border-gray-300 bg-[#f0f0f0] hover:bg-[#F0924C] hover:text-white transition duration-200 shadow-sm"
                        onClick={() => handleApplyFilter(1, filters)}
                    >
                        Apply Filters
                    </button>

                </div>
            </div>

            <div className="overflow-x-auto scrollbar-hide">{/*  max-h-[62vh]  */}
                {noResultsFound ? (
                    <div className="flex items-center justify-center h-[62vh]">
                        <div className="text-center text-red-500 font-semibold text-[18px]">
                            No results found
                        </div>
                    </div>
                ) : (
                    <><table className="hidden md:table w-full min-w-[800px] table-auto border-gray-200 text-base">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-4 font-bold">Reservation Number</th>
                                <th className="p-4 font-bold">Customer Name</th>
                                <th className="p-4 font-bold">Booking Date</th>
                                <th className="p-4 font-bold">Order Type</th>
                                <th className="p-4 font-bold">Status</th>
                                <th className="p-4 font-bold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.isArray(bookings) && bookings.map((booking, index) => (
                                <tr key={booking._id} className="text-center border-y hover:bg-gray-100 transition duration-200">
                                    <td className="p-5">  {(currentPage - 1) * limit + index + 1}</td>
                                    <td className="p-5">{booking.userId?.fullname || booking.guest?.name || "Unknown"}</td>
                                    <td className="p-5">{new Date(booking.bookingDate).toLocaleDateString()}</td>
                                    <td
                                        className={`p-5 capitalize font-semibold ${booking.orderType.toLowerCase() === 'delivery'
                                            ? 'text-blue-900'
                                            : booking.orderType.toLowerCase() === 'dine-in'
                                                ? 'text-green-700'
                                                : 'text-gray-600'}`}
                                    >
                                        {booking.orderType}
                                    </td>

                                    <td className="p-5">
                                        <select
                                            className="rounded-full px-4 py-1 font-bold text-sm text-center cursor-pointer focus:outline-none border-none"
                                            value={getStatus(booking.status)}
                                            onChange={(e) => {
                                                const newStatus = e.target.value;
                                                setPendingStatusChange({ id: booking._id, status: newStatus });
                                                setConfirmModalOpen(true);
                                            }}
                                            style={{
                                                backgroundColor: getStatus(booking.status) === 'Confirmed' ? '#d4edda' :
                                                    getStatus(booking.status) === 'Pending' ? '#fff3cd' :
                                                        getStatus(booking.status) === 'Canceled' ? '#f8d7da' : '#ffcc80',
                                                color: getStatus(booking.status) === 'Confirmed' ? '#155724' :
                                                    getStatus(booking.status) === 'Pending' ? '#856404' :
                                                        getStatus(booking.status) === 'Canceled' ? '#721c24' : '#8b4500'
                                            }}
                                        >
                                            <option value="Confirmed">Confirmed</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Canceled">Canceled</option>
                                        </select>
                                    </td>
                                    <td className="p-5 whitespace-nowrap">
                                        <button className=" flex items-center gap-1 hover:scale-110 hover:text-[#f0924c] bg-none pl-5" onClick={() => {
                                            setSelectedBooking(booking);
                                            setIsModalOpen(true);
                                        }}
                                        >
                                            <FaInfoCircle className="text-sm" /> View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                        <div className="md:hidden space-y-4 mt-4">
                            {Array.isArray(bookings) && bookings.map((booking, index) => (
                                <div key={booking._id} className="bg-gray-50 border rounded-lg p-4 shadow-sm">
                                    <div className="mb-2">
                                        <span className="font-semibold">Reservation No:</span>   {(currentPage - 1) * limit + index + 1}
                                    </div>
                                    <div className="mb-2">
                                        <span className="font-semibold">Customer:</span> {booking.userId?.fullname || booking.guest?.name || "Unknown"}
                                    </div>
                                    <div className="mb-2">
                                        <span className="font-semibold">Date:</span> {new Date(booking.bookingDate).toLocaleDateString()}
                                    </div>
                                    <div className="mb-2">
                                        <span className="font-semibold">Order Type:</span>{" "}
                                        <span className={`capitalize font-semibold ${booking.orderType.toLowerCase() === 'delivery'
                                            ? 'text-blue-900'
                                            : booking.orderType.toLowerCase() === 'dine-in'
                                                ? 'text-green-700'
                                                : 'text-gray-600'}`}>
                                            {booking.orderType}
                                        </span>
                                    </div>
                                    <div className="mb-2">
                                        <span className="font-semibold">Status:</span>{" "}
                                        <select
                                            className="rounded-full px-4 py-1 font-bold text-sm text-center cursor-pointer focus:outline-none border-none mt-1"
                                            value={getStatus(booking.status)}
                                            onChange={(e) => {
                                                const newStatus = e.target.value;
                                                setPendingStatusChange({ id: booking._id, status: newStatus });
                                                setConfirmModalOpen(true);
                                            }}
                                            style={{
                                                backgroundColor: getStatus(booking.status) === 'Confirmed' ? '#d4edda' :
                                                    getStatus(booking.status) === 'Pending' ? '#fff3cd' :
                                                        getStatus(booking.status) === 'Canceled' ? '#f8d7da' : '#ffcc80',
                                                color: getStatus(booking.status) === 'Confirmed' ? '#155724' :
                                                    getStatus(booking.status) === 'Pending' ? '#856404' :
                                                        getStatus(booking.status) === 'Canceled' ? '#721c24' : '#8b4500'
                                            }}
                                        >
                                            <option value="Confirmed">Confirmed</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Canceled">Canceled</option>
                                        </select>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#f09c42] hover:scale-110 hover:text-white transition duration-200"
                                            onClick={() => {
                                                setSelectedBooking(booking);
                                                setIsModalOpen(true);
                                            }}
                                        >
                                            <FaInfoCircle className="text-sm" /> View Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>

                )}
            </div>

            {!noResultsFound && totalPages > 1 && (
                <div className="flex justify-center mt-4 gap-2 flex-wrap">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
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
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                    >
                        Next &raquo;
                    </button>
                </div>
            )}


            {/* Confirm Modal */}
            <Modal
                isOpen={confirmModalOpen}
                onRequestClose={() => setConfirmModalOpen(false)}
                className="bg-white p-6 rounded-lg shadow-lg max-w-[600px] w-[88%] max-h-[82vh] animate-fadeInModal"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[9999]"

                ariaHideApp={false}
            >
                <div className="text-center space-y-4">
                    <h2 className="text-lg font-semibold">Confirm Status Change</h2>
                    <p>Are you sure you want to change the status to <span className="font-bold">{pendingStatusChange?.status}</span>?</p>
                    <div className="flex justify-center gap-4 mt-6">
                        <button
                            className="bg-orange-400 text-white px-9 py-2 rounded hover:bg-orange-500"
                            onClick={() => {
                                if (pendingStatusChange) {
                                    handleUpdateStatus(pendingStatusChange.id, pendingStatusChange.status);
                                }
                                setConfirmModalOpen(false);
                                setPendingStatusChange(null);
                            }}
                        >
                            Yes
                        </button>
                        <button
                            className="bg-gray-300 text-black px-6 py-2 rounded hover:bg-gray-400"
                            onClick={() => {
                                setConfirmModalOpen(false);
                                setPendingStatusChange(null);
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal Detail */}
            <Modal
                isOpen={isModalOpen}
                onRequestClose={closeModal}
                className="bg-white p-7 rounded-lg shadow-lg max-w-[600px] w-[94%] max-h-[82vh] overflow-y-auto animate-fadeInModal scrollbar-hide"
                overlayClassName="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center px-4 animate-fadeInOverlay z-[9999]"
                shouldCloseOnOverlayClick={false}
                ariaHideApp={false}
            >
                <div className="flex flex-col gap-4 text-base">
                    <h3 className="text-2xl font-bold text-center mb-3">Order details</h3>
                    {selectedBooking ? (
                        <>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between border-b border-dashed py-2 text-base">
                                    <strong>Booking ID:</strong> <span>{selectedBooking._id}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed py-2 text-base">
                                    <strong>Order Type:</strong>
                                    <span
                                        className={`font-semibold capitalize ${selectedBooking.orderType?.toLowerCase() === 'delivery'
                                            ? 'text-blue-900'
                                            : selectedBooking.orderType?.toLowerCase() === 'dine-in'
                                                ? 'text-green-700'
                                                : 'text-gray-700'
                                            }`}
                                    >
                                        {selectedBooking.orderType}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-dashed py-2 text-base">
                                    <strong>Customer Name:</strong>
                                    <span>{selectedBooking.userId?.fullname || selectedBooking.guest?.name || "Unknown"}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed py-2 text-base">
                                    <strong>Phone Number:</strong>
                                    <span>{selectedBooking.userId?.phoneNumber || selectedBooking.guest?.contactPhone || "N/A"}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed py-2 text-base">
                                    <strong>Email:</strong>
                                    <span>{selectedBooking.userId?.email || selectedBooking.guest?.email || "N/A"}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed py-2 text-base">
                                    <strong>Booking Date:</strong>
                                    <span>{new Date(selectedBooking.bookingDate).toLocaleDateString()}</span>
                                </div>

                                {selectedBooking.tableId ? (
                                    <>
                                        <div className="flex justify-between border-b border-dashed py-2 text-base">
                                            <strong>Start Time:</strong> <span>{selectedBooking.startTime}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-dashed py-2 text-base">
                                            <strong>End Time:</strong> <span>{selectedBooking.endTime}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-dashed py-2 text-base items-center">
                                            <strong>Table Number:</strong>

                                            {isEditingTable && selectedBooking.tableId ? (
                                                <select
                                                    value={newTableId}
                                                    onChange={(e) => setNewTableId(e.target.value)}
                                                    className="border rounded px-2 py-1"
                                                >
                                                    <option value={selectedBooking.tableId._id}>
                                                        {selectedBooking.tableId.tableNumber} (Current)
                                                    </option>

                                                    {availableTables
                                                        .filter(
                                                            (t) =>
                                                                t._id !== selectedBooking.tableId!._id &&
                                                                t.status === "available"
                                                        )
                                                        .map((table) => (
                                                            <option key={table._id} value={table._id}>
                                                                {table.tableNumber}
                                                            </option>
                                                        ))}
                                                </select>
                                            ) : (
                                                <span>{selectedBooking.tableId?.tableNumber}</span>
                                            )}
                                        </div>

                                        <div className="flex justify-between border-b border-dashed py-2 text-base">
                                            <strong>Capacity:</strong>
                                            <span>{getSelectedCapacity()}</span>
                                        </div>


                                    </>
                                ) : (
                                    <div className="flex justify-between border-b border-dashed py-2 text-base">
                                        <strong>Delivery Address:</strong>
                                        <span className="text-right break-words max-w-[50%]">{selectedBooking.deliveryAddress || "N/A"}</span>
                                    </div>

                                )}
                            </div>

                            <h5 className="text-base font-semibold">Ordered Dishes List:</h5>
                            {selectedBooking.dishes && selectedBooking.dishes.length > 0 ? (
                                <table className="w-full border border-gray-200 my-3 text-base">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-4 border">Dish Name</th>
                                            <th className="p-4 border">Quantity</th>
                                            <th className="p-4 border">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedBooking.dishes.map((dish, index) => (
                                            <tr key={index} className="text-center">
                                                <td className="p-4 border text-left">{dish.dishId.name}</td>
                                                <td className="p-4 border">x{dish.quantity}</td>
                                                <td className="p-4 border">{dish.dishId.price.toLocaleString()} VND</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gray-100">
                                            <td colSpan={3} className="p-4">
                                                <div className="flex justify-between font-bold">
                                                    <span>Total (Before Tax):</span>
                                                    <span className="text-orange-600">
                                                        {selectedBooking.dishes.reduce((sum, dish) => sum + dish.dishId.price * dish.quantity, 0).toLocaleString()} VND
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            ) : (
                                <div className="text-center bg-gray-100 text-gray-600 py-4 rounded">
                                    <strong>Order at the restaurant</strong>
                                </div>
                            )}

                            <div className="flex justify-between border-b border-dashed py-2 text-base">
                                <strong>Notes:</strong> <span>{selectedBooking.notes || "N/A"}</span>
                            </div>
                            <div className="flex justify-between border-b border-dashed py-2 text-base">
                                <strong>Status:</strong>
                                <span
                                    className="font-semibold"
                                    style={statusModelStyles[getStatus(selectedBooking.status)] || statusModelStyles.Unknown}
                                >
                                    {getStatus(selectedBooking.status)}
                                </span>
                            </div>

                            <div className="flex justify-between gap-4 mt-5">
                                {!isEditingTable ? (
                                    <>
                                        {selectedBooking?.orderType === "dine-in" && (
                                            <button
                                                onClick={() => {
                                                    setIsEditingTable(true);
                                                    setNewTableId(selectedBooking?.tableId?._id || "");
                                                    fetchAvailableTables(selectedBooking.bookingDate, selectedBooking.startTime);
                                                }}
                                                className="bg-[#f0924c] text-white px-4 py-2 rounded hover:bg-[#d87c3b] w-1/2 transition duration-200"
                                            >
                                                Edit Table
                                            </button>
                                        )}

                                        <button
                                            onClick={closeModal}
                                            className={`${selectedBooking?.orderType === "dine-in" ? "w-1/2" : "w-full"
                                                } bg-[#f0924c] text-white px-4 py-2 rounded hover:bg-[#d87c3b] transition duration-200`}
                                        >
                                            Close
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleChangeTable}
                                            className="bg-[#f0924c] text-white px-4 py-2 rounded hover:bg-[#d87c3b] w-1/2 transition duration-200"
                                        >
                                            Save
                                        </button>

                                        <button
                                            onClick={() => {
                                                setIsEditingTable(false);
                                                setNewTableId("");
                                            }}
                                            className="border border-[#f0924c] text-[#f0924c] px-4 py-2 rounded hover:bg-[#f0924c] hover:text-white w-1/2 transition duration-200"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                )}

                            </div>
                        </>
                    ) : (
                        <p>Loading...</p>
                    )}
                </div>
            </Modal>

        </div>
    );
};

export default TableReservationList;
