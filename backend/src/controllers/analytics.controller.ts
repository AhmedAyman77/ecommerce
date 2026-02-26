import { Request, Response } from 'express';
import { DAOFactory } from '../databases/DAOFactory';

const orderDAO = DAOFactory.getInstance().getOrderDAO();
const userDAO = DAOFactory.getInstance().getUserDAO();
const productDAO = DAOFactory.getInstance().getProductDAO();

export async function getAnalyticsData(_: Request, res: Response) {
  try {
    const [totalUsers, totalProducts, orders] = await Promise.all([
      userDAO.findAll().then(users => users.length),
      productDAO.findAll().then(products => products.length),
      orderDAO.findAll(),
    ]);

    const totalSales = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    res.json({
      users: totalUsers,
      products: totalProducts,
      totalSales,
      totalRevenue,
    });
  } catch (error: any) {
    console.error('Error in getAnalyticsData', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function getDailySalesData(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query;
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const orders = await orderDAO.findAll();
    
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt!);
      return orderDate >= start && orderDate <= end;
    });

    // Group by date
    const salesByDate: Record<string, { sales: number; revenue: number }> = {};
    
    filteredOrders.forEach(order => {
      const dateKey = new Date(order.createdAt!).toISOString().split('T')[0];
      if (!salesByDate[dateKey]) {
        salesByDate[dateKey] = { sales: 0, revenue: 0 };
      }
      salesByDate[dateKey].sales += 1;
      salesByDate[dateKey].revenue += order.totalAmount;
    });

    const dateArray = getDatesInRange(start, end);
    const dailySalesData = dateArray.map(date => ({
      date,
      sales: salesByDate[date]?.sales || 0,
      revenue: salesByDate[date]?.revenue || 0,
    }));

    res.json(dailySalesData);
  } catch (error: any) {
    console.error('Error in getDailySalesData', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

function getDatesInRange(startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}