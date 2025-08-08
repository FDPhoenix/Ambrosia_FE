import React, { useState, useRef, useEffect } from "react";
import QrScanner from "qr-scanner";
import axios from "axios";
import Modal from "react-modal";
import { FaInfoCircle } from "react-icons/fa";
import { MdFlipCameraAndroid } from "react-icons/md";
import LoadingAnimation from "../LoadingAnimation";

Modal.setAppElement('#root');

interface Dish {
    name: string;
    price: number;
    quantity: number;
}

interface PaymentInfo {
    method: string;
    status: string;
    amount: number;
    transactionId?: string | null;
}

interface Booking {
    _id: string;
    customerName: string;
    customerEmail: string;
    tableCapability: number;
    contactPhone: string;
    tableNumber: string;
    bookingDate: string;
    time: string;
    notes?: string;
    status: string;
    dishes: Dish[];
    totalBill: number;
    orderType: string;
    deliveryAddress?: string;
    pickupTime?: string;
    payment: PaymentInfo;
}

export default function StaffQRScanner() {
    const [mode, setMode] = useState<"camera" | "image">("camera");
    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
    const [bookingInfo, setBookingInfo] = useState<Booking | null>(null);
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const qrScannerRef = useRef<QrScanner | null>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [isDishModalOpen, setIsDishModalOpen] = useState(false);
    const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000';

    useEffect(() => {
        const setupScanner = async () => {
            if (mode !== "camera" || bookingInfo || !videoRef.current) return;

            await stopAndDestroyScanner();

            qrScannerRef.current = new QrScanner(
                videoRef.current,
                (result) => {
                    qrScannerRef.current?.stop();
                    handleExtractBooking(result.data);
                },
                {
                    returnDetailedScanResult: true,
                    preferredCamera: facingMode,
                }
            );

            await qrScannerRef.current.start();
        };

        setupScanner();

        return () => {
            stopAndDestroyScanner();
        };
    }, [mode, bookingInfo]);

    const stopAndDestroyScanner = async () => {
        if (qrScannerRef.current) {
            await qrScannerRef.current.stop();
            qrScannerRef.current.destroy();
            qrScannerRef.current = null;
        }

        if (videoRef.current?.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const toggleCamera = async () => {
        const nextFacing = facingMode === "environment" ? "user" : "environment";

        if (qrScannerRef.current) {
            try {
                await qrScannerRef.current.setCamera(nextFacing);
                setFacingMode(nextFacing);
            } catch (error) {
                console.error("Không thể đổi camera:", error);
            }
        } else {
            setFacingMode(nextFacing);
        }
    };


    const handleExtractBooking = async (qrData: string) => {
        try {
            console.log("Scanned QR:", qrData);
            const parts = qrData.split("/");
            const bookingId = parts[parts.length - 1];

            if (!bookingId || bookingId.length !== 24) {
                throw new Error("QR format invalid");
            }

            setLoading(true);
            setError("");
            setBookingInfo(null);

            const res = await axios.get<{ success: boolean; booking: Booking }>(
                `${backendApiUrl}/api/employees/verify-booking/${bookingId}`
            );

            if (res.data && res.data.success) {
                setBookingInfo(res.data.booking);
            } else {
                throw new Error("No booking found");
            }
        } catch (err: any) {
            setError(err?.message || "QR code is invalid or not recognized.");
            setShowErrorModal(true);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError("");
        setBookingInfo(null);
        setSelectedImage(file);
    };

    const handleScanImage = async () => {
        if (!selectedImage) return;

        setLoading(true);
        setError("");

        try {
            const result = await QrScanner.scanImage(selectedImage, {
                returnDetailedScanResult: true,
            });

            const qrText = extractTextFromResult(result);
            if (!qrText) throw new Error("QR not recognized from image");

            console.log("QR from selected image:", qrText);
            await handleExtractBooking(qrText);
        } catch (err) {
            console.error("Scan failed:", err);
            setError("QR code is invalid or not recognized.");
            setShowErrorModal(true);
        } finally {
            setLoading(false);
        }
    };



    const extractTextFromResult = (result: any) => {
        if (!result) return null;
        if (typeof result === "string") return result;
        if (typeof result === "object" && "data" in result) return result.data;
        return null;
    };


    const handleReset = () => {
        setBookingInfo(null);
        setError("");
        setSelectedImage(null);

        if (mode === "camera" && videoRef.current && qrScannerRef.current) {
            qrScannerRef.current.start().catch(err => {
                console.error("Cannot restart scanner:", err);
            });
        }
    };

    return (
        <div className="relative mx-auto bg-white p-5 rounded-lg shadow-md flex flex-col min-h-[80vh]">
            <div className="flex justify-between items-center gap-3 mb-4 w-full">
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            setMode("camera");
                            handleReset();
                        }}
                        className={`px-4 py-2 whitespace-nowrap rounded-full text-sm font-semibold ${mode === "camera" ? "bg-[#f0924c] text-white" : "bg-gray-100"
                            }`}
                    >
                        QR Scan
                    </button>
                    <button
                        onClick={() => {
                            setMode("image");
                            handleReset();
                        }}
                        className={`px-4 py-2 whitespace-nowrap rounded-full text-sm font-semibold ${mode === "image" ? "bg-[#f0924c] text-white" : "bg-gray-100"
                            }`}
                    >
                        Upload Image
                    </button>
                </div>

                {/* {mode === "camera" && !bookingInfo && (
                    <select
                        onChange={(e) => setFacingMode(e.target.value as "user" | "environment")}
                        value={facingMode}
                        className="border rounded-md px-2 py-1 text-sm"
                    >
                        <option value="environment">📸 Rear Camera</option>
                        <option value="user">Front Camera</option>
                    </select>
                )} */}

                {mode === "camera" && !bookingInfo && (
                    <button
                        onClick={toggleCamera}
                        title="Switch Camera"
                        className="text-xl p-2 rounded-full hover:bg-gray-200 transition"
                    >
                        <MdFlipCameraAndroid />
                    </button>
                )}
            </div>

            {mode === "camera" && !bookingInfo && (
                <div className="relative rounded-xl overflow-hidden border">
                    <video
                        ref={videoRef}
                        className="w-full h-[66vh] object-cover rounded-xl border"
                        muted
                        playsInline
                    />

                    {mode === "camera" && !bookingInfo && !error && (
                        <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
                            <div className="w-[220px] h-[220px] border-4 border-white rounded-lg shadow-md animate-pulse" />
                        </div>
                    )}
                </div>
            )}

            {/* {mode === "image" && !bookingInfo && (
                <div className="mb-4 space-y-3">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="border p-2 rounded-md w-full h-100"
                    />

                    {selectedImage && (
                        <button
                            onClick={handleScanImage}
                            className="w-full bg-[#f0924c] text-white py-2 rounded-md font-semibold hover:bg-[#d87c3b]"
                        >
                            Scan QR
                        </button>
                    )}
                </div>
            )} */}

            {mode === "image" && !bookingInfo && (
                <div className="mb-6 space-y-4">
                    <input
                        type="file"
                        id="file-upload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                    />

                    <label
                        htmlFor="file-upload"
                        className={`block w-full p-5 border-2 border-dashed border-gray-400 rounded-md text-gray-600 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[#f0924c] flex flex-col items-center justify-center
                ${selectedImage ? "h-[50vh]" : "h-[60vh]"}
            `}
                    >
                        <span className="text-lg font-semibold text-center">
                            Choose File
                        </span>

                        <p className="mt-2 text-sm text-gray-500 text-center">
                            Click here to select a file
                        </p>
                    </label>

                    {selectedImage && (
                        <div className="mt-2 text-center text-gray-700">
                            <span className="text-sm font-medium">{selectedImage.name}</span>
                        </div>
                    )}

                    {selectedImage && (
                        <button
                            onClick={handleScanImage}
                            className="w-full bg-[#f0924c] text-white py-2 rounded-md font-semibold hover:bg-[#d87c3b] mt-4"
                        >
                            Scan QR
                        </button>
                    )}
                </div>
            )}

            {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-60 z-50 flex items-center justify-center">
                    <LoadingAnimation />
                </div>
            )}

            {bookingInfo && (
                <div>
                    <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200 space-y-6 text-base text-gray-800">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h2 className="text-xl font-semibold">Booking Information</h2>
                            <span
                                className="text-sm font-medium px-3 py-1 rounded-full capitalize"
                                style={{
                                    backgroundColor:
                                        bookingInfo.status?.toLowerCase() === "confirmed" ? "#d4edda" :
                                            bookingInfo.status?.toLowerCase() === "pending" ? "#fff3cd" :
                                                bookingInfo.status?.toLowerCase() === "canceled" ? "#fee2e2" :
                                                    bookingInfo.status?.toLowerCase() === "cooking" ? "#ffe0b2" :
                                                        bookingInfo.status?.toLowerCase() === "ready" ? "#dbeafe" :
                                                            bookingInfo.status?.toLowerCase() === "completed" ? "#ffcc80" :
                                                                "#eeeeee",
                                    color:
                                        bookingInfo.status?.toLowerCase() === "confirmed" ? "#155724" :
                                            bookingInfo.status?.toLowerCase() === "pending" ? "#856404" :
                                                bookingInfo.status?.toLowerCase() === "canceled" ? "#b91c1c" :
                                                    bookingInfo.status?.toLowerCase() === "cooking" ? "#a84300" :
                                                        bookingInfo.status?.toLowerCase() === "ready" ? "#0d6efd" :
                                                            bookingInfo.status?.toLowerCase() === "completed" ? "#8b4500" :
                                                                "#444"
                                }}
                            >
                                {bookingInfo.status}
                            </span>

                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-base text-gray-800">
                            <div>
                                <span className="font-semibold">Customer Name:</span>{" "}
                                {bookingInfo.customerName !== "Guest" ? bookingInfo.customerName : "Unknown"}
                            </div>
                            <div>
                                <span className="font-semibold">Phone Number:</span> {bookingInfo.contactPhone}
                            </div>
                            <div>
                                <span className="font-semibold">Email:</span> {bookingInfo.customerEmail}
                            </div>

                            <div>
                                <span className="font-semibold">Table: </span>{" "}
                                {bookingInfo.tableNumber && bookingInfo.tableNumber !== "Unknown" ? (
                                    <>
                                        {bookingInfo.tableNumber}{" "}
                                        <span className="text-gray-600">
                                            (Capacity: {bookingInfo.tableCapability || 0})
                                        </span>
                                    </>
                                ) : (
                                    <span className="italic text-gray-600"> Waiting for table assignment</span>
                                )}
                            </div>
                            <div>
                                <span className="font-semibold">Date:</span>{" "}
                                {new Date(bookingInfo.bookingDate).toLocaleDateString()}
                            </div>

                            <div>
                                <span className="font-semibold">Time:</span> {bookingInfo.time}
                            </div>


                            <div>
                                <span className="font-semibold">Payment Method:</span> {bookingInfo.payment.method}
                            </div>



                            <div>
                                <span className="font-semibold">Payment Status: </span>{" "}
                                <span>
                                    {bookingInfo.payment.status || "N/A"}
                                </span>
                            </div>


                            {bookingInfo.deliveryAddress && (
                                <div className="sm:col-span-2">
                                    <span className="font-semibold">Delivery Address:</span> {bookingInfo.deliveryAddress}
                                </div>
                            )}

                            {bookingInfo.pickupTime && (
                                <div>
                                    <span className="font-semibold">Pickup Time:</span>{" "}
                                    {new Date(bookingInfo.pickupTime).toLocaleTimeString()}
                                </div>
                            )}

                            <div className="sm:col-span-2 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-md mt-2">
                                <span className="font-semibold text-yellow-800">Note:</span>{" "}
                                {bookingInfo.notes ? (
                                    <span className="ml-2">{bookingInfo.notes}</span>
                                ) : (
                                    <span className="text-gray-500 italic inline-block ml-2">No notes from customer</span>
                                )}
                            </div>

                        </div>

                        <div className="">
                            {bookingInfo.dishes.length > 0 ? (
                                <div className="flex items-center justify-between">
                                    <h4 className="text-base font-semibold text-gray-700">Ordered Dishes</h4>
                                    <button
                                        onClick={() => setIsDishModalOpen(true)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg hover:scale-110 hover:text-[#f09c42] transition duration-200 whitespace-nowrap"
                                    >
                                        <FaInfoCircle className="text-sm" /> View Details
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <h4 className="text-base font-semibold text-gray-700">Ordered Dishes</h4>
                                    <p className="text-gray-500 italic w-full sm:w-auto mt-2 sm:mt-0">
                                        Customer will order at the restaurant.
                                    </p>
                                </div>
                            )}

                            <Modal
                                isOpen={isDishModalOpen}
                                onRequestClose={() => setIsDishModalOpen(false)}
                                className="bg-white rounded-2xl p-6 w-[90%] max-w-lg mx-auto shadow-xl outline-none"
                                overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50"
                            >
                                <h3 className="font-semibold mb-4 text-gray-800 text-center text-[22px] mb-7">Ordered Dishes</h3>
                                {bookingInfo.dishes.length > 0 ? (
                                    <ul className="space-y-2 text-sm text-gray-700">
                                        {bookingInfo.dishes.map((dish, idx) => (
                                            <li
                                                key={idx}
                                                className="border-b pb-2 flex justify-between items-center"
                                            >
                                                <div className="flex-1 font-medium">{dish.name}</div>

                                                <div className="w-16 text-center">x {dish.quantity}</div>

                                                <div className="w-32 text-right text-gray-500">
                                                    {dish.price.toLocaleString()} VND
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500 italic">Customer will order at the restaurant.</p>
                                )}

                                <div className="mt-6">
                                    <button
                                        onClick={() => setIsDishModalOpen(false)}
                                        className="bg-[#f0924c] text-white w-full py-2 rounded-full font-semibold hover:bg-[#d87c3b]"
                                    >
                                        Close
                                    </button>
                                </div>
                            </Modal>
                        </div>


                        <div className="font-semibold text-green-700">
                            Total Bill: {bookingInfo.totalBill.toLocaleString()} VND
                        </div>

                        <div className="pt-1">
                            <button
                                onClick={handleReset}
                                className="w-full sm:w-auto px-5 py-2 bg-[#f0924c] text-white rounded-md font-semibold hover:bg-[#d87c3b] transition"
                            >
                                Scan another booking
                            </button>
                        </div>
                    </div>
                </div>
            )}


            <Modal
                isOpen={showErrorModal}
                onRequestClose={() => setShowErrorModal(false)}
                className="bg-white rounded-2xl p-6 w-[90%] max-w-sm mx-auto text-center shadow-xl outline-none"
                overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50"
            >
                <h2 className="text-lg font-bold text-[#f0924c] mb-2">Notification</h2>
                <p className="text-gray-700 mb-4">QR code is invalid</p>
                <button
                    onClick={() => {
                        setShowErrorModal(false);
                        handleReset();
                    }}
                    className="bg-[#f0924c] text-white w-full py-2 rounded-full font-semibold hover:bg-[#d87c3b]"
                >
                    Close
                </button>
            </Modal>
        </div>
    );
}
