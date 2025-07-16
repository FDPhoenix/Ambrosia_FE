import { useState, useEffect, useRef } from "react";
import Cookies from 'js-cookie';
import { Link } from "react-router";

interface Dish {
  _id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  category: string;
}

function SuggestDish() {
  const [suggestDish, setSuggestDish] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const token = Cookies.get('token');
  const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const fetchSuggestedDishes = async () => {
      if (!token) return;

      setIsLoading(true);
      try {
        const response = await fetch(`${backendApiUrl}/dishes/suggest`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch suggested dishes');
        const data = await response.json();
        if (data.success) {
          setSuggestDish(data.data);
        }
      } catch (error) {
        console.error('Error fetching suggested dishes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestedDishes();
  }, [token]);

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -sliderRef.current.offsetWidth, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: sliderRef.current.offsetWidth, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full px-4 bg-[#ddd] xl:bg-[#A2845E] lg:px-16 pb-1 lg:pb-6">
      <div className="w-full border-b border-black pb-3 mb-1 lg:mb-5">
        <h3 className="text-center text-xl font-bold text-black xl:text-left uppercase">
          Recommended for you
        </h3>
      </div>

      <div className="relative px-12">
        {isLoading ? (
          <p className="text-center text-black">Loading...</p>
        ) : suggestDish.length === 0 ? (
          <p className="text-center text-black">No suggested dishes available.</p>
        ) : (
          <div className="relative flex items-center">
            <button
              onClick={scrollLeft}
              className="absolute -left-12 z-10 p-2 bg-[#ECE6DF] text-[#A2845E] rounded-full hover:bg-[#d69c52] hover:text-[#00405d] transition-colors"
              aria-label="Scroll left"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div
              ref={sliderRef}
              className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth gap-4 py-4 hide-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {suggestDish.map((dish) => (
                <Link
                  to={`/dish/${dish._id}`}
                  key={dish._id}
                  className="flex-none snap-start w-full sm:w-1/2 md:w-1/3 lg:w-[23.5%] xl:w-[19%] p-4 bg-white rounded-lg shadow-md"
                >
                  <img
                    src={dish.imageUrl}
                    alt={dish.name}
                    className="w-full h-40 object-cover rounded-md mb-4"
                  />
                  <h4 className="text-lg font-semibold text-black mb-2 truncate">{dish.name}</h4>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-base text-gray-600">{dish.category}</p>
                    <p className="text-base font-medium text-black">{dish.price.toLocaleString()}₫</p>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{dish.description}</p>
                </Link>
              ))}
            </div>

            <button
              onClick={scrollRight}
              className="absolute -right-12 z-10 p-2 bg-[#ECE6DF] text-[#A2845E] rounded-full hover:bg-[#d69c52] hover:text-[#00405d] transition-colors"
              aria-label="Scroll right"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SuggestDish;