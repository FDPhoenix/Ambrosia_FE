import React, { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { toast, ToastContainer } from "react-toastify";

interface AddNoteProps {
    bookingId?: string;
    openReviewBookingModal: (bookingId: string) => void;
}

const AddNote: React.FC<AddNoteProps> = ({ bookingId, openReviewBookingModal }) => {
    const [notes, setNotes] = useState<string>("");
    const [errorMessage] = useState<string>("");

    const handleSubmit = async () => {
        const effectiveBookingId = bookingId || Cookies.get("bookingId");

        if (!notes.trim()) {
            toast.error("Please enter a note or choose to skip.");
            return;
        }

        if (!effectiveBookingId) {
            toast.error("Error: Booking ID not found!");
            return;
        }

        try {
            await axios.put(`http://localhost:3000/bookings/${effectiveBookingId}/update-note`, { notes });
            openReviewBookingModal(effectiveBookingId);
        } catch (error) {
            console.error("Error submitting note:", error);
            toast.error("Error submitting note. Please try again!");
        }
    };

    const handleSkip = () => {
        const effectiveBookingId = bookingId || Cookies.get("bookingId");

        if (!effectiveBookingId) {
            console.error("Skip Error: Missing bookingId!");
            toast.error("Error: Booking ID is missing!");
            return;
        }
        console.log("Skipping Add Note, opening ReviewBooking with ID:", effectiveBookingId);
        openReviewBookingModal(effectiveBookingId);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[1000] transition-opacity duration-300 opacity-100 ">
            <div className="bg-[#d7cfc6] w-[90%] max-w-[450px] p-6 rounded-xl shadow-lg flex flex-col text-center relative transform scale-100 translate-y-0 transition-all animate-fadeInOverlay">

                <h2 className="bg-[#634a3e] text-white py-3 rounded-t-xl text-[22px] font-bold">Add Note</h2>

                {errorMessage && (
                    <p className="text-red-600 font-bold mb-2">{errorMessage}</p>
                )}

                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter note for the order (optional)..."
                    className="mt-4 w-full h-[120px] p-3 text-base rounded-lg border border-[rgba(82, 50, 28, 0.7)] resize-none outline-none focus:border-[rgb(85, 54, 32)] focus:shadow-[0_0_8px_rgba(139,69,19,0.4)] transition-all"
                />

                <div className="flex justify-center mt-4 gap-4">
                    <button
                        onClick={handleSubmit}
                        className="bg-[rgb(148,114,96)] hover:bg-[#7e5b47] text-white px-7 py-4 rounded-lg text-base font-bold transition-all hover:-translate-y-0.5"
                    >
                        Confirm
                    </button>
                    <button
                        onClick={handleSkip}
                        className="bg-[rgb(186,163,146)] hover:bg-[#7e5b47] text-white px-7 py-4 rounded-lg text-base font-bold transition-all hover:-translate-y-0.5"
                    >
                        Skip
                    </button>
                </div>
            </div>
            <ToastContainer theme="colored" />
        </div>
    );
};

export default AddNote;
