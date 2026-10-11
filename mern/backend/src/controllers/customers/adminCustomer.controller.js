import Order from '../../models/order.model.js';
import ApiError from '../../utils/ApiError.js';
import { escapeRegex } from '../../utils/query.js';
import { adminCustomerListQuerySchema } from '../../validators/customers/adminCustomer.schema.js';

// All routes here are admin only (see routes/customers/adminCustomer.routes.js).
// A customer is everyone who has placed an order, grouped by email, whether
// they checked out as a guest or with an account.

const PAID_STATUSES = ['confirmed', 'shipped', 'delivered'];

// One row per email. Name, phone and city come from their latest order, and
// "paid" only counts orders whose payment was confirmed.
const summarise = [
  { $sort: { createdAt: -1 } },
  {
    $group: {
      _id: '$customer.email',
      name: { $first: '$customer.name' },
      phone: { $first: '$customer.phone' },
      city: { $first: '$shippingAddress.city' },
      orders: { $sum: 1 },
      paid: { $sum: { $cond: [{ $in: ['$status', PAID_STATUSES] }, '$total', 0] } },
      lastOrderAt: { $first: '$createdAt' },
      firstOrderAt: { $last: '$createdAt' },
      registered: { $max: { $ne: ['$user', null] } },
    },
  },
  {
    $project: {
      _id: 0,
      email: '$_id',
      name: 1,
      phone: 1,
      city: 1,
      orders: 1,
      paid: 1,
      lastOrderAt: 1,
      firstOrderAt: 1,
      registered: 1,
    },
  },
];

// GET /api/admin/customers?q=&page=&limit=
export const getCustomers = async (req, res) => {
  const { q, page, limit } = adminCustomerListQuerySchema.parse(req.query);
  const pattern = { $regex: escapeRegex(q), $options: 'i' };
  const match = q
    ? [
        {
          $match: {
            $or: [
              { 'customer.name': pattern },
              { 'customer.email': pattern },
              { 'customer.phone': pattern },
            ],
          },
        },
      ]
    : [];

  const [result] = await Order.aggregate([
    ...match,
    ...summarise,
    { $sort: { lastOrderAt: -1, email: 1 } },
    {
      $facet: {
        items: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        total: [{ $count: 'count' }],
      },
    },
  ]);

  const total = result.total[0]?.count ?? 0;
  res.json({
    success: true,
    data: result.items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

// GET /api/admin/customers/:email
export const getCustomer = async (req, res) => {
  const email = req.params.email.toLowerCase();
  const [customer] = await Order.aggregate([{ $match: { 'customer.email': email } }, ...summarise]);
  if (!customer) throw new ApiError(404, 'Customer not found');

  const orders = await Order.find({ 'customer.email': email }).sort({ createdAt: -1 });
  res.json({ success: true, data: { ...customer, orderList: orders } });
};
