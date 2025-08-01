import { useState, useEffect, useCallback } from 'react';
import { FaUserEdit, FaTimes, FaUnlock, FaLock } from 'react-icons/fa';
import StatusBadge from './StatusBadge';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import Pagination from '../Pagination';
import LoadingAnimation from '../LoadingAnimation';
import Modal from '../Modal';
// Định nghĩa các interface cần thiết
interface User {
  id: string;
  fullname: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  profileImage?: string;
  rank: { rankName: string };
  status?: string;
}

interface NewUser {
  fullname: string;
  email: string;
  phoneNumber: string;
  rankName: string;
  isActive: string;
  image: string;
  file?: File;
}

function UserContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000';
  const [currentUsers, setCurrentiUsers] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 4;
  const handlePageChange = useCallback((paginatedUsers: any[], page: number) => {
    setCurrentiUsers(paginatedUsers);
    setCurrentPage(page);
  }, []);

  const [newUser, setNewUser] = useState<NewUser>({
    fullname: "",
    email: "",
    phoneNumber: "",
    rankName: "Bronze",
    isActive: "Ban",
    image: "",
    file: undefined,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalOnConfirm, setModalOnConfirm] = useState<(() => void) | null>(null);

  const hasTooManySpaces = (str: string) => /\s{2,}/.test(str);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendApiUrl}/user/all`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${Cookies.get('token')}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data.data);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle editing user
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setNewUser({
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      rankName: user.rank.rankName,
      isActive: user.isActive ? "Active" : "Ban",
      image: user.profileImage || "",
      file: undefined,
    });
    setShowForm(true);
  };

  const handleHideUser = (id: string) => {
    const currentUser = users.find((user) => user.id === id);
    const confirmMessage = currentUser && currentUser.isActive === true
      ? "Do you want to Ban this user?"
      : "Do you want to Unban this user?";

    setModalMessage(confirmMessage || '');
    setModalOnConfirm(() => async () => {
      setIsModalOpen(false);
      try {
        const response = await fetch(`${backendApiUrl}/user/ban/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${Cookies.get('token')}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        if (response.ok) {
          toast.success(data.message);
          fetchUsers();
          setUsers(users.map((user) =>
            user.id === id ? { ...user, status: user.status === "Ban" ? "UnBan" : "Ban" } : user
          ));
        } else {
          alert(data.message);
        }
      } catch (error) {
        console.error("Error toggling user status:", error);
      }
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPG, PNG, JPEG)');
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size is too large. Please upload an image smaller than 5MB.');
      return;
    }
    const imageUrl = URL.createObjectURL(file);
    setNewUser({ ...newUser, image: imageUrl, file });
  };

  const handleAddOrUpdateUser = async () => {
    if (!editingUser) return;
  
    const formData = new FormData();
    if (newUser.fullname !== editingUser.fullname) formData.append('fullname', newUser.fullname);
    if (newUser.email !== editingUser.email) formData.append('email', newUser.email);
    if (newUser.phoneNumber !== editingUser.phoneNumber) formData.append('phoneNumber', newUser.phoneNumber);
    if (newUser.file) {
      formData.append('profileImage', newUser.file);
    }
  
    if (formData.entries().next().done) {
      toast.info("No changes to update.");
      return;
    }
  
    try {
      const response = await fetch(`${backendApiUrl}/user/edit/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error(`Failed to update user: ${response.status}`);
      }
  
      const data = await response.json();
      if (data.success) {
        toast.success("User updated successfully!");
        setShowForm(false);
        fetchUsers();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error("There was an error updating the user. Please try again.");
    }
  };
  
  
  useEffect(() => {
    const totalPages = Math.ceil(users.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0) {
      setCurrentPage(1);
    }
  
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = users.slice(startIndex, startIndex + itemsPerPage);
    setCurrentiUsers(paginatedItems);
  }, [users, currentPage, itemsPerPage]);


  return (
    <div className="relative w-[1200px] h-[567px] p-[25px_40px] max-w-[1210px] bg-white rounded-[20px] shadow-[0_4px_10px_rgba(0,0,0,0.1)] transition-transform duration-300">
      <div className="w-full flex justify-between mb-5">
        <h3 className="my-auto text-2xl font-semibold text-gray-800">List of User</h3>
      </div>

      <div className="max-h-[430px] overflow-y-auto pr-2.5">
        {loading ? (
          <div className="flex justify-center items-center h-[400px]">
            <LoadingAnimation />
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="p-3.5 border-b border-gray-200 bg-gray-100 font-bold text-center text-base text-gray-800">No</th>
                <th className="p-3.5 border-b border-gray-200 bg-gray-100 font-bold text-center text-base text-gray-800">Image</th>
                <th className="p-3.5 border-b border-gray-200 bg-gray-100 font-bold text-center text-base text-gray-800">Full Name</th>
                <th className="p-3.5 border-b border-gray-200 bg-gray-100 font-bold text-center text-base text-gray-800">Email</th>
                <th className="p-3.5 border-b border-gray-200 bg-gray-100 font-bold text-center text-base text-gray-800">Phone Number</th>
                <th className="p-3.5 border-b border-gray-200 bg-gray-100 font-bold text-center text-base text-gray-800">Status</th>
                <th className="p-3.5 border-b border-gray-200 bg-gray-100 font-bold text-center text-base text-gray-800">Rank</th>
                <th className="p-3.5 border-b border-gray-200 bg-gray-100 font-bold text-center text-base text-gray-800">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user: any, index) => (
                <tr key={user.id}>
                  <td className="p-3.5 border-b border-gray-200 text-center text-base text-gray-800">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="p-3.5 border-b border-gray-200 text-center text-base text-gray-800">
                    <img src={user.profileImage || "/placeholder.svg"} alt={user.fullname} className="w-[70px] h-[70px] rounded-lg object-cover mx-auto" />
                  </td>
                  <td className="p-3.5 border-b border-gray-200 text-center text-base text-gray-800">{user.fullname}</td>
                  <td className="p-3.5 border-b border-gray-200 text-center text-base text-gray-800">{user.email}</td>
                  <td className="p-3.5 border-b border-gray-200 text-center text-base text-gray-800">{user.phoneNumber}</td>
                  <td className="p-3.5 border-b border-gray-200 text-center text-base text-gray-800">
                    <div className="w-[106px] mx-auto">
                      <StatusBadge status={user.isActive} caseTrue={"Active"} caseFalse={"Banned"} />
                    </div>
                  </td>
                  <td className="p-3.5 border-b border-gray-200 text-center text-base text-gray-800">{user.rank.rankName}</td>
                  <td className="p-3.5 border-b border-gray-200 text-center text-base text-gray-800">
                    <div className="flex justify-center">
                      <button
                        className="border-none bg-transparent text-xl cursor-pointer mx-2 transition-all duration-300 hover:scale-[1.3] hover:text-[#f0924c]"
                        style={{ marginRight: '10px' }}
                        onClick={() => handleEditUser(user)}
                      >
                        <FaUserEdit />
                      </button>
                      <button
                        className="border-none bg-transparent text-xl cursor-pointer mx-2 transition-all duration-300 hover:scale-[1.3] hover:text-[#f0924c]"
                        onClick={() => handleHideUser(user.id)}
                      >
                        {user.isActive === true ? <FaLock /> : <FaUnlock />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination items={users} itemsPerPage={itemsPerPage} onPageChange={handlePageChange} />


      {showForm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[999]"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white w-[480px] max-w-[95vw] p-8 rounded-2xl shadow-2xl border border-gray-200 transition-transform duration-300 hover:scale-[1.03]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-7">
              <h3 className="text-2xl font-bold text-gray-800">
                {editingUser ? "Edit User" : "Add New User"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="bg-transparent border-none text-2xl cursor-pointer text-gray-400 hover:text-orange-500 transition"
              >
                <FaTimes />
              </button>
            </div>
            <div className="flex flex-col md:flex-row gap-7">
              {/* Click toàn bộ khung là chọn ảnh */}
              <div className="flex items-center justify-center md:block md:w-[180px] w-full">
                <label className="w-[180px] h-[180px] flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 border-2 border-dashed border-gray-300 cursor-pointer relative transition text-center">
                  {newUser.image ? (
                    <img
                      src={newUser.image || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <span className="text-gray-400 select-none pointer-events-none">No image</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    title=""
                  />
                </label>
              </div>
              <div className="flex flex-col gap-3 flex-1">
                {/* ... các input, button giữ nguyên ... */}
                <div>
                  <input
                    type="text"
                    name="fullname"
                    placeholder="Full Name"
                    value={newUser.fullname}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg text-base bg-white focus:border-orange-500 focus:outline-none transition"
                  />
                  {newUser.fullname === "" && (
                    <span className="text-red-500 text-xs">Full Name is required</span>
                  )}
                  {newUser.fullname && newUser.fullname.length > 50 && (
                    <span className="text-red-500 text-xs">Full Name cannot exceed 50 characters</span>
                  )}
                  {newUser.fullname && hasTooManySpaces(newUser.fullname) && (
                    <span className="text-red-500 text-xs">Full Name cannot contain more than 1 consecutive space</span>
                  )}
                </div>
                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={newUser.email}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg text-base bg-white focus:border-orange-500 focus:outline-none transition"
                  />
                  {newUser.email === "" && (
                    <span className="text-red-500 text-xs">Email is required</span>
                  )}
                  {newUser.email && newUser.email.length > 50 && (
                    <span className="text-red-500 text-xs">Email cannot exceed 50 characters</span>
                  )}
                  {newUser.email && !/\S+@\S+\.\S+/.test(newUser.email) && (
                    <span className="text-red-500 text-xs">Please enter a valid email address</span>
                  )}
                  {newUser.email && hasTooManySpaces(newUser.email.trim()) && (
                    <span className="text-red-500 text-xs">Email cannot contain more than 1 consecutive space</span>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    name="phoneNumber"
                    placeholder="Phone Number"
                    value={newUser.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg text-base bg-white focus:border-orange-500 focus:outline-none transition"
                  />
                  {newUser.phoneNumber === "" && (
                    <span className="text-red-500 text-xs">Phone Number is required</span>
                  )}
                  {newUser.phoneNumber && newUser.phoneNumber.length > 50 && (
                    <span className="text-red-500 text-xs">Phone Number cannot exceed 50 characters</span>
                  )}
                  {newUser.phoneNumber && !/^\d{10}$/.test(newUser.phoneNumber) && (
                    <span className="text-red-500 text-xs">Please enter a valid 10-digit phone number</span>
                  )}
                  {newUser.phoneNumber && hasTooManySpaces(newUser.phoneNumber) && (
                    <span className="text-red-500 text-xs">Phone Number cannot contain more than 1 consecutive space</span>
                  )}
                </div>
                <input
                  type="text"
                  name="rankName"
                  value={newUser.rankName}
                  readOnly
                  placeholder="Rank (Fixed)"
                  className="w-full p-3 border border-gray-200 rounded-lg text-base bg-gray-50 text-gray-400"
                />

                <button
                  onClick={handleAddOrUpdateUser}
                  className="w-full py-3 mt-2 bg-orange-500 text-white font-semibold rounded-lg shadow hover:bg-orange-600 active:bg-orange-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                  disabled={
                    newUser.fullname === "" ||
                    newUser.email === "" ||
                    newUser.phoneNumber === "" ||
                    newUser.fullname.length > 50 ||
                    newUser.email.length > 50 ||
                    newUser.phoneNumber.length > 50 ||
                    hasTooManySpaces(newUser.fullname) ||
                    hasTooManySpaces(newUser.email.trim()) ||
                    hasTooManySpaces(newUser.phoneNumber) ||
                    !/\S+@\S+\.\S+/.test(newUser.email) ||
                    !/^\d{10}$/.test(newUser.phoneNumber)
                  }
                >
                  <FaUserEdit size={22} className="transition-transform duration-300 group-hover:rotate-180" />
                  {editingUser ? "Update  " : "Add User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && modalOnConfirm && (
        <Modal
          isOpen={isModalOpen}
          message={modalMessage}
          onConfirm={modalOnConfirm}
          onCancel={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

export default UserContent;
