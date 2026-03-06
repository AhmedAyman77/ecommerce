import { create } from "zustand";
import axiosInstance from "../lib/axios";
import { toast } from "react-hot-toast";
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

interface CartItem extends Product {
	quantity: number;
}

interface Coupon {
	code: string;
	discountPercentage: number;
}

interface CartStore {
	cart: CartItem[];
	coupon: Coupon | null;
	total: number;
	subtotal: number;
	isCouponApplied: boolean;
	getMyCoupon: () => Promise<void>;
	applyCoupon: (code: string) => Promise<void>;
	removeCoupon: () => void;
	getCartItems: () => Promise<void>;
	clearCart: () => void;
	addToCart: (product: Product) => Promise<void>;
	removeFromCart: (productId: string) => Promise<void>;
	updateQuantity: (productId: string, quantity: number) => Promise<void>;
	calculateTotals: () => void;
}

export const useCartStore = create<CartStore>((set, get) => ({
	cart: [],
	coupon: null,
	total: 0,
	subtotal: 0,
	isCouponApplied: false,

	getMyCoupon: async () => {
		try {
			const response = await axiosInstance.get<Coupon>("/coupons");
			set({ coupon: response.data });
		} catch (error) {
			console.error("Error fetching coupon:", error);
		}
	},

	applyCoupon: async (code) => {
		try {
			const response = await axiosInstance.post<Coupon>("/coupons/apply", { code });
			set({ coupon: response.data, isCouponApplied: true });
			get().calculateTotals();
			toast.success("Coupon applied successfully");
		} catch (error) {
			const err = error as AxiosError<{ message: string }>;
			toast.error(err.response?.data?.message || "Failed to apply coupon");
		}
	},

	removeCoupon: () => {
		set({ coupon: null, isCouponApplied: false });
		get().calculateTotals();
		toast.success("Coupon removed");
	},

	getCartItems: async () => {
		try {
			const res = await axiosInstance.get<CartItem[]>("/cart");
			set({ cart: res.data });
			get().calculateTotals();
		} catch (error) {
			set({ cart: [] });
			const err = error as AxiosError<{ message: string }>;
			toast.error(err.response?.data?.message || "An error occurred");
		}
	},

	clearCart: () => {
		set({ cart: [], coupon: null, total: 0, subtotal: 0 });
	},

	addToCart: async (product) => {
		try {
			await axiosInstance.post("/cart", { productId: product._id });
			toast.success("Product added to cart");

			set((prevState) => {
				const existingItem = prevState.cart.find((item) => item._id === product._id);
				const newCart = existingItem
					? prevState.cart.map((item) =>
							item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
					)
					: [...prevState.cart, { ...product, quantity: 1 }];
				return { cart: newCart };
			});
			get().calculateTotals();
		} catch (error) {
			const err = error as AxiosError<{ message: string }>;
			toast.error(err.response?.data?.message || "An error occurred");
		}
	},
	removeFromCart: async (productId) => {
		try {
			await axiosInstance.delete(`/cart/${productId}`);
			set((prevState) => ({ cart: prevState.cart.filter((item) => item._id !== productId) }));
			get().calculateTotals();
		} catch (error) {
			const err = error as AxiosError<{ message: string }>;
			toast.error(err.response?.data?.message || "Failed to remove item from cart");
		}
	},

	updateQuantity: async (productId, quantity) => {
		if (quantity === 0) {
			get().removeFromCart(productId);
			return;
		}

		try {
			await axiosInstance.put(`/cart/${productId}`, { quantity });
			set((prevState) => ({
				cart: prevState.cart.map((item) =>
					item._id === productId ? { ...item, quantity } : item
				),
			}));
			get().calculateTotals();
		} catch (error) {
			const err = error as AxiosError<{ message: string }>;
			toast.error(err.response?.data?.message || "Failed to update quantity");
		}
	},

	calculateTotals: () => {
		const { cart, coupon } = get();
		const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
		let total = subtotal;

		if (coupon) {
			const discount = subtotal * (coupon.discountPercentage / 100);
			total = subtotal - discount;
		}

		set({ subtotal, total });
	},
}));
