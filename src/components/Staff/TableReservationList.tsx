import { useEffect, useRef, useState } from "react";
import Modal from "react-modal";
import axios from "axios";
import { FaInfoCircle } from 'react-icons/fa';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocation } from "react-router";
import LoadingAnimation from "../LoadingAnimation";

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
    const [loading, setLoading] = useState<boolean>(false);
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
    const location = useLocation();
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
    const firstLoad = useRef(true);

    useEffect(() => {
        const hasApplied =
            appliedFilters.dateRange ||
            appliedFilters.fromDate ||
            appliedFilters.toDate ||
            appliedFilters.orderType ||
            appliedFilters.status ||
            appliedFilters.searchText.trim();

        const showLoading = firstLoad.current;
        firstLoad.current = false;

        if (hasApplied) {
            handleApplyFilter(currentPage, appliedFilters, showLoading);
        } else {
            fetchTables(currentPage, showLoading);
        }
    }, [currentPage]);

    const fetchTables = async (page = 1, showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
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
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const handleApplyFilter = async (
        page = 1,
        customFilters = filters,
        showLoading = true
    ) => {
        try {
            if (showLoading) setLoading(false);
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
        } finally {
            if (showLoading) setLoading(false);
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

    const statusModelStyles: Record<string, { color: string }> = {
        Confirmed: { color: "green" },
        Pending: { color: "#ffd54f" },
        Canceled: { color: "red" },
        Cooking: { color: "#f0924c" },
        Ready: { color: "#0d6efd" },
        Completed: { color: "#a84300" },
        Unknown: { color: "rgb(147 147 147)" }
    };

    const getStatus = (
        status: string
    ): "Pending" | "Confirmed" | "Canceled" | "Completed" | "Ready" | "Cooking" | "Unknown" => {
        const normalizedStatus = status?.toLowerCase();

        switch (normalizedStatus) {
            case "pending":
                return "Pending";
            case "confirmed":
                return "Confirmed";
            case "canceled":
                return "Canceled";
            case "completed":
                return "Completed";
            case "ready":
                return "Ready";
            case "cooking":
                return "Cooking";
            default:
                return "Unknown";
        }
    };

    const getValidNextStatuses = (currentStatus: string): string[] => {
        const normalized = currentStatus.toLowerCase();

        switch (normalized) {
            case "pending":
                return ["Confirmed", "Canceled"];
            case "confirmed":
                return ["Canceled"];
            case "cooking":
                return [];
            case "ready":
                return ["Completed"];
            case "canceled":
            case "completed":
                return [];
            default:
                return [];
        }
    };

    const renderStatusComponent = (
        status: string,
        onChange?: (newStatus: string) => void,
        bookingId?: string
    ) => {
        const current = getStatus(status);
        const canChange = getValidNextStatuses(current).length > 0;

        const backgroundColor =
            current === "Confirmed" ? "#d4edda" :
                current === "Pending" ? "#fff3cd" :
                    current === "Canceled" ? "#fee2e2" :
                        current === "Cooking" ? "#ffe0b2" :
                            current === "Ready" ? "#dbeafe" :
                                current === "Completed" ? "#ffcc80" :
                                    "#eeeeee";

        const textColor =
            current === "Confirmed" ? "#155724" :
                current === "Pending" ? "#856404" :
                    current === "Canceled" ? "#b91c1c" :
                        current === "Cooking" ? "#a84300" :
                            current === "Ready" ? "#0d6efd" :
                                current === "Completed" ? "#8b4500" :
                                    "#444";

        if (canChange && bookingId && onChange) {
            return (
                <select className="rounded-full w-[121px] px-4 py-[4px] font-bold text-sm text-center cursor-pointer border-none focus:outline-none focus:ring-0 border-none"
                    value={current}
                    onChange={(e) => {
                        if (e.target.value !== current) {
                            onChange(e.target.value);
                        }
                    }}
                    style={{
                        backgroundColor,
                        color: textColor,
                    }}
                >
                    <option value={current} disabled>{current}</option>
                    {getValidNextStatuses(current).map((statusOpt) => (
                        <option key={statusOpt} value={statusOpt}>{statusOpt}</option>
                    ))}
                </select>
            );
        } else {
            return (
                <span
                    className="rounded-full w-[121px] px-4 py-[4px] font-bold text-sm flex items-center justify-center gap-2 mx-auto"

                    style={{
                        backgroundColor,
                        color: textColor,
                    }}
                >
                    <span className="w-[9px] h-[8px] rounded-full" style={{ backgroundColor: textColor }}></span>
                    {current}
                </span>
            );
        }
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

    const getContainerClass = () => {
        if (location.pathname.startsWith("/staff")) {
            return "mx-auto bg-white px-7 pt-6 pb-4 rounded-lg shadow-md flex flex-col min-h-[79vh]";
        }
        switch (location.pathname) {
            case "/manage":
                return "relative w-[1200px] h-[570px] p-6 max-w-[1210px] bg-white rounded-2xl shadow-md";
            default:
                return "bg-white p-5 rounded-2xl shadow-md";
        }
    };

    return (
        <div className={getContainerClass()}>
            <div className="flex flex-wrap items-center gap-3 mb-2 justify-between">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">List of Reservation</h3>
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
                        className="px-3 py-2 text-sm border border-gray-300 rounded bg-white hover:border-orange-400 cursor-pointer transition"
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        value={filters.status}
                    >
                        <option value="">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Canceled">Canceled</option>
                        <option value="Cooking">Cooking</option>
                        <option value="Ready">Ready</option>
                        <option value="Completed">Completed</option>
                    </select>

                    <button
                        className="px-4 py-[7px] text-sm rounded border border-gray-300 bg-[#f0f0f0] hover:bg-[#F0924C] hover:text-white transition duration-200 shadow-sm"
                        onClick={() => handleApplyFilter(1, filters)}
                    >
                        Apply Filters
                    </button>

                </div>
            </div>

            <div className="relative min-h-[300px] overflow-x-auto scrollbar-hide">
                {loading && (
                    <div className="absolute inset-0 bg-white bg-opacity-60 z-50 flex items-center justify-center relative h-[64vh]">
                        <LoadingAnimation />
                    </div>
                )}

                {!loading && noResultsFound ? (
                    <div className="flex items-center justify-center h-[52vh] sm:h-[62vh]">
                        <div className="text-center text-red-500 font-semibold text-[18px]">
                            No results found
                        </div>
                    </div>
                ) : !loading && (
                    <>
                        {/* Desktop Table */}
                        <table className="hidden md:table w-full min-w-[800px] table-auto border-gray-200 text-base py-1">
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
                                        <td className="p-4">  {(currentPage - 1) * limit + index + 1}</td>
                                        <td className="p-4">{booking.userId?.fullname || booking.guest?.name || "Unknown"}</td>
                                        <td className="p-4">{new Date(booking.bookingDate).toLocaleDateString()}</td>
                                        <td
                                            className={`p-4 capitalize font-semibold ${booking.orderType.toLowerCase() === 'delivery'
                                                ? 'text-blue-900'
                                                : booking.orderType.toLowerCase() === 'dine-in'
                                                    ? 'text-green-700'
                                                    : 'text-gray-600'}`}
                                        >
                                            {booking.orderType}
                                        </td>

                                        <td className="p-4">
                                            {renderStatusComponent(
                                                booking.status,
                                                (newStatus) => {
                                                    setPendingStatusChange({ id: booking._id, status: newStatus });
                                                    setConfirmModalOpen(true);
                                                },
                                                booking._id
                                            )}
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
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

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4 mt-4">
                            {Array.isArray(bookings) && bookings.map((booking, index) => (
                                <div key={booking._id} className="bg-gray-50 border rounded-lg p-4 shadow-sm">
                                    <div className="mb-2">
                                        <span className="font-semibold">Reservation No:</span>   {(currentPage - 1) * limit + index + 1}
                                    </div>
                                    <div className="mb-2 flex items-center gap-2 whitespace-nowrap">
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
                                    <div className="mb-4 flex items-center gap-2 whitespace-nowrap">
                                        <span className="font-semibold">Status:</span>{" "}
                                        <div className="mt-1">
                                            {renderStatusComponent(
                                                booking.status,
                                                (newStatus) => {
                                                    setPendingStatusChange({ id: booking._id, status: newStatus });
                                                    setConfirmModalOpen(true);
                                                },
                                                booking._id
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end">
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

                                <>
                                    {selectedBooking.orderType === "dine-in" ? (
                                        <>
                                            <div className="flex justify-between border-b border-dashed py-2 text-base">
                                                <strong>Start Time:</strong> <span>{selectedBooking.startTime}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-dashed py-2 text-base">
                                                <strong>End Time:</strong> <span>{selectedBooking.endTime}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-dashed py-2 text-base items-center">
                                                <strong>Table Number:</strong>
                                                {isEditingTable ? (
                                                    <select
                                                        value={newTableId}
                                                        onChange={(e) => setNewTableId(e.target.value)}
                                                        className="border rounded px-1 py-1 text-center"
                                                    >
                                                        <option value={selectedBooking.tableId?._id || ""} disabled>
                                                            {selectedBooking.tableId?.tableNumber
                                                                ? `Current: ${selectedBooking.tableId.tableNumber}`
                                                                : "Select a table"}
                                                        </option>
                                                        {availableTables.map((table) => (
                                                            <option key={table._id} value={table._id}>
                                                                {table.tableNumber} (capacity: {table.capacity})
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span
                                                        className={
                                                            selectedBooking.tableId
                                                                ? "text-black"
                                                                : "text-yellow-500 font-medium"
                                                        }
                                                    >
                                                        {selectedBooking.tableId?.tableNumber || "Waiting for table assignment"}
                                                    </span>

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
                                </>

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
