import { Link, useLocation } from 'react-router';
// import { BiUserPlus } from 'react-icons/bi';
import UserIcon from '../../assets/user.png';
import EmployeeIcon from '../../assets/employees.png';
import DishIcon from '../../assets/dish.png';
import TableIcon from '../../assets/round-table.png';
import CategoryIcon from '../../assets/category.png';
import RankIcon from '../../assets/ranking.png';
import RestaurantIcon from '../../assets/cutlery.png';
import FeedbackIcon from '../../assets/feedback.png';
import IngredientIcon from '../../assets/ingredient.png';
import SystemReview from '../../assets/customer-experience.png';
import OrderIcon from '../../assets/checklist.png';
import VoucherIcon from '../../assets/coupon.png';
import NewsIcon from '../../assets/news.png';
import LogoutIcon from '../../assets/logout.png';
import styles from '../../css/AdminCss/AdminSidebar.module.css';
import { Dispatch, SetStateAction } from 'react';

interface AdminSidebarProps {
  setShowLogoutModal: Dispatch<SetStateAction<boolean>>;
}

function AdminSidebar({ setShowLogoutModal }: AdminSidebarProps) {
  const location = useLocation();

  return (
    <aside className="w-[270px] h-[664px] bg-white border-r border-gray-200 flex flex-col rounded-[15px] shadow-md fixed">
      <div className="min-h-[70px] p-4 flex items-center gap-3 border-b border-gray-200 cursor-pointer">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white">
          <img src={RestaurantIcon} alt="logo" />
        </div>
        <span className="text-[22px] font-semibold font-serif tracking-wider">Ambrosia</span>
      </div>

      <nav className={styles.nav}>
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-gray-500 px-3">HOME</h3>
          <ul className="list-none p-0 m-0 flex flex-col gap-1">
            <li>
              <Link
                to="/manage/dashboard"
                className={`flex items-center gap-3 p-3 rounded-md text-gray-700 hover:bg-[#F09C42] ${location.pathname === '/manage/dashboard' ? 'bg-[#F09C42]' : ''}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <rect width="7" height="9" x="3" y="3" rx="1"></rect>
                  <rect width="7" height="5" x="14" y="3" rx="1"></rect>
                  <rect width="7" height="9" x="14" y="12" rx="1"></rect>
                  <rect width="7" height="5" x="3" y="16" rx="1"></rect>
                </svg>
                <span>Dashboard</span>
              </Link>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-gray-500 px-3">MANAGEMENT</h3>
          <ul className="list-none p-0 m-0 flex flex-col gap-1">
            {[
              { path: '/manage/user', icon: UserIcon, label: 'User' },
              { path: '/manage/employee', icon: EmployeeIcon, label: 'Employee' },
              { path: '/manage/table', icon: TableIcon, label: 'Table' },
              { path: '/manage/dish', icon: DishIcon, label: 'Dish' },
              { path: '/manage/category', icon: CategoryIcon, label: 'Category' },
              { path: '/manage/order', icon: OrderIcon, label: 'Order' },
              { path: '/manage/rank', icon: RankIcon, label: 'Rank' },
              { path: '/manage/feedback', icon: FeedbackIcon, label: 'Feedback' },
              { path: '/manage/ingredient', icon: IngredientIcon, label: 'Ingredient' },
              { path: '/manage/voucher', icon: VoucherIcon, label: 'Voucher' },
              { path: '/manage/news', icon: NewsIcon, label: 'News' },
            ].map(({ path, icon, label }) => (
              <li key={path}>
                <Link to={path} className={`flex items-center gap-3 p-3 rounded-md text-gray-700 hover:bg-[#F09C42] ${location.pathname === path ? 'bg-[#F09C42]' : ''}`}>
                  <img src={icon} alt={label} className="w-6 h-6" />
                  <span>{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-gray-500 px-3">EXTRA</h3>
          <ul className="list-none p-0 m-0 flex flex-col gap-1">
            <li>
              <Link to="/manage/system-review" className={`flex items-center gap-3 p-3 rounded-md text-gray-700 hover:bg-[#F09C42] ${location.pathname === '/manage/system-review' ? 'bg-[#F09C42]' : ''}`}>
                <img src={SystemReview} alt="System Review" className="w-6 h-6" />
                <span>System Review</span>
              </Link>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-gray-500 px-3">AUTH</h3>
          <ul className="list-none p-0 m-0 flex flex-col gap-1">
            <li>
              <div className={`flex items-center gap-3 p-3 rounded-md text-gray-700 hover:bg-[#F09C42]`} onClick={() => setShowLogoutModal(true)}>
                <img src={LogoutIcon} alt="Logout" className="w-6 h-6" />
                <span>Logout</span>
              </div>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
}

export default AdminSidebar;