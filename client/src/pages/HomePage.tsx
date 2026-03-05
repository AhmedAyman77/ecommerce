import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CategoryItem from '../components/CategoryItem';
import { useProductStore } from '../stores/useProductStore';
import FeaturedProducts from '../components/FeaturedProducts';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';

const categories = [
	{ href: '/jeans', name: 'Jeans', imageUrl: '/jeans.jpg' },
	{ href: '/t-shirts', name: 'T-shirts', imageUrl: '/tshirts.jpg' },
	{ href: '/shoes', name: 'Shoes', imageUrl: '/shoes.jpg' },
	{ href: '/glasses', name: 'Glasses', imageUrl: '/glasses.png' },
	{ href: '/jackets', name: 'Jackets', imageUrl: '/jackets.jpg' },
	{ href: '/suits', name: 'Suits', imageUrl: '/suits.jpg' },
	{ href: '/bags', name: 'Bags', imageUrl: '/bags.jpg' },
];

const HomePage = () => {
	const { fetchAllProducts, fetchFeaturedProducts, products, allProducts, loading, searchQuery, setSearchQuery } =
		useProductStore();
	const [isSearching, setIsSearching] = useState(false);
	const navigate = useNavigate();

	// On mount: load all products for search + featured for carousel
	useEffect(() => {
		fetchAllProducts();
	}, [fetchAllProducts]);

	useEffect(() => {
		fetchFeaturedProducts();
	}, [fetchFeaturedProducts]);

	const handleSearchChange = (value: string) => {
		setSearchQuery(value);
		setIsSearching(value.trim().length > 0);
	};

	const handleCategoryClick = (href: string) => {
		// Clear search when navigating to category
		setSearchQuery('');
		setIsSearching(false);
		navigate(`/category${href}`);
	};

	return (
		<div className='relative min-h-screen text-white overflow-hidden'>
			<div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
				<h1 className='text-center text-5xl sm:text-6xl font-bold text-emerald-400 mb-4'>
					Explore Our Categories
				</h1>
				<p className='text-center text-xl text-gray-300 mb-8'>
					Discover the latest trends in eco-friendly fashion
				</p>

				{/* Search bar */}
				<div className='mb-10'>
					<SearchBar
						value={searchQuery}
						onChange={handleSearchChange}
						placeholder='Search across all products...'
					/>
				</div>

				<AnimatePresence mode='wait'>
					{isSearching ? (
						// Search results view
						<motion.div
							key='search-results'
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{ duration: 0.2 }}
						>
							<p className='text-gray-400 mb-6 text-center'>
								{products.length === 0
									? 'No products found'
									: `${products.length} result${products.length !== 1 ? 's' : ''} for "${searchQuery}"`}
							</p>

							{products.length === 0 ? (
								<div className='text-center py-16'>
									<p className='text-gray-500 text-lg'>
										Try searching for a different product name or category.
									</p>
								</div>
							) : (
								<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
									{products.map((product) => (
										<ProductCard key={product._id} product={product} />
									))}
								</div>
							)}
						</motion.div>
					) : (
						// Default view: categories + featured
						<motion.div
							key='default-view'
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
						>
							<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
								{categories.map((category) => (
									<div
										key={category.name}
										onClick={() => handleCategoryClick(category.href)}
										className='cursor-pointer'
									>
										<CategoryItem category={category} />
									</div>
								))}
							</div>

							{!loading && allProducts.length > 0 && (
								<FeaturedProducts featuredProducts={allProducts.filter((p) => p.isFeatured)} />
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
};

export default HomePage;
