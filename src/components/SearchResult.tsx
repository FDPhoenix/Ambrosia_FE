import { Link, useLocation } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { FaCartPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import cookies from 'js-cookie';
import Pagination from './Pagination';

function SearchResult() {
    const [results, setResults] = useState<any[]>([]);
    const [error, setError] = useState("");
    const location = useLocation();
    const [category, setCategory] = useState('');
    const [categories, setCategories] = useState<any[]>([]);
    const params = new URLSearchParams(location.search);
    const name = params.get("name");
    const token = cookies.get("token");
    const [currentResults, setCurrentResults] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage, setItemsPerPage] = useState<number>(10);
    const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000';

    const updateItemsPerPage = () => {
        if (window.innerWidth < 1280) { 
            setItemsPerPage(8);
        } else {
            setItemsPerPage(10);
        }
    };

    
    useEffect(() => {
        updateItemsPerPage();
        window.addEventListener('resize', updateItemsPerPage); 

        return () => {
            window.removeEventListener('resize', updateItemsPerPage);
        };
    }, []);

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
    }, []);

    useEffect(() => {
        if (!name && !category) return;

        const query = new URLSearchParams();
        if (name) query.append("name", name);
        if (category) query.append("categoryId", category);

        fetch(`${backendApiUrl}/dishes?${query.toString()}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setResults(data.dishes);
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
    }, [name, category]);

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

    const handlePageChange = useCallback((paginatedResult: any[]) => {
        setCurrentResults(paginatedResult);
    }, []);

    useEffect(() => {
        const totalPages = Math.ceil(results.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        } else if (totalPages === 0) {
            setCurrentPage(1);
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedItems = results.slice(startIndex, startIndex + itemsPerPage);
        setCurrentResults(paginatedItems);
    }, [results, currentPage, itemsPerPage]);

    return (
        <div className='pb-4 md:pb-6 bg-[#EFF4F8]'>
            <div className="relative w-full px-4 xl:px-16 py-12 md:py-14 min-h-[323px] bg-[#EFF4F8]">
                <div className="result">
                    <h2 className="mb-8 text-2xl">Searching result for "{name || 'all'}"</h2>

                    <div className="w-full flex justify-start gap-5 mb-5">
                        <select
                            className="w-max p-2 border border-[#e1e1e1] rounded bg-white text-[#00405d]"
                            onChange={(e) => console.log(e.target.value)}
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
                            {currentResults.map((item) => (
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
                        <p className="text-red-500">{error}</p>
                    )}
                </div>

                <Pagination items={results} itemsPerPage={10} onPageChange={handlePageChange} />
            </div>
        </div>
    );
}

export default SearchResult;