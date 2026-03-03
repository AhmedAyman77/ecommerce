import { AxiosError } from "axios";
import { toast } from "react-hot-toast";
import { create } from "zustand";
import axiosInstance from "../lib/axios";

interface User {
	_id: string;
	name: string;
	email: string;
	role: "customer" | "admin";
}

interface SignupData {
	name: string;
	email: string;
	password: string;
	confirmPassword: string;
}

interface UserStore {
	user: User | null;
	loading: boolean;
	checkingAuth: boolean;
	signup: (data: SignupData) => Promise<void>;
	login: (email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	checkAuth: () => Promise<void>;
	refreshToken: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
	user: null,
	loading: false,
	checkingAuth: true,

	signup: async ({ name, email, password, confirmPassword }) => {
		set({ loading: true });

		if (password !== confirmPassword) {
			set({ loading: false });
			toast.error("Passwords do not match");
			return;
		}

		try {
			const res = await axiosInstance.post<User>("/auth/signup", { name, email, password });
			set({ user: res.data, loading: false });
		} catch (error) {
			set({ loading: false });
			const err = error as AxiosError<{ message: string }>;
			toast.error(err.response?.data?.message || "An error occurred");
		}
	},

	login: async (email, password) => {
		set({ loading: true });

		try {
			const res = await axiosInstance.post<User>("/auth/login", { email, password });
			set({ user: res.data, loading: false });
		} catch (error) {
			set({ loading: false });
			const err = error as AxiosError<{ message: string }>;
			toast.error(err.response?.data?.message || "An error occurred");
		}
	},

	logout: async () => {
		try {
			await axiosInstance.post("/auth/logout");
			set({ user: null });
		} catch (error) {
			const err = error as AxiosError<{ message: string }>;
			toast.error(err.response?.data?.message || "An error occurred during logout");
		}
	},

	checkAuth: async () => {
		set({ checkingAuth: true });
		try {
			const response = await axiosInstance.get<User>("/auth/profile");
			set({ user: response.data, checkingAuth: false });
		} catch (error) {
			const err = error as AxiosError;
			console.log(err.message);
			set({ checkingAuth: false, user: null });
		}
	},

	refreshToken: async () => {
		// Prevent multiple simultaneous refresh attempts
		if (get().checkingAuth) return;

		set({ checkingAuth: true });
		try {
			await axiosInstance.post("/auth/refresh-token");
			set({ checkingAuth: false });
		} catch (error) {
			set({ user: null, checkingAuth: false });
			throw error;
		}
	},
}));

// Axios interceptor for token refresh
let refreshPromise: Promise<void> | null = null;

axiosInstance.interceptors.response.use(
	(response) => response,
	async (error: AxiosError) => {
		const originalRequest = error.config as typeof error.config & { _retry?: boolean };

		// Don't intercept auth routes — a 401 on login/signup/refresh is a real error,
		// not an expired token. Intercepting these causes an infinite loop.
		const isAuthRoute = originalRequest?.url?.includes("/auth/");
		if (isAuthRoute) {
			return Promise.reject(error);
		}

		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				// If a refresh is already in progress, wait for it to complete
				if (refreshPromise) {
					await refreshPromise;
					return axiosInstance(originalRequest!);
				}

				// Start a new refresh process
				refreshPromise = useUserStore.getState().refreshToken();
				await refreshPromise;
				refreshPromise = null;

				return axiosInstance(originalRequest!);
			} catch (refreshError) {
				// If refresh fails, logout and reject
				useUserStore.getState().logout();
				refreshPromise = null;
				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	}
);