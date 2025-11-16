import express from 'express';
import { Payment } from '../models/Payment';
import { Booking } from '../models/Booking';
import { User } from '../models/User';
import { auth } from '../middleware/auth';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const router = express.Router();

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_key_secret'
});

// Create payment order
router.post('/order', auth, async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: 'Booking ID is required'
      });
    }

    // Get booking details
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check if user owns this booking
    if (booking.farmerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this booking'
      });
    }

    // Check booking status
    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        error: 'Payment can only be made for confirmed bookings'
      });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ bookingId });
    if (existingPayment && existingPayment.status !== 'failed') {
      return res.status(400).json({
        success: false,
        error: 'Payment already initiated or completed for this booking'
      });
    }

    // Create Razorpay order
    const options = {
      amount: booking.totalAmount * 100, // Convert to paise
      currency: 'INR',
      receipt: `AGR-${booking.bookingNumber}`,
      notes: {
        bookingId: booking._id.toString(),
        farmerId: booking.farmerId.toString(),
        ownerId: booking.ownerId.toString()
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Create payment record
    const payment = new Payment({
      paymentId: razorpayOrder.id,
      bookingId,
      amount: booking.totalAmount,
      currency: 'INR',
      status: 'pending',
      paymentMethod: 'online',
      gateway: 'razorpay',
      createdAt: new Date()
    });

    await payment.save();

    res.json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: booking.totalAmount,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        paymentId: payment._id
      }
    });

  } catch (error: any) {
    console.error('Error creating payment order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment order'
    });
  }
});

// Verify payment
router.post('/verify', auth, async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      paymentId
    } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !paymentId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required payment verification fields'
      });
    }

    // Get payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment record not found'
      });
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'rzp_test_key_secret')
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      payment.status = 'failed';
      payment.failureReason = 'Invalid payment signature';
      await payment.save();

      return res.status(400).json({
        success: false,
        error: 'Payment verification failed'
      });
    }

    // Update payment record
    payment.status = 'completed';
    payment.gatewayTransactionId = razorpay_payment_id;
    payment.completedAt = new Date();

    await payment.save();

    // Update booking payment status
    const booking = await Booking.findById(payment.bookingId);
    if (booking) {
      booking.paymentStatus = 'paid';
      await booking.save();
    }

    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        status: payment.status,
        transactionId: razorpay_payment_id
      }
    });

  } catch (error: any) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment'
    });
  }
});

// Get payment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('bookingId', 'bookingNumber totalAmount status')
      .populate('farmerId', 'firstName lastName email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Check access permissions
    const user = await User.findById(req.user.id);
    const hasAccess = user?.userType === 'admin' ||
                     payment.farmerId._id.toString() === req.user.id ||
                     payment.bookingId.ownerId.toString() === req.user.id;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this payment'
      });
    }

    res.json({
      success: true,
      data: payment
    });

  } catch (error: any) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment'
    });
  }
});

// Get payments for user
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    let filters: any = {};

    // Filter based on user type
    if (user.userType === 'farmer') {
      filters.farmerId = req.user.id;
    } else if (user.userType === 'owner') {
      // Owners can see payments for their bookings
      const bookings = await Booking.find({ ownerId: req.user.id }).select('_id');
      filters.bookingId = { $in: bookings.map(b => b._id) };
    }
    // Admin can see all payments (no filters)

    // Additional filters
    if (req.query.status) {
      filters.status = req.query.status;
    }

    if (req.query.paymentMethod) {
      filters.paymentMethod = req.query.paymentMethod;
    }

    if (req.query.startDate) {
      filters.createdAt = { $gte: new Date(req.query.startDate as string) };
    }

    if (req.query.endDate) {
      filters.createdAt = { $lte: new Date(req.query.endDate as string) };
    }

    const sort: any = {};
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const validSortFields = ['createdAt', 'amount', 'status'];
    if (validSortFields.includes(sortBy)) {
      sort[sortBy] = sortOrder;
    } else {
      sort.createdAt = -1;
    }

    const payments = await Payment.find(filters)
      .populate('bookingId', 'bookingNumber totalAmount status')
      .populate('farmerId', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(filters);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payments'
    });
  }
});

