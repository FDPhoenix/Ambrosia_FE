import { useCallback, useEffect, useState } from 'react';
import { FaEdit, FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa';
import StatusBadge from './StatusBadge';
import { toast } from 'react-toastify';
import Pagination from '../Pagination';
import LoadingAnimation from '../LoadingAnimation';

interface Ingredient {
  _id: string;
  dishId: { _id: string; name: string };
  name: string;
  description: string;
  type?: string;
  quantity: number;
  status: 'Available' | 'Unavailable';
}

interface IngredientData {
  name: string;
  status: 'Available' | 'Unavailable';
  quantity: string;
  description: string;
  dishId: string;
  type?: string;
}

const INGREDIENT_TYPES = ['Fresh Food', 'Cooking Ingredients', 'Vegetable'] as const;

function IngredientContent() {
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editIngredientId, setEditIngredientId] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [dishes, setDishes] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || '${backendApiUrl}';
  const [currentIngredients, setCurrentIngredients] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 4;
    const handlePageChange = useCallback((paginatedDishes: any[], page: number) => {
      setCurrentIngredients(paginatedDishes);
      setCurrentPage(page);
    }, []);
  const [ingredientData, setIngredientData] = useState<IngredientData>({
    name: '',
    status: 'Available',
    quantity: '',
    description: '',
    dishId: '',
    type: '',
  });

  useEffect(() => {
    fetchDishes();
    fetchIngredients();
  }, []);

  const fetchDishes = async () => {
    try {
      const response = await fetch(`${backendApiUrl}/dishes/all?page=1&limit=10000`);
      if (!response.ok) throw new Error('Failed to fetch dishes');
      const data = await response.json();
      setDishes(data.dishes || []);
    } catch (error) {
      console.error('Error fetching dishes:', error);
      setError('Failed to load dishes');
    }
  };

  const fetchIngredients = async (type?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = type
        ? `${backendApiUrl}/ingredients/filter/type?type=${encodeURIComponent(type)}`
        : `${backendApiUrl}/ingredients`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch ingredients');
      const data = await response.json();
      setIngredients(data.ingredients || []);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      setError('Failed to load ingredients');
      setIngredients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setIngredientData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddOrUpdateIngredient = async () => {
    const nameRegex = /^[A-Za-z\s]+$/;

    if (!ingredientData.name.trim()) {
      toast.error('Ingredient name is required.');
      return;
    } else if (!nameRegex.test(ingredientData.name)) {
      toast.error('Name must contain only letters and spaces.');
      return;
    } else if (ingredientData.name.length > 50) {
      toast.error('Name must not exceed 50 characters.');
      return;
    }

    if (!ingredientData.dishId) {
      toast.error('Please select a dish.');
      return;
    }

    if (!ingredientData.type) {
      toast.error('Please select a type.');
      return;
    }

    const quantity = Number(ingredientData.quantity);
    if (!ingredientData.quantity || isNaN(quantity)) {
      toast.error('Quantity must be a number.');
      return;
    } else if (quantity <= 0) {
      toast.error('Quantity must be a positive number.');
      return;
    }

    try {
      const url = isEditing
        ? `${backendApiUrl}/ingredients/update/${editIngredientId}`
        : `${backendApiUrl}/ingredients/add`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ingredientData,
          quantity: quantity,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(isEditing ? 'Ingredient updated successfully!' : 'Ingredient added successfully!');
        setShowForm(false);
        fetchIngredients(filterType);
        resetForm();
      } else {
        toast.error(data.message || 'Failed to process request');
      }
    } catch (error) {
      console.error('Error processing ingredient:', error);
      toast.error('Error processing ingredient. Please try again.');
    }
  };

  const resetForm = () => {
    setIngredientData({
      name: '',
      status: 'Available',
      quantity: '',
      description: '',
      dishId: '',
      type: '',
    });
    setIsEditing(false);
    setEditIngredientId(null);
  };

  const handleEditIngredient = (ingredient: Ingredient) => {
    setIngredientData({
      name: ingredient.name,
      status: ingredient.status,
      quantity: String(ingredient.quantity),
      description: ingredient.description || '',
      dishId: ingredient.dishId._id,
      type: ingredient.type || '',
    });
    setEditIngredientId(ingredient._id);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleHideIngredient = async (ingredientId: string) => {
    try {
      const response = await fetch(`${backendApiUrl}/ingredients/hide/${ingredientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok) {
        fetchIngredients(filterType);
      } else {
        toast.error(data.message || 'Failed to update ingredient status');
      }
    } catch (error) {
      console.error('Error updating ingredient status:', error);
      toast.error('Error updating ingredient status. Please try again.');
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    setFilterType(type);
    fetchIngredients(type);
  };

  useEffect(() => {
    const totalPages = Math.ceil(ingredients.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0) {
      setCurrentPage(1);
    }
  
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = ingredients.slice(startIndex, startIndex + itemsPerPage);
    setCurrentIngredients(paginatedItems);
  }, [ingredients, currentPage, itemsPerPage]);
  return (
    <div className="relative h-[567px] max-w-8xl mx-auto bg-white p-6 rounded-xl shadow-md">
      {loading ? (
        <div className="w-full h-full flex justify-center items-center">
          <LoadingAnimation />
        </div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : (
        <>
          <div className=" flex flex-row justify-between mb-4">
            <h3 className=" text-xl font-semibold">List of Ingredients</h3>
            <div className="flex flex-col sm:flex-row items-start mt-2 sm:mt-0">
              <select
                value={filterType}
                onChange={handleFilterChange}
                className="mb-2 sm:mb-0 sm:mr-3 px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Types</option>
                {INGREDIENT_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <button
                onClick={() => { setShowForm(true); setIsEditing(false); }}
                className="px-3 py-2 bg-[#f0f0f0] text-black rounded-md border border-[#ddd] hover:bg-[#F0924C] transition"
              >
                Add New
              </button>
            </div>
          </div>

          <div className="h-[450px] overflow-auto sm:max-h-[475px]">
            {ingredients.length === 0 ? (
              <p className="text-center">No ingredients found.</p>
            ) : (
              <>
                <div className="hidden sm:block">
                  <table className="w-full text-center">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-4">No</th>
                        <th className="p-4">Name</th>
                        <th className="p-4">Description</th>
                        <th className="p-4">Quantity</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentIngredients.map((ingredient, index) => (
                        <tr key={ingredient._id} className="border-b">
                          <td className="p-3">{(currentPage - 1) * itemsPerPage + index + 1}
</td>
                          <td className="p-3">{ingredient.name}</td>
                          <td className="max-w-[250px] p-3">{ingredient.description || '-'}</td>
                          <td className="p-3">{ingredient.quantity}</td>
                          <td className="p-3">{ingredient.type || '-'}</td>
                          <td className="p-3">
                            <StatusBadge
                              status={ingredient.status === 'Available'}
                              caseTrue="Available"
                              caseFalse="Unavailable"
                            />
                          </td>
                          <td className="p-3">
                            <button
                              className="text-lg mr-4 hover:text-orange-500 transition"
                              onClick={() => handleEditIngredient(ingredient)}
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="text-lg hover:text-orange-500 transition"
                              onClick={() => handleHideIngredient(ingredient._id)}
                            >
                              {ingredient.status === 'Available' ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="block sm:hidden">
                  {ingredients.map((ingredient, index) => (
                    <div key={ingredient._id} className="p-4 mb-4 border rounded-lg shadow-sm">
                      <p><strong>Order No:</strong> {index + 1}</p>
                      <p><strong>Name:</strong> {ingredient.name}</p>
                      <p><strong>Description:</strong> {ingredient.description || '-'}</p>
                      <p><strong>Quantity:</strong> {ingredient.quantity}</p>
                      <p><strong>Type:</strong> {ingredient.type || '-'}</p>
                      <p><strong>Status:</strong> <StatusBadge status={ingredient.status === 'Available'} caseTrue="Available" caseFalse="Unavailable" /></p>
                      <div className="mt-2">
                        <button
                          className="text-lg mr-2 hover:text-orange-500 transition"
                          onClick={() => handleEditIngredient(ingredient)}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="text-lg hover:text-orange-500 transition"
                          onClick={() => handleHideIngredient(ingredient._id)}
                        >
                          {ingredient.status === 'Available' ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <Pagination items={ingredients} itemsPerPage={itemsPerPage} onPageChange={handlePageChange} />
          
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
              <div className="bg-white rounded-lg p-6 w-[90%] sm:w-[400px]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {isEditing ? 'Edit Ingredient' : 'Add New Ingredient'}
                  </h3>
                  <button onClick={() => { setShowForm(false); resetForm(); }}>
                    <FaTimes />
                  </button>
                </div>
                <input
                  className="w-full mb-2 px-3 py-2 border rounded"
                  name="name"
                  placeholder="Ingredient Name"
                  value={ingredientData.name}
                  onChange={handleInputChange}
                />
                <select
                  className="w-full mb-2 px-3 py-2 border rounded"
                  name="dishId"
                  value={ingredientData.dishId}
                  onChange={handleInputChange}
                >
                  <option value="">Select Dish</option>
                  {dishes.map((dish) => (
                    <option key={dish._id} value={dish._id}>{dish.name}</option>
                  ))}
                </select>
                <select
                  className="w-full mb-2 px-3 py-2 border rounded"
                  name="type"
                  value={ingredientData.type || ''}
                  onChange={handleInputChange}
                >
                  <option value="">Select Type</option>
                  {INGREDIENT_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
                <input
                  type="number"
                  className="w-full mb-2 px-3 py-2 border rounded"
                  name="quantity"
                  placeholder="Quantity"
                  value={ingredientData.quantity}
                  onChange={handleInputChange}
                />
                <textarea
                  className="w-full mb-3 px-3 py-2 border rounded h-20"
                  name="description"
                  placeholder="Description"
                  value={ingredientData.description}
                  onChange={handleInputChange}
                ></textarea>
                <button
                  className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600"
                  onClick={handleAddOrUpdateIngredient}
                >
                  {isEditing ? 'Update' : 'Add'} Ingredient
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default IngredientContent;