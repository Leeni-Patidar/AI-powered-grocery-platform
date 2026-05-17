import React, { useState } from 'react';
import { assets, categories } from '../../assets/assets';
import toast from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";



const AddProduct = () => {
  const [files, setFiles] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [variants, setVariants] = useState([{ name: '', unit: '', price: '', offerPrice: '', stock: '' }]);
  const {axios} = useAppContext()

  const updateVariant = (index, field, value) => {
    const updatedVariants = [...variants];
    updatedVariants[index][field] = value;
    setVariants(updatedVariants);
  }

  
  const onSubmitHandler = async (event) => {
    try {
      event.preventDefault();
      const productData={
        name,  description:description.split('\n'),
        category, subcategory, brand, price, offerPrice,
        variants: variants.filter((variant) => variant.name.trim())
      }
      const formData= new FormData();
      formData.append('productData',JSON.stringify(productData));
      for (let i=0; i<files.length; i++){
        formData.append('images',files[i])
      }
      const{data} = await axios.post('/api/product/add',formData)
      
      if(data.success){
        toast.success(data.message);
        setName('')
        setDescription('')
        setCategory('')
        setSubcategory('')
        setBrand('')
        setPrice('')
        setOfferPrice('')
        setVariants([{ name: '', unit: '', price: '', offerPrice: '', stock: '' }])
        setFiles([])
        }else{
          toast.error(data.message)
        }

    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className="no-scrollbar flex-1 h-[95vh] overflow-y-scroll flex flex-col justify-between">
      <form onSubmit={onSubmitHandler} className="md:p-10 p-4 space-y-5 max-w-lg">
        <div>
          <p className="text-base font-medium">Product Image</p>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {Array(4).fill('').map((_, index) => (
              <label key={index} htmlFor={`image${index}`}>
                <input
                  type="file"
                  id={`image${index}`}
                  hidden
                  onChange={(e) => {
                    const updatedFiles = [...files];
                    updatedFiles[index] = e.target.files[0];
                    setFiles(updatedFiles);
                  }}
                />
                <img
                  className="max-w-24 cursor-pointer"
                  src={files[index] ? URL.createObjectURL(files[index]) : assets.upload_area}
                  alt="uploadArea"
                  width={100}
                  height={100}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1 max-w-md">
          <label htmlFor="product-name" className="text-base font-medium">Product Name</label>
          <input
            id="product-name"
            type="text"
            placeholder="Type here"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
            required
          />
        </div>

        <div className="flex flex-col gap-1 max-w-md">
          <label htmlFor="product-description" className="text-base font-medium">Product Description</label>
          <textarea
            id="product-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 resize-none"
            placeholder="Type here"
          ></textarea>
        </div>

        <div className="w-full flex flex-col gap-1">
          <label htmlFor="category" className="text-base font-medium">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
          >
            <option value="">Select Category</option>
            {categories.map((item, index) => (
              <option key={index} value={item.path}>{item.path}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex-1 flex flex-col gap-1 w-40">
            <label htmlFor="subcategory" className="text-base font-medium">Subcategory</label>
            <input
              id="subcategory"
              type="text"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder="e.g. Fresh vegetables"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
            />
          </div>
          <div className="flex-1 flex flex-col gap-1 w-40">
            <label htmlFor="brand" className="text-base font-medium">Brand</label>
            <input
              id="brand"
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Amul"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
            />
          </div>
        </div>

        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex-1 flex flex-col gap-1 w-32">
            <label htmlFor="product-price" className="text-base font-medium">Product Price</label>
            <input
              id="product-price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              required
            />
          </div>
          <div className="flex-1 flex flex-col gap-1 w-32">
            <label htmlFor="offer-price" className="text-base font-medium">Offer Price</label>
            <input
              id="offer-price"
              type="number"
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value)}
              placeholder="0"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-base font-medium">Product Variants</p>
            <button
              type="button"
              onClick={() => setVariants([...variants, { name: '', unit: '', price: '', offerPrice: '', stock: '' }])}
              className="text-sm text-primary border border-primary/40 px-3 py-1 rounded"
            >
              Add Variant
            </button>
          </div>
          {variants.map((variant, index) => (
            <div key={index} className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <input value={variant.name} onChange={(e) => updateVariant(index, 'name', e.target.value)} placeholder="Name" className="outline-none py-2 px-3 rounded border border-gray-500/40" />
              <input value={variant.unit} onChange={(e) => updateVariant(index, 'unit', e.target.value)} placeholder="Unit" className="outline-none py-2 px-3 rounded border border-gray-500/40" />
              <input type="number" value={variant.price} onChange={(e) => updateVariant(index, 'price', e.target.value)} placeholder="Price" className="outline-none py-2 px-3 rounded border border-gray-500/40" />
              <input type="number" value={variant.offerPrice} onChange={(e) => updateVariant(index, 'offerPrice', e.target.value)} placeholder="Offer" className="outline-none py-2 px-3 rounded border border-gray-500/40" />
              <input type="number" value={variant.stock} onChange={(e) => updateVariant(index, 'stock', e.target.value)} placeholder="Stock" className="outline-none py-2 px-3 rounded border border-gray-500/40" />
            </div>
          ))}
        </div>

        <button type="submit" className="px-8 py-2.5 bg-primary text-white font-medium rounded">ADD</button>
      </form>
    </div>
  );
};

export default AddProduct;
