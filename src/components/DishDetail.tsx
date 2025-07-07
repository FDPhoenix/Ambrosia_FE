import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

interface DishDetailProps {
  dishInfor: {
    _id: string;
    name: string;
    imageUrl: string;
    categoryName: string;
    description: string;
    price: number;
    isAvailable: boolean;
  };
}

interface Feedback {
  _id: string;
  userId: {
    _id: string;
    fullname: string;
    email: string;
    profileImage: string;
    createdAt: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

interface Ingredient {
  _id: string;
  dishId: string;
  name: string;
  description: string;
  quantity: number;
  status: string;
}

function DishDetail({ dishInfor }: DishDetailProps) {
  const [activeTab, setActiveTab] = useState("DESCRIPTION");
  const [quantity, setQuantity] = useState(1);
  const [ingredients, setIngredients] = useState<Ingredient[] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [feedbackData, setFeedbackData] = useState<{
    totalFeedback: number;
    averageRating: number;
    feedbacks: Feedback[];
  } | null>(null);
  const [editingFeedback, setEditingFeedback] = useState<string | null>(null);
  const [editedComment, setEditedComment] = useState<string>('');
  const [editedRating, setEditedRating] = useState<number>(0);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const userToken = Cookies.get('token') ?? null;
    setToken(userToken);
    if (userToken) {
      const decoded: any = jwtDecode(userToken);
      setUserId(decoded.id);
    }
  }, []);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await fetch(
          `${backendApiUrl}/api/feedback/dish/${dishInfor._id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch feedback data");
        }

        const data = await response.json();
        if (data.success) {
          setFeedbackData({
            totalFeedback: data.totalFeedback,
            averageRating: data.averageRating,
            feedbacks: data.feedbacks,
          });
        }
      } catch (err: any) {
        console.error(err.message);
      }
    };

    const fetchIngredient = async () => {
      try {
        const response = await fetch(
          `${backendApiUrl}/ingredients/${dishInfor._id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch ingredients");
        }

        const data = await response.json();
        if (data.success) {
          setIngredients(data.ingredients || []);
        }
      } catch (err: any) {
        console.error(err.message);
        setIngredients([]);
      }
    }

    fetchIngredient();
    fetchFeedback();
  }, [dishInfor._id]);

  useEffect(() => {
    const userToken = Cookies.get('token') ?? null;
    setToken(userToken);
  }, []);

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const decimal = rating - fullStars;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`full-${i}`} className="text-yellow-400 text-xl">★</span>);
    }

    if (decimal > 0 && stars.length < 5) {
      stars.push(
        <span key="partial" className="inline-block text-gray-300 text-xl relative">
          <span
            className="absolute top-0 left-0 overflow-hidden text-yellow-400"
            style={{ width: `${decimal * 100}%` }}
          >
            ★
          </span>
          <span className="text-gray-300 text-xl">★</span>
        </span>
      );
    }

    while (stars.length < 5) {
      stars.push(<span key={`empty-${stars.length}`} className="text-gray-300 text-xl">☆</span>);
    }

    return stars;
  };

  const renderEmptyStars = () => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(<span key={`empty-${i}`} className="text-gray-300 text-xl">☆</span>);
    }
    return stars;
  };

  const renderEditableStars = () => {
    const stars = [];
    const currentRating = hoverRating || editedRating;

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`text-xl cursor-pointer transition-colors duration-200 ${i <= currentRating ? 'text-yellow-400' : 'text-gray-300'}`}
          onClick={() => setEditedRating(i)}
          onMouseEnter={() => setHoverRating(i)}
          onMouseLeave={() => setHoverRating(0)}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  const increaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const addToCart = async (dish: any, dishQuantity: number) => {
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        const userId = decoded.id;

        const response = await fetch(`${backendApiUrl}/cart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: userId,
            dishId: dish._id,
            quantity: dishQuantity,
          }),
        });

        const data = await response.json();

        if (data.success) {
          toast.success('Added to cart successfully!');
          window.dispatchEvent(new Event('cartUpdated'));
        } else {
          toast.error(data.message || 'Failed to add item to cart.');
        }
      } catch (error) {
        console.error('Error adding item to cart:', error);
        toast.error('An error occurred while adding item to cart.');
      }
    } else {
      const storedCart = localStorage.getItem('cart');
      const cart = storedCart ? JSON.parse(storedCart) : [];

      const existingItem = cart.find((item: { _id: any }) => item._id === dish._id);
      let updatedCart;

      if (existingItem) {
        updatedCart = cart.map((item: { _id: any; quantity: number }) =>
          item._id === dish._id ? { ...item, quantity: item.quantity + dishQuantity } : item
        );
      } else {
        updatedCart = [...cart, { ...dish, quantity: dishQuantity }];
      }

      localStorage.setItem('cart', JSON.stringify(updatedCart));
      window.dispatchEvent(new Event('cartUpdated'));

      toast.success('Add to cart successfully!');
    }
  };

  const handleEditFeedback = (feedback: Feedback) => {
    setEditingFeedback(feedback._id);
    setEditedComment(feedback.comment);
    setEditedRating(feedback.rating);
    setShowMenu(null);
  };

  const handleSaveFeedback = async (feedbackId: string) => {
    try {
      const response = await fetch(`${backendApiUrl}/api/feedback/update/${feedbackId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: editedRating,
          comment: editedComment,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setFeedbackData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            feedbacks: prev.feedbacks.map((fb) =>
              fb._id === feedbackId ? { ...fb, rating: editedRating, comment: editedComment } : fb
            ),
          };
        });
        setEditingFeedback(null);
        toast.success('Feedback updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update feedback');
      }
    } catch (error) {
      toast.error('Error updating feedback');
      console.error(error);
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    try {
      const response = await fetch(`${backendApiUrl}/api/feedback/delete/${feedbackId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setFeedbackData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            totalFeedback: prev.totalFeedback - 1,
            feedbacks: prev.feedbacks.filter((fb) => fb._id !== feedbackId),
          };
        });
        setShowMenu(null);
        toast.success('Feedback deleted successfully!');
      } else {
        toast.error(data.message || 'Failed to delete feedback');
      }
    } catch (error) {
      toast.error('Error deleting feedback');
      console.error(error);
    }
  };

  return (
    <div className="bg-[#EFF4F8]">
      <div className="max-w-[1250px] mx-auto pb-4 lg:py-16">
        <div className="flex flex-col gap-2.5 md:flex-row">
          <div className="flex-[0.6] max-w-full">
            <img
              src={dishInfor.imageUrl}
              alt={dishInfor.name}
              className="w-full h-[450px] object-fill mb-3 lg:mb-5 lg:h-[660px] lg:rounded"
            />
          </div>

          <div className="flex-[0.4] px-6">
            <h1 className="text-2xl lg:text-4xl text-gray-800 font-semibold font-serif mb-1">{dishInfor.name}</h1>

            <div className="flex items-center mb-5">
              <div className="flex text-yellow-400 mr-2.5 pb-0.5">
                {feedbackData?.averageRating ? renderStars(feedbackData.averageRating) : renderEmptyStars()}
              </div>
              <span className="text-gray-500 text-sm">
                {`(${feedbackData?.totalFeedback || 0} customer reviews)`}
              </span>
            </div>

            <div className="my-5 py-2.5 border-t border-b border-gray-300">
              <h2 className="text-xl xl:text-2xl text-red-600 font-semibold m-0">{dishInfor.price.toLocaleString()}₫</h2>
            </div>

            <p className="text-base xl:text-lg text-gray-600 leading-7 mb-7">
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque lauatium.
            </p>

            <div className="flex gap-3.5 mb-7">
              <div className="relative flex items-center border border-gray-300 rounded w-[standard: w-20 bg-[#EFF4F8]">
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                  className="w-[50px] h-[38px] p-1 text-center text-sm bg-[#EFF4F8] appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="flex flex-col border-l border-gray-300">
                  <button onClick={increaseQuantity} className="bg-none p-0 w-7 h-[19px] flex items-center justify-center cursor-pointer text-gray-600 text-[8px] border-b border-gray-300 hover:bg-gray-200" aria-label="Increase quantity">
                    ▲
                  </button>
                  <button onClick={decreaseQuantity} className="border-none bg-none p-0 w-7 h-[19px] flex items-center justify-center cursor-pointer text-gray-600 text-[8px] hover:bg-gray-200" aria-label="Decrease quantity">
                    ▼
                  </button>
                </div>
              </div>
              <button
                className="text-sm xl:text-base font-serif bg-gray-300 border-none text-gray-800 py-0 px-7 h-[50px] cursor-pointer lg:font-semibold tracking-wide hover:bg-[#A2845E] transition-colors duration-200"
                onClick={() => addToCart(dishInfor, quantity)}
              >
                ADD TO CART
              </button>
            </div>

            <div className="mb-7">
              <div className="flex mb-2.5">
                <span className="w-[120px] text-gray-500 font-semibold text-[16px] xl:text-[17px]">Category</span>
                <span className="text-gray-600 text-base xl:text-[17px]">{dishInfor.categoryName}</span>
              </div>

              <div className="flex mb-2.5">
                <span className="w-[120px] text-gray-500 font-semibold text-[16px] xl:text-[17px]">Availability</span>
                <span className="text-gray-600 text-base xl:text-[17px]">{dishInfor.isAvailable ? "In Stock" : "Out of Stock"}</span>
              </div>
            </div>

            <div className="min-h-[230px] mt-10">
              <div className="flex justify-between border-b border-gray-300 mb-5">
                <button
                  className={`text-sm lg:text-base bg-none border-none p-2.5 cursor-pointer font-semibold ${activeTab === "DESCRIPTION" ? "text-gray-800 relative after:content-[''] after:absolute after:bottom-[-1px] after:left-0 after:w-full after:h-[2px] after:bg-gray-800" : "text-gray-500"}`}
                  onClick={() => setActiveTab("DESCRIPTION")}
                >
                  DESCRIPTION
                </button>
                <button
                  className={`text-sm lg:text-base bg-none border-none p-2.5 cursor-pointer font-semibold ${activeTab === "INGREDIENT" ? "text-gray-800 relative after:content-[''] after:absolute after:bottom-[-1px] after:left-0 after:w-full after:h-[2px] after:bg-gray-800" : "text-gray-500"}`}
                  onClick={() => setActiveTab("INGREDIENT")}
                >
                  INGREDIENTS
                </button>
                <button
                  className={`text-sm lg:text-base bg-none border-none p-2.5 cursor-pointer font-semibold ${activeTab === "REVIEWS" ? "text-gray-800 relative after:content-[''] after:absolute after:bottom-[-1px] after:left-0 after:w-full after:h-[2px] after:bg-gray-800" : "text-gray-500"}`}
                  onClick={() => setActiveTab("REVIEWS")}
                >
                  REVIEWS ({feedbackData?.totalFeedback || 0})
                </button>
              </div>

              <div className="text-gray-600 leading-7">
                {activeTab === "DESCRIPTION" && (
                  <div className="px-2.5">
                    <p>{dishInfor.description}</p>
                  </div>
                )}

                {activeTab === "INGREDIENT" && (
                  <div className="h-[180px] px-2.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:w-0">
                    {ingredients ? (
                      (() => {
                        const availableIngredients = ingredients.filter(
                          (ingredient) => ingredient.status === "Available"
                        );
                        return availableIngredients.length > 0 ? (
                          <ul className="list-disc pl-5 m-0">
                            {availableIngredients.map((ingredient) => (
                              <li key={ingredient._id} className="mb-3 leading-6">
                                <strong className="text-gray-800">{ingredient.name}</strong>: <span className="text-gray-600 text-sm">{ingredient.description}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="h-[180px] flex justify-center items-center">
                            <p className="text-lg">No available ingredients for this dish.</p>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="h-[180px] flex justify-center items-center">
                        <p className="text-lg">No ingredients available for this dish.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "REVIEWS" && (
                  <div className="h-[180px] overflow-y-auto pr-1.5 [scrollbar-w-1] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#A2845E] [&::-webkit-scrollbar-thumb]:rounded-[80px]">
                    {feedbackData && feedbackData.feedbacks.length > 0 ? (
                      feedbackData.feedbacks.map((feedback) => (
                        <div key={feedback._id} className="mb-2.5 pb-2.5 mr-1.5 border-b border-dashed border-gray-300 last:mb-0 last:border-b-0">
                          <div className="flex justify-between items-center">
                            <p>
                              <strong>{feedback.userId.fullname}</strong> -{" "}
                              {new Date(feedback.createdAt).toLocaleDateString()}
                            </p>
                            {userId && feedback.userId._id === userId && (
                              <div className="relative">
                                <button
                                  className="bg-none border-none text-xl cursor-pointer px-2.5"
                                  onClick={() => setShowMenu(showMenu === feedback._id ? null : feedback._id)}
                                >
                                  ⋮
                                </button>
                                {showMenu === feedback._id && (
                                  <div className="absolute right-0 top-6 bg-white border border-gray-300 rounded shadow-[0_2px_5px_rgba(0,0,0,0.1)] z-[1000]">
                                    <button
                                      onClick={() => handleEditFeedback(feedback)}
                                      className="block w-full py-1.5 px-3.5 bg-none border-none text-left cursor-pointer hover:bg-gray-200"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteFeedback(feedback._id)}
                                      className="block w-full py-1.5 px-3.5 bg-none border-none text-left cursor-pointer hover:bg-gray-200"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex">
                            {editingFeedback === feedback._id ? (
                              renderEditableStars()
                            ) : (
                              renderStars(feedback.rating)
                            )}
                          </div>
                          {editingFeedback === feedback._id ? (
                            <div>
                              <textarea
                                value={editedComment}
                                onChange={(e) => setEditedComment(e.target.value)}
                                className="w-full min-h-[80px] my-2.5 p-1.5 border border-gray-300 rounded"
                              />
                              <button
                                onClick={() => handleSaveFeedback(feedback._id)}
                                className="bg-green-500 text-white py-1.5 px-3.5 border-none rounded cursor-pointer mt-1.5 hover:bg-green-600"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <p>{feedback.comment}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="h-[180px] flex justify-center items-center">
                        <p className="text-lg">No reviews yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DishDetail;