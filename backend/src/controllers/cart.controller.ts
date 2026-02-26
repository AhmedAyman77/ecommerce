import { Request, Response } from 'express';
import { DAOFactory } from '../databases/DAOFactory';

const userDAO = DAOFactory.getInstance().getUserDAO();
const productDAO = DAOFactory.getInstance().getProductDAO();

export async function getCartProducts(req: Request, res: Response) {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await userDAO.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const productIds = user.cartItems.map(item => item.productId);
    const products = await Promise.all(
      productIds.map(id => productDAO.findById(id))
    );

    const cartItems = products
      .filter(p => p !== null)
      .map(product => {
        const item = user.cartItems.find(cartItem => cartItem.productId === product!._id);
        return {
          ...product,
          quantity: item?.quantity || 1,
        };
      });

    res.json(cartItems);
  } catch (error: any) {
    console.error('Error in getCartProducts controller', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function addToCart(req: Request, res: Response) {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { productId } = req.body;
    await userDAO.addToCart(req.user._id, productId, 1);
    
    const cart = await userDAO.getCart(req.user._id);
    res.json(cart);
  } catch (error: any) {
    console.error('Error in addToCart controller', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function removeAllFromCart(req: Request, res: Response) {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { productId } = req.body;
    
    if (!productId) {
      await userDAO.clearCart(req.user._id);
    } else {
      await userDAO.removeFromCart(req.user._id, productId);
    }

    const cart = await userDAO.getCart(req.user._id);
    res.json(cart);
  } catch (error: any) {
    console.error('Error in removeAllFromCart controller', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function updateQuantity(req: Request, res: Response) {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id: productId } = req.params;
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
  } catch (error: any) {
    console.error('Error in updateQuantity controller', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}