import type React from "react"
import { useEffect, useState, useCallback } from "react"
import Pagination from "../Pagination"
import Cookies from "js-cookie";

interface Category {
  _id: string
  name: string
}

interface Feedback {
  _id: string
  userId: {
    fullname: string
    email: string
    profileImage?: string
  }
  rating: number
  comment: string
  isHided: boolean
  createdAt: string
}

interface Dish {
  _id: string
  name: string
  imageUrl: string
  price: number
  category: Category
  isAvailable: boolean
}

const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000'
const BASE_IMAGE_URL = `${backendApiUrl}/uploads/`

const FeedbackContent: React.FC = () => {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null)
  const [loadingFeedback, setLoadingFeedback] = useState<boolean>(false)
  const [ratingFilter, setRatingFilter] = useState<number | "">("")
  
  const [currentDishes, setCurrentDishes] = useState<Dish[]>([])
  const [currentPage, setCurrentPage] = useState<number>(1)
  const itemsPerPage = 10

  const [currentFeedbacks, setCurrentFeedbacks] = useState<Feedback[]>([])
  const [currentFeedbackPage, setCurrentFeedbackPage] = useState<number>(1)
  const feedbacksPerPage = 6

  useEffect(() => {
    fetchDishes()
    fetchCategories()
  }, [selectedCategory])

  useEffect(() => {
    const totalPages = Math.ceil(dishes.length / itemsPerPage)
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    } else if (totalPages === 0) {
      setCurrentPage(1)
    }

    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedItems = dishes.slice(startIndex, startIndex + itemsPerPage)
    setCurrentDishes(paginatedItems)
  }, [dishes, currentPage, itemsPerPage])

  const fetchDishes = () => {
    const apiUrl = selectedCategory
      ? `${backendApiUrl}/api/feedback/allDishes?categoryId=${selectedCategory}`
      : `${backendApiUrl}/api/feedback/allDishes`

    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => setDishes(Array.isArray(data) ? data : []))
      .catch((error) => console.error("Error fetching dishes:", error))
  }

  const fetchCategories = () => {
    fetch(`${backendApiUrl}/category/all`)
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data.categories) ? data.categories : []))
      .catch((error) => console.error("Error fetching categories:", error))
  }

  const fetchFeedbacks = (dishId: string) => {
    setLoadingFeedback(true)
    fetch(`${backendApiUrl}/api/feedback/admin/dish/${dishId}`, {
      headers: {
        'Authorization': `Bearer ${Cookies.get('token')}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data) => setFeedbacks(data.feedbacks || []))
      .catch(() => setFeedbacks([]))
      .finally(() => setLoadingFeedback(false))
  }

  const handleDishClick = (dish: Dish) => {
    setSelectedDish(dish)
    fetchFeedbacks(dish._id)
    setRatingFilter("")
    setCurrentFeedbackPage(1)
  }

  const toggleVisibility = async (id: string) => {
    try {
      const response = await fetch(`${backendApiUrl}/api/feedback/hide/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) throw new Error("Error")

      const data = await response.json()

      setFeedbacks((prev) => prev.map((fb) => (fb._id === id ? { ...fb, isHided: data.feedback.isHided } : fb)))

      alert(data.feedback.isHided ? "Feedback hidden!" : "Feedback shown!")
    } catch (error) {
      console.error("Error", error)
      alert("Update error feedback!")
    }
  }

  const filteredFeedbacks = ratingFilter ? feedbacks.filter((fb) => fb.rating === ratingFilter) : feedbacks

  useEffect(() => {
    const totalPages = Math.ceil(filteredFeedbacks.length / feedbacksPerPage)
    if (currentFeedbackPage > totalPages && totalPages > 0) {
      setCurrentFeedbackPage(totalPages)
    } else if (totalPages === 0) {
      setCurrentFeedbackPage(1)
    }

    const startIndex = (currentFeedbackPage - 1) * feedbacksPerPage
    const paginatedFeedbacks = filteredFeedbacks.slice(startIndex, startIndex + feedbacksPerPage)
    setCurrentFeedbacks(paginatedFeedbacks)
  }, [filteredFeedbacks, currentFeedbackPage, feedbacksPerPage])

  const handlePageChange = useCallback((paginatedDishes: Dish[], page: number) => {
    setCurrentDishes(paginatedDishes)
    setCurrentPage(page)
  }, [])

  const handleFeedbackPageChange = useCallback((paginatedFeedbacks: Feedback[], page: number) => {
    setCurrentFeedbacks(paginatedFeedbacks)
    setCurrentFeedbackPage(page)
  }, [])

  return (
    <div className="relative w-full max-w-[1200px] h-[567px] mx-auto">
      <select
        className="w-full max-w-[200px] p-2 mb-5 border border-gray-300 rounded-lg"
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
      >
        <option value="">All Category</option>
        {categories.map((category) => (
          <option key={category._id} value={category._id}>
            {category.name}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto pr-2 scrollbar-hide">
        {currentDishes.map((dish) => (
          <div
            key={dish._id}
            className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-105"
            onClick={() => handleDishClick(dish)}
          >
            <img
              src={
                dish.imageUrl
                  ? dish.imageUrl.startsWith("http")
                    ? dish.imageUrl
                    : `${BASE_IMAGE_URL}${dish.imageUrl}`
                  : "https://tse4.mm.bing.net/th?id=OIP.1QDPhOmFezmjXmeTYkbOagHaE8&pid=Api&P=0&h=180"
              }
              alt={dish.name}
              className="w-full h-[120px] sm:h-[140px] object-cover border-b border-gray-100"
            />
            <div className="p-2.5 text-center">
              <h2 className="text-sm sm:text-base font-semibold my-1.5 truncate">{dish.name}</h2>
              <p className="text-xs sm:text-sm text-gray-500">{dish.price.toLocaleString()} VND</p>
            </div>
          </div>
        ))}
      </div>

      {!selectedDish && (
        <div className="flex justify-center shadow-t border-t border-gray-200 bg-white/90
          fixed left-0 right-0 bottom-0 z-40 md:static md:left-auto md:right-auto md:bottom-auto md:z-auto md:bg-transparent md:shadow-none md:border-0 md:py-0 md:mt-6">
          <Pagination items={dishes} itemsPerPage={itemsPerPage} onPageChange={handlePageChange} />
        </div>
      )}

      {selectedDish && (
        <div
          className="fixed inset-0 bg-black/60 flex justify-center items-start pt-4 sm:pt-10 z-50"
          onClick={() => setSelectedDish(null)}
        >
          <div
            className="bg-white w-[95%] max-w-[1100px] rounded-2xl p-4 sm:p-6 relative shadow-lg max-h-[90vh] overflow-y-auto z-[1100] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 overflow-y-auto pb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-4">Feedback of {selectedDish.name}</h2>

              <div className="flex justify-center items-center gap-2.5 mb-5">
                <label className="text-sm sm:text-base">Filter by Rating:</label>
                <select
                  className="w-50px sm:w-a py-1.5 rounded-lg border border-gray-300"
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value === "" ? "" : Number(e.target.value))}
                >
                  <option value="">All</option>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <option key={star} value={star}>
                      {star} ⭐
                    </option>
                  ))}
                </select>
              </div>

              {loadingFeedback ? (
                <p className="text-center text-sm sm:text-base text-blue-500 mt-5">Loading...</p>
              ) : filteredFeedbacks.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse mt-2.5">
                      <thead>
                        <tr>
                          <th className="p-2 border border-gray-300 text-center bg-gray-100 font-bold text-xs sm:text-sm">Fullname</th>
                          <th className="p-2 border border-gray-300 text-center bg-gray-100 font-bold text-xs sm:text-sm">Email</th>
                          <th className="p-2 border border-gray-300 text-center bg-gray-100 font-bold text-xs sm:text-sm">Rating</th>
                          <th className="p-2 border border-gray-300 text-center bg-gray-100 font-bold text-xs sm:text-sm">Comment</th>
                          <th className="p-2 border border-gray-300 text-center bg-gray-100 font-bold text-xs sm:text-sm">Created At</th>
                          <th className="p-2 border border-gray-300 text-center bg-gray-100 font-bold text-xs sm:text-sm">Status</th>
                          <th className="p-2 border border-gray-300 text-center bg-gray-100 font-bold text-xs sm:text-sm">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentFeedbacks.map((fb) => (
                          <tr key={fb._id} className={fb.isHided ? "bg-gray-50 text-gray-400" : ""}>
                            <td className="p-2 border border-gray-300 text-center text-xs sm:text-sm">{fb.userId.fullname}</td>
                            <td className="p-2 border border-gray-300 text-center text-xs sm:text-sm">{fb.userId.email}</td>
                            <td className="p-2 border border-gray-300 text-center text-xs sm:text-sm">⭐ {fb.rating}</td>
                            <td className="p-2 border border-gray-300 text-center text-xs sm:text-sm">{fb.comment}</td>
                            <td className="p-2 border border-gray-300 text-center text-xs sm:text-sm">
                              {new Date(fb.createdAt).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="p-2 border border-gray-300 text-center text-xs sm:text-sm">{fb.isHided ? "Hidden" : "Showing"}</td>
                            <td className="p-2 border border-gray-300 text-center text-xs sm:text-sm">
                              <button
                                className="text-black py-1 px-2 sm:py-2 sm:px-3 border-none rounded-lg bg-[rgb(240,240,240)] cursor-pointer transition-colors duration-200 hover:bg-[#F09C42]"
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to change the status of this feedback?')) {
                                    toggleVisibility(fb._id)
                                  }
                                }}
                              >
                                {fb.isHided ? "Show" : "Hide"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                
                  {filteredFeedbacks.length > feedbacksPerPage && (
                    <div className="mt-6 mb-4">
                      <Pagination items={filteredFeedbacks} itemsPerPage={feedbacksPerPage} onPageChange={handleFeedbackPageChange} />
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-sm sm:text-base text-gray-500 mt-5">No feedback yet</p>
              )}
            </div>

            <button
              className="absolute top-2.5 right-2.5 bg-transparent border-none text-lg cursor-pointer text-gray-700"
              onClick={() => setSelectedDish(null)}
            >
              🗙
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default FeedbackContent