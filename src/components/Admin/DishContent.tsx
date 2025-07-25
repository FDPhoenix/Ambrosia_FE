import { useCallback, useEffect, useState } from 'react';
import { FaEdit, FaEye, FaTimes } from 'react-icons/fa';
import { FaEyeSlash } from 'react-icons/fa6';
import StatusBadge from './StatusBadge';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import Pagination from '../Pagination';
import LoadingAnimation from '../LoadingAnimation';

function DishContent() {
  const [dishes, setDishes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [currentDishes, setCurrentDishes] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 4;
  const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000';

  const [editDish, setEditDish] = useState({
    _id: "",
    name: "",
    category: "",
    price: "",
    image: "",
  })

  const [newDish, setNewDish] = useState({
    name: "",
    category: categories.length > 0 ? categories[0]._id : "",
    price: "",
    status: "Available",
    image: "",
  });

  const fetchDishes = () => {
    setFetching(true);

    fetch(`${backendApiUrl}/dishes/admin/all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Cookies.get("token")}`,
      },
    }).then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDishes(data.response);
        }
      })
      .catch((err) => {
        console.error("Error fetching dishes:", err);
      }).finally(() => setFetching(false));
  };

  const fetchCategory = () => {
    fetch(`${backendApiUrl}/category/all`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${Cookies.get("token")}`,
      },
    }).then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const visibleCategories = data.categories.filter((category: { isHidden: boolean }) => !category.isHidden);
          setCategories(visibleCategories);
        }
      })
      .catch((err) => {
        console.error("Error fetching categories:", err);
      });
  };

  //Hide
  const handleHideDish = (id: any) => {
    const dishToUpdate = dishes.find(dish => dish._id === id);
    const updatedStatus = !dishToUpdate.isAvailable;

    fetch(`${backendApiUrl}/dishes/hide/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Cookies.get("token")}`
      },
      body: JSON.stringify({ isAvailable: updatedStatus })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDishes(dishes.map(dish =>
            dish._id === id ? { ...dish, isAvailable: updatedStatus } : dish
          ));
        }
        fetchDishes();
      })
      .catch(err => console.error("Error updating dish status:", err));
  };

  const handleInputChange = (e: { target: { name: any; value: any; }; }) => {
    setNewDish({ ...newDish, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setNewDish({ ...newDish, image: URL.createObjectURL(file) });
    }
  };

  const handleEditImageChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setEditDish({ ...editDish, image: URL.createObjectURL(file) });
    }
  };

  //Add
  const handleAddDish = () => {
    if (!newDish.name.trim()) {
      toast.error("Dish name cannot be empty!");
      return;
    }

    const price = Number(newDish.price)
    if (!price || isNaN(price) || price <= 1000) {
      toast.error("Price must be a valid number and higher than 1000!");
      return;
    }

    if (!selectedFile) {
      toast.error("Please select an image!");
      return;
    }

    if (!newDish.category || newDish.category.trim() === "") {
      toast.error("Please select a valid category!");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('name', newDish.name);
    formData.append('categoryId', newDish.category);
    formData.append('price', newDish.price);
    formData.append('image', selectedFile);

    fetch(`${backendApiUrl}/dishes/add`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Cookies.get("token")}`
      },
      body: formData,
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDishes([...dishes, data.dish]);
          setShowForm(false);
          setNewDish({ name: "", category: categories[0]._id, price: "", status: "Available", image: "" });
          setSelectedFile(null);
          toast.success('Added successfully')
          fetchDishes();
        } else {
          toast.error("Failed to add dish!");
        }
      })
      .catch(err => console.error("Error adding dish:", err))
      .finally(() => setLoading(false));
  };

  const handleEditDish = (dish: any) => {
    const category = categories.find((cat: any) => cat.name === dish.categoryName);

    setEditDish({
      _id: dish._id,
      name: dish.name,
      category: category?._id,
      price: dish.price,
      image: dish.imageUrl,
    });
    setShowEditForm(true);
  };

  //Update
  const handleUpdateDish = () => {
    if (!editDish.name.trim()) {
      toast.error("Dish name cannot be empty!");
      return;
    }

    const price = Number(editDish.price)
    if (!price || isNaN(price) || price <= 1000) {
      toast.error("Price must be a valid number and higher than 1000!");
      return;
    }

    console.log("Updating with category:", editDish.category);

    if (!categories.find((cat: any) => cat._id === editDish.category)) {
      toast.error("Invalid category selected!");
      return;
    }

    setEditLoading(true);

    const formData = new FormData();
    formData.append('name', editDish.name);
    formData.append('categoryId', editDish.category);
    formData.append('price', editDish.price);

    if (selectedFile) {
      formData.append('image', selectedFile);
    }

    fetch(`${backendApiUrl}/dishes/update/${editDish._id}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${Cookies.get("token")}`
      },
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDishes(dishes.map(dish => dish._id === editDish._id ? data.dish : dish));
          setShowEditForm(false);
          toast.success('Upadated successfully')
          fetchDishes();
        } else {
          toast.error("Failed to update dish!");
        }
      })
      .catch((err) => console.error("Error updating dish:", err))
      .finally(() => setEditLoading(false));
  };

  const handlePageChange = useCallback((paginatedDishes: any[], page: number) => {
    setCurrentDishes(paginatedDishes);
    setCurrentPage(page);
  }, []);

  useEffect(() => {
    const totalPages = Math.ceil(dishes.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0) {
      setCurrentPage(1);
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = dishes.slice(startIndex, startIndex + itemsPerPage);
    setCurrentDishes(paginatedItems);
  }, [dishes, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchDishes();
    fetchCategory();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      setNewDish((prev) => ({ ...prev, category: categories[0]._id }));
    }
  }, [categories]);

  return (
    <div className="relative w-[1200px] h-[567px] p-5 max-w-[1210px] bg-white rounded-2xl shadow-md">
      {fetching ? (
        <div className='w-full h-[567px] flex justify-center items-center'>
          <LoadingAnimation />
        </div>
      ) : (
        <div>
          <div className="flex justify-between mb-4">
            <h3 className="text-xl font-bold my-auto">List of Dish</h3>
            <button
              className="py-1 px-3 border border-gray-300 rounded-md transition-colors duration-200 bg-gray-100 hover:bg-[#F0924C]"
              onClick={() => setShowForm(true)}
            >
              Add dish
            </button>
          </div>

          <div className="max-h-[440px] overflow-y-auto">
            <table className="w-full border-collapse text-left">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="p-4 text-center">No</th>
                  <th className="p-4 text-center">Image</th>
                  <th className="p-4 text-center">Name</th>
                  <th className="p-4 text-center">Category</th>
                  <th className="p-4 text-center">Price (VND)</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentDishes.map((dish: any, index) => (
                  <tr key={dish._id} className='border-b border-gray-300 last:border-b-0'>
                    <td className="p-3 text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="p-3 text-center">
                      <img src={dish.imageUrl} alt={''} className="w-[70px] h-[70px] rounded-md mx-auto" />
                    </td>
                    <td className="p-3 text-center w-[387px]">{dish.name}</td>
                    <td className="p-3 text-center">{dish.categoryName}</td>
                    <td className="p-3 text-center">{dish.price.toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <div style={{ width: '106px', margin: '0 auto' }}>
                        <StatusBadge status={dish.isAvailable} caseTrue={"Available"} caseFalse={"Unavailable"} />
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        className="bg-none text-xl cursor-pointer mr-2.5 transition-transform duration-200 hover:scale-125 hover:text-[#f0924c]"
                        onClick={() => handleEditDish(dish)}
                      >
                        <FaEdit title='Edit' />
                      </button>
                      <button
                        className="bg-none text-xl cursor-pointer transition-transform duration-200 hover:scale-125 hover:text-[#f0924c]"
                        onClick={() => handleHideDish(dish._id)}
                      >
                        {dish.isAvailable ? <FaEyeSlash title='Hide' /> : <FaEye title='Show' />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination items={dishes} itemsPerPage={itemsPerPage} onPageChange={handlePageChange} />
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center">
          <div className="bg-white w-[450px] p-5 rounded-lg">
            <div className="flex justify-between items-center mb-2.5">
              <h3 className='font-semibold'>Add New Dish</h3>
              <button className="bg-none text-lg text-gray-600 cursor-pointer" onClick={() => setShowForm(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="flex gap-5">
              <div className="relative w-[250px] h-[195px] bg-gray-100 flex items-center justify-center rounded-md cursor-pointer overflow-hidden">
                {newDish.image ? <img src={newDish.image} alt="Preview" className="w-full h-full object-cover" /> : <span>Select Image</span>}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-2.5 w-full">
                <input
                  type="text"
                  name="name"
                  placeholder="Dish Name"
                  value={newDish.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />

                <select
                  name="category"
                  value={newDish.category}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {categories.map((cat: any) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>

                <input
                  type="number"
                  name="price"
                  placeholder="Price"
                  value={newDish.price}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />

                <button
                  className="bg-[#f0924c] text-white p-2.5 rounded-md transition-colors duration-200 hover:bg-[#d87c3b]"
                  onClick={handleAddDish}
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Dish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditForm && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center">
          <div className="bg-white w-[450px] p-5 rounded-lg">
            <div className="flex justify-between items-center mb-2.5">
              <h3 className='font-semibold'>Edit Dish</h3>
              <button className="bg-none text-lg text-gray-600 cursor-pointer" onClick={() => setShowEditForm(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="flex gap-5">
              <div className="relative w-[275px] h-[195px] bg-gray-100 flex items-center justify-center rounded-md cursor-pointer overflow-hidden">
                {editDish.image ? <img src={editDish.image} alt="Preview" className="w-full h-full object-cover" /> : <span>Select Image</span>}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageChange}
                  className="absolute w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-2.5 w-full">
                <input
                  type="text"
                  name="name"
                  placeholder="Dish Name"
                  value={editDish.name}
                  onChange={(e) => setEditDish({ ...editDish, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />

                <select
                  name="category"
                  value={editDish.category}
                  onChange={(e) => setEditDish({ ...editDish, category: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {categories.map((cat: any) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  name="price"
                  placeholder="Price"
                  value={editDish.price}
                  onChange={(e) => setEditDish({ ...editDish, price: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />

                <button
                  className="bg-[#f0924c] text-white p-2.5 rounded-md transition-colors duration-200 hover:bg-[#d87c3b]"
                  onClick={handleUpdateDish}
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DishContent