import { useEffect, useState } from "react";
import Modal from "react-modal";
import axios from "axios";
import { FaInfoCircle } from 'react-icons/fa';

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
    notes?: string;
    deliveryAddress?: string;
}

const BookingOrderManagement = () => {
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
            const response = await axios.get(`${backendApiUrl}/reservation/staff?page=${page}&limit=${limit}`);
            const { data, totalPages } = response.data;

            setBookings(data);
            setTotalPages(totalPages || 1);
        } catch (error) {
            console.error("Error fetching tables:", error);
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

            const response = await axios.get(`${backendApiUrl}/reservation/filters?${queryParams.toString()}`);
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
        const delayDebounceFn = setTimeout(() => {
            if (filters.searchText.trim() === "") {
                fetchTables(1);
                setCurrentPage(1);
                setNoResultsFound(false);
            } else {
                handleApplyFilter(1, filters);
                setCurrentPage(1);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [filters.searchText]);

    const handleViewDetails = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedBooking(null);
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

    return (
        <div className="mx-auto bg-white px-6 pt-5 pb-5 rounded-xl shadow-md min-h-[82vh]">
            <div className="flex flex-wrap items-center gap-3 mb-2 flex justify-between">
                <h3 className="text-2xl font-bold text-gray-800 mb-1">List of Reservation</h3>
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
                    </select>

                    <button
                        onClick={() => handleApplyFilter(1, filters)}
                        className="px-4 py-[7px] text-sm rounded border border-gray-300 bg-[#f0f0f0] hover:bg-[#F0924C] hover:text-white transition duration-200 shadow-sm"
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
                                        <td className="p-5 bg-white whitespace-nowrap">
                                            {(currentPage - 1) * limit + index + 1}
                                        </td>
                                        <td className="p-5 bg-white whitespace-nowrap">{booking.userId?.fullname || booking.guest?.name || "Unknown"}</td>
                                        <td className="p-5 bg-white whitespace-nowrap">{new Date(booking.bookingDate).toLocaleDateString()}</td>
                                        <td className="p-5">
                                            <span className={`inline-block px-3 py-1 rounded-full font-bold text-sm capitalize min-w-[90px] text-center ${booking.orderType.toLowerCase() === 'dine-in' ? 'text-green-700' :
                                                booking.orderType.toLowerCase() === 'delivery' ? 'text-blue-800' :
                                                    'text-gray-600'
                                                }`}>
                                                {booking.orderType}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <div className={`inline-flex items-center px-4 py-1 rounded-full font-bold text-sm w-fit ${getStatus(booking.status) === 'Confirmed' ? 'bg-green-100 text-green-700' :
                                                getStatus(booking.status) === 'Pending' ? 'bg-yellow-100 text-yellow-600' :
                                                    getStatus(booking.status) === 'Canceled' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-200 text-gray-600'
                                                }`}>
                                                <span className={`w-2 h-2 rounded-full mr-2 ${getStatus(booking.status) === 'Confirmed' ? 'bg-green-700' :
                                                    getStatus(booking.status) === 'Pending' ? 'bg-yellow-600' :
                                                        getStatus(booking.status) === 'Canceled' ? 'bg-red-700' :
                                                            'bg-gray-600'
                                                    }`}></span>
                                                {getStatus(booking.status)}
                                            </div>
                                        </td>
                                        <td className="p-5 whitespace-nowrap">
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
                                    <div className="mb-2">
                                        <span className="font-semibold">Order No:</span> {(currentPage - 1) * limit + index + 1}
                                    </div>
                                    <div className="mb-2">
                                        <span className="font-semibold">Customer:</span> {booking.userId?.fullname || booking.guest?.name || "Unknown"}
                                    </div>
                                    <div className="mb-2">
                                        <span className="font-semibold">Booking Date:</span> {new Date(booking.bookingDate).toLocaleDateString()}
                                    </div>
                                    <div className="mb-2">
                                        <span className="font-semibold">Order Type:</span>{" "}
                                        <span className={`capitalize font-semibold ${booking.orderType.toLowerCase() === 'delivery' ? 'text-blue-900' :
                                            booking.orderType.toLowerCase() === 'dine-in' ? 'text-green-700' :
                                                'text-gray-600'
                                            }`}>
                                            {booking.orderType}
                                        </span>
                                    </div>
                                    <div className="mb-2">
                                        <span className="font-semibold">Status:</span>{" "}
                                        <div className={`inline-flex items-center px-3 py-1 rounded-full font-bold text-sm w-fit mt-1 ${getStatus(booking.status) === 'Confirmed' ? 'bg-green-100 text-green-700' :
                                            getStatus(booking.status) === 'Pending' ? 'bg-yellow-100 text-yellow-600' :
                                                getStatus(booking.status) === 'Canceled' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-200 text-gray-600'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full mr-2 ${getStatus(booking.status) === 'Confirmed' ? 'bg-green-700' :
                                                getStatus(booking.status) === 'Pending' ? 'bg-yellow-600' :
                                                    getStatus(booking.status) === 'Canceled' ? 'bg-red-700' :
                                                        'bg-gray-600'
                                                }`}></span>
                                            {getStatus(booking.status)}
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-end">
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

                                {selectedBooking.tableId ? (
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
                                            <span>{selectedBooking.tableId.tableNumber}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex justify-between border-b border-dashed py-2 text-base">
                                        <strong>Delivery Address:</strong>
                                        <span className="text-right break-words max-w-[50%]">{selectedBooking.deliveryAddress || "N/A"}</span>
                                    </div>
                                )}
                            </div>

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
                                <span>{selectedBooking.notes || "N/A"}</span>
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
                        <p className="text-center">Loading...</p>
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

        </div>
    );
};

export default BookingOrderManagement;
