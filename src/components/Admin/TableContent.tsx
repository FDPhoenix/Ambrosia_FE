import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEdit, FaTrash } from "react-icons/fa";
import Pagination from "../Pagination";
import LoadingAnimation from "../LoadingAnimation";
import Modal from "../Modal";

interface Table {
  tableNumber: string;
  capacity: number | "";
}

const TableContent: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [customTable, setCustomTable] = useState("");
  const [capacity, setCapacity] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<"tableNumber" | "capacity" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [confirmDelete, setConfirmDelete] = useState<{ tableNumber: string | null }>({ tableNumber: null });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentTables, setCurrentTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const itemsPerPage = 5;
  useEffect(() => {
    const sorted = [...tables].sort((a, b) => {
      const extract = (s: string) => {
        const prefix = s.replace(/\d+$/, "");       // phần chữ
        const number = parseInt(s.replace(/^\D+/, ""), 10); // phần số
        return { prefix, number: isNaN(number) ? 0 : number };
      };

      const aPart = extract(a.tableNumber);
      const bPart = extract(b.tableNumber);

      if (aPart.prefix !== bPart.prefix) {
        return sortOrder === "asc"
          ? aPart.prefix.localeCompare(bPart.prefix)
          : bPart.prefix.localeCompare(aPart.prefix);
      }

      return sortOrder === "asc"
        ? aPart.number - bPart.number
        : bPart.number - aPart.number;
    });

    const start = (currentPage - 1) * itemsPerPage;
    setCurrentTables(sorted.slice(start, start + itemsPerPage));
  }, [tables, currentPage, sortBy, sortOrder]);


  const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchTables();
    fetchAvailableTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendApiUrl}/api/tables`);
      if (response.data.success) {
        setTables(response.data.tables);
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTables = async () => {
    try {
      const response = await axios.get(`${backendApiUrl}/api/tables/available-numbers`);
      if (response.data.success) {
        setAvailableTables(response.data.availableTables);
      }
    } catch (error) {
      console.error("Error fetching available tables:", error);
    }
  };

  const handlePageChange = useCallback((paginatedData: Table[], page: number) => {
    setCurrentTables(paginatedData);
    setCurrentPage(page);
  }, []);


  const handleSort = (column: "tableNumber" | "capacity") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleAddTable = async () => {
    const finalTableNumber = customTable || tableNumber;

    if (!finalTableNumber || capacity === "") {
      return toast.warn("Please fill in all required fields!");
    }

    const isValidFormat = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/.test(finalTableNumber);
    if (!isValidFormat) {
      return toast.error("Table name must contain at least one letter and one number, with no special characters.");
    }

    if (finalTableNumber.length > 10) {
      return toast.error("Table name must not exceed 10 characters!");
    }

    const isDuplicate = tables.some(
      (t) => t.tableNumber.trim().toLowerCase() === finalTableNumber.toLowerCase()
    );
    if (isDuplicate) {
      toast.error("Table name already exists!");
      return;
    }

    try {
      const response = await axios.post(`${backendApiUrl}/api/tables`, {
        tableNumber: finalTableNumber,
        capacity,
      });

      if (response.data.success) {
        toast.success("Table added successfully!");
        fetchTables();
        fetchAvailableTables();
        setIsAddModalOpen(false);
        setTableNumber("");
        setCustomTable("");
        setCapacity("");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error adding table:", error);
      toast.error("Table name already exists!");
    }
  };

  const handleUpdateTable = async () => {
    if (!selectedTable) return;
    try {
      const response = await axios.put(`${backendApiUrl}/api/tables/${selectedTable.tableNumber}`, {
        capacity: selectedTable.capacity,
      });

      if (response.data.success) {
        toast.success("Table updated successfully!");
        fetchTables();
        setIsUpdateModalOpen(false);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error updating table:", error);
      toast.error("Error updating table!");
    }
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setTableNumber("");
    setCustomTable("");
    setCapacity("");
  };

  const handleCloseUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setSelectedTable(null);
  };

  const handleDeleteTable = async (tableNumber: string) => {
    try {
      const response = await axios.delete(`${backendApiUrl}/api/tables/${tableNumber}`);
      if (response.data.success) {
        toast.success("Table deleted successfully!");
        fetchTables();
        fetchAvailableTables();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error deleting table:", error);
      toast.error("Error deleting table!");
    }
  };

  return (
    <div className="relative w-[1200px] h-[567px] p-5 max-w-[1210px] bg-white rounded-2xl shadow-md">
      <div className="flex justify-between items-center mb-6 text-[#3f2b22]">
        <h2 className="text-2xl font-bold">Table List</h2>
        <button className="px-4 py-[8px] text-sm rounded border border-gray-300 bg-[#f0f0f0] hover:bg-[#F0924C] hover:text-white transition duration-200 shadow-sm" onClick={() => setIsAddModalOpen(true)}>
          Add table
        </button>
      </div>

      <div className="max-h-[425px] overflow-y-auto scrollbar-hide">
        {loading ? (
          <div className="absolute inset-0 bg-white bg-opacity-60 z-50 flex items-center justify-center">
            <LoadingAnimation />
          </div>
        ) : (
          <table className="w-full border-collapse text-center">
            <thead className="bg-gray-100 font-bold">
              <tr>
                <th className="p-5">No</th>
                <th className="p-5 cursor-pointer" onClick={() => handleSort("tableNumber")}>Table Name </th>
                <th className="p-5 cursor-pointer" onClick={() => handleSort("capacity")}>Number of seats </th>
                <th className="p-5">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentTables.map((table, index) => (
                <tr key={table.tableNumber} className="hover:bg-[rgba(186,163,146,0.205)] border-b">
                  <td className="p-5">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="p-5">{table.tableNumber}</td>
                  <td className="p-5">{table.capacity}</td>
                  <td className="py-6 px-5">
                    <div className="flex justify-center items-center gap-5 text-xl text-gray-700">
                      <button onClick={() => { setSelectedTable(table); setIsUpdateModalOpen(true); }} title="Edit">
                        <FaEdit className="transition-transform duration-200 hover:scale-125 hover:text-[#f0924c]" />
                      </button>

                      <button
                        onClick={() => setConfirmDelete({ tableNumber: table.tableNumber })}
                        title="Delete"
                      >
                        <FaTrash className="transition-transform duration-200 hover:scale-125 hover:text-[#f0924c]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Add Table */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md mx-auto mt-20 outline-none animate-fadeInModal">
            <h3 className="text-lg font-bold mb-4 text-center text-[24px]">Add Table</h3>
            <div className="space-y-3">
              {/* Dropdown select */}
              <select
                className={`w-full border p-2 rounded transition ${customTable !== "" ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                disabled={customTable !== ""}
              >
                <option value="">-- Select a table --</option>
                {availableTables.map((num) => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>

              {/* Custom table input */}
              <input
                className={`w-full border p-2 rounded transition ${tableNumber !== "" ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                type="text"
                placeholder="Or enter table number"
                value={customTable}
                onChange={(e) => {
                  const raw = e.target.value;

                  const trimmed = raw.trim();

                  if (raw.length > 0 && trimmed === "") {
                    toast.error("Table name cannot be just spaces!");
                    return;
                  }

                  if (/\s/.test(raw)) {
                    toast.error("Table name cannot contain spaces!");
                    return;
                  }

                  if (raw.length > 10) {
                    toast.error("Table name cannot exceed 10 characters!");
                    return;
                  }

                  setCustomTable(raw);
                }}
                disabled={tableNumber !== ""}
              />

              {/* Number of seats with increment/decrement buttons */}
              <div className="relative flex items-center">
                <button
                  type="button"
                  className="absolute left-2 text-xl font-bold text-gray-600 hover:text-[#f0924c]"
                  onClick={() => {
                    const newValue = Number(capacity) - 1;
                    if (newValue < 1) {
                      toast.warn("Minimum number of seats is 1!");
                      return;
                    }
                    setCapacity(newValue);
                  }}
                >
                  –
                </button>

                <input
                  className="w-full border p-2 rounded text-center px-10"
                  type="text"
                  placeholder="Number of seats"
                  value={capacity === "" ? "" : capacity}
                  onChange={(e) => {
                    const value = e.target.value.trim();

                    if (value === "") {
                      setCapacity("");
                      return;
                    }

                    if (!/^\d+$/.test(value)) {
                      toast.error("Only numbers are allowed!");
                      return;
                    }

                    if (/^0\d+/.test(value)) {
                      toast.error("Number of seats cannot start with 0!");
                      return;
                    }

                    const num = Number(value);
                    if (num < 1) {
                      toast.warn("Minimum number of seats is 1!");
                      setCapacity(1);
                    } else if (num > 20) {
                      toast.warn("Maximum number of seats is 20!");
                      setCapacity(20);
                    } else {
                      setCapacity(num);
                    }
                  }}
                />

                <button
                  type="button"
                  className="absolute right-2 text-xl font-bold text-gray-600 hover:text-[#f0924c]"
                  onClick={() => {
                    const newValue = Number(capacity) + 1;
                    if (newValue > 20) {
                      toast.warn("Maximum number of seats is 20!");
                      return;
                    }
                    setCapacity(newValue);
                  }}
                >
                  +
                </button>
              </div>

              <div className="flex gap-4">
                <button
                  className="bg-[#f0924c] hover:bg-[#d87c3b] text-white px-4 py-2 rounded w-full transition duration-200"
                  onClick={handleAddTable}
                >
                  Create
                </button>
                <button
                  className="bg-[#f0924c] hover:bg-[#d87c3b] text-white px-4 py-2 rounded w-full transition duration-200"
                  onClick={handleCloseAddModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Update Table */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md mx-auto mt-20 outline-none animate-fadeInModal">
            <h3 className="text-lg font-bold mb-4 text-center text-[23px]">
              Update Table {selectedTable?.tableNumber}
            </h3>

            <div className="space-y-4">
              <div className="relative flex items-center">
                {/* Decrease button */}
                <button
                  type="button"
                  className="absolute left-2 text-xl font-bold text-gray-600 hover:text-[#f0924c]"
                  onClick={() => {
                    if (!selectedTable) return;
                    const newCapacity = Number(selectedTable.capacity) - 1;
                    if (newCapacity < 1) {
                      toast.warn("Minimum number of seats is 1!");
                      return;
                    }
                    setSelectedTable({ ...selectedTable, capacity: newCapacity });
                  }}
                >
                  –
                </button>

                {/* Center input */}
                <input
                  className="w-full border p-2 rounded text-center px-10 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  type="text"
                  placeholder="Number of seats"
                  value={selectedTable?.capacity !== undefined ? selectedTable.capacity : ""}
                  onChange={(e) => {
                    if (!selectedTable) return;
                    const value = e.target.value.trim();

                    if (value.length > 10) {
                      toast.error("Maximum 10 digits allowed!");
                      return;
                    }

                    if (!/^\d*$/.test(value)) {
                      toast.error("Only numbers are allowed!");
                      return;
                    }

                    if (value === "") {
                      setSelectedTable({ ...selectedTable, capacity: "" });
                      return;
                    }

                    const num = Number(value);
                    if (num < 1) {
                      toast.warn("Minimum number of seats is 1!");
                      setSelectedTable({ ...selectedTable, capacity: 1 });
                    } else if (num > 20) {
                      toast.warn("Maximum number of seats is 20!");
                      setSelectedTable({ ...selectedTable, capacity: 20 });
                    } else {
                      setSelectedTable({ ...selectedTable, capacity: num });
                    }
                  }}
                />


                {/* Increase button */}
                <button
                  type="button"
                  className="absolute right-2 text-xl font-bold text-gray-600 hover:text-[#f0924c]"
                  onClick={() => {
                    if (!selectedTable) return;
                    const newCapacity = Number(selectedTable.capacity) + 1;
                    if (newCapacity > 20) {
                      toast.warn("Maximum number of seats is 20!");
                      return;
                    }
                    setSelectedTable({ ...selectedTable, capacity: newCapacity });
                  }}
                >
                  +
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex gap-4 mt-4">
                <button
                  className="bg-[#f0924c] hover:bg-[#d87c3b] text-white px-4 py-2 rounded w-full transition duration-200"
                  onClick={handleUpdateTable}
                >
                  Update
                </button>
                <button
                  className="bg-[#f0924c] hover:bg-[#d87c3b] text-white px-4 py-2 rounded w-full transition duration-200"
                  onClick={handleCloseUpdateModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete Table */}
      {confirmDelete.tableNumber && (
        <Modal
          isOpen={true}
          message={`Are you sure you want to delete table ${confirmDelete.tableNumber}?`}
          onConfirm={() => {
            handleDeleteTable(confirmDelete.tableNumber!);
            setConfirmDelete({ tableNumber: null });
          }}
          onCancel={() => setConfirmDelete({ tableNumber: null })}
        />
      )}

      <Pagination
        items={tables}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
      />

    </div>
  );
};

export default TableContent;
