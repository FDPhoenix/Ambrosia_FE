import { useEffect, useState } from "react";
import Modal from "react-modal";
import axios from "axios";
import { FaInfoCircle } from 'react-icons/fa';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoadingAnimation from "../LoadingAnimation";

interface Booking {
    _id: string;
    userId?: { fullname: string; email: string; phoneNumber: string };
    tableId?: { tableNumber: string; capacity: number };
    bookingDate: string;
    startTime: string;
    endTime: string;
    orderType: string;
    status: string;
    dishes?: {
        dishId: {
            imageUrl: string;
            name: string;
            price: number;
        };
        quantity: number;
    }[];
    guest?: { name: string; contactPhone: string, email: string };
    order?: {
        _id: string;
        totalAmount: number;
        prepaidAmount: number;
        paymentMethod?: string;
        paymentStatus?: string;
        createdAt: string;
    } | null;
    notes?: string;
    deliveryAddress?: string;
}

const BookingOrderManagement = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [, setFilterModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        dateRange: "",
        fromDate: "",
        toDate: "",
        orderType: "",
        status: "",
        searchText: "",
    });

    const [appliedFilters, setAppliedFilters] = useState({
        dateRange: "",
        fromDate: "",
        toDate: "",
        orderType: "",
        status: "",
        searchText: "",
    });

    const [noResultsFound, setNoResultsFound] = useState(false);
    const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000';
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const limit = 6;
    const [pendingStatusChange, setPendingStatusChange] = useState<{ id: string; status: string } | null>(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const fetchTables = async (page = 1, showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const response = await axios.get(`${backendApiUrl}/reservation/staff?page=${page}&limit=${limit}`);
            const { data, totalPages } = response.data;

            setBookings(data);
            setTotalPages(totalPages || 1);
        } catch (error) {
            console.error("Error fetching tables:", error);
        } finally {
            if (showLoading) {
                setLoading(false);
                setInitialLoading(false);
            }
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
            fetchTables(currentPage, initialLoading);
        }
    }, [currentPage]);

    const handleViewDetails = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsModalOpen(true);
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            await axios.put(`${backendApiUrl}/reservation/${id}/status`, { status: newStatus });

            const hasApplied =
                appliedFilters.dateRange ||
                appliedFilters.fromDate ||
                appliedFilters.toDate ||
                appliedFilters.orderType ||
                appliedFilters.status ||
                appliedFilters.searchText.trim();
            if (hasApplied) {
                await handleApplyFilter(currentPage, appliedFilters);
            } else {
                await fetchTables(currentPage, false);
            }

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


    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedBooking(null);
    };

    const getStatus = (status: string) => {
        const normalizedStatus = status?.toLowerCase();
        if (normalizedStatus === "confirmed") return "Confirmed";
        if (normalizedStatus === "pending") return "Pending";
        if (normalizedStatus === "canceled") return "Canceled";
        if (normalizedStatus === "cooking") return "Cooking";
        if (normalizedStatus === "ready") return "Ready";
        if (normalizedStatus === "completed") return "Completed";
        return "Unknown";
    };

    const statusModelStyles: Record<string, { color: string }> = {
        Confirmed: { color: "green" },
        Pending: { color: "#ffd54f" },
        Canceled: { color: "red" },
        Completed: { color: "#a84300" },
        Ready: { color: "#0d6efd" },
        Cooking: { color: "#f0924c" },
        Unknown: { color: "rgb(147 147 147)" }
    };


    const getValidNextStatuses = (currentStatus: string) => {
        const status = currentStatus.toLowerCase();

        if (status === "confirmed") return ["Cooking", "Ready"];
        if (status === "cooking") return ["Ready"];

        return [];
    };
    const isStatusLocked = (status: string) => {
        return getValidNextStatuses(status).length === 0;
    };


    return (
        <div className="mx-auto bg-white p-6 rounded-lg shadow-md flex flex-col min-h-[568px]">
            <div className="flex flex-wrap items-center gap-3 mb-2 flex justify-between">
                <h3 className="text-2xl font-bold text-gray-800 mb-3">List of Reservation</h3>
                <div className="flex flex-wrap items-center gap-3">
                    <select
                        className="px-3 py-2 text-sm border border-gray-300 rounded bg-white hover:border-orange-400 cursor-pointer transition"
                        onChange={(e) => setFilters({ ...filters, dateRange: e.target.value, fromDate: "", toDate: "" })}
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
                        <option value="Canceled">Canceled</option>
                        <option value="Cooking">Cooking</option>
                        <option value="Ready">Ready</option>
                        <option value="Completed">Completed</option>
                    </select>

                    <button
                        onClick={() => handleApplyFilter(1, filters)}
                        className="px-4 py-[7px] text-sm rounded border border-gray-300 bg-[#f0f0f0] hover:bg-[#F0924C] hover:text-white transition duration-200 shadow-sm"
                    >
                        Apply Filters
                    </button>

                </div>
            </div>

            <div className="relative overflow-x-auto scrollbar-hide">
                {loading && (
                    <div className="absolute inset-0 bg-white bg-opacity-60 z-50 flex items-center justify-center relative h-[63vh]">
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
                        <table className="hidden md:table w-full border-collapse rounded-md text-center">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-4 font-bold">Order Number</th>
                                    <th className="p-4 font-bold">Customer Name</th>
                                    <th className="p-4 font-bold">Booking Date</th>
                                    <th className="p-4 font-bold">Order Type</th>
                                    <th className="p-4 font-bold">Status</th>
                                    <th className="p-4 font-bold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((booking, index) => (
                                    <tr key={booking._id} className="border-b">
                                        <td className="p-4 bg-white whitespace-nowrap">
                                            {(currentPage - 1) * limit + index + 1}
                                        </td>
                                        <td className="p-4 bg-white whitespace-nowrap">{booking.userId?.fullname || booking.guest?.name || "Unknown"}</td>
                                        <td className="p-4 bg-white whitespace-nowrap">{new Date(booking.bookingDate).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            <span className={`inline-block px-3 py-1 rounded-full font-bold text-sm capitalize min-w-[90px] text-center ${booking.orderType.toLowerCase() === 'dine-in' ? 'text-green-700' :
                                                booking.orderType.toLowerCase() === 'delivery' ? 'text-blue-800' :
                                                    'text-gray-600'
                                                }`}>
                                                {booking.orderType}
                                            </span>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            {isStatusLocked(booking.status) ? (
                                                <span
                                                    className="w-[121px] inline-flex items-center gap-2 px-4 py-[4px] rounded-full font-bold text-sm justify-center"
                                                    style={{
                                                        backgroundColor:
                                                            getStatus(booking.status) === 'Confirmed' ? '#d4edda' :
                                                                getStatus(booking.status) === 'Pending' ? '#fff3cd' :
                                                                    getStatus(booking.status) === 'Canceled' ? '#fee2e2' :
                                                                        getStatus(booking.status) === 'Cooking' ? '#ffe0b2' :
                                                                            getStatus(booking.status) === 'Ready' ? '#dbeafe' :
                                                                                '#ffcc80',
                                                        color:
                                                            getStatus(booking.status) === 'Confirmed' ? '#155724' :
                                                                getStatus(booking.status) === 'Pending' ? '#856404' :
                                                                    getStatus(booking.status) === 'Canceled' ? '#b91c1c' :
                                                                        getStatus(booking.status) === 'Cooking' ? '#a84300' :
                                                                            getStatus(booking.status) === 'Ready' ? '#0d6efd' :
                                                                                '#8b4500',
                                                    }}
                                                >
                                                    <span className="text-lg leading-none">●</span>
                                                    {getStatus(booking.status)}
                                                </span>
                                            ) : (
                                                <select
                                                    className="w-[121px] rounded-full px-4 py-[4px] font-bold text-sm text-center item-center cursor-pointer focus:outline-none border border-gray-100"
                                                    value={getStatus(booking.status)}
                                                    onChange={(e) => {
                                                        const newStatus = e.target.value;
                                                        if (newStatus !== getStatus(booking.status)) {
                                                            setPendingStatusChange({ id: booking._id, status: newStatus });
                                                            setConfirmModalOpen(true);
                                                        }
                                                    }}
                                                    style={{
                                                        backgroundColor:
                                                            getStatus(booking.status) === 'Confirmed' ? '#d4edda' :
                                                                getStatus(booking.status) === 'Pending' ? '#fff3cd' :
                                                                    getStatus(booking.status) === 'Canceled' ? '#fee2e2' :
                                                                        getStatus(booking.status) === 'Cooking' ? '#ffe0b2' :
                                                                            getStatus(booking.status) === 'Ready' ? '#dbeafe' :
                                                                                '#ffcc80',
                                                        color:
                                                            getStatus(booking.status) === 'Confirmed' ? '#155724' :
                                                                getStatus(booking.status) === 'Pending' ? '#856404' :
                                                                    getStatus(booking.status) === 'Canceled' ? '#b91c1c' :
                                                                        getStatus(booking.status) === 'Cooking' ? '#a84300' :
                                                                            getStatus(booking.status) === 'Ready' ? '#0d6efd' :
                                                                                '#8b4500',
                                                        textAlignLast: 'center',
                                                    }}
                                                >
                                                    <option value={getStatus(booking.status)} disabled>
                                                        {getStatus(booking.status)}
                                                    </option>
                                                    {getValidNextStatuses(booking.status).map((statusOpt) => (
                                                        <option key={statusOpt} value={statusOpt}>{statusOpt}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </td>

                                        <td className="p-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleViewDetails(booking)}
                                                className="flex items-center gap-1 hover:scale-110 hover:text-[#f0924c] bg-none pl-5"
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
                            {bookings.map((booking, index) => (
                                <div key={booking._id} className="bg-white rounded-md p-4 shadow border">
                                    <div className="mb-2 whitespace-nowrap">
                                        <span className="font-semibold">Order No:</span> {(currentPage - 1) * limit + index + 1}
                                    </div>
                                    <div className="mb-2 whitespace-nowrap">
                                        <span className="font-semibold">Customer:</span> {booking.userId?.fullname || booking.guest?.name || "Unknown"}
                                    </div>
                                    <div className="mb-2 whitespace-nowrap">
                                        <span className="font-semibold">Booking Date:</span> {new Date(booking.bookingDate).toLocaleDateString()}
                                    </div>
                                    <div className="mb-2 whitespace-nowrap">
                                        <span className="font-semibold">Order Type:</span>{" "}
                                        <span className={`capitalize font-semibold ${booking.orderType.toLowerCase() === 'delivery' ? 'text-blue-900' :
                                            booking.orderType.toLowerCase() === 'dine-in' ? 'text-green-700' :
                                                'text-gray-600'
                                            }`}>
                                            {booking.orderType}
                                        </span>
                                    </div>
                                    <div className="mb-2 flex items-center gap-2 whitespace-nowrap">
                                        <span className="font-semibold">Status:</span>
                                        <div className="mt-1 ">
                                            {isStatusLocked(booking.status) ? (
                                                <span
                                                    className="inline-flex w-[121px] py-1 items-center justify-center gap-2 px-3 py-1 rounded-full font-bold text-sm text-center"
                                                    style={{
                                                        backgroundColor:
                                                            getStatus(booking.status) === 'Confirmed' ? '#d4edda' :
                                                                getStatus(booking.status) === 'Pending' ? '#fff3cd' :
                                                                    getStatus(booking.status) === 'Canceled' ? '#f8d7da' :
                                                                        getStatus(booking.status) === 'Cooking' ? '#ffe0b2' :
                                                                            getStatus(booking.status) === 'Ready' ? '#dbeafe' :
                                                                                '#ffcc80',
                                                        color:
                                                            getStatus(booking.status) === 'Confirmed' ? '#155724' :
                                                                getStatus(booking.status) === 'Pending' ? '#856404' :
                                                                    getStatus(booking.status) === 'Canceled' ? '#721c24' :
                                                                        getStatus(booking.status) === 'Cooking' ? '#a84300' :
                                                                            getStatus(booking.status) === 'Ready' ? '#0d6efd' :
                                                                                '#8b4500',
                                                    }}
                                                >
                                                    <span className="text-lg leading-none">●</span>
                                                    {getStatus(booking.status)}
                                                </span>
                                            ) : (
                                                <select
                                                    className="w-[121px] rounded-full py-1 font-bold text-sm text-center cursor-pointer focus:outline-none border-none"
                                                    value={getStatus(booking.status)}
                                                    onChange={(e) => {
                                                        const newStatus = e.target.value;
                                                        if (newStatus !== getStatus(booking.status)) {
                                                            setPendingStatusChange({ id: booking._id, status: newStatus });
                                                            setConfirmModalOpen(true);
                                                        }
                                                    }}
                                                    style={{
                                                        backgroundColor:
                                                            getStatus(booking.status) === 'Confirmed' ? '#d4edda' :
                                                                getStatus(booking.status) === 'Pending' ? '#fff3cd' :
                                                                    getStatus(booking.status) === 'Canceled' ? '#f8d7da' :
                                                                        getStatus(booking.status) === 'Cooking' ? '#ffe0b2' :
                                                                            getStatus(booking.status) === 'Ready' ? '#dbeafe' :
                                                                                '#ffcc80',
                                                        color:
                                                            getStatus(booking.status) === 'Confirmed' ? '#155724' :
                                                                getStatus(booking.status) === 'Pending' ? '#856404' :
                                                                    getStatus(booking.status) === 'Canceled' ? '#721c24' :
                                                                        getStatus(booking.status) === 'Cooking' ? '#a84300' :
                                                                            getStatus(booking.status) === 'Ready' ? '#0d6efd' :
                                                                                '#8b4500',
                                                        textAlignLast: 'center',
                                                    }}
                                                >
                                                    <option value={getStatus(booking.status)} disabled>
                                                        {getStatus(booking.status)}
                                                    </option>
                                                    {getValidNextStatuses(booking.status).map((statusOpt) => (
                                                        <option key={statusOpt} value={statusOpt}>{statusOpt}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>

                                    </div>


                                    <div className="mt-6 flex justify-end">
                                        <button
                                            onClick={() => handleViewDetails(booking)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#f09c42] hover:scale-110 hover:text-white transition duration-200"
                                        >
                                            <FaInfoCircle className="text-base" />
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>


            {/* Modal Detail */}
            <Modal
                isOpen={isModalOpen}
                onRequestClose={closeModal}
                className="bg-white p-7 rounded-lg shadow-lg max-w-[600px] w-[94%] max-h-[81vh]  overflow-y-auto animate-fadeInModal scrollbar-hide"
                overlayClassName="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center px-4 animate-fadeInOverlay z-[9999]"
                shouldCloseOnOverlayClick={false}
                ariaHideApp={false}
            >
                <div className="flex flex-col gap-4 text-base">
                    <h3 className="text-2xl font-bold text-center border-b pb-2">Order details</h3>

                    {selectedBooking ? (
                        <>
                            {/* Customer Info */}
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between border-b border-dashed py-2 text-base">
                                    <strong>Customer Name:</strong>
                                    <span>{selectedBooking.userId?.fullname || selectedBooking.guest?.name || "Unknown"}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed py-2 text-base">
                                    <strong>Email:</strong>
                                    <span>{selectedBooking.userId?.email || selectedBooking.guest?.email || "N/A"}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed py-2 text-base">
                                    <strong>Phone Number:</strong>
                                    <span>{selectedBooking.userId?.phoneNumber || selectedBooking.guest?.contactPhone || "N/A"}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed py-2 text-base">
                                    <strong>Booking Date:</strong>
                                    <span>{new Date(selectedBooking.bookingDate).toLocaleDateString()}</span>
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

                                {selectedBooking.orderType?.toLowerCase() === "delivery" ? (
                                    <div className="flex justify-between border-b border-dashed py-2 text-base">
                                        <strong>Delivery Address:</strong>
                                        <span className="text-right break-words max-w-[50%]">
                                            {selectedBooking.deliveryAddress || "N/A"}
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between border-b border-dashed py-2 text-base">
                                            <strong>Start Time:</strong>
                                            <span>{selectedBooking.startTime}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-dashed py-2 text-base">
                                            <strong>End Time:</strong>
                                            <span>{selectedBooking.endTime}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-dashed py-2 text-base">
                                            <strong>Table Name:</strong>
                                            <span
                                                className={
                                                    selectedBooking.tableId
                                                        ? "text-black"
                                                        : "text-yellow-500 font-medium"
                                                }
                                            >
                                                {selectedBooking.tableId?.tableNumber || "Waiting for table assignment"}
                                            </span>
                                        </div>
                                        {selectedBooking.tableId && (
                                            <div className="flex justify-between border-b border-dashed py-2 text-base">
                                                <strong>Capacity:</strong>
                                                <span className="text-gray-700">{selectedBooking.tableId.capacity}</span>
                                            </div>
                                        )}
                                    </>
                                )}

                            </div>
                            {selectedBooking.order && (
                                <>
                                    <div className="flex justify-between border-b border-dashed py-2 text-base">
                                        <strong>Payment Method:</strong>
                                        <span>{selectedBooking.order?.paymentMethod || "N/A"}</span>
                                    </div>

                                    <div className="flex justify-between border-b border-dashed py-2 text-base">
                                        <strong>Payment Status:</strong>
                                        <span className="font-bold tracking-wide">
                                            {selectedBooking.order.paymentStatus || "N/A"}
                                        </span>
                                    </div>

                                </>
                            )}
                            {/* Dishes */}
                            <h5 className="text-base font-semibold mt-3">Ordered Dishes List:</h5>
                            {Array.isArray(selectedBooking.dishes) && selectedBooking.dishes.length > 0 ? (
                                <table className="w-full border border-gray-200 my-3 text-base">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="border px-3 py-2">Image</th>
                                            <th className="border px-3 py-2">Dish Name</th>
                                            <th className="border px-3 py-2">Quantity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedBooking.dishes.map((dish, index) => (
                                            <tr key={index}>
                                                <td className="border p-2">
                                                    <img
                                                        src={dish.dishId.imageUrl || "https://via.placeholder.com/50"}
                                                        alt={dish.dishId.name}
                                                        className="w-[110px] h-[110px] rounded-md object-cover mx-auto"
                                                    />
                                                </td>
                                                <td className="border text-center">{dish.dishId.name}</td>
                                                <td className="border text-center">x{dish.quantity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-6 bg-gray-100 rounded text-sm font-semibold text-gray-600 mt-2">
                                    Order at the restaurant
                                </div>
                            )}
                            <div className="flex justify-between border-b border-dashed py-2 text-base">
                                <strong>Notes:</strong>
                                <span>
                                    {selectedBooking.notes ? (
                                        selectedBooking.notes
                                    ) : (
                                        <em style={{ color: "#888" }}>No notes provided by the customer</em>
                                    )}
                                </span>
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

                            {/* Close Button */}
                            <div className="flex justify-center mt-6">
                                <button
                                    onClick={closeModal}
                                    className="bg-orange-400 text-white w-full py-2 rounded hover:bg-orange-500"
                                >
                                    Close
                                </button>
                            </div>
                        </>
                    ) : (
                        <p className="text-center"><LoadingAnimation /></p>
                    )}
                </div>
            </Modal>

            {!noResultsFound && totalPages > 1 && (
                <div className="flex justify-center mt-3 gap-2 flex-wrap">
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

        </div>
    );
};

export default BookingOrderManagement;
