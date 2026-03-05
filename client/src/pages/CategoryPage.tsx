import { useEffect } from 'react';
import { useProductStore } from '../stores/useProductStore';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';

const CategoryPage = () => {
	const {
		fetchProductsByCategory,
		products,
		loading,
		searchQuery,
		setSearchQuery,
		setActiveCategory,
	} = useProductStore();

	const { category } = useParams<{ category: string }>();

	useEffect(() => {
		if (category) {
			setActiveCategory(category);       // tell the store we're in this category
			fetchProductsByCategory(category); // load this category's products
		}

		// On unmount: clear category context and search
		return () => {
			setActiveCategory(null);
			setSearchQuery('');
		};
	}, [category]);

	return (
		<div className='min-h-screen'>
			<div className='relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
				<motion.h1
					className='text-center text-4xl sm:text-5xl font-bold text-emerald-400 mb-6'
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
				>
					{category ? category.charAt(0).toUpperCase() + category.slice(1) : ''}
				</motion.h1>

				{/* Search bar */}
				<motion.div
					className='mb-8'
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.2 }}
				>
					<SearchBar
						value={searchQuery}
						onChange={setSearchQuery}
						placeholder={`Search in ${category ?? 'category'}...`}
					/>
					{searchQuery && (
						<p className='text-center text-gray-400 mt-3 text-sm'>
							{products.length === 0
								? 'No products found'
								: `${products.length} result${products.length !== 1 ? 's' : ''} for "${searchQuery}"`}
						</p>
					)}
				</motion.div>

				<motion.div
					className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center'
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.3 }}
				>
					{!loading && products.length === 0 && (
						<h2 className='text-3xl font-semibold text-gray-300 text-center col-span-full'>
							{searchQuery
								? `No products match "${searchQuery}"`
								: 'No products found'}
						</h2>
					)}

					{products.map((product) => (
						<ProductCard key={product._id} product={product} />
					))}
				</motion.div>
			</div>
		</div>
	);
};

export default CategoryPage;