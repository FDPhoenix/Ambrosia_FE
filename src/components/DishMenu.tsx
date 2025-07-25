import { useNavigate } from 'react-router'
import { useEffect, useState } from 'react';
import { FaCartPlus } from "react-icons/fa6";
import { ToastContainer, toast } from "react-toastify";
import Cookies from "js-cookie";
import { jwtDecode } from 'jwt-decode';

function DishMenu() {
  const [dishes, setDishes] = useState([]);
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [priceRanges, setPriceRanges] = useState([]);
  const [, setCart] = useState([]);
  const navigate = useNavigate();
  const token = Cookies.get('token');
  const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    setCart(storedCart ? JSON.parse(storedCart) : []);

    fetch(`${backendApiUrl}/category/all`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const visibleCategories = data.categories.filter((category: { isHidden: boolean }) => !category.isHidden);
          setCategories(visibleCategories);
        }
      })
      .catch((err) => {
        console.error("Error fetching categories:", err);
      });
  }, []);

  useEffect(() => {
    fetchDishes(category, currentPage, priceRanges);
  }, [category, currentPage, priceRanges]);

  const fetchDishes = async (selectedCategory: string, page = 1, priceRanges = []) => {
    try {
      let query = selectedCategory
        ? `?categoryId=${selectedCategory}`
        : priceRanges.length > 0
        ? `?priceRange=${priceRanges.join(',')}`
        : `all?page=${page}&limit=12`;

      if (selectedCategory && priceRanges.length > 0) {
        query += `&priceRange=${priceRanges.join(',')}`;
      }

      if (selectedCategory || priceRanges.length > 0 || selectedCategory && priceRanges.length > 0) {
        query += `&page=${page}&limit=12`
      }

      const response = await fetch(`${backendApiUrl}/dishes/${query}`);
      const data = await response.json();

      if (data.success && Array.isArray(data.dishes)) {
        setDishes(data.dishes);
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
      } else {
        setDishes([]);
      }

    } catch (error) {
      console.error('Error while fetching dishes:', error);
    }
  };

  const addToCart = async (dish: any) => {
    const quantity = 1;

    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        const userId = decoded.id;

        const response = await fetch(`${backendApiUrl}/cart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: userId,
            dishId: dish._id,
            quantity
          })
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

      const existingItem = cart.find((item: { _id: any; }) => item._id === dish._id);
      let updatedCart;

      if (existingItem) {
        updatedCart = cart.map((item: { _id: any; quantity: number; }) =>
          item._id === dish._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        updatedCart = [...cart, { ...dish, quantity: 1, isAvailable: dish.isAvailable ?? true }];
      }

      localStorage.setItem('cart', JSON.stringify(updatedCart));
      window.dispatchEvent(new Event('cartUpdated'));

      toast.success('Add to cart successfully!');
    }
  };

  const handlePriceChange = (e: any) => {
    const value = e.target.value;
    setPriceRanges((prev: any) =>
      e.target.checked ? [...prev, value] : prev.filter((range: any) => range !== value)
    );
  };

  return (
    <div className="w-full min-h-[790px] bg-[#ddd] px-4 lg:px-16 pt-10 pb-10 xl:pt-16 xl:pb-6 xl:bg-[#A2845E]">
      <div className="w-full flex flex-col md:flex-row md:justify-between md:gap-10">
        {/* Filters (Category and Price) - Left on desktop/tablet, below title on mobile */}
        <div className="hidden xl:block w-1/4 order-2 md:order-1">
          <div className="border border-[#d69c52] rounded mb-8">
            <div className="p-2 rounded-t bg-[#d69c52]">
              <h2 className="text-center text-[#00405d] text-xl">Categories</h2>
            </div>

            <form className="w-full">
              <div className="flex py-4 px-5 border-t border-[#d69c52]">
                <input
                  type="radio"
                  id="all"
                  name="category"
                  value="all"
                  checked={category === ''}
                  onChange={() => setCategory('')}
                  className="mr-2"
                />
                <label htmlFor="all" className="text-[19px] text-[#00405d]">All</label>
              </div>

              {categories.map((cat: any) => (
                <div className="flex py-4 px-5 border-t border-[#d69c52]" key={cat._id}>
                  <input
                    type="radio"
                    id={cat.name}
                    name="category"
                    value={cat.name}
                    checked={category === cat._id}
                    onChange={() => setCategory(cat._id)}
                    className="mr-2"
                  />
                  <label htmlFor={cat.name} className="text-[19px] text-[#00405d]">{cat.name}</label>
                </div>
              ))}
            </form>
          </div>

          <div className="border border-[#d69c52] rounded mb-8">
            <div className="p-2 rounded-t bg-[#d69c52]">
              <h2 className="text-center text-[#00405d] text-xl">Price</h2>
            </div>

            <form className="w-full">
              <div className="flex py-4 px-5 border-t border-[#d69c52]">
                <input
                  type="checkbox"
                  id="first"
                  name="price"
                  value="above-1000000"
                  onChange={handlePriceChange}
                  className="mr-2"
                />
                <label htmlFor="first" className="text-[19px] text-[#00405d]">
                  Above 1.000.000₫
                </label>
              </div>

              <div className="flex py-4 px-5 border-t border-[#d69c52]">
                <input
                  type="checkbox"
                  id="second"
                  name="price"
                  value="500000-1000000"
                  onChange={handlePriceChange}
                  className="mr-2"
                />
                <label htmlFor="second" className="text-[19px] text-[#00405d]">
                  500.000 - 1.000.000₫
                </label>
              </div>

              <div className="flex py-4 px-5 border-t border-[#d69c52]">
                <input
                  type="checkbox"
                  id="third"
                  name="price"
                  value="200000-500000"
                  onChange={handlePriceChange}
                  className="mr-2"
                />
                <label htmlFor="third" className="text-[19px] text-[#00405d]">
                  200.000 - 500.000₫
                </label>
              </div>

              <div className="flex py-4 px-5 border-t border-[#d69c52]">
                <input
                  type="checkbox"
                  id="fourth"
                  name="price"
                  value="100000-200000"
                  onChange={handlePriceChange}
                  className="mr-2"
                />
                <label htmlFor="fourth" className="text-[19px] text-[#00405d]">
                  100.000 - 200.000₫
                </label>
              </div>

              <div className="flex py-4 px-5 border-t border-[#d69c52]">
                <input
                  type="checkbox"
                  id="fifth"
                  name="price"
                  value="below-100000"
                  onChange={handlePriceChange}
                  className="mr-2"
                />
                <label htmlFor="fifth" className="text-[19px] text-[#00405d]">
                  Below 100.000₫
                </label>
              </div>
            </form>
          </div>
        </div>

        {/* Dishes Section - Right on desktop/tablet, top and bottom on mobile */}
        <div className="relative w-full mt-9 pb-6 md:mt-0 xl:w-3/4 xl:mt-0 order-1 xl:order-2">
          <div className="w-full border-b border-black pb-3 mb-5">
            <h3 className="text-center text-[20px] font-bold text-black xl:text-left">ALL DISHES</h3>
          </div>

          {/* Mobile Category/Price Filter */}
          <div className="w-full flex justify-between gap-5 xl:hidden mb-4">
            <select
              className="w-max p-2 border border-[#ddd] rounded bg-white text-[#00405d]"
              onChange={(e) => {
                const selectedOptions: any = Array.from(e.target.selectedOptions).map((option) => option.value);
                setPriceRanges(selectedOptions);
              }}
            >
              <option value="">All Prices</option>
              <option value="above-1000000">Above 1.000.000₫</option>
              <option value="500000-1000000">500.000 - 1.000.000₫</option>
              <option value="200000-500000">200.000 - 500.000₫</option>
              <option value="100000-200000">100.000 - 200.000₫</option>
              <option value="below-100000">Below 100.000₫</option>
            </select>

            <select
              className="w-max p-2 border border-[#ddd] rounded bg-white text-[#00405d]"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat: any) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-8">
            {dishes.length > 0 ? (
              dishes.map((item: any) => (
                <div key={item._id} className="no-underline text-black">
                  <div className="bg-[#ECE6DF] p-2 border border-[#ECE6DF] shadow-[4px_4px_0_0_#acacac] mb-4">
                    <div onClick={() => navigate(`/dish/${item._id}`)} style={{ cursor: 'pointer' }}>
                      <div className="mb-1">
                        <img className="w-full h-[160px] md:h-[215px] object-cover" src={item.imageUrl} alt={item.name} />
                      </div>
                      <div className="w-full xl:w-[215px] text-center whitespace-nowrap text-ellipsis overflow-hidden">
                        <p className="text-[15px] md:text-[17px] font-bold mb-2 overflow-hidden text-ellipsis">{item.name}</p>
                        <p className="text-[16px] md:text-[20px] text-[#d83a3a] font-bold">{item.price.toLocaleString()}₫</p>
                      </div>
                    </div>
                    <button
                      className="px-4 py-1 flex mx-auto translate-y-6 rounded border-none bg-[#d69c52] shadow-[0_3px_0_0_#a37b44] cursor-pointer"
                      onClick={() => addToCart(item)}
                    >
                      <FaCartPlus className="text-lg mr-2 text-white my-auto" />
                      <p className="text-sm text-white py-1">Add to cart</p>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className='col-span-2 md:col-span-4 flex justify-center items-center h-[500px]'>
                <p className="text-base md:text-[20px] col-span-2 md:col-span-4 text-center">No dishes or drinks available.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full md:w-full flex justify-center md:float-right gap-4 order-3">
              <button
                className="text-base md:text-lg px-2 bg-[#d69c52] border border-[#d69c52] rounded pt-0.5 text-[#00405d] disabled:opacity-50"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                &lt;
              </button>
              <ul className="flex gap-2 list-none">
                {[...Array(totalPages)].map((_, index) => (
                  <li
                    key={index + 1}
                    className={`bg-[#d69c52] px-2 pt-0.5 pb-0.5 border border-[#d69c52] rounded text-[#00405d] cursor-pointer text-[16px] md:text-[18px] ${currentPage === index + 1 ? 'border-[#00405d]' : ''
                      }`}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </li>
                ))}
              </ul>
              <button
                className="text-[16px] md:text-[18px] px-2 bg-[#d69c52] border border-[#d69c52] rounded pt-0.5 text-[#00405d] disabled:opacity-50"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </div>

      <ToastContainer theme="colored" />
    </div>
  )
}

export default DishMenu