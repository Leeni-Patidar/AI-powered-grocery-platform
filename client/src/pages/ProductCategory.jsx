import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useParams } from 'react-router-dom';
import { categories } from '../assets/assets';
import ProductCard from '../components/ProductCard';

const ProductCategory = () => {
  const { products, productFilters } = useAppContext(); 
  const { category } = useParams();
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const searchCategory = categories.find(
    (item) => item.path.toLowerCase() === category
  );

  const filteredProducts = useMemo(() => {
    const filtered = products.filter(
      (product) =>
        product.inStock &&
        product.category.toLowerCase() === category &&
        (!selectedSubcategory || product.subcategory === selectedSubcategory) &&
        (!selectedBrand || product.brand === selectedBrand)
    );

    return [...filtered].sort((a, b) => {
      if (sortBy === 'priceLow') return a.offerPrice - b.offerPrice;
      if (sortBy === 'priceHigh') return b.offerPrice - a.offerPrice;
      if (sortBy === 'rating') return (b.ratingAverage || 0) - (a.ratingAverage || 0);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [products, category, selectedSubcategory, selectedBrand, sortBy]);

  const totalPages = Math.max(Math.ceil(filteredProducts.length / pageSize), 1);
  const paginatedProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [category, selectedSubcategory, selectedBrand, sortBy]);

  return (
    <div className="mt-16">
      {searchCategory && (
        <div className="flex flex-col items-end w-max">
          <p className="text-2xl font-medium">
            {searchCategory.text.toUpperCase()}
          </p>
          <div className="w-16 h-0.5 bg-primary rounded-full"></div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 max-w-3xl">
        <select value={selectedSubcategory} onChange={(e) => setSelectedSubcategory(e.target.value)} className="border border-gray-300 rounded px-3 py-2 outline-none">
          <option value="">All Subcategories</option>
          {productFilters.subcategories.map((subcategory) => <option key={subcategory} value={subcategory}>{subcategory}</option>)}
        </select>
        <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="border border-gray-300 rounded px-3 py-2 outline-none">
          <option value="">All Brands</option>
          {productFilters.brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border border-gray-300 rounded px-3 py-2 outline-none">
          <option value="newest">Newest First</option>
          <option value="priceLow">Price: Low to High</option>
          <option value="priceHigh">Price: High to Low</option>
          <option value="rating">Top Rated</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>
      <p className="text-sm text-gray-600 mt-4">{filteredProducts.length} products found</p>
 {paginatedProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6 mt-6">
          {paginatedProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-2xl font-medium text-primary">
            No products found in this category.
          </p>
        </div>
      )}
      {filteredProducts.length > pageSize && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button disabled={page === 1} onClick={() => setPage((value) => Math.max(value - 1, 1))} className="px-4 py-2 border rounded disabled:opacity-40">Prev</button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage((value) => Math.min(value + 1, totalPages))} className="px-4 py-2 border rounded disabled:opacity-40">Next</button>
        </div>
      )}
    
    </div>
  );
};

export default ProductCategory;
