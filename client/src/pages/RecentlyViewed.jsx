import ProductCard from '../components/ProductCard'
import { useAppContext } from '../context/AppContext'

const RecentlyViewed = () => {
    const { recentlyViewed } = useAppContext()

    return (
        <div className='mt-16 flex flex-col'>
            <div className='flex flex-col items-end w-max'>
                <p className='text-2xl font-medium uppercase'>Recently Viewed</p>
                <div className='w-16 h-0.5 bg-primary rounded-full'></div>
            </div>
            {recentlyViewed.length > 0 ? (
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-6 lg:grid-cols-5 mt-6'>
                    {recentlyViewed.map((product) => <ProductCard key={product._id} product={product} />)}
                </div>
            ) : (
                <div className='flex items-center justify-center h-[50vh]'>
                    <p className='text-2xl font-medium text-primary'>No recently viewed products yet.</p>
                </div>
            )}
        </div>
    )
}

export default RecentlyViewed
