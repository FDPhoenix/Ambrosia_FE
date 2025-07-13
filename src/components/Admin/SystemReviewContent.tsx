import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Modal from "react-modal";
import StatusBadge from "./StatusBadge";
import { FaInfoCircle, FaStar } from 'react-icons/fa';
import "react-toastify/dist/ReactToastify.css";
import { toast } from 'react-toastify';
import Pagination from "../Pagination";

interface Review {
  id: string;
  _id?: string;
  userId?: {
    fullname: string;
    email: string;
    phoneNumber: string;
  };
  guestId?: {
    name: string;
    contactPhone: string;
    email: string;
  };
  rating: number;
  comment: string;
  isReplied: boolean;
}

function SystemReviewContent() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
  const [replyModalOpen, setReplyModalOpen] = useState<boolean>(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyContent, setReplyContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filterIsReplied, setFilterIsReplied] = useState<string>("");
  const [filterRating, setFilterRating] = useState<string>("");
  const [currentReviews, setCurrentReviews] = useState<Review[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;
  useEffect(() => {
    const start = (currentPage - 1) * itemsPerPage;
    setCurrentReviews(reviews.slice(start, start + itemsPerPage));
  }, [reviews, currentPage, itemsPerPage]);

  const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000';

  const openModal = (review: Review) => {
    setSelectedReview(review);
    setModalIsOpen(true);
  };

  const openReplyModal = (review: Review & { _id?: string }) => {
    const reviewId = review.id || review._id || "";

    if (reviewId) {
      setSelectedReview({ ...review, id: reviewId });
      setReplyModalOpen(true);
    } else {
      console.error("Review or reviewId is missing!", review);
      toast.error("Review data is missing!");
    }
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setReplyModalOpen(false);
    setSelectedReview(null);
    setReplyContent("");
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${backendApiUrl}/reviews`);
      const formattedReviews = response.data.reviews.map((review: { _id: unknown; }) => ({
        ...review,
        id: review._id,
      }));

      setReviews(formattedReviews);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load reviews:", err);
      setError("Failed to load reviews.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const renderStars = (rating: number) => {
    return [...Array(rating)].map((_, i) => (
      <FaStar key={i} className="text-[18px] mr-1 inline-block text-yellow-400" />
    ));
  };

  const handlePageChange = useCallback(
    (paginated: Review[], page: number) => {
      setCurrentReviews(paginated);
      setCurrentPage(page);
    },
    []
  );


  const replyStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <FaStar key={i} className="text-[28px] inline-block" color={i < rating ? '#ffc107' : '#e4e5e9'} />
    ));
  };

  const handleSendReply = async () => {
    if (!replyContent.trim()) {
      toast.error("Reply content cannot be blank!");
      return;
    }

    if (!selectedReview?.id) {
      console.error("Review ID is missing!", selectedReview);
      toast.error("Review ID is missing!");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${backendApiUrl}/reviews/reply`, {
        reviewId: selectedReview.id,
        replyContent,
      });

      if (response.data.message.toLowerCase().includes("email sent successfully")) {
        toast.success("Email was successfully delivered!");
      } else {
        toast.warning("Reply sent, but email might not have been sent.");
      }

      setReplyContent("");
      await fetchReviews();
    } catch (error) {
      console.error("Error occurred:", error);
      toast.error("Error sending reply!!");
    } finally {
      closeModal();
      setIsLoading(false);
    }
  };

  const fetchFiltersReviews = async () => {
    try {
      const queryParams = [];
      if (filterIsReplied !== "") queryParams.push(`isReplied=${filterIsReplied}`);
      if (filterRating !== "") queryParams.push(`rating=${filterRating}`);

      const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
      const response = await axios.get(`${backendApiUrl}/reviews/filter${queryString}`);

      const formattedReviews = response.data.data.map((review: { _id: unknown }) => ({
        ...review,
        id: review._id,
      }));

      setReviews(formattedReviews);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load reviews:", err);
      setError("Failed to load reviews.");
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setIsLoading(true);
    fetchFiltersReviews();
    setIsLoading(false);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  return (
    // <div className="w-[1200px] h-[567px] mx-auto bg-white p-8 rounded-lg shadow-md">
    <div className="relative w-[1200px] h-[567px] p-5 max-w-[1210px] bg-white rounded-2xl shadow-md">
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="text-white text-center">
            <div className="animate-spin h-12 w-12 border-4 border-gray-200 border-t-gray-600 rounded-full mx-auto"></div>
            <p className="mt-4">Sending feedback...</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-5">
        <h2 className="mt-[5px] text-xl font-semibold">Review Management</h2>

        <div className="flex items-center gap-2">
          <select
            className="px-3 py-2 text-sm border border-gray-300 rounded bg-white hover:border-[#f4832c] cursor-pointer transition"
            onChange={(e) => setFilterIsReplied(e.target.value)}
            value={filterIsReplied}
          >
            <option value="">All Status</option>
            <option value="true">Replied</option>
            <option value="false">No Replied</option>
          </select>

          <select
            className="px-3 py-2 text-sm border border-gray-300 rounded bg-white hover:border-[#f4832c] cursor-pointer transition"
            onChange={(e) => setFilterRating(e.target.value)}
            value={filterRating}
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <button
            className="px-4 py-[7px] text-sm rounded border border-gray-300 bg-[#f0f0f0] hover:bg-[#F0924C] hover:text-white transition duration-200 shadow-sm"
            onClick={applyFilters}
          >
            Apply Filters
          </button>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[425px] h-[451px]">
        <table className="w-full border border-collapse text-base">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-3 text-center">No</th>
              <th className="border px-4 py-3 text-center">User Name</th>
              <th className="border px-4 py-3 text-center">Rating</th>
              <th className="border px-4 py-3 w-[30%] text-center">Feedback</th>
              <th className="border px-4 py-3 text-center">Status</th>
              <th className="border px-4 py-3 text-center">Detail</th>
              <th className="border px-4 py-3 text-center">Reply</th>
            </tr>
          </thead>
          <tbody>
            {currentReviews.length > 0 ? (
              currentReviews.map((review, index) => (
                <tr key={review.id} className="hover:bg-gray-100">
                  <td className="border px-4 py-5 text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="border px-4 py-5 text-center">{review.userId ? review.userId.fullname : review.guestId?.name || "Unknown"}</td>
                  <td className="border px-4 py-5 text-center">{renderStars(review.rating)}</td>
                  <td className="border px-4 py-5 text-center">{review.comment}</td>
                  <td className="border px-4 py-5 text-center">
                    <StatusBadge status={review.isReplied} caseTrue="Replied" caseFalse="No Replied" />
                  </td>
                  <td className="border px-4 py-5 text-center">
                    <button onClick={() => openModal(review)} className="bg-none border-none text-sm flex items-center justify-center hover:scale-110 hover:text-[#f0924c] transition pl-4">
                      <FaInfoCircle /> <span className="ml-1">View Details</span>
                    </button>
                  </td>
                  <td className="border px-4 py-2 text-center">
                    <button onClick={() => openReplyModal(review)} className="bg-orange-400 text-white px-3 py-2 rounded hover:bg-orange-500">
                      →
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center p-6 text-red-500 font-semibold h-[371px]">
                  No results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Reply Modal */}
      <Modal
        isOpen={replyModalOpen}
        onRequestClose={closeModal}
        className="bg-white p-5 rounded-[10px] shadow-[0px_5px_15px_rgba(0,0,0,0.3)] max-w-[90%] w-[400px] max-h-[90vh] overflow-y-auto relative mx-auto scrollbar-hide animate-fadeInModal"
        overlayClassName="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-4 animate-fadeInOverlay"
        shouldCloseOnOverlayClick={false}
        ariaHideApp={false}
      >
        {selectedReview && (
          <div className="flex flex-col gap-4 text-[16px]">
            <h2 className="text-[24px] font-bold text-center mt-2 mb-3">Reply to Feedback</h2>

            <div className="text-center my-2">
              <span>{replyStars(selectedReview.rating)}</span>
            </div>

            <label className="font-bold mb-1 text-base">User Reviews</label>
            <div className="px-2 text-sm">
              <blockquote className="w-full bg-[#f1f8ff] p-4 border-l-4 border-blue-500 italic my-2 text-[16px] text-gray-700">
                "{selectedReview.comment || 'No comment'}"
              </blockquote>
            </div>

            <div>
              <label className="font-bold mb-1 text-base">Enter Feedback:</label>
              <textarea
                className="w-full p-3 text-base leading-6 border border-gray-300 rounded-lg bg-[#f9f9f9] text-gray-800 resize-y min-h-[140px] max-h-[190px] overflow-y-auto mt-4 focus:outline-none focus:border-[#f7a327] focus:bg-white focus:shadow-[0_0_8px_rgba(208,118,15,0.4)] placeholder:italic placeholder:text-gray-500 transition duration-300 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
                rows={3}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Enter your response..."
              />
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={handleSendReply}
                className="bg-[#f0924c] text-white py-2 px-10 rounded-lg font-bold hover:bg-[#f4832c] shadow-md hover:shadow-lg transition-all"
              >
                Send
              </button>
              <button
                onClick={closeModal}
                className="bg-gray-300 text-black py-2 px-6 rounded-lg font-bold hover:bg-gray-400 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        className="bg-white p-5 rounded-[10px] shadow-[0px_5px_15px_rgba(0,0,0,0.3)] max-w-[90%] w-[400px] max-h-[80vh] overflow-y-auto relative mx-auto animate-fadeInModal"
        overlayClassName="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-4 animate-fadeInOverlay"
        shouldCloseOnOverlayClick={false}
        ariaHideApp={false}
      >
        {selectedReview && (
          <div className="flex flex-col gap-4 text-[16px]">
            <h2 className="text-[22px] font-bold text-center mb-3">Customer Details</h2>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between border-b border-dashed border-gray-300 py-3 px-2 text-base">
                <strong className="text-[#222]">Name:</strong>
                <span className="max-w-[66%] text-right break-words">
                  {selectedReview.userId ? selectedReview.userId.fullname : selectedReview.guestId?.name}
                </span>
              </div>
              <div className="flex justify-between border-b border-dashed border-gray-300 py-3 px-2 text-base">
                <strong className="text-[#222]">Phone:</strong>
                <span className="max-w-[66%] text-right break-words">
                  {selectedReview.userId ? selectedReview.userId.phoneNumber : selectedReview.guestId?.contactPhone}
                </span>
              </div>
              <div className="flex justify-between border-b border-dashed border-gray-300 py-3 px-2 text-base">
                <strong className="text-[#222]">Email:</strong>
                <span className="max-w-[66%] text-right break-words">
                  {selectedReview.userId ? selectedReview.userId.email : selectedReview.guestId?.email}
                </span>
              </div>
              <div className="flex justify-between border-b border-dashed border-gray-300 py-3 px-2 text-base">
                <strong className="text-[#222]">Rating:</strong>
                <span>{renderStars(selectedReview.rating)}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-gray-300 py-3 px-2 text-base">
                <strong className="text-[#222]">Comment:</strong>
                <span className="max-w-[66%] text-right break-words">
                  {selectedReview.comment || "No comment"}
                </span>
              </div>
              <div className="flex justify-between border-b border-dashed border-gray-300 py-3 px-2 text-base">
                <strong className="text-[#222]">Status:</strong>
                <span className={selectedReview.isReplied ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                  {selectedReview.isReplied ? 'Replied' : 'Not Replied'}
                </span>
              </div>
            </div>
            <div className="flex justify-center mt-4">
              <button
                onClick={closeModal}
                className="w-[60%] bg-[#f0924c] text-white w-full py-2 rounded-md hover:bg-[#f4892c] transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Pagination
        items={reviews}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
      />

    </div>
  );
}

export default SystemReviewContent