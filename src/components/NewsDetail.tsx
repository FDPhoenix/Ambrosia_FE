import type React from "react";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";

const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:3000";

function NewsDetail() {
    const [news, setNews] = useState<any[]>([]);
    const [category, setCategory] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    const fetchNews = useCallback(async () => {
        setIsLoading(true);
        try {
            const url = category
                ? `${backendApiUrl}/news?category=${category}`
                : `${backendApiUrl}/news`;
            const response = await axios.get(url);
            setNews(response.data.news);
        } catch (error) {
            console.error("Error fetching news:", error);
        } finally {
            setIsLoading(false);
        }
    }, [category]);

    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCategory(e.target.value);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const getCategoryClass = (category: string) => {
        switch (category) {
            case "Promotion":
                return "bg-green-600";
            case "New Dish":
                return "bg-blue-600";
            case "Event":
                return "bg-red-600";
            case "Restaurant News":
                return "bg-purple-700";
            default:
                return "bg-gray-600";
        }
    };

    return (
        <div className="w-full bg-[#EFF4F8]">
            <div className="max-w-[1350px] mx-auto px-4 pt-24 sm:pt-28 pb-12">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-semibold text-gray-800">Ambrosia News</h2>
                    <p className="text-gray-600">Stay updated with the latest promotions, events, and restaurant news</p>
                </div>

                <div className="mb-8 text-right">
                    <select
                        value={category}
                        onChange={handleCategoryChange}
                        className="px-4 py-2 rounded border border-gray-300 bg-[#ECE6DF] focus:outline-none"
                    >
                        <option value="">All Categories</option>
                        <option value="Promotion">Promotion</option>
                        <option value="New Dish">New Dish</option>
                        <option value="Event">Event</option>
                        <option value="Restaurant News">Restaurant News</option>
                    </select>
                </div>

                {isLoading ? (
                    <div className="space-y-8">
                        {[...Array(6)].map((_, index) => (
                            <div key={index} className="flex animate-pulse bg-[#ECE6DF] rounded-lg overflow-hidden shadow-md">
                                <div className="w-1/3 h-[300px] bg-gray-300" />
                                <div className="w-2/3 p-6 space-y-4">
                                    <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-300 rounded w-4/5"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : news.length === 0 ? (
                    <div className="text-center text-gray-500">No news available for the selected category.</div>
                ) : (
                    <div className="flex flex-col gap-10">
                        {news.map((item, index) => (
                            <div
                                key={item._id}
                                className={`flex flex-col ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} bg-[#ECE6DF] rounded-lg overflow-hidden shadow-md`}
                            >
                                <div className="relative w-full md:w-1/3">
                                    {item.imageUrl ? (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.title}
                                            className="w-full h-[200px] md:h-[300px] object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-[200px] md:h-[300px] bg-gray-300 flex items-center justify-center text-gray-600">
                                            No image
                                        </div>
                                    )}
                                    {item.category && (
                                        <span
                                            className={`absolute top-2 ${index % 2 === 0 ? "left-2" : "right-2"} px-2 py-1 text-white text-xs font-bold rounded ${getCategoryClass(item.category)}`}
                                        >
                                            {item.category}
                                        </span>
                                    )}
                                </div>
                                <div className="w-full md:w-2/3 p-6 flex flex-col gap-4">
                                    <h3 className="text-2xl font-semibold text-gray-800">{item.title}</h3>
                                    <div className="flex flex-col md:flex-row gap-2 md:gap-6 text-sm text-gray-600">
                                        {item.createdAt && <span>Created on: {formatDate(item.createdAt)}</span>}
                                        {!item.createdAt && item.date && <span>{formatDate(item.date)}</span>}
                                        {item.author && <span className="italic">By: {item.author}</span>}
                                    </div>
                                    <p className="text-gray-700 leading-relaxed">{item.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default NewsDetail;
