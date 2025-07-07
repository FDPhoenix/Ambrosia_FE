import { Route, Routes } from "react-router";
import HomePage from "./pages/HomePage"
import './App.css'
import MenuPage from "./pages/MenuPage"
import SearchPage from "./pages/SearchPage"
import Login from "./pages/Login"
import Register from "./pages/Register"
import { useEffect, useState } from "react"
import SelectDishes from "./pages/SelectDishes"
import AddNote from "./pages/AddNote "
import ReviewBooking from "./pages/ReviewBooking"
import ReviewExperience from "./pages/ReviewExperience"
import BookingForm from "./pages/BookingForm"
import DishFeedback from "./pages/DishFeedback";
import HistoryDashboard from "./pages/HistoryDashboard";
import ChangePassword from "./components/ChangePassword";
import ViewRanks from "./components/ViewRanks";
import AdminPage from "./pages/AdminPage";
import Cookies from "js-cookie";
import DishDetailPage from "./pages/DishDetailPage";
import Checkout from "./pages/CheckoutPage";
import PaymentResult from "./pages/PaymentResult";
import ForgotPassword from "./pages/ForgotPassword";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import ChefPage from "./pages/ChefPage";
import StaffPage from "./pages/StaffPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import NewsPage from "./pages/NewsPage";
import Reservation from "./pages/Reservation";
import './index.css';
import MobileCartPage from "./pages/MobileCartPage";


function App() {
  const [bookingId] = useState(() => Cookies.get("bookingId") || null);
  const [orderType, setOrderType] = useState("pre-order"); useEffect(() => { console.log("Current orderType:", orderType); }, [orderType]);

  useEffect(() => {
    if (bookingId) {
      Cookies.set("bookingId", bookingId);
    }
  }, [bookingId]);

  return (
    <Routes>
      <Route path='/' element={<HomePage />} />
      <Route path="/booking" element={<BookingForm openSelectDateTimeModal={() => { }} closeModal={() => { }} />} />
      <Route path='/menu' element={<MenuPage />} />
      <Route path='/search' element={<SearchPage />} />
      <Route path='/login' element={<Login />} />
      <Route path='/register' element={<Register />} />
      <Route path="/select-dishes" element={<SelectDishes bookingId={bookingId || Cookies.get("bookingId")!} onOrderTypeChange={(type: string) => setOrderType(type)} openAddNoteModal={() => window.location.href = "/add-note"} />} />
      <Route path="/add-note" element={<AddNote bookingId={bookingId || Cookies.get("bookingId")} openReviewBookingModal={(id: string) => window.location.href = `/review-booking/${id}`} />} />
      <Route path="/review-booking/:bookingId" element={<ReviewBooking closeModal={() => { }} openReviewExperienceModal={() => { }} bookingId={""} />} />
      <Route path="/review-experience/:bookingId" element={<ReviewExperience closeModal={() => { }} bookingId={""} />} />
      <Route path="/feedback/:dishId" element={<DishFeedback />} />
      <Route path="/history" element={<HistoryDashboard />} />
      {/* <Route path="/profile" element={<UserProfile />} /> */}
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="/ranks" element={<ViewRanks />} />
      <Route path="/manage/*" element={<AdminPage />} />
      <Route path="/dish/:id" element={<DishDetailPage />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/payment-result" element={<PaymentResult />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/chef/*" element={<ChefPage />} />
      <Route path="/staff/*" element={<StaffPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />
      <Route path="/news" element={<NewsPage />} />
      <Route path="/reservation" element={<Reservation />} />
      <Route path="/cart" element={<MobileCartPage />} />
    </Routes>
  )
}

export default App
