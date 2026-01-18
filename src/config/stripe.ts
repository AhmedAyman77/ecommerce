import Stripe from 'stripe';
import { env } from './env.config';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
	if (!stripeInstance) {
		if (!env.STRIPE_SECRET) {
			throw new Error('Stripe secret not configured');
		}
		stripeInstance = new Stripe(env.STRIPE_SECRET);
	}
	return stripeInstance;
}