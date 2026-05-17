import React from 'react'
import { categories } from '../assets/assets'
import {useAppContext} from '../context/AppContext'

const Categories = () => {
    const {navigate} = useAppContext()
    const categorySections = categories.reduce((sections, category) => {
        const section = category.section || 'Categories'
        if (!sections[section]) sections[section] = []
        sections[section].push(category)
        return sections
    }, {})

    return (
        <div className='mt-16 space-y-12'>
            {Object.entries(categorySections).map(([section, sectionCategories]) => (
                <section key={section}>
                    <p className='text-2xl md:text-3xl font-bold'>{section}</p>
                    <div className='grid grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 mt-6 gap-3 md:gap-6'>

                        {sectionCategories.map((category, index) => (
                            <div key={`${category.path}-${index}`} className='group cursor-pointer flex flex-col items-center gap-3'
                            onClick={()=>{
                                navigate(`/products/${category.path.toLowerCase()}`);
                                scrollTo(0,0)
                            }}>
                                <div className='w-full aspect-square rounded-lg flex items-center justify-center p-3 md:p-4' style={{background:category.bgColor}}>
                                    <img src={category.image} alt={category.text} className='group-hover:scale-105 transition max-h-full max-w-full object-contain' />
                                </div>

                                <p className='text-xs sm:text-sm md:text-base font-semibold text-center leading-snug'>{category.text}</p>
                            </div>

                        ))}

                    </div>
                </section>
            ))}
        </div>
    )
}

export default Categories
