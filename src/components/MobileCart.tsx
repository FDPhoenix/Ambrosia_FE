import { Minus, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from 'react-bootstrap'
import Cookies from 'js-cookie'
import { useNavigate } from 'react-router'
import { toast } from 'react-toastify'
import { jwtDecode } from 'jwt-decode'
import LoadingAnimation from './LoadingAnimation'

function MobileCart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const token = Cookies.get('token');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const fetchCart = async () => {
      setIsLoading(true);
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          const userId = decoded.id;

          const response = await fetch(`${backendApiUrl}/cart/${userId}`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) throw new Error("Failed to fetch cart");

          const data = await response.json();
          setCartItems(data.dishes);
        } catch (error) {
          console.error(error);
        }
      } else {
        const storedCart = localStorage.getItem("cart");
        setCartItems(storedCart ? JSON.parse(storedCart) : []);
      }
      setIsLoading(false);
    };

    fetchCart();
    window.addEventListener("cartUpdated", fetchCart);

    return () => {
      window.removeEventListener("cartUpdated", fetchCart);
    };
  }, [token]);


  const updateCart = (updatedCart: any) => {
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const removeFromCart = async (cartItemId: any) => {
    if (!cartItemId) return;

    if (token) {
      try {
        const response = await fetch(`${backendApiUrl}/cart/remove/${cartItemId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to remove item");

        setCartItems(cartItems.filter((item: any) => item._id !== cartItemId));
      } catch (error) {
        console.error(error);
      }
    } else {
      const updatedCart = cartItems.filter((item: any) => item._id !== cartItemId);
      updateCart(updatedCart);
    }
  };

  const updateQuantity = async (cartItemId: string, action?: "increase" | "decrease", newQuantity?: number) => {
    const item = cartItems.find((i: any) => i._id === cartItemId);
    if (!item) return;

    let updatedQuantity = newQuantity !== undefined ? Number(newQuantity) : item.quantity;
    if (action === "increase") {
      updatedQuantity = item.quantity + 1;
    } else if (action === "decrease" && item.quantity > 1) {
      updatedQuantity = item.quantity - 1;
    }

    if (updatedQuantity && updatedQuantity < 1) return;

    if (token) {
      try {
        const response = await fetch(`${backendApiUrl}/cart/update`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ cartItemId, ...(action ? { action } : { quantity: updatedQuantity }) }),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.message || "Failed to update quantity");
        }

        const result = await response.json();
        const updatedCartItem = result.cartItem;
        const updatedCart = cartItems.map((i: any) =>
          i._id === cartItemId ? { ...i, quantity: updatedCartItem.quantity } : i
        );
        setCartItems(updatedCart);
      } catch (error) {
        console.error(error);
      }
    } else {
      const updatedCart = cartItems.map((item: any) =>
        item._id === cartItemId ? { ...item, quantity: updatedQuantity } : item
      );
      updateCart(updatedCart);
    }
  };

  const handleBlur = (cartItemId: string, value: string) => {
    const newQuantity = Number(value);
    if (isNaN(newQuantity) || newQuantity < 1) {
      updateQuantity(cartItemId, undefined, 1);
    }
  };

  const totalPrice = cartItems.reduce((sum, item: any) => item.isAvailable ? sum + item.price * item.quantity : sum, 0);

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('There are no dish to checkout');
      return;
    }

    const hasUnavailableItems = cartItems.some((item: any) => !item.isAvailable);
    if (hasUnavailableItems) {
      toast.error('Please remove unavailable dishes before checking out.');
      return;
    }

    if (token) {
      navigate('/checkout');
    }
    else {
      toast.error('You must login to perform this action!')
    }
  }

  return (
    <div className='w-full min-h-[323px] px-4 py-4 bg-[#EFF4F8] xl:px-16 '>
      <div className="max-w-6xl mx-auto my-6 xl:my-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h1 className="text-2xl text-center md:text-3xl font-bold text-gray-800 mb-6">Your Cart</h1>
            <div className="bg-white rounded-lg shadow-sm py-4 px-6 min-h-[200px]">
              {isLoading ? (
                <LoadingAnimation />
              ) : cartItems.length === 0 ? (
                <div className='w-max flex flex-col justify-center items-center mx-auto my-12'>
                  <p className='text-lg mb-2'>Your cart is empty</p>
                  <button className='text-[13px] font-serif uppercase text-white bg-black px-5 py-2' style={{ margin: "0 auto" }} onClick={() => navigate("/menu")}>go to menu</button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4 text-right">You have {cartItems.length} dishes/drinks in your cart</p>

                  <div className="w-full space-y-4 mb-2">
                    {cartItems.map((item) => (
                      <div
                        key={item._id}
                        className="relative flex flex-row gap-3 p-3 border border-gray-200 rounded-lg"
                      >
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={item.imageUrl || "/placeholder.svg"}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="w-20 h-20 object-cover rounded-md"
                          />
                        </div>

                        {/* Item Details and Controls */}
                        <div className="flex w-full flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                          <div>
                            <h3 className="font-semibold text-gray-800 text-xs sm:text-sm md:text-base mb-1">
                              {item.name}
                            </h3>
                            <p className="text-gray-600 text-xs sm:text-sm">
                              {item.categoryName || "No category"}
                            </p>
                          </div>

                          {/* Quantity and Price Controls */}
                          <div className="w-full flex flex-row items-center justify-between  sm:w-auto gap-3">
                            <div className={`flex items-center gap-2 border border-gray-300 rounded-lg px-2 py-1 mr-0 xl:mr-14 ${item.isAvailable ? '' : 'hidden'}`}>
                              <button
                                className="w-4 h-4 md:w-6 md:h-6 xl:w-8 xl:h-8 border-none cursor-pointer flex items-center justify-center"
                                onClick={() => updateQuantity(item._id, "decrease")}
                              >
                                <Minus className="w-4 h-4 sm:w-3 sm:h-3" />
                              </button>
                              <input
                                type="number"
                                value={item.quantity}
                                className="w-10 sm:w-8 text-center text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                min={1}
                                onChange={(e) => updateQuantity(item._id, undefined, Number(e.target.value))}
                                onBlur={(e) => handleBlur(item._id, e.target.value)}
                              />
                              <button
                                className="w-4 h-4 md:w-6 md:h-6 xl:w-8 xl:h-8 border-none cursor-pointer flex items-center justify-center"
                                onClick={() => updateQuantity(item._id, "increase")}
                              >
                                <Plus className="w-4 h-4 sm:w-3 sm:h-3" />
                              </button>
                            </div>

                            {/* Price and Remove Button */}
                            {item.isAvailable ? (
                              <div className="flex items-center justify-between sm:justify-end gap-3">
                                <div className="text-right">
                                  <div className="text-base sm:text-lg font-semibold text-red-600">
                                    {item.price.toLocaleString()}₫
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-[25px] flex justify-start items-center">
                                <div className="px-3 py-[3px] rounded-md text-red-600 font-semibold border border-red-600">Sold out</div>
                              </div>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-1.5 right-1 md:static text-gray-400 hover:text-red-500 p-1"
                              onClick={() => removeFromCart(item._id)}
                            >
                              <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>


          <div className="lg:col-span-1">
            <div className="sticky top-8 bg-[#F6FAFB] p-6 rounded-lg shadow-sm">
              <div>
                <div>
                  <h3 className="text-lg pb-4 font-semibold">Order information</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center border-y border-gray-200 py-4">
                    <span className="font-medium text-lg">Total:</span>
                    <span className="text-lg font-bold">{totalPrice.toLocaleString()}₫</span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[17px] text-gray-600">You can enter the discount code at checkout</p>
                  </div>

                  <button className="w-full bg-black hover:bg-gray-800 text-white py-3 text-base font-medium" onClick={handleCheckout} disabled={isLoading}>
                    Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MobileCart