import { Request, Response } from 'express';
import { DAOFactory } from '../databases/DAOFactory';

const couponDAO = DAOFactory.getInstance().getCouponDAO();

export async function getCoupon(req: Request, res: Response) {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const coupon = await couponDAO.findByUserId(req.user._id);
    res.json(coupon || null);
  } catch (error: any) {
    console.error('Error in getCoupon controller', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function validateCoupon(req: Request, res: Response) {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { code } = req.body;
    const coupon = await couponDAO.findByCode(code);

    if (!coupon || coupon.userId !== req.user._id || !coupon.isActive) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    if (coupon.expirationDate < new Date()) {
      await couponDAO.deactivate(coupon._id!);
      return res.status(404).json({ message: 'Coupon expired' });
    }

    res.json({
      message: 'Coupon is valid',
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
    });
  } catch (error: any) {
    console.error('Error in validateCoupon controller', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}