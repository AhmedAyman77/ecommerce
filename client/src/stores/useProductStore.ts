import { create } from "zustand";
import toast from "react-hot-toast";
import axiosInstance from "../lib/axios";
import { AxiosError } from "axios";

interface Product {
	_id: string;
	name: string;
	description: string;
	price: number;
	image: string;
	category: string;
	isFeatured: boolean;
}

interface ProductStore {
	products: Product[];
	allProducts: Product[];
	loading: boolean;
	searchQuery: string;
	activeCategory: string | null; // tracks which category page we're on
	setProducts: (products: Product[]) => void;
	setSearchQuery: (query: string) => void;
	setActiveCategory: (category: string | null) => void;
	createProduct: (formData: FormData) => Promise<void>;
	fetchAllProducts: () => Promise<void>;
	fetchProductsByCategory: (category: string) => Promise<void>;
	deleteProduct: (productId: string) => Promise<void>;
	toggleFeaturedProduct: (productId: string) => Promise<void>;
	fetchFeaturedProducts: () => Promise<void>;
}

export const useProductStore = create<ProductStore>((set, get) => ({
	products: [],
	allProducts: [],
	loading: false,
	searchQuery: "",
	activeCategory: null,

	setProducts: (products) => set({ products, allProducts: products }),

	setActiveCategory: (category) => set({ activeCategory: category }),

	setSearchQuery: async (query) => {
		set({ searchQuery: query });

		if (!query.trim()) {
			// Restore full list when cleared
			set({ products: get().allProducts });
			return;
		}

		try {
			// Pass category if we're on a category page
			const { activeCategory } = get();
			const params = new URLSearchParams({ q: query });
			if (activeCategory) params.append("category", activeCategory);

			const res = await axiosInstance.get<{ products: Product[] }>(
				`/products/search?${params.toString()}`
			);
			set({ products: res.data.products });
		} catch (error) {
			const err = error as AxiosError<{ message: string }>;
			toast.error(err.response?.data?.message || "Search failed");
		}
	},

	createProduct: async (formData) => {
		set({ loading: true });
		try {
			const res = await axiosInstance.post<Product>("/products", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			set((prevState) => ({
				products: [...prevState.products, res.data],
				allProducts: [...prevState.allProducts, res.data],
				loading: false,
			}));
		} catch (error) {
			const err = error as AxiosError<{ message: string }>;
			toast.error(err.response?.data?.message || "Failed to create product");
			set({ loading: false });
		}
	},

	fetchAllProducts: async () => {
		set({ loading: true });
		try {
			const response = await axiosInstance.get<{ products: Product[] }>("/products");
			const fetched = response.data.products;
			set({ products: fetched, allProducts: fetched, loading: false, searchQuery: "" });
		} catch (error) {
			const err = error as AxiosError<{ message: string }>;
			set({ loading: false });
			toast.error(err.response?.data?.message || "Failed to fetch products");
		}
	},

	fetchProductsByCategory: async (category) => {
		set({ loading: true, searchQuery: "" });
		try {
			const response = await axiosInstance.get<{ products: Product[] }>(
				`/products/category/${category}`
			);
			const fetched = response.data.products;
			set({ products: fetched, allProducts: fetched, loading: false });
		} catch (error) {
			const err = error as AxiosError<{ message: string }>;
			set({ loading: false });
			toast.error(err.response?.data?.message || "Failed to fetch products");
		}
	},

	deleteProduct: async (productId) => {
		set({ loading: true });
		try {
			await axiosInstance.delete(`/products/${productId}`);
			set((prevState) => ({
				products: prevState.products.filter((p) => p._id !== productId),
				allProducts: prevState.allProducts.filter((p) => p._id !== productId),
				loading: false,
			}));
		} catch (error) {
			const err = error as AxiosError<{ message: string }>;
			set({ loading: false });
			toast.error(err.response?.data?.message || "Failed to delete product");
		}
	},

	toggleFeaturedProduct: async (productId) => {
		set({ loading: true });
		try {
			const response = await axiosInstance.patch<Product>(
				`/products/toggle-featured/${productId}`
			);
			const updater = (p: Product) =>
				p._id === productId ? { ...p, isFeatured: response.data.isFeatured } : p;
			set((prevState) => ({
				products: prevState.products.map(updater),
				allProducts: prevState.allProducts.map(updater),
				loading: false,
			}));
		} catch (error) {
			const err = error as AxiosError<{ message: string }>;
			set({ loading: false });
			toast.error(err.response?.data?.message || "Failed to update product");
		}
	},

	fetchFeaturedProducts: async () => {
		set({ loading: true });
		try {
			const response = await axiosInstance.get<Product[]>("/products/featured");
			const fetched = response.data;
			set({ products: fetched, allProducts: fetched, loading: false });
		} catch (error) {
			const err = error as AxiosError<{ message: string }>;
			set({ loading: false });
			console.log("Error fetching featured products:", err.message);
		}
	},
}));