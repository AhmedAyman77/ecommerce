import { Request, Response } from 'express';
import { DAOFactory } from '../databases/DAOFactory';
import { AuthorizationError, ValidationError } from '../types/error.types';

const userDAO = DAOFactory.getInstance().getUserDAO();
const productDAO = DAOFactory.getInstance().getProductDAO();

export async function getCartProducts(req: Request, res: Response) {
  if (!req.user?._id) {
    throw new AuthorizationError('User not authenticated');
  }

  const user = req.user;

  const productIds = user.cartItems.map(item => item.productId);
  const products = await productDAO.findByIds(productIds);

  const cartItems = products
    .map(product => {
      const item = user.cartItems.find(cartItem => cartItem.productId === product!._id);
      return {
        ...product,
        quantity: item!.quantity,
      };
    });

  res.json(cartItems);
}

export async function addToCart(req: Request, res: Response) {
  if (!req.user?._id) {
    throw new AuthorizationError('User not authenticated');
  }

  const { productId } = req.body;
  if (!productId) {
    throw new ValidationError('Product ID is required');
  }

  await userDAO.addToCart(req.user._id, productId, 1);
  
  const cart = await userDAO.getCart(req.user._id);
  res.json(cart);
}

export async function updateQuantity(req: Request, res: Response) {
  if (!req.user?._id) {
    throw new AuthorizationError('User not authenticated');
  }

  const { productId } = req.params;
  const { quantity } = req.body;

  if (quantity === 0) {
    await userDAO.removeFromCart(req.user._id, productId);
  } else {
    // Remove then add with new quantity
    await userDAO.removeFromCart(req.user._id, productId);
    await userDAO.addToCart(req.user._id, productId, quantity);
  }

  const cart = await userDAO.getCart(req.user._id);
  res.json(cart);
}

export async function removeProductFromCart(req: Request, res: Response) {
  if (!req.user?._id) {
    throw new AuthorizationError('User not authenticated');
  }
  
  const { productId } = req.params;
  await userDAO.removeFromCart(req.user._id, productId);
  
  const cart = await userDAO.getCart(req.user._id);
  res.json(cart);
}