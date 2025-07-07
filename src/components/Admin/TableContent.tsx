import { useState, useEffect } from "react";
import Modal from "react-modal";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEdit, FaTrash } from "react-icons/fa";

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

  useEffect(() => {
    fetchTables();
    fetchAvailableTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/tables");
      if (response.data.success) {
        setTables(response.data.tables);
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
    }
  };

  const fetchAvailableTables = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/tables/available-numbers");
      if (response.data.success) {
        setAvailableTables(response.data.availableTables);
      }
    } catch (error) {
      console.error("Error fetching available tables:", error);
    }
  };

  const handleSort = (column: "tableNumber" | "capacity") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const sortedTables = [...tables].sort((a, b) => {
    if (!sortBy) return 0;
    if (sortBy === "tableNumber") return sortOrder === "asc" ? a.tableNumber.localeCompare(b.tableNumber) : b.tableNumber.localeCompare(a.tableNumber);
    if (sortBy === "capacity") return sortOrder === "asc" ? Number(a.capacity) - Number(b.capacity) : Number(b.capacity) - Number(a.capacity);
    return 0;
  });

  const handleAddTable = async () => {
    const finalTableNumber = customTable || tableNumber;

    if (!finalTableNumber || capacity === "") {
      return toast.warn("Please fill in all required fields!");
    }

    if (customTable && (customTable.length < 1 || customTable.length > 10)) {
      return toast.error("Table name must be between 1 and 10 characters!");
    }

    try {
      const response = await axios.post("http://localhost:3000/api/tables", {
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
      const response = await axios.put(`http://localhost:3000/api/tables/${selectedTable.tableNumber}`, {
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
      const response = await axios.delete(`http://localhost:3000/api/tables/${tableNumber}`);

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
    <div className="max-w-[1210px] p-10 bg-white rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-6 text-[#3f2b22]">
        <h2 className="text-2xl font-bold">Table List</h2>
        <button className="px-4 py-[8px] text-sm rounded border border-gray-300 bg-[#f0f0f0] hover:bg-[#F0924C] hover:text-white transition duration-200 shadow-sm" onClick={() => setIsAddModalOpen(true)}>
          Add table
        </button>
      </div>

      <div className="max-h-[425px] overflow-y-auto scrollbar-hide">
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
            {sortedTables.map((table, index) => (
              <tr key={table.tableNumber} className="hover:bg-[rgba(186,163,146,0.205)] border-b">
                <td className="p-5">{index + 1}</td>
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
      </div>

      {/* Modal Add Table */}
      <Modal
        isOpen={isAddModalOpen}
        onRequestClose={handleCloseAddModal}
        shouldCloseOnOverlayClick={false}
        className="bg-white p-6 rounded-lg w-full max-w-md mx-auto mt-20 outline-none animate-fadeInModal"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fadeInOverlay"
      >
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
              const value = e.target.value;
              if (value.length > 10) {
                toast.error("Table name cannot exceed 10 characters!");
                return;
              }
              setCustomTable(value);
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
      </Modal>

      {/* Modal Update Table */}
      <Modal
        isOpen={isUpdateModalOpen}
        onRequestClose={handleCloseUpdateModal}
        shouldCloseOnOverlayClick={false}
        className="bg-white p-6 rounded-lg w-full max-w-md mx-auto mt-20 outline-none animate-fadeInModal"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fadeInOverlay"
      >
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
      </Modal>

      {/* Modal Confirm Delete Table */}
      {confirmDelete.tableNumber && (
        <Modal
          isOpen={true}
          onRequestClose={() => setConfirmDelete({ tableNumber: null })}
          shouldCloseOnOverlayClick={false}
          className="bg-white p-6 rounded-lg w-full max-w-sm mx-auto outline-none animate-fadeInModal"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fadeInOverlay"
        >
          <h3 className="text-lg font-semibold mb-4 text-center">
            Are you sure you want to delete table <span className="font-bold">{confirmDelete.tableNumber}</span>?
          </h3>
          <div className="flex justify-center gap-4 mt-6">
            <button
              className="px-4 py-2 rounded bg-[#f0924c] hover:bg-[#d87c3b] text-white"
              onClick={() => {
                handleDeleteTable(confirmDelete.tableNumber!);
                setConfirmDelete({ tableNumber: null });
              }}
            >
              Confirm
            </button>
            <button
              className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-black"
              onClick={() => setConfirmDelete({ tableNumber: null })}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TableContent;
