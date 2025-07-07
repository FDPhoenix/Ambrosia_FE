import { Minus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from 'react-bootstrap'
import Cookies from 'js-cookie'


function MobileCart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const token = Cookies.get('token');

  useEffect(() => {
    const fetchCart = async () => {
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          const userId = decoded.id;

          const response = await fetch(`http://localhost:3000/cart/${userId}`, {
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
    console.log(cartItemId);
    if (!cartItemId) return;

    if (token) {
      try {
        const response = await fetch(`http://localhost:3000/cart/remove/${cartItemId}`, {
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

  const updateQuantity = async (cartItemId: string, action: "increase" | "decrease") => {
    const item = cartItems.find((i: any) => i._id === cartItemId);
    if (!item) return;

    const newQuantity = action === "increase" ? item.quantity + 1 : item.quantity - 1;
    if (newQuantity < 1) return;

    if (token) {
      try {
        const response = await fetch("http://localhost:3000/cart/update", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ cartItemId, action }),
        });

        if (!response.ok) throw new Error("Failed to update quantity");

        const updatedCart = cartItems.map((i: any) =>
          i._id === cartItemId ? { ...i, quantity: newQuantity } : i
        );
        setCartItems(updatedCart);
      } catch (error) {
        console.error(error);
      }
    } else {
      const updatedCart = cartItems.map((item: any) =>
        item._id === cartItemId ? { ...item, quantity: newQuantity } : item
      );
      updateCart(updatedCart);
    }
  };

  const totalPrice = cartItems.reduce((sum, item: any) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('There are no dish to checkout');
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
      <div className="max-w-6xl mx-auto my-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h1 className="text-2xl text-center md:text-3xl font-bold text-gray-800 mb-6">Your Cart</h1>
            <div className="bg-white rounded-lg shadow-sm py-4 px-6">
              <p className="text-gray-600 mb-4 text-right">You have {cartItems.length} dishes/drinks in your cart</p>

              <div className="space-y-6 mb-2">
                {cartItems.map((item) => (
                  <div key={item._id} className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex-shrink-0">
                      <img
                        src={item.imageUrl || "/placeholder.svg"}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                    </div>

                    <div className="flex w-full justify-between items-center gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-800 text-sm md:text-base mb-1">{item.name}</h3>
                        <p className="text-gray-600 text-sm mb-3">
                          {item.categoryName || "No category"}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
                        <div className="flex items-center gap-3 border border-gray-300 rounded-lg px-2 py-1">
                          <button className="w-[25px] h-[25px] border-none cursor-pointer" onClick={() => updateQuantity(item._id, "decrease")}><Minus className='w-3 mx-auto'/></button>
                          <input type="number" value={item.quantity} className="w-6 text-center appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                          <button className="w-[25px] h-[25px] border-none cursor-pointer" onClick={() => updateQuantity(item._id, "increase")}>+</button>
                        </div>


                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="text-right">
                            <div className="text-lg font-semibold text-red-600">{item.price.toLocaleString()}₫</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-red-500"
                            onClick={() => removeFromCart(item._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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

                  <button className="w-full bg-black hover:bg-gray-800 text-white py-3 text-base font-medium" onClick={handleCheckout}>
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
import { useNavigate } from 'react-router'
import { toast } from 'react-toastify'
import { jwtDecode } from 'jwt-decode'

export default MobileCart