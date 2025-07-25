import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FaCartPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import cookies from 'js-cookie';

function SearchResult() {
    const [results, setResults] = useState<any[]>([]);
    const [error, setError] = useState("");
    const location = useLocation();
    const [category, setCategory] = useState('');
    const [categories, setCategories] = useState<any[]>([]);
    const [priceRange, setPriceRange] = useState('');
    const params = new URLSearchParams(location.search);
    const name = params.get("name");
    const token = cookies.get("token");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit, setLimit] = useState(10);
    const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000';

    const updateItemsPerPage = () => {
        if (window.innerWidth < 1280) {
            setLimit(8);
        } else {
            setLimit(10);
        }
    };

    const fetchCategories = () => {
        fetch(`${backendApiUrl}/category/all`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setCategories(data.categories);
                }
            })
            .catch((err) => {
                console.error("Error fetching categories:", err);
            });
    };

    useEffect(() => {
        fetchCategories();
        updateItemsPerPage();
        window.addEventListener('resize', updateItemsPerPage);

        return () => {
            window.removeEventListener('resize', updateItemsPerPage);
        };
    }, []);

    useEffect(() => {
        if (!name && !category && !priceRange) return;

        const query = new URLSearchParams();
        if (name) query.append("name", name);
        if (category) query.append("categoryId", category);
        if (priceRange) query.append("priceRange", priceRange);

        query.append("page", currentPage.toString());
        query.append("limit", limit.toString());

        fetch(`${backendApiUrl}/dishes?${query.toString()}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setResults(data.dishes);
                    setCurrentPage(data.currentPage);
                    setTotalPages(data.totalPages)
                    setError("");
                } else {
                    setResults([]);
                    setError(data.message);
                }
            })
            .catch((err) => {
                console.error(err);
                setError("Failed to fetch data.");
            });
    }, [name, category, priceRange, currentPage, limit]);

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
                updatedCart = [...cart, { ...dish, quantity: 1 }];
            }

            localStorage.setItem('cart', JSON.stringify(updatedCart));
            window.dispatchEvent(new Event('cartUpdated'));

            toast.success('Add to cart successfully!');
        }
    };

    return (
        <div className='min-h-[500px] pb-4 md:pb-6 bg-[#EFF4F8]'>
            <div className="relative w-full px-4 xl:px-16 py-12 md:py-14 min-h-[323px] bg-[#EFF4F8]">
                <div className="result">
                    <h2 className="mb-8 text-2xl">Searching result for "{name || 'all'}"</h2>

                    <div className="w-full flex justify-start gap-5 mb-5">
                        <select
                            className="w-max p-2 border border-[#e1e1e1] rounded bg-white text-[#00405d]"
                            onChange={(e) => setPriceRange(e.target.value)}
                        >
                            <option value="">All Prices</option>
                            <option value="above-1000000">Above 1.000.000₫</option>
                            <option value="500000-1000000">500.000 - 1.000.000₫</option>
                            <option value="200000-500000">200.000 - 500.000₫</option>
                            <option value="100000-200000">100.000 - 200.000₫</option>
                            <option value="below-100000">Below 100.000₫</option>
                        </select>

                        <select
                            className="w-max p-2 border border-[#e1e1e1] rounded bg-white text-[#00405d]"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>


                    {results.length > 0 ? (
                        <div className="grid grid-cols-2 gap-7 md:grid-cols-4 md:gap-10 xl:grid-cols-5 xl:gap-14 mb-6">
                            {results.map((item) => (
                                <div key={item._id} className="no-underline text-black">
                                    <div className="bg-[#ECE6DF] p-2 border border-[#ECE6DF] shadow-[4px_4px_0_0_#acacac] mb-4">
                                        <Link to={`/dish/${item._id}`} style={{ cursor: 'pointer' }}>
                                            <div className="mb-1">
                                                <img className="w-full h-[160px] md:h-[215px] object-cover" src={item.imageUrl} alt={item.name} />
                                            </div>
                                            <div className="w-full xl:w-[215px] text-center whitespace-nowrap text-ellipsis overflow-hidden">
                                                <p className="text-[15px] md:text-[17px] font-bold mb-2 overflow-hidden text-ellipsis">{item.name}</p>
                                                <p className="text-[16px] md:text-[20px] text-[#d83a3a] font-bold">{item.price.toLocaleString()}₫</p>
                                            </div>
                                        </Link>
                                        <button
                                            className="px-4 py-1 flex mx-auto translate-y-6 rounded border-none bg-[#d69c52] shadow-[0_3px_0_0_#a37b44] cursor-pointer"
                                            onClick={() => addToCart(item)}
                                        >
                                            <FaCartPlus className="text-lg mr-2 text-white my-auto" />
                                            <p className="text-sm text-white py-1">Add to cart</p>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className='w-full h-[240px] flex justify-center items-center'>
                            <p className="text-red-500">{error}</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && results.length > 0 && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full md:w-full flex justify-center gap-4 order-3">
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
    );
}

export default SearchResult;