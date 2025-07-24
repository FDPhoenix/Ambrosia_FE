import { useState, useEffect } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import StatusBadge from "./StatusBadge";

interface NewsItem {
    _id: string;
    title: string;
    content: string;
    category: string;
    author: string;
    imageUrl: string;
    isPublished: boolean;
}

const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:3000";

function NewsContent() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("Promotion");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isPublished, setIsPublished] = useState(false);
    const [filterCategory, setFilterCategory] = useState("");
    const [newsToDelete, setNewsToDelete] = useState<NewsItem | null>(null);

    useEffect(() => {
        fetchNews();
    }, [filterCategory]);

    const fetchNews = async () => {
        try {
            let url = `${backendApiUrl}/news/all`;
            if (filterCategory) url += `?category=${filterCategory}`;
            const response = await fetch(url);
            const data = await response.json();
            setNews(data.news);
        } catch (error) {
            console.error("Error fetching news:", error);
        }
    };

    const openAddModal = () => {
        setEditingNews(null);
        setTitle("");
        setContent("");
        setCategory("Promotion");
        setImageFile(null);
        setIsPublished(false);
        setModalOpen(true);
    };

    const openEditModal = (item: NewsItem) => {
        setEditingNews(item);
        setTitle(item.title);
        setContent(item.content);
        setCategory(item.category);
        setImageFile(null);
        setIsPublished(item.isPublished);
        setModalOpen(true);
    };

    const confirmDeleteNews = (item: NewsItem) => {
        setNewsToDelete(item);
    };

    const handleConfirmDelete = async () => {
        if (!newsToDelete) return;
        try {
            await fetch(`${backendApiUrl}/news/${newsToDelete._id}`, {
                method: "DELETE",
            });
            fetchNews();
        } catch (error) {
            console.error("Error deleting news:", error);
        } finally {
            setNewsToDelete(null);
        }
    };

    const handleSubmit = async () => {
        const method = editingNews ? "PUT" : "POST";
        const url = editingNews
            ? `${backendApiUrl}/news/${editingNews._id}`
            : `${backendApiUrl}/news`;

        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("content", content);
            formData.append("category", category);
            formData.append("isPublished", String(isPublished));
            if (imageFile) formData.append("image", imageFile);

            const response = await fetch(url, {
                method,
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Failed to ${editingNews ? "update" : "add"} news`);
            }

            fetchNews();
            setModalOpen(false);
        } catch (error) {
            console.error("Error saving news:", error);
        }
    };

    return (
        <div className="w-[1200px] h-[567px] bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-semibold text-gray-800">List of News</h3>
                <div className="flex items-center gap-3">
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 text-sm"
                    >
                        <option value="">All Categories</option>
                        <option value="Promotion">Promotion</option>
                        <option value="New Dish">New Dish</option>
                        <option value="Event">Event</option>
                        <option value="Restaurant News">Restaurant News</option>
                    </select>
                    <button
                        onClick={openAddModal}
                        className="px-4 py-[7px] text-sm rounded border border-gray-300 bg-[#f0f0f0] hover:bg-[#F0924C] hover:text-white transition duration-200 shadow-sm"
                    >
                        Add new
                    </button>
                </div>
            </div>

            <table className="w-full table-auto border-collapse text-sm text-gray-700">
                <thead className="bg-gray-100 uppercase text-xs text-gray-500 border-b">
                    <tr>
                        <th className="p-3 text-center w-[10%]">Image</th>
                        <th className="p-3 text-center w-[30%]">Title</th>
                        <th className="p-3 text-center w-[20%]">Category</th>
                        <th className="p-3 text-center w-[15%]">Author</th>
                        <th className="p-3 text-center w-[15%]">Status</th>
                        <th className="p-3 text-center">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {news.map((item) => (
                        <tr key={item._id} className="border-b last:border-b-0">
                            <td className="text-center p-2">
                                {item.imageUrl ? (
                                    <img
                                        src={item.imageUrl}
                                        alt={item.title}
                                        className="w-12 h-12 object-cover rounded"
                                    />
                                ) : (
                                    "No Image"
                                )}
                            </td>
                            <td className="text-center p-2">{item.title}</td>
                            <td className="text-center p-2">{item.category}</td>
                            <td className="text-center p-2">{item.author || "Admin"}</td>
                            <td className="text-center p-2">
                                <StatusBadge
                                    status={item.isPublished}
                                    caseTrue="Available"
                                    caseFalse="Unavailable"
                                />
                            </td>
                            <td className="text-center p-2">
                                <button
                                    onClick={() => openEditModal(item)}
                                    className="mr-2 text-gray-700 hover:text-[#f0924c] hover:scale-110 transition-transform"
                                    title="Edit"
                                >
                                    <FaEdit className="text-lg" />
                                </button>
                                <button
                                    onClick={() => confirmDeleteNews(item)}
                                    className="text-gray-700 hover:text-[#f0924c] hover:scale-110 transition-transform"
                                    title="Delete"
                                >
                                    <FaTrash className="text-lg" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Modal Add/Edit */}
            {modalOpen && (
                <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white w-[400px] rounded-lg shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-center mb-4">
                            {editingNews ? "Edit News" : "Add News"}
                        </h3>
                        <input
                            type="text"
                            placeholder="Updated News Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full mb-3 px-3 py-2 border rounded text-sm"
                        />
                        <textarea
                            placeholder="Updated Content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full mb-3 px-3 py-2 border rounded text-sm min-h-[100px]"
                        />
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full mb-3 px-3 py-2 border rounded text-sm"
                        >
                            <option value="Promotion">Promotion</option>
                            <option value="New Dish">New Dish</option>
                            <option value="Event">Event</option>
                            <option value="Restaurant News">Restaurant News</option>
                        </select>
                        <div className="mb-3 flex items-center gap-3">
                            <label className="cursor-pointer bg-white border border-gray-300 px-3 py-1 rounded text-sm">
                                Choose Image
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        setImageFile(e.target.files ? e.target.files[0] : null)
                                    }
                                    className="hidden"
                                />
                            </label>
                            <span className="text-sm text-gray-500 truncate max-w-[200px]">
                                {imageFile ? imageFile.name : "No file chosen"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="checkbox"
                                id="isPublished"
                                checked={isPublished}
                                onChange={(e) => setIsPublished(e.target.checked)}
                            />
                            <label htmlFor="isPublished" className="text-sm text-gray-700">
                                Published
                            </label>
                        </div>
                        <div className="flex justify-center gap-3 mt-4">
                            <button
                                onClick={handleSubmit}
                                className="bg-[#f0924c] text-white px-4 py-2 rounded hover:opacity-90 transition"
                            >
                                {editingNews ? "Update" : "Add"}
                            </button>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Confirm Delete */}
            {newsToDelete && (
                <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-[400px] text-center">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">Confirm Delete</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete{" "}
                            <span className="font-semibold">{newsToDelete.title}</span>?
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={handleConfirmDelete}
                                className="bg-[#f0924c] text-white px-4 py-2 rounded hover:opacity-90 transition"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => setNewsToDelete(null)}
                                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default NewsContent;
