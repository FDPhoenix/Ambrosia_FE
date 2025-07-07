import type React from "react"
import { useNavigate } from "react-router"
import { useEffect, useState } from "react"
import { GoTrash } from "react-icons/go";
import { CiDeliveryTruck } from "react-icons/ci";
import Cookies from "js-cookie";
import { jwtDecode } from 'jwt-decode';
import { toast } from "react-toastify";

interface CartSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<any[]>([])
  const token = Cookies.get('token');
  const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const loadCart = async () => {
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
          setCart(data.dishes);
        } catch (error) {
          console.error(error);
        }
      } else {
        const storedCart = localStorage.getItem("cart");
        setCart(storedCart ? JSON.parse(storedCart) : []);
      }
    };

    loadCart();
    window.addEventListener("cartUpdated", loadCart);

    return () => {
      window.removeEventListener("cartUpdated", loadCart);
    };
  }, [token]);


  const updateCart = (updatedCart: any) => {
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const removeFromCart = async (cartItemId: any) => {
    if (token) {
      try {
        const response = await fetch(`${backendApiUrl}/cart/remove/${cartItemId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to remove item");

        setCart(cart.filter((item: any) => item._id !== cartItemId));
      } catch (error) {
        console.error(error);
      }
    } else {
      const updatedCart = cart.filter((item: any) => item._id !== cartItemId);
      updateCart(updatedCart);
    }
  };

  const updateQuantity = async (cartItemId: string, action: "increase" | "decrease") => {
    const item = cart.find((i: any) => i._id === cartItemId);
    if (!item) return;

    const newQuantity = action === "increase" ? item.quantity + 1 : item.quantity - 1;
    if (newQuantity < 1) return;

    if (token) {
      try {
        const response = await fetch(`${backendApiUrl}/cart/update`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ cartItemId, action }),
        });

        if (!response.ok) throw new Error("Failed to update quantity");

        const updatedCart = cart.map((i: any) =>
          i._id === cartItemId ? { ...i, quantity: newQuantity } : i
        );
        setCart(updatedCart);
      } catch (error) {
        console.error(error);
      }
    } else {
      const updatedCart = cart.map((item: any) =>
        item._id === cartItemId ? { ...item, quantity: newQuantity } : item
      );
      updateCart(updatedCart);
    }
  };

  const totalPrice = cart.reduce((sum, item: any) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
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
    <div className={`fixed top-0 ${isOpen ? 'right-0' : 'right-[-110%]'} w-[43  0px] h-full bg-white shadow-[ -2px_0_5px_rgba(0,0,0,0.1)] transition-[right] duration-500 z-[999] p-4 flex flex-col`}>
      <div className="flex justify-between items-center p-2.5">
        <p className="text-[20px] font-bold">Your Cart</p>
        <button className="bg-none border-none text-[19px] cursor-pointer" onClick={onClose}>✖</button>
      </div>

      <div className="w-full flex gap-2.5 justify-center items-center bg-[#F6FAFB] border border-[#ccc] rounded mb-4 py-2.5 px-2.5">
        <CiDeliveryTruck className="text-[18px] my-auto" />
        <p className="text-[17px]">Free shipping for orders over <span className="font-bold">800k</span> VND</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {cart.length === 0 ? (
          <p className="mt-[50%] text-center">There are no dish yet</p>
        ) : (
          cart.map((item: any) => (
            <div key={item._id} className="h-[120px] relative flex justify-between items-center mt-1 mb-4 border border-[#ddd] rounded">
              <img src={item.imageUrl} alt={''} className="w-[80px] h-[90px] object-cover my-auto mr-4 ml-4" />

              <div className="h-full w-[265px] block leading-normal mt-5 justify-between gap-1 mr-4">
                <div className="flex justify-between">
                  <div className="max-w-[155px] my-auto">
                    <p className="text-[15px] whitespace-nowrap overflow-hidden text-ellipsis font-bold m-0">{item.name}</p>
                    <p className="text-[15px] mt-1">{item.categoryName}</p>
                  </div>

                  <button className="mt-[2px] self-start bg-none border-none text-[17px] cursor-pointer text-black" onClick={() => removeFromCart(item._id)}>
                    <GoTrash />
                  </button>
                </div>

                <div className="flex justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <button className="w-[25px] h-[25px] border-none cursor-pointer" onClick={() => updateQuantity(item._id, "decrease")}>-</button>
                    <input type="number" value={item.quantity} className="w-6 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
                    <button className="w-[25px] h-[25px] border-none cursor-pointer" onClick={() => updateQuantity(item._id, "increase")}>+</button>
                  </div>
                  <p className="font-bold text-red-600">{item.price.toLocaleString()}₫</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="py-4 border-t border-[#ddd] text-center">
        <div className="flex justify-between mb-4 text-[#634a3e]">
          <h3 className="font-semibold">TOTAL</h3>
          <h3 className="font-semibold">{totalPrice.toLocaleString()}₫</h3>
        </div>
        <div className="flex gap-3 w-full">
          <button className="py-2 w-full text-[18px] border border-[#00405d] text-[#00405d]" onClick={() => navigate("/cart")}>View cart</button>
          <button onClick={handleCheckout} className="bg-[#A2845E] text-white py-2 w-full text-[18px] border-none cursor-pointer">Checkout</button>
        </div>
      </div>
    </div>
  )
}

export default CartSidebar