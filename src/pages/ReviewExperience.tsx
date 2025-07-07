import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { FaStar } from "react-icons/fa";
import 'react-toastify/dist/ReactToastify.css';
import { toast, ToastContainer } from "react-toastify";

interface ReviewExperienceProps {
    bookingId: string;
    closeModal: () => void;
}
const ReviewExperience: React.FC<ReviewExperienceProps> = ({ bookingId, closeModal }) => {
    const navigate = useNavigate();
    const [rating, setRating] = useState<number>(5);
    const [hover, setHover] = useState<number | null>(null);
    const [comment, setComment] = useState("");
    const [isOpen, setIsOpen] = useState(true);

    const handleSubmit = async () => {
        try {
            await axios.post("http://localhost:3000/reviews/create", {
                bookingId,
                rating,
                comment,
            });
            toast.success("Thank you for your review!");
            setTimeout(() => {
                setIsOpen(false);
                closeModal();
                navigate("/");
            }, 900);
        } catch (error) {
            console.error("Error submitting review!", error);
            toast.error("Review submission failed!");
        }
    };


    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] animate-fadeInOverlay">
                    <div className="bg-[#d7cfc6] p-6 rounded-lg shadow-lg w-[90%] max-w-md text-center animate-fadeInOverlay">
                        <h2 className="text-[#634a3e] text-xl font-bold mb-4">Rate Your Experience</h2>

                        <div className="flex justify-center mb-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <FaStar
                                    key={star}
                                    size={40}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHover(star)}
                                    onMouseLeave={() => setHover(null)}
                                    color={(hover || rating) >= star ? "#FFD700" : "#C0C0C0"}
                                    className="cursor-pointer transition-colors duration-200"
                                />
                            ))}
                        </div>

                        <label className="block mb-1 text-base font-semibold text-[#634a3e]">
                            Comment:
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your experience..."
                            className="w-full h-20 p-2 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-[#947260] bg-white"
                        />

                        <div className="flex justify-between gap-3 mt-6">
                            <button
                                onClick={handleSubmit}
                                className="bg-[#947260] hover:bg-[#3e2f28] text-white py-2 px-4 rounded w-1/2 font-semibold transition-colors"
                            >
                                Submit Review
                            </button>
                            <button
                                onClick={() => {
                                    closeModal();
                                    navigate("/");
                                }}
                                className="bg-[#baa392] hover:bg-[#7e5b47] text-white py-2 px-4 rounded w-1/2 font-semibold transition-colors"
                            >
                                Skip
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <ToastContainer theme="colored" />
        </>
    );
};

export default ReviewExperience;
