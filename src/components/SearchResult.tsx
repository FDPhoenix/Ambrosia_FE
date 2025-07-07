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
    const params = new URLSearchParams(location.search);
    const name = params.get("name");
    const token = cookies.get("token");
    const [, setCart] = useState([]);

    const fetchCategories = () => {
        fetch("http://localhost:3000/category/all")
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setCategories(data.categories);
                    console.log("Categories:", data.categories);
                }
            })
            .catch((err) => {
                console.error("Error fetching categories:", err);
            });
    };

    useEffect(() => {
        const storedCart = localStorage.getItem('cart');
        setCart(storedCart ? JSON.parse(storedCart) : []);

        fetchCategories();
    }, []);

    useEffect(() => {
        if (!name && !category) return;

        const query = new URLSearchParams();
        if (name) query.append("name", name);
        if (category) query.append("categoryId", category);

        fetch(`http://localhost:3000/dishes?${query.toString()}`)
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

                const response = await fetch('http://localhost:3000/cart', {
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
        <div className="w-full xl:px-16 py-12 min-h-[323px] bg-[#EFF4F8]">
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
                    <div className="grid grid-cols-5 gap-14 mb-4">
                        {results.map((item) => (
                            <div key={item._id} className="no-underline text-black">
                                <div key={item._id} className="no-underline text-black">
                                    <div className="bg-[#ECE6DF] p-2 border border-[#ECE6DF] shadow-[4px_4px_#acacac] mb-4">
                                        <Link to={`/dish/${item._id}`} className="cursor-pointer">
                                            <div className="mb-1">
                                                <img className="w-[215px] h-[215px]" src={item.imageUrl} alt={item.name} />
                                            </div>
                                            <div className="w-[215px] text-center whitespace-nowrap overflow-hidden text-ellipsis">
                                                <p className="text-lg font-bold mb-2">{item.name}</p>
                                                <p className="text-xl text-[#d83a3a] font-bold">{item.price.toLocaleString()}₫</p>
                                            </div>
                                        </Link>
                                        <button
                                            className="flex mx-auto translate-y-[70%] px-4 py-0.5 rounded-md border-none bg-[#d69c52] shadow-[0_3px_#a37b44] cursor-pointer"
                                            onClick={() => addToCart(item)}
                                        >
                                            <FaCartPlus className="text-base my-auto mr-2 text-white" />
                                            <p className="text-sm text-white py-2">Add to cart</p>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-red-500">{error}</p>
                )}
            </div>
        </div>
    );
}

export default SearchResult;