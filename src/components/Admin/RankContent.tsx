import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit } from "react-icons/fa";

interface Rank {
    _id: string;
    rankName: string;
    minSpending: number;
    benefits: string;
    totalSpending: number;
}

const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:3000";

const ManageRank: React.FC = () => {
    const [ranks, setRanks] = useState<Rank[]>([]);
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [editingRank, setEditingRank] = useState<Rank | null>(null);
    const [formData, setFormData] = useState<Omit<Rank, "_id" | "totalSpending">>({
        rankName: "",
        minSpending: 0,
        benefits: ""
    });

    useEffect(() => {
        fetchRanks();
    }, []);

    const fetchRanks = async () => {
        try {
            const response = await axios.get<Rank[]>(`${backendApiUrl}/rank/all`);
            setRanks(response.data);
        } catch (error) {
            console.error("Error fetching ranks", error);
        }
    };

    const openModal = (rank: Rank | null = null) => {
        setEditingRank(rank);
        setFormData(
            rank
                ? { rankName: rank.rankName, minSpending: rank.minSpending, benefits: rank.benefits }
                : { rankName: "", minSpending: 0, benefits: "" }
        );
        setModalOpen(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        let { name, value } = e.target;
        if (name === "rankName") value = value.replace(/[^A-Za-z]/g, "");
        if (name === "benefits") value = value.replace(/\s/g, "");
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingRank) {
                await axios.put(`${backendApiUrl}/rank/${editingRank._id}`, formData);
            } else {
                await axios.post(`${backendApiUrl}/rank/add`, formData);
            }
            fetchRanks();
            setModalOpen(false);
        } catch (error) {
            console.error("Error saving rank", error);
        }
    };

    return (
        <div className="w-[1200px] h-[567px] max-w-[1210px] bg-white p-6 rounded-[15px] shadow-md flex flex-col items-center justify-start">
            <div className="w-full flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-[#2e2422]">List of Rank</h3>
                <button
                    onClick={() => openModal()}
                    className="bg-[#f0924c] text-white px-4 py-2 rounded hover:opacity-90 transition"
                >
                    Add Rank
                </button>
            </div>

            <table className="w-full border-collapse bg-white">
                <thead>
                    <tr className="bg-gray-100 text-black">
                        <th className="p-3 border-b text-center">No</th>
                        <th className="p-3 border-b text-center">Rank Name</th>
                        <th className="p-3 border-b text-center">Min Spending (VND)</th>
                        <th className="p-3 border-b text-center">Benefits</th>
                        <th className="p-3 border-b text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {ranks.map((rank, index) => (
                        <tr key={rank._id}>
                            <td className="p-3 border-b text-center">{index + 1}</td>
                            <td className="p-3 border-b text-center text-[#2e2422]">{rank.rankName}</td>
                            <td className="p-3 border-b text-center text-[#2e2422]">{rank.minSpending.toLocaleString()}</td>
                            <td className="p-3 border-b text-center text-[#2e2422]">{rank.benefits}</td>
                            <td className="p-3 border-b text-center">
                                <FaEdit
                                    className="text-[20px] cursor-pointer transition-transform hover:scale-110 hover:text-[#F0924C]"
                                    onClick={() => openModal(rank)}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {modalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white w-[400px] p-6 rounded shadow-lg text-center">
                        <h3 className="text-lg font-semibold text-[#2e2422] mb-4">
                            {editingRank ? "Edit Rank" : "Create New Rank"}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="text"
                                name="rankName"
                                placeholder="Rank Name"
                                value={formData.rankName}
                                onChange={handleChange}
                                required
                                className="w-full border border-[#baa392] rounded px-3 py-2"
                            />
                            <input
                                type="number"
                                name="minSpending"
                                placeholder="Min Spending"
                                value={formData.minSpending}
                                onChange={handleChange}
                                required
                                className="w-full border border-[#baa392] rounded px-3 py-2"
                            />
                            <textarea
                                name="benefits"
                                placeholder="Benefits"
                                value={formData.benefits}
                                onChange={handleChange}
                                required
                                className="w-full border border-[#baa392] rounded px-3 py-2"
                            ></textarea>
                            <div className="flex justify-center gap-4 pt-2">
                                <button
                                    type="submit"
                                    className="bg-[#f0924c] text-white px-4 py-2 rounded hover:opacity-90"
                                >
                                    Save
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="bg-white text-[#f0924c] border border-[#f0924c] px-4 py-2 rounded hover:bg-[#fff3e9] transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageRank;
