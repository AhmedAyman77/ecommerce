import { Search, X } from 'lucide-react';

interface SearchBarProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
}

const SearchBar = ({ value, onChange, placeholder = 'Search products...' }: SearchBarProps) => {
	return (
		<div className='relative w-full max-w-xl mx-auto'>
			<div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
				<Search className='h-5 w-5 text-gray-400' />
			</div>
			<input
				type='text'
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className='w-full pl-11 pr-10 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white
				placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500
				focus:border-transparent transition duration-200'
			/>
			{value && (
				<button
					onClick={() => onChange('')}
					className='absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400
					hover:text-white transition'
				>
					<X className='h-5 w-5' />
				</button>
			)}
		</div>
	);
};

export default SearchBar;
