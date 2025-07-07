import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ToastContainer } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { FiMenu } from "react-icons/fi";
import { BiUserPlus } from "react-icons/bi";

import StaffReservation from "../assets/StaffReservation.png";
import IngredientIcon from "../assets/ingredient.png";
import FeedbackIcon from "../assets/feedback.png";
import OrderIcon from "../assets/checklist.png";
import passcode from "../assets/credit-card.png";
import LogOut from "../assets/logout.png";
import waiterIcon from "../assets/waiter.png";
import avatar from "../assets/avatar.png";

import TableReservationList from "../components/Staff/TableReservationList";
import FeedbackContent from "../components/Admin/FeedbackContent";
import IngredientContent from "../components/Admin/IngredientContent";
import OrderContent from "../components/Admin/OrderContent";
import StaffQRScanner from "../components/Staff/StaffQRScanner";

function StaffPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const token = Cookies.get("token");
    const userImage = Cookies.get("userImage") ?? null;
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isModalOpen] = useState(false);

    const getTitle = () => {
        switch (location.pathname) {
            case "/staff/reservation":
                return "Reservation Management";
            case "/staff/passcode":
                return "QRScanner Management";
            case "/staff/order":
                return "Order Management";
            case "/staff/feedback":
                return "Feedback Management";
            case "/staff/ingredient":
                return "Ingredient Management";
            default:
                return "Reservation Management";
        }
    };

    let decodedToken: any = null;
    if (token) {
        try {
            decodedToken = jwtDecode(token);
        } catch (error) {
            console.error("Invalid token:", error);
        }
    }

    const getContentComponent = () => {
        switch (location.pathname) {
            case "/staff/reservation":
                return <TableReservationList />;
            case "/staff/passcode":
                return <StaffQRScanner />;
            case "/staff/order":
                return <OrderContent />;
            case "/staff/feedback":
                return <FeedbackContent />;
            case "/staff/ingredient":
                return <IngredientContent />;
            default:
                return <TableReservationList />;
        }
    };

    const handleLogout = () => {
        Cookies.remove("token");
        Cookies.remove("userImage");
        navigate("/login");
    };

    return token && decodedToken?.roleId?.includes("67ac64c7e072694cafa16e7a") ? (
        <div className="relative h-screen overflow-hidden">
            <div className={`flex h-full transition duration-300 `} >
                {/* <div
                    className={flex h-screen bg-[#eff4f8] overflow-hidden transition duration-300 ${isModalOpen ? "md:blur-sm md:brightness-90" : ""
                }}
            > */}
                {/* Sidebar */}
                <div
                    className={`fixed inset-y-0 left-0 w-[284px] bg-white shadow-lg transform transition-transform duration-100 ease-in-out md:relative md:translate-x-0 
    ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
    ${isModalOpen ? "z-0" : "z-50"} overflow-y-auto`}
                >
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6 ">
                            <div className="flex items-center gap-2 cursor-pointer mb-6">
                                <img
                                    src={waiterIcon}
                                    className="w-8 h-8 rounded-full border border-black"
                                    alt="logo"
                                />
                                <span className="text-[35px] font-bold">Ambrosia</span>
                            </div>
                            <div className="flex justify-end items-center mb-14 md:hidden">
                                <button onClick={() => setIsSidebarOpen(false)} className="text-gray-700 text-[21px]">
                                    ✕
                                </button>
                            </div>
                        </div>



                        <div>
                            <div className="px-3 mb-8 ">
                                <h3 className="text-sm font-semibold text-gray-500">MANAGEMENT</h3>
                                <div className="mt-5 h-px bg-gray-200"></div>
                            </div>

                            <ul className="space-y-2 text-[16px]">
                                <li>
                                    <button
                                        onClick={() => {
                                            navigate("/staff/reservation");
                                            setIsSidebarOpen(false);
                                        }}
                                        className={`flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-orange-200 transition ${["/staff", "/staff/reservation"].includes(location.pathname) ? "bg-[#f09c42] text-white" : "text-gray-800"}`}
                                    >
                                        <img src={StaffReservation} className="w-6 h-6" alt="Reservation" />
                                        <span>Reservation Order</span>
                                    </button>
                                </li>
                                {[{ path: "/staff/passcode", icon: passcode, label: "Passcode" }, { path: "/staff/order", icon: OrderIcon, label: "Order" }, { path: "/staff/feedback", icon: FeedbackIcon, label: "Feedback" }, { path: "/staff/ingredient", icon: IngredientIcon, label: "Ingredient" }].map(({ path, icon, label }) => (
                                    <li key={path}>
                                        <button
                                            onClick={() => {
                                                navigate(path);
                                                setIsSidebarOpen(false);
                                            }}
                                            className={`flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-orange-200 transition ${location.pathname === path ? "bg-[#f09c42] text-white" : "text-gray-800"}`}
                                        >
                                            <img src={icon} className="w-6 h-6" alt={label} />
                                            <span>{label}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>

                            <div className="px-3 mb-8 mt-9">
                                <h3 className="text-sm font-semibold text-gray-500">AUTH</h3>
                                <div className="mt-5 h-px bg-gray-200"></div>
                            </div>
                            <ul className="space-y-3 text-[16px]">
                                <li>
                                    <button
                                        onClick={() => setShowLogoutModal(true)}
                                        className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-orange-200 text-left text-gray-800"
                                    >
                                        <img src={LogOut} className="w-6 h-6" alt="Log Out" />
                                        <span>Log Out</span>
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => navigate("/staff/register")}
                                        className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-orange-200 text-gray-800"
                                    >
                                        <BiUserPlus className="w-5 h-5" />
                                        <span>Other</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-y-auto bg-[#f6f6f9] min-h-screen scrollbar-hide">

                    {/* HEADER */}
                    <div className="w-full px-4 sm:px-1 pb-2">
                        <div className="w-full px-3 sm:px-6 md:px-10 lg:px-10 xl:px-12 2xl:px-31">
                            <header className="bg-white shadow-md rounded-xl py-3 px-6 flex items-center justify-between mt-6 relative">
                                {/* LEFT — Menu (mobile) & Title (desktop) */}
                                <div className="flex items-center gap-3">
                                    {/* Menu button — mobile only */}
                                    <button
                                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                        className="p-2 rounded bg-[#f09c42] md:hidden"
                                    >
                                        <FiMenu className="text-white w-5 h-5" />
                                    </button>

                                    {/* Title — show desktop only */}
                                    <h1 className="text-[27px] font-semibold hidden md:block p-1">
                                        {getTitle()}
                                    </h1>

                                </div>

                                {/* <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 md:hidden">
                                <img src={waiterIcon} alt="Logo" className="w-7 h-7" />
                            </div> */}

                                {/* RIGHT — Bell & Avatar */}
                                <div className="absolute right-4 flex items-center gap-5">
                                    <div className="p-2 bg-[#f09c42] rounded">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-5 h-5 text-white"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 5a2 2 0 0 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3H4a4 4 0 0 0 2-3v-3a7 7 0 0 1 4-6m-1 12v1a3 3 0 0 0 6 0v-1" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 6.727A11.05 11.05 0 0 0 18.206 3" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6.727A11.05 11.05 0 0 1 5.792 3" />
                                        </svg>
                                    </div>

                                    <img
                                        src={userImage || avatar}
                                        alt="User avatar"
                                        className="w-9 h-9 rounded-full object-cover"
                                    />
                                </div>
                            </header>
                        </div>
                    </div>

                    {/* MAIN CONTENT */}
                    <main className="flex-1 w-full px-4 sm:px-5 md:px-9 lg:px-9 xl:px-10 2xl:px-18 pt-4 pb-3">
                        <div className="w-full px-3">
                            {getContentComponent()}
                        </div>
                    </main>

                </div>


                {/* Logout Modal */}
                {showLogoutModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-[9999]">
                        <div className="bg-white rounded-2xl p-7 w-[360px] max-w-[90%] text-center shadow-2xl animate-fade-in">
                            <h3 className="text-xl font-semibold mb-2 text-gray-900">Confirm Log Out</h3>
                            <p className="text-gray-600 mb-6">Are you sure you want to log out?</p>
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={handleLogout}
                                    className="bg-[#f09c42] text-white px-9 py-2 rounded-lg font-semibold text-sm hover:bg-[#e3912d] transition"
                                >
                                    OK
                                </button>
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 hover:border-gray-400 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
            <ToastContainer theme="colored" />

        </div >
    ) : (
        <div className="flex justify-center items-center h-screen text-lg font-semibold">
            You don't have permission to access this page
        </div>
    );
}

export default StaffPage;