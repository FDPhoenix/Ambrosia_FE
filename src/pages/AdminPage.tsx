import { useLocation, useNavigate } from "react-router";
import AdminHeader from "../components/Admin/AdminHeader";
import AdminSidebar from "../components/Admin/AdminSidebar";
import DashboardContent from "../components/Admin/DashboardContent";
import UserContent from "../components/Admin/UserContent";
import EmployeeContent from "../components/Admin/EmployeeContent";
import TableContent from "../components/Admin/TableContent";
import DishContent from "../components/Admin/DishContent";
import CategoryContent from "../components/Admin/CategoryContent";
import RankContent from "../components/Admin/RankContent";
import FeedbackContent from "../components/Admin/FeedbackContent";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import IngredientContent from "../components/Admin/IngredientContent";
import SystemReviewContent from "../components/Admin/SystemReviewContent";
import OrderContent from "../components/Admin/OrderContent";
import { ToastContainer } from "react-toastify";
import VoucherContent from "../components/Admin/VoucherContent";
import NewsContent from "../components/Admin/NewsContent";
import { useState } from "react";
import TableReservationList from "../components/Staff/TableReservationList";

function AdminPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = Cookies.get('token')
  const decodedToken: any = token ? jwtDecode(token) : null;
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("userImage");
    navigate("/login");
  };

  const getTitle = () => {
    if (location.pathname.startsWith("/manage/reservation")) {
      return "Reservation Management";
    }
    switch (location.pathname) {
      case "/manage/user":
        return "Customer Management";
      case "/manage/employee":
        return "Employee Management";
      case "/manage/table":
        return "Table Management";
      case "/manage/dish":
        return "Dish Management";
      case "/manage/category":
        return "Category Management";
      case "/manage/rank":
        return "Rank Management";
      case "/manage/feedback":
        return "Feedback Management";
      case "/manage/ingredient":
        return "Ingredient Management";
      case "/manage/system-review":
        return "System Review Management"
      case "/manage/order":
        return "Order Management";
      case "/manage/voucher":
        return "Voucher Management";
      case "/manage/news":
        return "News Management"
      default:
        return "Dashboard";
    }
  };

  const getContentComponent = () => {
    if (location.pathname.startsWith("/manage/reservation")) {
      return <TableReservationList />;
    }
    switch (location.pathname) {
      case "/manage/user":
        return <UserContent />;
      case "/manage/employee":
        return <EmployeeContent />;
      case "/manage/table":
        return <TableContent />;
      case "/manage/dish":
        return <DishContent />;
      case "/manage/category":
        return <CategoryContent />;
      case "/manage/rank":
        return <RankContent />;
      case "/manage/feedback":
        return <FeedbackContent />;
      case "/manage/ingredient":
        return <IngredientContent />;
      case "/manage/system-review":
        return <SystemReviewContent />
      case "/manage/order":
        return <OrderContent />;
      case "/manage/voucher":
        return <VoucherContent />;
      case "/manage/news":
        return <NewsContent />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    token && decodedToken.roleId == '67ac64afe072694cafa16e76' ? (
      <div className="bg-[#EFF4F8] w-full min-h-screen p-5 flex justify-between">
        <AdminSidebar setShowLogoutModal={setShowLogoutModal}/>

        <div className="ml-[296px] flex-1">
          <AdminHeader title={getTitle()} />
          {getContentComponent()}
          <ToastContainer theme="colored" />
        </div>

        {showLogoutModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-[9999]">
            <div className="bg-white rounded-2xl p-7 w-[360px] max-w-[90%] text-center shadow-2xl animate-fade-in">
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Logout</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to log out?</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleLogout}
                  className="bg-[#f09c42] text-white px-9 py-2 rounded-lg font-semibold text-sm hover:bg-[#e3912d] transition"
                >
                  OK
                </button>
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 hover:border-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    ) : (
      <div>You don't have permission to access this page</div>
    )
  );
}

export default AdminPage;
