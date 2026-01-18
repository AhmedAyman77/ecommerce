export interface User {
    _id?: string;
    name: string;
    email: string;
    password: string;
    role: 'customer' | 'admin';
    cartItems: CartItem[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CartItem {
    productId: string;
    quantity: number;
}

export interface Product {
    _id?: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    isFeatured: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Order {
    _id?: string;
    user: string;
    products: OrderProduct[];
    totalAmount: number;
    stripeSessionId: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface OrderProduct {
    product: string;
    quantity: number;
    price: number;
}

export interface Coupon {
    _id?: string;
    code: string;
    discountPercentage: number;
    expirationDate: Date;
    isActive: boolean;
    userId: string;
    createdAt?: Date;
    updatedAt?: Date;
}