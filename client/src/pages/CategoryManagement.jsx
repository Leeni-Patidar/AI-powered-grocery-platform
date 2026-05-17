import { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

const CategoryManagement = () => {
  const { axios, user } = useAppContext();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [subcategoryName, setSubcategoryName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get('/api/category/list');
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      toast.error(error.message || 'Unable to load categories');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      return toast.error('Category name is required');
    }
    setLoading(true);
    try {
      const { data } = await axios.post('/api/category/create', { name: name.trim() });
      if (data.success) {
        toast.success(data.message);
        setName('');
        fetchCategories();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubcategory = async () => {
    if (!selectedCategory || !subcategoryName.trim()) {
      return toast.error('Select a category and provide a subcategory name');
    }

    setLoading(true);
    try {
      const { data } = await axios.post('/api/category/subcategory/add', {
        categoryId: selectedCategory._id,
        name: subcategoryName.trim(),
      });
      if (data.success) {
        toast.success(data.message);
        setSubcategoryName('');
        fetchCategories();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category and all subcategories?')) return;
    try {
      const { data } = await axios.delete(`/api/category/delete/${id}`);
      if (data.success) {
        toast.success(data.message);
        fetchCategories();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  if (!user || user.role !== 'admin') {
    return (
      <div className="mt-16 text-center text-gray-700">
        <h2 className="text-2xl font-semibold">Admin access required</h2>
        <p className="mt-3 text-gray-500">You need to be an admin to manage categories.</p>
      </div>
    );
  }

  return (
    <div className="mt-16 pb-16">
      <h1 className="text-3xl font-semibold mb-6">Category Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Create Category</h2>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category Name"
              className="w-full border border-gray-300 rounded px-3 py-2 outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-dull transition disabled:opacity-50"
            >
              Create Category
            </button>
          </form>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-3">Add Subcategory</h3>
            <select
              value={selectedCategory?._id || ''}
              onChange={(e) => setSelectedCategory(categories.find((item) => item._id === e.target.value))}
              className="w-full border border-gray-300 rounded px-3 py-2 mb-3 outline-none"
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              value={subcategoryName}
              onChange={(e) => setSubcategoryName(e.target.value)}
              placeholder="Subcategory Name"
              className="w-full border border-gray-300 rounded px-3 py-2 outline-none"
            />
            <button
              onClick={handleAddSubcategory}
              disabled={loading}
              className="w-full mt-4 py-3 bg-secondary text-white rounded-lg hover:bg-secondary-dull transition disabled:opacity-50"
            >
              Add Subcategory
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Existing Categories</h2>
          {categories.length === 0 ? (
            <p className="text-gray-500">No categories created yet.</p>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{category.name}</h3>
                      <p className="text-xs text-gray-500">{category.subcategories.length} subcategories</p>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(category._id)}
                      className="text-red-600 text-sm hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                  {category.subcategories.length > 0 && (
                    <div className="mt-4 grid gap-2 text-sm text-gray-600">
                      {category.subcategories.map((sub) => (
                        <div key={sub._id} className="flex items-center justify-between gap-3">
                          <span>{sub.name}</span>
                          <span className="text-xs text-gray-400">{sub.slug}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;
