import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInfoCircle,
  faExclamationCircle,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import Cookies from "js-cookie";
import Pagination from "../components/Pagination";
import LoadingAnimation from "../components/LoadingAnimation";

interface Booking {
  _id: string;
  orderType: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  tableId?: {
    tableNumber: number;
    capacity: number;
  };
}

interface BookingDetail {
  _id: string;
  orderType: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string;
  contactPhone: string;
  bookingDishes: {
    dishId: {
      name: string;
      price: number;
      description: string;
    };
    quantity: number;
  }[];
}

export default function BookingHistory() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentBooking, setCurrentBooking] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;
  const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        const token = Cookies.get("token");
        if (!token) {
          setError("You need to log in to view booking history");
          return;
        }

        const response = await fetch(`${backendApiUrl}/api/history/bookings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          Cookies.remove("token");
          navigate("/login");
          return;
        }

        const data = await response.json();
        if (data.success) {
          const validBookings = data.data.filter((booking: Booking) => {
            return booking.startTime != null && booking.endTime != null;
          });
          setBookings(validBookings);
        } else {
          setError(data.message || "An error occurred while loading data");
        }
      } catch (error) {
        console.error("Error fetching booking history:", error);
        setError("An error occurred while loading data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [navigate]);

  const fetchBookingDetails = async (bookingId: string) => {
    try {
      const token = Cookies.get("token");
      const response = await fetch(`${backendApiUrl}/api/history/booking/${bookingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSelectedBooking(data.data);
      } else {
        setError(data.message || "An error occurred while loading booking details");
      }
    } catch (error) {
      console.error("Error fetching booking details:", error);
      setError("An error occurred while loading booking details");
    }
  };

  const handleRowClick = (bookingId: string) => {
    fetchBookingDetails(bookingId);
  };

  const closeModal = () => {
    setSelectedBooking(null);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const handlePageChange = useCallback((paginatedBooking: any[], page: number) => {
    setCurrentBooking(paginatedBooking);
    setCurrentPage(page);
  }, []);

  if (error) {
    return (
      <div className="bg-red-100 text-red-800 p-4 rounded-md flex items-center gap-2">
        <FontAwesomeIcon icon={faExclamationCircle} className="mr-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="relative max-w-6xl mx-auto p-5 font-sans min-h-[380px] pb-[4.5rem]">
      {bookings.length > 0 ? (
        <div>
          <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
            <thead>
              <tr>
                <th className="p-2 md:p-4 text-center md:text-left bg-[#A2845E] text-white font-bold">No</th>
                <th className="p-2 md:p-4 text-center md:text-left bg-[#A2845E] text-white font-bold">Date</th>
                <th className="p-2 md:p-4 text-center md:text-left bg-[#A2845E] text-white font-bold border-r-1 md:border-0">Time</th>
                <th className="p-2 md:p-4 text-center md:text-left bg-[#A2845E] text-white font-bold border-r-1 md:border-0">Status</th>
                <th className="p-2 md:p-4 text-center md:text-left bg-[#A2845E] text-white font-bold">Table Number</th>
              </tr>
            </thead>
            <tbody className="w-full">
              {currentBooking.map((booking, index) => (
                <tr key={booking._id} onClick={() => handleRowClick(booking._id)} className="hover:bg-gray-100 cursor-pointer">
                  <td className="p-2 text-sm md:text-base text-center md:text-left md:p-4 border-b border-gray-200">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="p-2 text-sm md:text-base text-center md:text-left md:p-4 border-b border-gray-200">{new Date(booking.bookingDate).toLocaleDateString()}</td>
                  <td className="p-2 text-sm md:text-base text-center md:text-left md:p-4 border-b border-gray-200">{`${booking.startTime} - ${booking.endTime}`}</td>
                  <td className={`p-2 text-sm md:text-base text-center md:text-left md:p-4 border-b border-gray-200 capitalize ${booking.status === "confirmed" ? "text-green-600" : "text-yellow-500"}`}>
                    <FontAwesomeIcon
                      icon={faInfoCircle}
                      className="hidden md:inline mr-2"
                    />
                    {booking.status}
                  </td>
                  <td className="p-2 text-center md:text-left text-sm md:p-4 border-b border-gray-200">
                    {booking.tableId
                      ? `${booking.tableId.tableNumber} (Capacity: ${booking.tableId.capacity})`
                      : "No table"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedBooking && (
            <div className="fixed inset-0 px-3 bg-black bg-opacity-50 flex justify-center items-center z-[1000]" onClick={handleOverlayClick}>
              <div className="bg-white p-5 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto relative shadow-lg [&::-webkit-scrollbar]:hidden">
                <h3 className="mb-4 text-xl font-semibold">🧾 Booking Details</h3>

                <button
                  className="absolute top-4 right-5 text-gray-500 hover:text-gray-800"
                  onClick={closeModal}
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xl" />
                </button>

                <p className="mb-1 text-sm md:text-base">
                  <strong>Booking Date:</strong>{" "}
                  {new Date(selectedBooking.bookingDate).toLocaleDateString()}
                </p>

                <p className="mb-1 text-sm md:text-base">
                  <strong>Time:</strong> {selectedBooking.startTime} - {selectedBooking.endTime}
                </p>

                <p className="mb-1 text-sm md:text-base">
                  <strong>Status:</strong> {selectedBooking.status}
                </p>

                <p className="mb-1 text-sm md:text-base">
                  <strong>Notes:</strong> {selectedBooking.notes || "None"}
                </p>

                <p className="mb-4 text-sm md:text-base">
                  <strong>Contact Phone:</strong> {selectedBooking.contactPhone}
                </p>

                {selectedBooking.bookingDishes.length > 0 ? (
                  <table className="w-full border-collapse bg-white shadow-md rounded-lg">
                    <thead>
                      <tr>
                        <th className="p-2 md:p-4 text-center bg-[#A2845E] text-white font-bold">Dish Name</th>
                        <th className="p-2 md:p-4 text-center bg-[#A2845E] text-white font-bold">Quantity</th>
                        <th className="hidden md:block p-2 md:p-4 text-left bg-[#A2845E] text-white font-bold">Description</th>
                        <th className="p-2 md:p-4 text-center bg-[#A2845E] text-white font-bold">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBooking.bookingDishes.map((dish, index) => (
                        <tr key={index}>
                          <td className="p-2 md:p-4 border-b border-gray-200 text-black text-center">{dish.dishId.name}</td>
                          <td className="p-2 md:p-4 border-b border-gray-200 text-black text-center">{dish.quantity}</td>
                          <td className="hidden md:block p-2 md:p-4 border-b border-gray-200 text-black">{dish.dishId.description}</td>
                          <td className="p-2 md:p-4 border-b border-gray-200 text-black text-center">{dish.dishId.price.toLocaleString()} VND</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (null)}
              </div>
            </div>
          )}
        </div>
      ) : isLoading ? (
        <div className="min-h-[150px] flex justify-center items-center mt-28">
          <LoadingAnimation />
        </div>
      ) : (
        <div className="flex justify-center items-center mt-32">
          <p>There are no booking record in history</p>
        </div>
      )}

      <Pagination items={bookings} itemsPerPage={itemsPerPage} onPageChange={handlePageChange} />
    </div>
  );
}