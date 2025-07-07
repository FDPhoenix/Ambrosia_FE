import { useState, useEffect } from "react";
import axios from "axios";
import Modal from "react-modal";
import { FaUserEdit, FaLock, FaUnlock, FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import StatusBadge from "./StatusBadge";
import { AxiosError } from 'axios';

interface Employee {
  _id: string;
  fullname: string;
  email: string;
  phoneNumber: string;
  profileImage: string;
  isActive: boolean;
}

export default function EmployeeContext() {
  const [activeTab, setActiveTab] = useState<"staff" | "chef">("staff");
  const [staffs, setStaffs] = useState<Employee[]>([]);
  const [chefs, setChefs] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ id: string; isActive: boolean } | null>(null);

  const [newEmployee, setNewEmployee] = useState({
    fullname: "",
    email: "",
    phoneNumber: "",
    // profileImage: "",
    password: "",
    confirmPassword: "",
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    fetchEmployees("staff");
    fetchEmployees("chef");
  }, [activeTab]);

  const fetchEmployees = async (role: "staff" | "chef") => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3000/api/employees/get${role === "staff" ? "Staff" : "Chef"}`);
      if (role === "staff") setStaffs(response.data.employees);
      else setChefs(response.data.employees);
    } catch (error) {
      console.error(`Error fetching ${role} employees:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEmployee = async (id: string) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/employees/getEmployee/${id}`);
      if (!response.data.user) {
        console.error("No employee data found");
        return;
      }
      setEditingEmployee(response.data.user);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error("Error fetching employee details:", error);
    }
  };

  const handleSaveChanges = async () => {
    if (!editingEmployee) return;
    const error = validateEmployeeInput(editingEmployee);
    if (error) {
      toast.warn(error);
      return;
    }

    try {
      await axios.put(`http://localhost:3000/api/employees/update/${editingEmployee._id}`, editingEmployee);
      setIsEditModalOpen(false);
      fetchEmployees(activeTab);
      toast.success("Employee updated successfully!");
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error("Failed to update employee!");
    }
  };

  const toggleBanUnban = async (id: string, currentStatus: boolean) => {
    try {
      await axios.put(`http://localhost:3000/api/employees/update/${id}`, { isActive: !currentStatus });
      fetchEmployees(activeTab);
      toast.success(`Account has been ${currentStatus ? "banned" : "unbanned"}!`);
    } catch (error) {
      console.error("Error updating employee status:", error);
      toast.error("Failed to update employee status!");
    }
  };

  const handleAddEmployee = async () => {
    const error = validateEmployeeInput(newEmployee);
    if (error) {
      toast.warn(error);
      return;
    }

    if (newEmployee.password !== newEmployee.confirmPassword) {
      toast.warn("Passwords do not match!");
      return;
    }

    try {
      await axios.post(`http://localhost:3000/api/employees/add${activeTab === "staff" ? "Staff" : "Chef"}`, newEmployee);
      setNewEmployee({ fullname: "", email: "", phoneNumber: "", password: "", confirmPassword: "" });
      fetchEmployees(activeTab);
      setModalIsOpen(false);
      toast.success("Employee added successfully!");
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error("Error adding employee:", error.response);

        if (error.response && error.response.data) {
          if (error.response.data.message === "Email is already registered.") {
            toast.warn("This email is already registered.");
          } else {
            toast.error(`Error: ${error.response.data.message || "Failed to add employee!"}`);
          }
        } else {
          toast.error("An unexpected error occurred!");
        }
      } else {
        toast.error("An unexpected error occurred!");
      }
    }
  };

  const validateEmployeeInput = (emp: { fullname: string; email: string; phoneNumber: string }) => {
    if (!emp.fullname.trim()) return "Full Name is required";
    if (!emp.email.trim()) return "Email is required";
    if (emp.fullname.length > 50) return "Full Name must not exceed 50 characters";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emp.email)) return "Invalid email format";
    if (!emp.phoneNumber.trim()) return "Phone Number is required";
    if (!/^[0-9]{9,11}$/.test(emp.phoneNumber)) return "Phone number must be 9-11 digits";
    if (!/^0[3|5|7|8|9][0-9]{8}$/.test(emp.phoneNumber)) {
      return "Invalid Vietnamese phone number";
    }
    return null;
  };

  const employees = activeTab === "staff" ? staffs : chefs;

  return (
    // <div className="w-[1200px] max-h-[567px] mx-auto overflow-y-auto overflow-x-hidden bg-white px-8 rounded-lg shadow-lg scrollbar-hide" >
    <div className="max-w-[1320px] pt-4 pb-5 pl-8 pr-8 bg-white rounded-xl shadow-md">
      <div className="bg-white z-20">
        <ul className="flex border-b pt-1 pl-5 mb-2 mt-2">
          <li>
            <button
              className={`px-4 py-2 font-medium ${activeTab === "staff"
                ? "border-b-2 border-orange-500 text-black"
                : "text-gray-500"
                }`}
              onClick={() => setActiveTab("staff")}
            >
              Staff
            </button>
          </li>
          <li>
            <button
              className={`ml-4 px-4 py-2 font-medium ${activeTab === "chef"
                ? "border-b-2 border-orange-500 text-black"
                : "text-gray-500"
                }`}
              onClick={() => setActiveTab("chef")}
            >
              Chef
            </button>
          </li>
        </ul>

        <div className="flex justify-between items-center mb-2 mt-4 ml-5 pr-4">
          <h3 className="text-2xl font-bold">
            {activeTab === "staff" ? "Staff List" : "Chef List"}
          </h3>
          <button
            className="px-4 py-[7px] text-sm rounded border border-gray-300 bg-[#f0f0f0] hover:bg-[#F0924C] hover:text-white transition duration-200 shadow-sm"
            onClick={() => setModalIsOpen(true)}
          >
            {activeTab === "staff" ? "Add Staff" : "Add Chef"}
          </button>
        </div>
      </div>

      {/* List of employees */}
      <div className="max-h-[424px] overflow-y-auto scrollbar-hide px-4">
        {loading ? (
          <div className="flex items-center justify-center h-[457px] text-gray-500 text-lg">Loading...</div>
        ) : employees.length > 0 ? (
          <table className="table-auto w-full text-center border-collapse">
            <thead className="bg-gray-100 text-base">
              <tr>
                <th className="py-6 px-5">No</th>
                <th className="py-6 px-5">Full Name</th>
                <th className="py-6 px-5">Email</th>
                <th className="py-6 px-5">Phone</th>
                <th className="py-6 px-5">Status</th>
                <th className="py-6 px-5">Action</th>
              </tr>
            </thead>
            <tbody className="text-base">
              {employees.map((emp, idx) => (
                <tr key={emp._id} className="hover:bg-[rgba(186,163,146,0.205)] border-b">

                  <td className="py-7 px-5">{idx + 1}</td>
                  <td className="py-7 px-5">{emp.fullname}</td>
                  <td className="py-7 px-5">{emp.email}</td>
                  <td className="py-7 px-5">{emp.phoneNumber}</td>
                  <td className="py-7 px-5">
                    <StatusBadge
                      status={emp.isActive}
                      caseTrue="Active"
                      caseFalse="Banned"
                    />
                  </td>
                  <td className="py-6 px-5">
                    <div className="flex justify-center items-center gap-5 text-xl text-gray-700">
                      <button onClick={() => handleEditEmployee(emp._id)} title="Edit">
                        <FaUserEdit className="transition-transform duration-200 hover:scale-125 hover:text-[#f0924c]" />
                      </button>
                      <button
                        onClick={() =>
                          setConfirmModal({ id: emp._id, isActive: emp.isActive })
                        }
                        title={emp.isActive ? "Ban" : "Unban"}
                      >
                        {emp.isActive ? (
                          <FaLock className="transition-transform duration-200 hover:scale-125 hover:text-[#f0924c]" />
                        ) : (
                          <FaUnlock className="transition-transform duration-200 hover:scale-125 hover:text-[#f0924c]" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center text-red-500 flex items-center justify-center h-[457px] ">No employees available.</div>
        )}
      </div>

      {/* Ban/Unban confirmation modal */}
      {confirmModal && (
        <Modal
          isOpen={true}
          onRequestClose={() => setConfirmModal(null)}
          shouldCloseOnOverlayClick={false}
          className="bg-white p-6 rounded-lg w-full max-w-sm mx-auto outline-none animate-fadeInModal"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fadeInOverlay"
        >
          <h3 className="text-lg font-semibold mb-4 text-center">
            {confirmModal.isActive
              ? "Do you want to Ban this employee?"
              : "Do you want to Unban this employee?"}
          </h3>
          <div className="flex justify-center gap-4 mt-6">
            <button
              className="px-4 py-2 rounded bg-[#f0924c] hover:bg-[#d87c3b] text-white"
              onClick={() => {
                toggleBanUnban(confirmModal.id, confirmModal.isActive);
                setConfirmModal(null);
              }}
            >
              Confirm
            </button>
            <button
              className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-black"
              onClick={() => setConfirmModal(null)}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Add Employee */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        shouldCloseOnOverlayClick={false}
        className="bg-white p-6 rounded-lg w-full max-w-md mx-auto mt-20 outline-none animate-fadeInModal"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fadeInOverlay"
      >
        <h3 className="text-lg font-bold mb-4 text-center text-[23px] ">
          Add {activeTab === "staff" ? "Staff" : "Chef"}
        </h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full border p-2 rounded"
            value={newEmployee.fullname}
            onChange={(e) =>
              setNewEmployee({ ...newEmployee, fullname: e.target.value })
            }
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full border p-2 rounded"
            value={newEmployee.email}
            onChange={(e) =>
              setNewEmployee({ ...newEmployee, email: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Phone Number"
            className="w-full border p-2 rounded"
            value={newEmployee.phoneNumber}
            onChange={(e) =>
              setNewEmployee({ ...newEmployee, phoneNumber: e.target.value })
            }
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full border p-2 rounded pr-10"
              value={newEmployee.password}
              onChange={(e) =>
                setNewEmployee({ ...newEmployee, password: e.target.value })
              }
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              className="w-full border p-2 rounded pr-10"
              value={newEmployee.confirmPassword}
              onChange={(e) =>
                setNewEmployee({
                  ...newEmployee,
                  confirmPassword: e.target.value,
                })
              }
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className="flex gap-4 mt-4">
            <button
              className="bg-[#f0924c] hover:bg-[#d87c3b] text-white px-4 py-2 rounded w-full transition duration-200"
              onClick={handleAddEmployee}
            >
              Create
            </button>
            <button
              className="bg-[#f0924c] hover:bg-[#d87c3b] text-white px-4 py-2 rounded w-full transition duration-200"
              onClick={() => setModalIsOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Edit Employee */}
      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={() => setIsEditModalOpen(false)}
        shouldCloseOnOverlayClick={false}
        className="bg-white p-6 rounded-lg w-full max-w-md mx-auto mt-20 outline-none animate-fadeInModal"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fadeInOverlay"
      >
        <h3 className="text-lg font-bold mb-4 text-center text-[23px] ">
          Edit {activeTab === "staff" ? "Staff" : "Chef"}
        </h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full border p-2 rounded"
            value={editingEmployee?.fullname || ""}
            onChange={(e) =>
              setEditingEmployee({
                ...editingEmployee!,
                fullname: e.target.value,
              })
            }
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full border p-2 rounded"
            value={editingEmployee?.email || ""}
            onChange={(e) =>
              setEditingEmployee({
                ...editingEmployee!,
                email: e.target.value,
              })
            }
          />
          <input
            type="text"
            placeholder="Phone Number"
            className="w-full border p-2 rounded"
            value={editingEmployee?.phoneNumber || ""}
            onChange={(e) =>
              setEditingEmployee({
                ...editingEmployee!,
                phoneNumber: e.target.value,
              })
            }
          />
          <div className="flex gap-4 mt-8">
            <button
              className="bg-[#f0924c] hover:bg-[#d87c3b] text-white px-4 py-2 rounded w-full"
              onClick={handleSaveChanges}
            >
              Save Changes
            </button>
            <button
              className="bg-[#f0924c] hover:bg-[#d87c3b] text-white px-4 py-2 rounded w-full"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div >
  );
}