// Process refund
router.post('/:id/refund', auth, async (req, res) => {
  try {
    const { reason } = req.body;

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Check if user is admin or payment owner
    const user = await User.findById(req.user.id);
    const hasPermission = user?.userType === 'admin' ||
                         payment.farmerId.toString() === req.user.id;

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied to process refund'
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Only completed payments can be refunded'
      });
    }

    if (payment.refundStatus && payment.refundStatus !== 'failed') {
      return res.status(400).json({
        success: false,
        error: 'Refund already processed for this payment'
      });
    }

    try {
      // Process refund via Razorpay
      const refund = await razorpay.payments.refund(payment.gatewayTransactionId, {
        amount: payment.amount * 100, // Convert to paise
        notes: {
          reason: reason || 'Customer requested refund'
        }
      });

      // Update payment record
      payment.refundStatus = 'processing';
      payment.refundId = refund.id;
      payment.refundReason = reason;
      await payment.save();

      res.json({
        success: true,
        data: {
          refundId: refund.id,
          status: 'processing'
        }
      });

    } catch (refundError: any) {
      console.error('Refund processing error:', refundError);

      payment.refundStatus = 'failed';
      payment.refundFailureReason = refundError.message || 'Refund processing failed';
      await payment.save();

      res.status(500).json({
        success: false,
        error: 'Failed to process refund'
      });
    }

  } catch (error: any) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process refund'
    });
  }
});

// Create cash payment (owner only)
router.post('/cash', auth, async (req, res) => {
  try {
    const { bookingId, amount, collectedAt } = req.body;

    if (!bookingId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Booking ID and amount are required'
      });
    }

    // Verify user is owner
    const user = await User.findById(req.user.id);
    if (!user || user.userType !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Only owners can record cash payments'
      });
    }

    // Get booking details
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Verify booking ownership
    if (booking.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this booking'
      });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ bookingId });
    if (existingPayment && existingPayment.status !== 'failed') {
      return res.status(400).json({
        success: false,
        error: 'Payment already recorded for this booking'
      });
    }

    // Create cash payment record
    const payment = new Payment({
      paymentId: `CASH-${Date.now()}`,
      bookingId,
      farmerId: booking.farmerId,
      amount: parseFloat(amount),
      currency: 'INR',
      status: 'completed',
      paymentMethod: 'cash',
      gateway: 'manual',
      completedAt: collectedAt ? new Date(collectedAt) : new Date(),
      createdAt: new Date()
    });

    await payment.save();

    // Update booking payment status
    booking.paymentStatus = 'paid';
    await booking.save();

    res.status(201).json({
      success: true,
      data: payment
    });

  } catch (error: any) {
    console.error('Error creating cash payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create cash payment'
    });
  }
});

// Get payment statistics
router.get('/stats/dashboard', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    let matchStage: any = {};

    if (user.userType === 'farmer') {
      matchStage.farmerId = user._id;
    } else if (user.userType === 'owner') {
      // For owners, get payments from their bookings
      const bookings = await Booking.find({ ownerId: user._id }).select('_id');
      matchStage.bookingId = { $in: bookings.map(b => b._id) };
    }
    // Admin can see all payments

    const stats = await Payment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          completedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pendingPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          failedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' },
          onlinePayments: {
            $sum: { $cond: [{ $eq: ['$paymentMethod', 'online'] }, 1, 0] }
          },
          cashPayments: {
            $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get monthly revenue trend
    const monthlyTrend = await Payment.aggregate([
      { $match: { ...matchStage, status: 'completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      data: {
        ...stats[0],
        monthlyTrend
      }
    });

  } catch (error: any) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment statistics'
    });
  }
});

// Webhook handler for Razorpay
router.post('/webhook', async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Webhook secret not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    const webhookSignature = req.headers['x-razorpay-signature'] as string;
    const webhookBody = JSON.stringify(req.body);

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(webhookBody)
      .digest('hex');

    if (expectedSignature !== webhookSignature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    // Handle different webhook events
    if (event === 'payment.captured') {
      const paymentEntity = payload.payment.entity;

      // Find and update payment record
      const payment = await Payment.findOne({
        paymentId: paymentEntity.order_id
      });

      if (payment) {
        payment.status = 'completed';
        payment.gatewayTransactionId = paymentEntity.id;
        payment.completedAt = new Date();
        await payment.save();

        // Update booking payment status
        const booking = await Booking.findById(payment.bookingId);
        if (booking) {
          booking.paymentStatus = 'paid';
          await booking.save();
        }
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = payload.payment.entity;

      const payment = await Payment.findOne({
        paymentId: paymentEntity.order_id
      });

      if (payment) {
        payment.status = 'failed';
        payment.failureReason = paymentEntity.error_description || 'Payment failed';
        await payment.save();
      }
    }

    res.json({ received: true });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;