import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '../lib/axios';
import LoadingSpinner from './LoadingSpinner';
import ProductCard from './ProductCard';
import { AxiosError } from 'axios';

interface Product {
	_id: string;
	name: string;
	description: string;
	price: number;
	image: string;
	category: string;
	isFeatured: boolean;
}

const PeopleAlsoBought = () => {
	const [recommendations, setRecommendations] = useState<Product[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchRecommendations = async () => {
			try {
				const res = await axiosInstance.get<Product[]>('/products/recommendations');
				setRecommendations(res.data);
			} catch (error) {
				const err = error as AxiosError<{ message: string }>;
				toast.error(err.response?.data?.message || 'An error occurred while fetching recommendations');
			} finally {
				setIsLoading(false);
			}
		};

		fetchRecommendations();
	}, []);

	if (isLoading) return <LoadingSpinner />;

	return (
		<div className='mt-8'>
			<h3 className='text-2xl font-semibold text-emerald-400'>People also bought</h3>
			<div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
				{recommendations.map((product) => (
					<ProductCard key={product._id} product={product} />
				))}
			</div>
		</div>
	);
};

export default PeopleAlsoBought;
