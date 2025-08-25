import type React from "react"
import { useState, useEffect } from "react"
import axios from "axios"
import Lottie from "lottie-react"

interface BestSellerDish {
  dishId: string
  name: string
  imageUrl?: string
  price: number
  totalQuantity: number
}

const BestSellers: React.FC = () => {
  const [bestSellers, setBestSellers] = useState<BestSellerDish[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<{
    limit: string
    month: string
    year: string
  }>({
    limit: "5",
    month: "",
    year: new Date().getFullYear().toString(),
  })

  const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000'

  const fetchBestSellers = async () => {
    try {
      setLoading(true)
      const params: any = {
        limit: filters.limit,
        year: filters.year,
      };
      if (filters.month) {
        params.month = filters.month;
      }
      const response = await axios.get(`${backendApiUrl}/dish/bestsellers`, {
        params,
      })
      setBestSellers(response.data.data || [])
      setLoading(false)
    } catch (err) {
      setError("Failed to load bestseller dishes!")
      setLoading(false)
      console.error("Error fetching bestsellers:", err)
    }
  }

  const [loadingData, setLoadingData] = useState(null);

  useEffect(() => {
    if (loading) {
      fetch("/loading.json")
        .then(res => res.json())
        .then(data => setLoadingData(data));
    }
  }, [loading]);

  useEffect(() => {
    fetchBestSellers()
  }, [filters])

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  if (error) return <div className="text-center text-2xl text-red-600 p-12 font-medium">{error}</div>

  return (
    <div className="w-[445px] h-[567px] p-5 md:p-[20px_30px] max-w-[1210px] bg-white rounded-[15px] shadow-md">
      <div className="w-full mb-5">
        <h4 className="text-center mb-7 text-lg">Bestseller Dishes List</h4>
        <div className="flex gap-5 flex-nowrap items-center">
          <div className="flex items-center gap-1.5 w-max">
            <label htmlFor="limit" className="text-base font-semibold">
              Limit:
            </label>
            <select
              id="limit"
              name="limit"
              value={filters.limit}
              onChange={handleFilterChange}
              className="px-2.5 py-1.5 border border-gray-300 rounded-md outline-none bg-gray-50 focus:border-blue-500 focus:shadow-[0_0_5px_rgba(26,115,232,0.3)]"
              style={{ width: "60px" }}
            >
              {[5, 10, 15, 20].map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5 w-max">
            <label htmlFor="month" className="text-base font-semibold">
              Month:
            </label>
            <select
              id="month"
              name="month"
              value={filters.month}
              onChange={handleFilterChange}
              className="px-2.5 py-1.5 border border-gray-300 rounded-md outline-none bg-gray-50 focus:border-blue-500 focus:shadow-[0_0_5px_rgba(26,115,232,0.3)]"
            >
              <option value="">All</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5 w-max">
            <label htmlFor="year" className="text-base font-semibold">
              Year:
            </label>
            <input
              type="number"
              id="year"
              name="year"
              value={filters.year}
              onChange={handleFilterChange}
              className="px-2.5 py-1.5 border border-gray-300 rounded-md outline-none bg-gray-50 focus:border-blue-500 focus:shadow-[0_0_5px_rgba(26,115,232,0.3)]"
              style={{ width: "75px" }}
            />
          </div>
        </div>
      </div>

      <div className="h-[425px] overflow-y-auto bg-white overflow-x-auto box-border scrollbar-hide">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            {loadingData ? (
              <Lottie animationData={loadingData} style={{ width: 120, height: 120 }} />
            ) : (
              <span>Loading...</span>
            )}
          </div>
        ) : bestSellers.length === 0 ? (
          <p className="text-center text-lg text-gray-500 p-7 mt-[40%]">No dishes found for this period.</p>
        ) : (
          <table className="w-full border-collapse text-center">
            <thead>
              <tr>
                <th className="bg-gray-100 p-3.5 text-center font-semibold text-base">No</th>
                <th className="bg-gray-100 p-3.5 text-center font-semibold text-base">Image</th>
                <th className="bg-gray-100 p-3.5 text-center font-semibold text-base">Dish Name</th>
                <th className="bg-gray-100 p-3.5 text-center font-semibold text-base">Total Sold</th>
              </tr>
            </thead>
            <tbody>
              {bestSellers.map((dish, index) => (
                <tr key={dish.dishId}>
                  <td className="p-3.5 text-base border-b border-gray-200 text-center">{index + 1}</td>
                  <td className="p-3.5 text-base border-b border-gray-200 text-center">
                    <img
                      src={dish.imageUrl || "https://via.placeholder.com/50"}
                      alt={dish.name}
                      className="w-[50px] h-[50px] object-cover rounded-md shadow-sm mx-auto"
                    />
                  </td>
                  <td className="p-3.5 text-base border-b border-gray-200 text-center">{dish.name}</td>
                  <td className="p-3.5 text-base border-b border-gray-200 text-center">{dish.totalQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default BestSellers
