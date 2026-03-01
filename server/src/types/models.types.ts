interface BaseEntity {
    _id?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface User extends BaseEntity {
    name: string;
    email: string;
    password: string;
    role: 'customer' | 'admin';
    cartItems: CartItem[];
}

export interface CartItem {
    productId: string;
    quantity: number;
}

export interface Product extends BaseEntity {
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    isFeatured: boolean;
}

export interface Order extends BaseEntity {
    user: string;
    products: OrderProduct[];
    totalAmount: number;
    stripeSessionId: string;
}

export interface OrderProduct {
    product: string;
    quantity: number;
    price: number;
}

export interface Coupon extends BaseEntity {
    code: string;
    discountPercentage: number;
    expirationDate: Date;
    isActive: boolean;
    userId: string;
}