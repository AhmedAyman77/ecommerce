import { Request, Response } from 'express';
import { DAOFactory } from '../databases/DAOFactory';
import { AuthorizationError, NotFoundError, ValidationError } from '../types/error.types';

const couponDAO = DAOFactory.getInstance().getCouponDAO();

export async function getCoupon(req: Request, res: Response) {
  if (!req.user?._id) {
    throw new AuthorizationError('User not authenticated');
  }

  const coupon = await couponDAO.findByUserId(req.user._id);
  res.json(coupon || null);
}

export async function validateCoupon(req: Request, res: Response) {
  if (!req.user?._id) {
    throw new AuthorizationError('User not authenticated');
  }

  const { code } = req.body;
  const coupon = await couponDAO.findByCode(code);
  console.log(`Validating coupon code: ${code} for user: ${req.user._id} -> ${coupon}`);

  if (!coupon || coupon.userId !== req.user._id || !coupon.isActive) {
    throw new NotFoundError('Coupon not found');
  }

  if (coupon.expirationDate < new Date()) {
    await couponDAO.deactivate(coupon._id!);
    throw new ValidationError('Coupon expired');
  }

  res.json({
    message: 'Coupon is valid',
    code: coupon.code,
    discountPercentage: coupon.discountPercentage,
  });
}