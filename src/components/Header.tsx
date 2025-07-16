import { BsSearch } from "react-icons/bs";
import { FiMenu } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import avatar from "../assets/avatar.png";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import EditProfile from "./UserProfile";
import logo from "../assets/ambrosia-logo-removebg.png";
import { FaCartShopping } from "react-icons/fa6";

interface HeaderProps {
  fixed?: boolean;
  inheritBackground?: boolean;
  onCartToggle?: () => void;
}

function Header({ fixed = false, inheritBackground = false, onCartToggle }: HeaderProps) {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dropdownView, setDropdownView] = useState<
    "main" | "editProfile" | "changePassword"
  >("main");
  const [forceUpdate, setForceUpdate] = useState(0); // Thêm state để force re-render
  const navigate = useNavigate();
  const dropdownRefMobile = useRef<HTMLDivElement>(null);
  const dropdownRefDesktop = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleSearch = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?name=${encodeURIComponent(searchTerm)}`);
    }
  };

  // Thêm event listener để re-render khi đăng nhập thành công
  useEffect(() => {
    const handleLoginSuccess = () => {
      console.log("[Header] Login success event received, forcing re-render");
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('loginSuccess', handleLoginSuccess);
    return () => {
      window.removeEventListener('loginSuccess', handleLoginSuccess);
    };
  }, []);

  // Thêm interval để kiểm tra token định kỳ (backup)
  useEffect(() => {
    const checkTokenInterval = setInterval(() => {
      const currentToken = Cookies.get("token") ?? null;
      if (currentToken !== userToken) {
        console.log("[Header] Token changed, updating state");
        setUserToken(currentToken);
        setForceUpdate(prev => prev + 1);
      }
    }, 1000); // Kiểm tra mỗi giây

    return () => clearInterval(checkTokenInterval);
  }, [userToken]);

  useEffect(() => {
    const token = Cookies.get("token") ?? null;
    console.log("[Header] Current token:", token ? "Found" : "Not found");
    setUserToken(token);

    if (token) {
      console.log("[Header] Fetching user info...");
      const fetchUserInfo = async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000'}/user/profile`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: 'include', 
          });

          console.log("[Header] API response status:", response.status);

          if (response.ok) {
            const data = await response.json();
            console.log("[Header] User data received:", data);
            setUserImage(data.user.profileImage);
         
            const userRoles = data.user.roles || [];
            const isAdminUser = userRoles.some((role: any) => role.roleId === "67ac64afe072694cafa16e76");
            setIsAdmin(isAdminUser);
            console.log("[Header] User image set:", data.user.profileImage);
            console.log("[Header] Is admin:", isAdminUser);
          } else {
            console.log("[Header] API failed, using token decode fallback");
            const decodedToken: any = jwtDecode(token);
            setUserImage(decodedToken.image);
            setIsAdmin(decodedToken.roleId == "67ac64afe072694cafa16e76");
          }
        } catch (error) {
          console.error("[Header] Error fetching user info:", error);
          const decodedToken: any = jwtDecode(token);
          setUserImage(decodedToken.image);
          setIsAdmin(decodedToken.roleId == "67ac64afe072694cafa16e76");
        }
      };

      fetchUserInfo();
    } else {
      console.log("[Header] No token, setting isAdmin to false");
      setIsAdmin(false);
    }
  }, [userToken, forceUpdate]); // Thêm forceUpdate vào dependency

  const handleLogout = () => {
    console.log("[Header] Logout clicked");
    Cookies.remove("token");
    setUserToken(null);
    setIsDropdownOpen(false);
    setDropdownView("main");
    navigate("/login");
  };

  const showEditProfile = () => {
    console.log("[Header] Show edit profile clicked");
    setDropdownView("editProfile");
  };

  const showChangePassword = () => {
    console.log("[Header] Show change password clicked");
    setDropdownView("changePassword");
  };

  const handleBack = () => {
    console.log("[Header] Back clicked");
    setDropdownView("main"); // Always return to main view
  };

  const handleAvatarClick = () => {
    console.log("[Header] Avatar clicked, dropdown open:", !isDropdownOpen);
    if (!isDropdownOpen) {
      setDropdownView("main"); // Reset to main when opening dropdown
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


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
      className={`w-full py-4 px-4 md:px-16 ${fixed ? "fixed top-0 left-0 z-50" : ""} ${inheritBackground && !isScrolled
        ? "bg-transparent shadow-none"
        : "bg-[#A2845E] shadow-[0_4px_6px_rgba(0,0,0,0.2)]"
        }`}
    >
      {/* Mobile Header */}
      <div className="flex items-center justify-between md:hidden">
        <button
          className="text-white p-2"
          onClick={() => setIsSidebarOpen(true)}
        >
          <FiMenu className={`w-6 h-6 hover:scale-110 ${inheritBackground && !isScrolled
            ? "text-white"
            : "text-black hover:scale-125 transition"
            }`} />
        </button>

        <Link to="/" className="flex items-center pl-8">
          <img src={logo} alt="Ambrosia" className="h-10 object-cover ml-6" />
        </Link>

        <div className="flex items-center gap-2">
          <button
            className="relative rounded-full p-2"
            onClick={() => navigate("/cart")}
          >
            <FaCartShopping className={`w-6 h-6 hover:scale-110 ${inheritBackground && !isScrolled
              ? "text-white"
              : "text-black hover:scale-125 transition"
              }`} />
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
          <div className="w-72 h-full bg-white p-6">
            <div className="flex justify-between items-center mb-6">
              <p className="font-serif font-bold text-xl" onClick={() => navigate("/")}>Ambrosia</p>
              <button
                className="text-gray-500 font-semibold"
                onClick={() => setIsSidebarOpen(false)}
              >
                ✕
              </button>
            </div>

            <form
              className="w-full flex justify-between items-center bg-white rounded-full px-3 py-1 shadow-inner mb-4"
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
                <BsSearch className="w-5 h-5 pb-[2px] mr-2" />
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
                    to="/reservation"
                    className="text-[#A2845E] text-lg font-medium"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    Reservation
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
        <div className="flex items-center gap-8 xl:gap-12">
          <Link
            to="/"
            className={`text-3xl font-bold font-serif text-black select-none ${inheritBackground && !isScrolled
              ? "text-white"
              : ""
              }`}
          >
            Ambrosia
          </Link>
          <nav>
            <ul className="flex gap-6 xl;gap-8">
              <li>
                <Link
                  to="/menu"
                  className={`text-black text-lg font-medium  ${inheritBackground && !isScrolled
                    ? "text-white hover:underline transition"
                    : "hover:opacity-60 transition"
                    }`}
                >
                  Menu
                </Link>
              </li>

              <li>
                <Link
                  to="/about"
                  className={`text-black text-lg font-medium ${inheritBackground && !isScrolled
                    ? "text-white hover:underline transition"
                    : "hover:opacity-60 transition"
                    }`}
                >
                  About Us
                </Link>
              </li>

              <li>
                <Link
                  to="/news"
                  className={`text-black text-lg font-medium ${inheritBackground && !isScrolled
                    ? "text-white hover:underline transition"
                    : "hover:opacity-60 transition"
                    }`}
                >
                  News
                </Link>
              </li>

              <li>
                <Link
                  to="/contact"
                  className={`text-black text-lg font-medium ${inheritBackground && !isScrolled
                    ? "text-white hover:underline transition"
                    : "hover:opacity-60 transition"
                    }`}
                >
                  Contact
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-3 xl:gap-6">
          <form
            className={`flex items-center rounded-full px-3 py-1 ${inheritBackground && !isScrolled
              ? "bg-transparent shadow-none border border-white"
              : "bg-[#ECE6DF] shadow-inner"
              }`}
            onSubmit={handleSearch}
          >
            <input
              type="text"
              className={`outline-none border-none bg-transparent px-2 py-1 w-32 xl:w-40 ${inheritBackground && !isScrolled
                ? "text-white placeholder:text-white"
                : "text-gray-700 placeholder:text-gray-400"
                }`}
              placeholder="Searching dish...."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className={`${inheritBackground && !isScrolled
              ? "text-white font-semibold"
              : "text-[#A2845E] hover:opacity-80 transition"
              }`}>
              <BsSearch className="w-5 h-5 pb-[2px]" />
            </button>
          </form>
          <button
            className={`relative rounded-full p-2 ${inheritBackground && !isScrolled
              ? "bg-transparent"
              : "bg-[#A2845E]"
              }`}
            onClick={onCartToggle}
          >
            <FaCartShopping className={`w-6 h-6 hover:scale-110 ${inheritBackground && !isScrolled
              ? "text-white"
              : "text-black hover:scale-125 transition"
              }`} />
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

                    <div className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-gray-700" onClick={showEditProfile} >
                      Profile
                    </div>

                    <Link
                      to="/history"
                      className="block px-4 py-3 hover:bg-gray-100 text-gray-700"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      History
                    </Link>

                    {/* {isAdmin && (
                      <Link
                        to="/manage/dashboard"
                        className="block px-4 py-3 hover:bg-gray-100 text-gray-700"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Manage System
                      </Link>
                    )} */}

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
