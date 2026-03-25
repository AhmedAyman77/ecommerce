import { Request, Response } from 'express';
import { getStripe } from '../config/stripe';
import { DAOFactory } from '../databases/DAOFactory';
import { AuthorizationError } from '../types/error.types';
import { redisClient } from '../config/redis';

const couponDAO = DAOFactory.getInstance().getCouponDAO();
const orderDAO = DAOFactory.getInstance().getOrderDAO();
const userDAO = DAOFactory.getInstance().getUserDAO();

export async function createCheckoutSession(req: Request, res: Response) {
  console.log("Creating checkout session for user:", req.user?._id);
  if (!req.user?._id) {
    throw new AuthorizationError('User not authenticated');
  }

  const { products, couponCode } = req.body;
  
  let totalAmount = 0;
  
  const lineItems = products.map((product: any) => {
    const amount = Math.round(product.price * 100);
    totalAmount += amount * product.quantity;
    
    return {
      price_data: {
        currency: 'usd',
        product_data: {
          name: product.name,
          images: [product.image],
        },
        unit_amount: amount,
      },
      quantity: product.quantity || 1,
    };
  });
  
  let coupon = null;
  if (couponCode) {
    coupon = await couponDAO.findByCode(couponCode);
    if (coupon && coupon.userId === req.user._id && coupon.isActive) {
      totalAmount -= Math.round((totalAmount * coupon.discountPercentage) / 100);
    }
  }
  
  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
    discounts: coupon
    ? [{ coupon: await createStripeCoupon(coupon.discountPercentage) }]
    : [],
    metadata: {
      userId: req.user._id,
      couponCode: couponCode || '',
      products: JSON.stringify(
        products.map((p: any) => ({
          id: p._id,
          quantity: p.quantity,
          price: p.price,
        }))
      ),
    },
  });
  
  res.status(200).json({ id: session.id, url: session.url, totalAmount: totalAmount / 100 });
}

export async function checkoutSuccess(req: Request, res: Response) {
  const { sessionId } = req.body;

  // Redis lock
  const lockKey = `lock:checkout:${sessionId}`;
  const lock = await redisClient.set(lockKey, '1', {
    NX: true, // will return null if key already exists
    EX: 30
  });

  if (!lock) {
    // Another request is processing — wait then return the created order
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Duplicate check (handles reloads)
  const existingOrder = await orderDAO.findByStripeSessionId(sessionId);
  if (existingOrder) {
    console.log('Order already exists for session ID:', sessionId);
    return res.status(200).json({
      success: true,
      message: 'Order already processed.',
      orderId: existingOrder._id,
    });
  }

  console.log("new order, retrieving session from Stripe...");

  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  
  if (session.payment_status !== 'paid') {
    return res.status(400).json({
      success: false,
      message: 'Payment not completed yet',
    });
  }

  if (session.metadata?.couponCode) {
    const coupon = await couponDAO.findByCode(session.metadata.couponCode);
    if (coupon) {
      await couponDAO.deactivate(coupon._id!);
    }
  }
  
  const products = JSON.parse(session.metadata?.products || '[]');
  const newOrder = await orderDAO.create({
    user: session.metadata?.userId || '',
    products: products.map((product: any) => ({
      product: product.id,
      quantity: product.quantity,
      price: product.price,
    })),
    totalAmount: (session.amount_total || 0) / 100,
    stripeSessionId: sessionId,
  });

  if (session.amount_total! / 100 >= 20000) {
    await createNewCoupon(session.metadata?.userId!);
  }

  // remove cart items from user
  await userDAO.clearCart(session.metadata?.userId!);

  res.status(200).json({
    success: true,
    message: 'Payment successful, order created, and coupon deactivated if used.',
    orderId: newOrder._id,
  });
}

async function createStripeCoupon(discountPercentage: number): Promise<string> {
  const coupon = await getStripe().coupons.create({
    percent_off: discountPercentage,
    duration: 'once',
  });

  return coupon.id;
}

async function createNewCoupon(userId: string): Promise<void> {
  const existing = await couponDAO.findByUserId(userId);
  if (existing) {
    await couponDAO.delete(existing._id!);
  }

  const code = 'GIFT' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await couponDAO.create({
    code,
    discountPercentage: 10,
    expirationDate,
    isActive: true,
    userId,
  });
}