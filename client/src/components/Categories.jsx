import React from 'react'
import { categories as categoryAssets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'

const Categories = () => {
    const { dbCategories, navigate } = useAppContext()
    const assetMap = new Map(
        categoryAssets.map((asset) => [asset.path.toLowerCase(), asset])
    )

    const categoryItems = dbCategories.map((category) => {
        const key = category.slug?.toLowerCase() || category.name.toLowerCase()
        const asset = assetMap.get(key) || assetMap.get(category.name.toLowerCase())
        return {
            ...category,
            path: category.slug,
            text: category.name,
            image: asset?.image,
            bgColor: asset?.bgColor || '#F3F4F6',
        }
    })

    if (!categoryItems.length) {
        return (
            <div className='mt-16 text-center text-gray-500'>
                <p>No categories available.</p>
                <p className='text-sm mt-2'>Please add categories from the admin panel.</p>
            </div>
        )
    }

    return (
        <div className='mt-16 space-y-12'>
            <section>
                <p className='text-2xl md:text-3xl font-bold'>Categories</p>
                <div className='grid grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 mt-6 gap-3 md:gap-6'>
                    {categoryItems.map((category, index) => (
                        <div key={`${category.slug}-${index}`} className='group cursor-pointer flex flex-col items-center gap-3'
                            onClick={() => {
                                navigate(`/products/${category.path.toLowerCase()}`)
                                scrollTo(0, 0)
                            }}>
                            <div className='w-full aspect-square rounded-lg flex items-center justify-center p-3 md:p-4' style={{ background: category.bgColor }}>
                                {category.image ? (
                                    <img src={category.image} alt={category.text} className='group-hover:scale-105 transition max-h-full max-w-full object-contain' />
                                ) : (
                                    <span className='text-sm text-gray-600'>{category.text}</span>
                                )}
                            </div>

                            <p className='text-xs sm:text-sm md:text-base font-semibold text-center leading-snug'>{category.text}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}

export default Categories
