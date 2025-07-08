import { BsFillBagFill, BsSearch } from "react-icons/bs";
import { FiMenu } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import avatar from "../assets/avatar.png";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import EditProfile from "./UserProfile";
import logo from "../assets/ambrosia-logo.png";

interface HeaderProps {
  fixed?: boolean;
  onCartToggle?: () => void;
}

function Header({ fixed = false, onCartToggle }: HeaderProps) {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dropdownView, setDropdownView] = useState<
    "main" | "editProfile" | "changePassword"
  >("main");
  // const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const dropdownRefMobile = useRef<HTMLDivElement>(null);
  const dropdownRefDesktop = useRef<HTMLDivElement>(null);

  const handleSearch = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?name=${encodeURIComponent(searchTerm)}`);
    }
  };

  useEffect(() => {
    const token = Cookies.get("token") ?? null;
    setUserToken(token);

    if (token) {
      const decodedToken: any = jwtDecode(token);
      setUserImage(decodedToken.image);
      setIsAdmin(decodedToken.roleId == "67ac64afe072694cafa16e76");
    } else {
      setIsAdmin(false);
    }
  }, [userToken]);

  const handleLogout = () => {
    Cookies.remove("token");
    setUserToken(null);
    setIsDropdownOpen(false);
    setDropdownView("main"); // Reset view on logout
    navigate("/login");
  };

  const showEditProfile = () => {
    setDropdownView("editProfile");
  };

  const showChangePassword = () => {
    setDropdownView("changePassword");
  };

  const handleBack = () => {
    setDropdownView("main"); // Always return to main view
  };

  const handleAvatarClick = () => {
    if (!isDropdownOpen) {
      setDropdownView("main"); // Reset to main when opening dropdown
    }
    setIsDropdownOpen(!isDropdownOpen);
  };


useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;
    if (
      (dropdownRefMobile.current && dropdownRefMobile.current.contains(target)) ||
      (dropdownRefDesktop.current && dropdownRefDesktop.current.contains(target))
    ) {
      return;
    }
    setIsDropdownOpen(false);
    setDropdownView("main");
  };

  if (isDropdownOpen) {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }
}, [isDropdownOpen]);

  return (
    <header
      className={`w-full bg-[#A2845E] py-4 px-4 md:px-16 shadow-[0_4px_6px_rgba(0,0,0,0.2)] ${fixed ? "fixed top-0 left-0 z-50" : ""
        }`}
    >
      {/* Mobile Header */}
      <div className="flex items-center justify-between md:hidden">
        <button
          className="text-white p-2"
          onClick={() => setIsSidebarOpen(true)}
        >
          <FiMenu className="w-6 h-6 text-black" />
        </button>

        <Link to="/" className="flex items-center">
          <img src={logo} alt="Ambrosia" className="h-10 object-cover ml-6" />
        </Link>

        <div className="flex items-center gap-2">
          <button
            className="relative rounded-full p-2"
            onClick={() => navigate("/cart")}
          >
            <BsFillBagFill className="text-black w-6 h-6" />
          </button>

          {userToken ? (
            <div className="relative" ref={dropdownRefDesktop}>
              <div
                className="w-8 h-8 rounded-full overflow-hidden cursor-pointer"
                onClick={handleAvatarClick}
              >
                <img
                  src={userImage || avatar}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-[999]">

                  {/* Main Menu */}
                  <div className={`${dropdownView === "main" ? "" : "hidden"}`}>
                    <div
                      className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-gray-700"
                      onClick={showEditProfile}
                    >
                      Profile
                    </div>
                    <Link
                      to="/history"
                      className="block px-4 py-3 hover:bg-gray-100 text-gray-700"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      History
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/manage/dashboard"
                        className="block px-4 py-3 hover:bg-gray-100 text-gray-700"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Manage System
                      </Link>
                    )}
                    <button
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 text-red-600"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>

                  {/* Edit Profile View */}
                  <div
                    className={`${dropdownView === "editProfile" ? "" : "hidden"
                      }`}
                  >
                    <EditProfile
                      onChangePasswordClick={showChangePassword}
                      onBackClick={handleBack}
                      currentView={dropdownView}
                    />
                  </div>

                  {/* Change Password View */}
                  <div
                    className={`${dropdownView === "changePassword" ? "" : "hidden"
                      }`}
                  >
                    <EditProfile
                      onChangePasswordClick={showChangePassword}
                      onBackClick={handleBack}
                      isChangePassword={true}
                      currentView={dropdownView}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="bg-white text-[#A2845E] px-3 py-1 rounded-full text-sm font-medium"
            >
              Login
            </button>
          )}
        </div>
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 md:hidden">
          <div className="w-64 h-full bg-white p-6">
            <div className="flex justify-between items-center mb-6">
              <p className="font-serif font-bold text-[17px]">Ambrosia</p>
              <button
                className="text-gray-500"
                onClick={() => setIsSidebarOpen(false)}
              >
                ✕
              </button>
            </div>

            <form
              className="flex items-center bg-white rounded-full px-3 py-1 shadow-inner mb-4"
              onSubmit={handleSearch}
            >
              <input
                type="text"
                className="outline-none border-none bg-transparent px-2 py-1 text-gray-700 w-40 placeholder:text-gray-400"
                placeholder="Searching dish...."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="text-[#A2845E]">
                <BsSearch className="w-5 h-5 pb-[2px]" />
              </button>
            </form>

            <nav>
              <ul className="flex flex-col gap-4">
                <li>
                  <Link
                    to="/menu"
                    className="text-[#A2845E] text-lg font-medium"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    Menu
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    className="text-[#A2845E] text-lg font-medium"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/news"
                    className="text-[#A2845E] text-lg font-medium"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    News
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="text-[#A2845E] text-lg font-medium"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link
            to="/"
            className="text-3xl font-bold font-serif text-black select-none"
          >
            Ambrosia
          </Link>
          <nav>
            <ul className="flex gap-8">
              <li>
                <Link
                  to="/menu"
                  className="text-black text-lg font-medium hover:opacity-60 transition"
                >
                  Menu
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-black text-lg font-medium hover:opacity-60 transition"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/news"
                  className="text-black text-lg font-medium hover:opacity-60 transition"
                >
                  News
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-black text-lg font-medium hover:opacity-60 transition"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <form
            className="flex items-center bg-white rounded-full px-3 py-1 shadow-inner"
            onSubmit={handleSearch}
          >
            <input
              type="text"
              className="outline-none border-none bg-transparent px-2 py-1 text-gray-700 w-40 placeholder:text-gray-400"
              placeholder="Searching dish...."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="text-[#A2845E]">
              <BsSearch className="w-5 h-5 pb-[2px]" />
            </button>
          </form>
          <button
            className="relative bg-[#A2845E] rounded-full p-2"
            onClick={onCartToggle}
          >
            <BsFillBagFill className="text-black w-6 h-6 hover:scale-110" />
          </button>
          {userToken ? (
            <div className="relative" ref={dropdownRefMobile}>
              <div
                className="w-10 h-10 rounded-full overflow-hidden cursor-pointer"
                onClick={handleAvatarClick}
              >
                <img
                  src={userImage || avatar}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-[999]">
                  {/* Main Menu */}

                  <div className={`${dropdownView === "main" ? "" : "hidden"}`}>

                    <div
                      className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-gray-700"
                      onClick={showEditProfile}
                    >
                      Profile
                    </div>
                    <Link
                      to="/history"
                      className="block px-4 py-3 hover:bg-gray-100 text-gray-700"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      History
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/manage/dashboard"
                        className="block px-4 py-3 hover:bg-gray-100 text-gray-700"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Manage System
                      </Link>
                    )}
                    <button
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 text-red-600"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>

                  {/* Edit Profile View */}
                  <div
                    className={`${dropdownView === "editProfile" ? "" : "hidden"
                      }`}
                  >
                    <EditProfile
                      onChangePasswordClick={showChangePassword}
                      onBackClick={handleBack}
                      currentView={dropdownView}
                    />
                  </div>

                  {/* Change Password View */}
                  <div
                    className={`${dropdownView === "changePassword" ? "" : "hidden"
                      }`}
                  >
                    <EditProfile
                      onChangePasswordClick={showChangePassword}
                      onBackClick={handleBack}
                      isChangePassword={true}
                      currentView={dropdownView}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="bg-white text-[#A2845E] font-semibold px-6 py-2 rounded-full shadow transition"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
