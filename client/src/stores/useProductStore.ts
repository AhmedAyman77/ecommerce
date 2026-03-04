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
	loading: boolean;
	setProducts: (products: Product[]) => void;
	createProduct: (formData: FormData) => Promise<void>;
	fetchAllProducts: () => Promise<void>;
	fetchProductsByCategory: (category: string) => Promise<void>;
	deleteProduct: (productId: string) => Promise<void>;
	toggleFeaturedProduct: (productId: string) => Promise<void>;
	fetchFeaturedProducts: () => Promise<void>;
}

export const useProductStore = create<ProductStore>((set) => ({
	products: [],
	loading: false,

	setProducts: (products) => set({ products }),

	createProduct: async (formData) => {
		set({ loading: true });
		try {
			const res = await axiosInstance.post<Product>("/products", formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
			set((prevState) => ({
				products: [...prevState.products, res.data],
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
			set({ products: response.data.products, loading: false });
		} catch (error) {
			const err = error as AxiosError<{ message: string }>;
			set({ loading: false });
			toast.error(err.response?.data?.message || "Failed to fetch products");
		}
	},

	fetchProductsByCategory: async (category) => {
		set({ loading: true });
		try {
			const response = await axiosInstance.get<{ products: Product[] }>(`/products/category/${category}`);
			set({ products: response.data.products, loading: false });
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
				products: prevState.products.filter((product) => product._id !== productId),
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
			const response = await axiosInstance.patch<Product>(`/products/toggle-featured/${productId}`);
			set((prevState) => ({
				products: prevState.products.map((product) =>
					product._id === productId ? { ...product, isFeatured: response.data.isFeatured } : product
				),
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
			set({ products: response.data, loading: false });
		} catch (error) {
			const err = error as AxiosError<{ message: string }>;
			set({ loading: false });
			console.log("Error fetching featured products:", err.message);
		}
	},
}));
