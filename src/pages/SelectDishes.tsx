import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { toast, ToastContainer } from "react-toastify";

interface DishItem {
    _id: string;
    name: string;
    price: number;
    imageUrl: string;
}

interface Dish {
    dishId: string;
    quantity: number;
}

interface SelectDishesProps {
    bookingId?: string;
    onOrderTypeChange: (type: string) => void;
    openAddNoteModal: () => void;
}

const SelectDishes: React.FC<SelectDishesProps> = ({ bookingId, onOrderTypeChange, openAddNoteModal }) => {
    const [dishes, setDishes] = useState<DishItem[]>([]);

    const [selectedDishes, setSelectedDishes] = useState<Dish[]>([]);
    const [orderType, setOrderType] = useState("order-at-restaurant");
    const [showOrderTypeModal, setShowOrderTypeModal] = useState(true);
    const [showDishModal, setShowDishModal] = useState(false);
    const [, setErrorMessage] = useState("");
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000';
    // const navigate = useNavigate();
    const effectiveBookingId = bookingId || Cookies.get("bookingId");

    useEffect(() => {
        console.log("Booking ID:", effectiveBookingId);
    }, [effectiveBookingId]);

    useEffect(() => {
        const fetchDishes = async () => {
            try {
                const response = await axios.get(`${backendApiUrl}/bookings/get-dishes`);
                setDishes(response.data.data);
            } catch (error) {
                setErrorMessage("Error retrieving dish list.");
            }
        };

        const fetchBookingDetails = async () => {
            if (!effectiveBookingId) return;
            try {
                const response = await axios.get(`${backendApiUrl}/bookings/${effectiveBookingId}`);
                const bookingData = response.data;
                setSelectedDishes(bookingData.dishes || []);
                setOrderType(bookingData.orderType || "order-at-restaurant");
            } catch (error) {
                setSelectedDishes([]);
                setOrderType("order-at-restaurant");
            }
        };

        fetchDishes();
        if (effectiveBookingId) fetchBookingDetails();
    }, [effectiveBookingId]);

    const handleQuantityChange = (dishId: string, change: number) => {
        setSelectedDishes((prev: Dish[]) => {
            const existingDish = prev.find(dish => dish.dishId === dishId);

            if (existingDish) {
                return prev.map(dish =>
                    dish.dishId === dishId
                        ? { ...dish, quantity: Math.max(0, dish.quantity + change) }
                        : dish
                ).filter(dish => dish.quantity > 0);
            } else if (change > 0) {
                return [...prev, { dishId, quantity: 1 }];
            }

            return prev;
        });
    };


    const handleSubmit = async () => {
        if (!effectiveBookingId) {
            toast.warning("Please select at least one dish before confirming!");
            return;
        }

        if (orderType === "pre-order" && selectedDishes.length === 0) {
            toast.warning("Please select at least one dish before confirming!");
            return;
        }

        try {
            const formattedDishes = selectedDishes.map(dish => ({
                dishId: dish.dishId,
                quantity: dish.quantity
            }));

            await axios.put(`${backendApiUrl}/bookings/${effectiveBookingId}/add-dishes`, {
                dishes: orderType === "pre-order" ? formattedDishes : [],
                orderType
            });

            openAddNoteModal();
        } catch (error) {
            setErrorMessage("Error sending data to the server. Please try again!");
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center overflow-hidden animate-fadeInOverlay">
                {showOrderTypeModal && (
                    <div className="bg-[#baa392] w-[90%] max-w-[500px] max-h-[80vh] flex flex-col rounded-xl shadow-lg overflow-hidden animate-zoomIn animate-fadeInOverlay">
                        <h2 className="bg-[#634a3e] text-white p-3 text-center text-lg font-semibold rounded-t-xl">
                            Choose ordering method
                        </h2>
                        <div className="flex-1 overflow-y-auto p-4 max-h-[60vh]">
                            <label className="flex items-center bg-[var(--beige)] p-4 rounded-lg my-2 cursor-pointer transition-all text-lg font-bold border-2 border-[#634a3e] text-[#634a3e] hover:bg-[#634a3e] hover:text-white">
                                <input
                                    type="radio"
                                    value="pre-order"
                                    checked={orderType === "pre-order"}
                                    onChange={() => {
                                        setOrderType("pre-order");
                                        setShowDishModal(true);
                                        setShowOrderTypeModal(false);
                                    }}
                                    className="mr-2 scale-[1.2]"
                                />
                                <span>Pre-order</span>
                            </label>

                            <label className="flex items-center bg-[var(--beige)] p-4 rounded-lg my-2 cursor-pointer transition-all text-lg font-bold border-2 border-[#634a3e] text-[#634a3e] hover:bg-[#634a3e] hover:text-white">
                                <input
                                    type="radio"
                                    value="order-at-restaurant"
                                    checked={orderType === "order-at-restaurant"}
                                    onChange={() => {
                                        setOrderType("order-at-restaurant");
                                        if (typeof onOrderTypeChange === "function") {
                                            onOrderTypeChange("order-at-restaurant");
                                        }
                                        setShowConfirmModal(true);
                                    }}
                                    className="mr-2 scale-[1.2]"
                                />
                                <span>Order at the restaurant</span>
                            </label>

                            {showConfirmModal && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[1000] animate-fadeInOverlay">
                                    <div className="bg-[#baa392] w-[90%] max-w-md rounded-xl shadow-xl overflow-hidden animate-zoomIn animate-fadeInOverlay">

                                        <div className="bg-[#634a3e] py-4 px-6">
                                            <h2 className="text-white text-xl font-bold text-center tracking-wide">
                                                Confirmation
                                            </h2>
                                        </div>

                                        {/* Confirmation */}
                                        <div className="p-6 text-center animate-fadeInOverlay">
                                            <p className="text-base text-[#3e2f28] mb-6">
                                                Are you sure you want to continue without pre-ordering?
                                            </p>

                                            <div className="flex justify-center gap-4">
                                                <button
                                                    onClick={() => {
                                                        setOrderType("order-at-restaurant");
                                                        setShowOrderTypeModal(false);
                                                        setShowConfirmModal(false);
                                                        if (typeof onOrderTypeChange === "function") {
                                                            onOrderTypeChange("order-at-restaurant");
                                                        }
                                                        openAddNoteModal();
                                                    }}
                                                    className="bg-[#947260] hover:bg-[#7e5b47] text-white px-6 py-2 rounded font-semibold transition-all "
                                                >
                                                    Confirm
                                                </button>
                                                <button
                                                    onClick={() => setShowConfirmModal(false)}
                                                    className="bg-white text-[#634a3e] hover:bg-[#e4d3c3] border border-[#c7b6a8] px-6 py-2 rounded font-semibold transition-all hover:-translate-y-[2px] transition"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                            )}
                        </div>
                    </div>
                )}

                {showDishModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center overflow-hidden animate-fadeInOverlay">
                        <div className="bg-[#baa392] w-[90%] max-w-[510px] max-h-[94vh] flex flex-col rounded-xl shadow-lg overflow-hidden animate-zoomIn">
                            <h2 className="bg-[#634a3e] text-white p-5 text-center text-lg font-semibold rounded-t-xl">Select dishes</h2>
                            <div className="flex-1 overflow-y-auto p-4 max-h-[60vh]">
                                <ul className="list-none p-0 m-0">
                                    {dishes.map((dish) => (
                                        <li key={dish._id} className="flex justify-between items-center p-2 border-b border-gray-300">
                                            <div className="flex items-center">
                                                <img
                                                    src={dish.imageUrl || "https://cdn.tgdd.vn/Files/2020/10/27/1302333/omakase-la-gi-tai-sao-nguoi-nhat-san-sang-chi-tien-cho-loai-hinh-am-thuc-cau-ky-nay-202010271035082405.jpg"}
                                                    alt={dish.name}
                                                    className="w-20 h-20 object-cover rounded-xl mr-4"
                                                />
                                                <div>
                                                    <h4>{dish.name}</h4>
                                                    <p>Price: {dish.price.toLocaleString()} VND</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <div className="flex items-center border border-gray-400 rounded-full px-3 py-1 bg-white">
                                                    <button className="text-xl px-3" onClick={() => handleQuantityChange(dish._id, -1)}>-</button>
                                                    <span>
                                                        {selectedDishes.find((item) => item.dishId === dish._id)?.quantity || 0}
                                                    </span>
                                                    <button className="text-xl px-3" onClick={() => handleQuantityChange(dish._id, 1)}>+</button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-[#634a3e] p-4 sticky bottom-0 z-10 flex justify-center gap-4">
                                <button
                                    onClick={handleSubmit}
                                    className="bg-[#947260] text-white py-3 px-7 rounded-lg text-base font-bold shadow-md hover:bg-[#7e5b47] hover:-translate-y-[2px] transition"
                                >
                                    Confirm
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDishModal(false);
                                        setShowOrderTypeModal(true);
                                    }}
                                    className="bg-[#baa392] text-white py-3 px-7 rounded-lg text-base font-bold shadow-md hover:bg-[#e4d3c3] hover:-translate-y-[2px] transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <ToastContainer theme="colored" />
        </>
    );
};

export default SelectDishes;
