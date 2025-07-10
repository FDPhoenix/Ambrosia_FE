import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';

interface CartItem {
  _id: string;
  name: string;
  imageUrl: string;
  price: number;
  quantity: number;
  size?: string;
}

interface UserProfile {
  id: string;
  fullname: string;
  email: string;
  phoneNumber: string;
  profileImage?: string;
  rank: string;
  createdAt: string;
}

function CheckoutPage() {
  const [checkoutProduct, setCheckoutProduct] = useState<CartItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [voucherCode, setVoucherCode] = useState<string>('');
  const [appliedVoucher, setAppliedVoucher] = useState<any | null>(null);
  const token = Cookies.get('token');
  const navigate = useNavigate();
  const baseShippingFee = 25000;

  const addressRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const provinceRef = useRef<HTMLInputElement>(null);
  const districtRef = useRef<HTMLInputElement>(null);
  const wardRef = useRef<HTMLInputElement>(null);

  const GOONG_API_KEY = import.meta.env.VITE_GOONG_MAPS_API_KEY;
  const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000';
  const sessionToken = crypto.randomUUID();

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

          if (!response.ok) throw new Error("Unable to load cart");
          const data = await response.json();
          setCheckoutProduct(data.dishes);
        } catch (error) {
          console.error(error);
        }
      }
    };

    const loadUserProfile = async () => {
      if (token) {
        try {
          const response = await fetch(`${backendApiUrl}/user/profile`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) throw new Error("Unable to load user information");
          const data = await response.json();
          if (data.success) {
            setUserProfile(data.user);
          }
        } catch (error) {
          console.error("Error loading user information:", error);
        }
      }
    };

    loadCart();
    loadUserProfile();
  }, [token]);

  const debounce = (func: Function, wait: number) => {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const searchAddress = debounce(async (query: string) => {
    if (query.length < 2) {
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://rsapi.goong.io/Place/AutoComplete?api_key=${GOONG_API_KEY}&input=${encodeURIComponent(query)}&sessiontoken=${sessionToken}`
      );
      const data = await response.json();
      console.log('Goong API response:', data);

      if (data.status === 'OK') {
        setSuggestions(data.predictions);
        setShowSuggestions(true);
      } else {
        console.error('Goong API error:', data.status, data.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error when calling Goong API:', error);
    }
  }, 300);

  const handleSuggestionClick = (suggestion: any) => {
    console.log('Suggestion compound:', suggestion.compound);

    if (addressRef.current) {
      addressRef.current.value = suggestion.description || '';
    }

    if (suggestion.compound) {
      if (provinceRef.current) provinceRef.current.value = suggestion.compound.province || '';
      if (districtRef.current) districtRef.current.value = suggestion.compound.district || '';
      if (wardRef.current) wardRef.current.value = suggestion.compound.commune || '';
    }

    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addressRef.current &&
        !addressRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleApplyVoucher = async () => {
    if (!voucherCode) {
      toast.error('Please input voucher');
      return;
    }

    if (!token) {
      toast.error('Please login to apply voucher');
      return;
    }

    try {
      const currentUserId = jwtDecode<any>(token).id;

      const response = await fetch(`${backendApiUrl}/vouchers/code/${voucherCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        const voucher = data.data;

        if (voucher.userId) {
          if (voucher.userId._id !== currentUserId) {
            toast.error('This voucher is not valid for your account');
            return;
          }
        }

        setAppliedVoucher(data.data);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error when applied voucher');
    }
  };

  const handleChangeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
  };

  const handleCheckout = async () => {
    if (!token || !userProfile) {
      toast.error("Please login to continue!");
      navigate('/login');
      return;
    }

    const deliveryAddress = addressRef.current?.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!userProfile.fullname) {
      toast.error('Please enter your full name');
      return;
    }

    if (!userProfile.email) {
      toast.error('Please enter your email');
      return;
    }

    if (!emailRegex.test(userProfile.email)) {
      toast.error('Invalid email, please try again');
      return;
    }

    if (!userProfile.phoneNumber) {
      toast.error('Please enter your phone number');
      return;
    }

    if (!deliveryAddress) {
      toast.error("Please enter your delivery address");
      return;
    }

    const checkoutData = {
      userId: jwtDecode<any>(token).id,
      contactPhone: userProfile.phoneNumber,
      deliveryAddress,
      totalAmount: getTotalPrice() - getVoucherDiscount() + getShippingFee(),
    };

    try {
      setIsLoading(true);

      const checkoutResponse = await fetch(`${backendApiUrl}/payment/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(checkoutData),
      });

      const checkoutDataResponse = await checkoutResponse.json();

      if (!checkoutDataResponse.success) {
        toast.error(`ERROR: ${checkoutDataResponse.message}`);
        return;
      }

      const bookingId = checkoutDataResponse.bookingId;
      Cookies.set('bookingId', bookingId, { expires: 1, path: '/' });

      const orderId = checkoutDataResponse.orderId;
      const vnpayResponse = await fetch(`${backendApiUrl}/payment/vnpay-create?orderId=${orderId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const vnpayData = await vnpayResponse.json();

      if (vnpayResponse.ok && vnpayData.paymentUrl) {
        if (appliedVoucher) {
          Cookies.set('VoucherId', appliedVoucher._id, { expires: 1, path: '/' });
        }

        Cookies.set('TotalAmount', `${checkoutData.totalAmount}`, { expires: 1, path: '/' });

        window.location.href = vnpayData.paymentUrl;
      } else {
        toast.error(`ERROR: ${vnpayData.error || 'Unable to generate payment URL'}`);
      }
    } catch (error) {
      console.error('Error during checkout or payment URL creation:', error);
      toast.error('An error occurred while processing your order');
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalPrice = () => {
    return checkoutProduct.reduce((total, item) => total + item.quantity * item.price, 0);
  };

  const getShippingFee = () => {
    const totalPrice = getTotalPrice();
    return (totalPrice >= 800000 || totalPrice === 0) ? 0 : baseShippingFee;
  };

  const getVoucherDiscount = () => {
    if (!appliedVoucher) return 0;
    const subtotal = getTotalPrice();
    return (subtotal * appliedVoucher.discount) / 100;
  };

  return (
    <div className="flex flex-col md:flex-row w-full mx-auto min-h-screen">
      <div className="w-full pr-4 lg:w-[55%] xl:pl-56 md:pl-10 pl-4 pt-12 lg:pr-[4%]">
        <h3 className="text-3xl font-serif font-semibold mb-4">Ambrosia</h3>
        <p className="text-lg mb-3">Delivery information</p>

        <form className="w-full mb-3 lg:mb-4">
          <input
            className="w-full p-3 mb-3.5 border border-gray-200 rounded-md"
            type='text'
            placeholder='Full Name'
            value={userProfile?.fullname || ''}
            onChange={(e) => setUserProfile({ ...userProfile!, fullname: e.target.value })}
          />

          <div className="flex flex-col md:flex-row md:space-x-4 mb-3.5">
            <input
              className="w-full md:w-2/3 p-3 border border-gray-200 rounded-md md:mb-0"
              type='text'
              placeholder='Email'
              value={userProfile?.email || ''}
              onChange={(e) => setUserProfile({ ...userProfile!, email: e.target.value })}
            />
            <input
              className="w-full md:w-1/3 p-3 border border-gray-200 rounded-md"
              type='text'
              placeholder='Phone'
              value={userProfile?.phoneNumber || ''}
              onChange={(e) => setUserProfile({ ...userProfile!, phoneNumber: e.target.value })}
            />
          </div>

          <div className="relative mb-3.5">
            <input
              ref={addressRef}
              className="w-full p-3 border border-gray-200 rounded-md"
              type="text"
              placeholder="Address"
              onChange={(e) => searchAddress(e.target.value)}
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div ref={suggestionsRef} className="absolute bg-gray-50 w-full max-h-72 overflow-y-auto shadow-lg rounded-lg z-10 border border-gray-700">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.place_id}
                    className="p-3 cursor-pointer flex items-center border-b border-gray-700 last:border-b-0 bg-gray-200 hover:bg-[#A2845E] hover:text-white hover:pl-6 transition-all duration-300 before:bg-[url('../../assets/location.png')] before:bg-no-repeat before:bg-[length:16px_16px] before:bg-[10px_center]"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion.description}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:space-x-4">
            <input
              ref={provinceRef}
              type="text"
              className="w-full md:w-1/3 p-3 border border-gray-200 rounded-md mb-4 md:mb-0"
              placeholder="Province/City"
            />
            <input
              ref={districtRef}
              type="text"
              className="w-full md:w-1/3 p-3 border border-gray-200 rounded-md mb-4 md:mb-0"
              placeholder="District"
            />
            <input
              ref={wardRef}
              type="text"
              className="w-full md:w-1/3 p-3 border border-gray-200 rounded-md"
              placeholder="Ward/Commune"
            />
          </div>
        </form>

        <p className="text-lg mb-2">Delivery method</p>
        <div className="flex w-full border border-gray-200 rounded-md p-3.5 mb-3 justify-between lg:mb-4">
          <div>
            <input className="mr-2" type='radio' id='ship' checked />
            <label htmlFor='ship'>Delivery to your location</label>
          </div>
          <p>{getShippingFee().toLocaleString()}₫</p>
        </div>

        <p className="text-lg mb-2">Payment method</p>
        <div className="w-full border border-gray-200 rounded-md p-3.5 mb-3 lg:mb-4">
          <div>
            <input className="mr-2" type='radio' id='payment' checked />
            <label htmlFor='payment'>Prepayment with VNPay</label>
          </div>
        </div>

        <div className="hidden md:flex flex-col md:flex-row justify-between">
          <button className=" text-[#338dbc] bg-white mb-4 md:mb-0" onClick={() => navigate('/')}>← Home</button>
          {!isLoading ? (
            <button className="p-3 bg-[#338dbc] text-white rounded-md" onClick={handleCheckout}>Complete order</button>
          ) : (
            <button className="p-3 bg-[#338dbc] text-white rounded-md">Completing...</button>
          )}
        </div>
      </div>

      <div className="w-full pl-4 pt-4 lg:pt-12 bg-white pr-4 lg:w-[45%] xl:pr-56 md:pr-10 lg:pl-[4%] lg:bg-gray-50 shadow-[-1px_0_0_#e1e1e1]">
        <h3 className="text-lg mb-2 lg:hidden">Order summary</h3>
        <div className="w-full max-h-80 overflow-y-auto border-b border-gray-300 pb-2 [scrollbar-w-1] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#A2845E] [&::-webkit-scrollbar-thumb]:rounded-[50px]">
          {checkoutProduct.map((item) => (
            <div className="w-full flex justify-between py-3 relative" key={item._id}>
              <div className="w-3/4 flex">
                <img src={item.imageUrl} alt='' className="w-16 h-16 mr-5 rounded-lg" />
                <div className="flex items-center">
                  <p className="text-lg">{item.name}</p>
                </div>
                <p className="text-xs bg-[#999999E5] text-white rounded-full px-[8px] py-[3px] absolute top-1 left-14">{item.quantity}</p>
              </div>
              <div className="my-auto mr-2">{(item.price * item.quantity).toLocaleString()}₫</div>
            </div>
          ))}
        </div>

        {!appliedVoucher ? (
          <div className="w-full flex py-5">
            <input
              type="text"
              name="voucher"
              id="voucher"
              placeholder="Voucher"
              className="w-4/5 p-2 border border-[#e1e1e1] border-r-0 rounded-l-md focus:outline-none"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value)}
            />
            <button className="w-1/5 border border-[#e1e1e1] border-l-0 bg-[#ECE6DF] rounded-r-md" onClick={handleApplyVoucher}>Apply</button>
          </div>
        ) : (
          <div className="py-5 pr-1">
            <div className="flex justify-between items-center">
              <p className="text-gray-600">Voucher applied:</p>
              <div className="relative p-2 bg-gray-50 rounded-md border border-[#A2845E]">
                <p className="text-[#A2845E]">{appliedVoucher.code} (-{appliedVoucher.discount}%)</p>
                <button className="absolute -top-[5px] -right-[6px] text-[10px] bg-[#A2845E] text-white rounded-full px-[3.5px] pt-[1px]" onClick={handleChangeVoucher}>✖</button>
              </div>
            </div>
          </div>
        )}

        <div className="py-6 border-t border-gray-300">
          <div className="flex justify-between mb-3">
            <p className="text-gray-600">Subtotal</p>
            <p>{getTotalPrice().toLocaleString()}₫</p>
          </div>
          <div className="flex justify-between mb-3">
            <p className="text-gray-600">Voucher</p>
            <p>- {getVoucherDiscount().toLocaleString()}₫</p>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-600">Shipping fee</p>
            <p>{getShippingFee().toLocaleString()}₫</p>
          </div>
        </div>

        <div className="flex justify-between py-6 border-t border-gray-300">
          <p className="text-xl font-medium">Total</p>
          <p className="text-xl font-medium">{(getTotalPrice() + getShippingFee() - getVoucherDiscount()).toLocaleString()}₫</p>
        </div>
      </div>

      <div className="flex flex-col justify-between md:hidden pr-4 pl-4 mb-4">
        <button className="p-1.5 text-[#338dbc] bg-white mb-2 border border-[#338dbc] rounded-md md:mb-0" onClick={() => navigate('/cart')}>Back to cart</button>
        {!isLoading ? (
          <button className="p-2 bg-[#338dbc] text-white rounded-md" onClick={handleCheckout}>Complete order</button>
        ) : (
          <button className="p-2 bg-[#338dbc] text-white rounded-md">Completing...</button>
        )}
      </div>

      <ToastContainer theme="colored" />
    </div>
  );
}

export default CheckoutPage;