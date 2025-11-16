import express from 'express';
import { Booking } from '../models/Booking';
import { Vehicle } from '../models/Vehicle';
import { User } from '../models/User';
import { auth } from '../middleware/auth';
import { Payment } from '../models/Payment';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Create new booking
router.post('/', auth, async (req, res) => {
  try {
    const {
      vehicleId,
      startTime,
      endTime,
      serviceType,
      farmSize,
      notes,
      workLocation
    } = req.body;

    // Validate required fields
    if (!vehicleId || !startTime || !endTime || !serviceType || !farmSize) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: vehicleId, startTime, endTime, serviceType, farmSize'
      });
    }

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        error: 'End time must be after start time'
      });
    }

    if (start < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Start time cannot be in the past'
      });
    }

    // Check vehicle exists and is available
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    if (!vehicle.isActive || !vehicle.isAvailable) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle is not available for booking'
      });
    }

    if (vehicle.documents.verificationStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Vehicle documents are not verified'
      });
    }

    // Check for conflicting bookings
    const conflictingBooking = await Booking.findOne({
      vehicleId,
      status: { $in: ['pending', 'confirmed', 'in_progress'] },
      $or: [
        { startTime: { $lt: end }, endTime: { $gt: start } }
      ]
    });

    if (conflictingBooking) {
      return res.status(409).json({
        success: false,
        error: 'Vehicle is already booked for the requested time slot'
      });
    }

    // Calculate total amount
    const durationHours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    const totalAmount = durationHours * vehicle.hourlyRate;

    // Create booking
    const booking = new Booking({
      bookingNumber: `AGR${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      vehicleId,
      farmerId: req.user.id,
      ownerId: vehicle.ownerId,
      startTime: start,
      endTime: end,
      duration: durationHours,
      serviceType,
      farmSize: parseFloat(farmSize),
      workLocation: workLocation || {
        type: 'Point',
        coordinates: [0, 0], // Default, should be provided
        address: ''
      },
      totalAmount,
      status: 'pending',
      paymentStatus: 'pending'
    });

    if (notes) {
      booking.notes = notes;
    }

    await booking.save();

    // Populate related data for response
    await booking.populate([
      { path: 'vehicleId', select: 'make model year hourlyRate photos' },
      { path: 'farmerId', select: 'firstName lastName phone email' },
      { path: 'ownerId', select: 'firstName lastName phone email' }
    ]);

    res.status(201).json({
      success: true,
      data: booking
    });

  } catch (error: any) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking'
    });
  }
});

// Get all bookings for user (farmer or owner)
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
      filters.ownerId = req.user.id;
    } else {
      // Admin can see all bookings
      // Add admin-specific filters if needed
    }

    // Additional filters
    if (req.query.status) {
      filters.status = req.query.status;
    }

    if (req.query.paymentStatus) {
      filters.paymentStatus = req.query.paymentStatus;
    }

    if (req.query.startDate) {
      filters.startTime = { $gte: new Date(req.query.startDate as string) };
    }

    if (req.query.endDate) {
      filters.endTime = { $lte: new Date(req.query.endDate as string) };
    }

    const sort: any = {};
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const validSortFields = ['createdAt', 'startTime', 'endTime', 'totalAmount', 'status'];
    if (validSortFields.includes(sortBy)) {
      sort[sortBy] = sortOrder;
    } else {
      sort.createdAt = -1;
    }

    const bookings = await Booking.find(filters)
      .populate('vehicleId', 'make model year hourlyRate photos registrationNumber')
      .populate('farmerId', 'firstName lastName phone email')
      .populate('ownerId', 'firstName lastName phone email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Booking.countDocuments(filters);

    res.json({
      success: true,
      data: {
        bookings,
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
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings'
    });
  }
});

// Get booking by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('vehicleId', 'make model year hourlyRate photos registrationNumber documents')
      .populate('farmerId', 'firstName lastName phone email')
      .populate('ownerId', 'firstName lastName phone email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check if user has access to this booking
    const user = await User.findById(req.user.id);
    const hasAccess = user?.userType === 'admin' ||
                     booking.farmerId._id.toString() === req.user.id ||
                     booking.ownerId._id.toString() === req.user.id;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this booking'
      });
    }

    res.json({
      success: true,
      data: booking
    });

  } catch (error: any) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking'
    });
  }
});

// Update booking status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, reason } = req.body;

    if (!['confirmed', 'cancelled', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    const user = await User.findById(req.user.id);

    // Check permissions based on status and user type
    let hasPermission = false;

    if (user?.userType === 'admin') {
      hasPermission = true;
    } else if (user?.userType === 'farmer' && booking.farmerId.toString() === req.user.id) {
      hasPermission = ['cancelled'].includes(status);
    } else if (user?.userType === 'owner' && booking.ownerId.toString() === req.user.id) {
      hasPermission = ['confirmed', 'in_progress', 'completed'].includes(status);
    }

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied to update booking status'
      });
    }

    // Validate status transitions
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: `Cannot change status from ${booking.status}`
      });
    }

    if (status === 'cancelled' && booking.status === 'in_progress') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel booking that is already in progress'
      });
    }

    // Update status
    const previousStatus = booking.status;
    booking.status = status;

    // Add timeline event
    booking.timeline.push({
      event: `status_${status}`,
      timestamp: new Date(),
      actor: user?.userType,
      userId: req.user.id,
      details: reason || `Status changed to ${status}`
    });

    // Handle status-specific logic
    if (status === 'completed') {
      booking.actualEndTime = new Date();

      // Update vehicle stats
      const vehicle = await Vehicle.findById(booking.vehicleId);
      if (vehicle) {
        vehicle.incrementBookings();
        vehicle.addEarnings(booking.totalAmount);
        await vehicle.save();
      }
    }

    await booking.save();

    // Populate for response
    await booking.populate([
      { path: 'vehicleId', select: 'make model year hourlyRate photos' },
      { path: 'farmerId', select: 'firstName lastName phone email' },
      { path: 'ownerId', select: 'firstName lastName phone email' }
    ]);

    res.json({
      success: true,
      data: booking
    });

  } catch (error: any) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking status'
    });
  }
});

// Update work progress
router.put('/:id/progress', auth, async (req, res) => {
  try {
    const { progress, notes, photos } = req.body;

    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        error: 'Progress must be a number between 0 and 100'
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    const user = await User.findById(req.user.id);

    // Only owner or admin can update progress
    const hasPermission = user?.userType === 'admin' ||
                         (user?.userType === 'owner' && booking.ownerId.toString() === req.user.id);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Only vehicle owner can update work progress'
      });
    }

    if (booking.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        error: 'Can only update progress for bookings in progress'
      });
    }

    // Update progress
    booking.workProgress = progress;

    // Add to timeline
    booking.timeline.push({
      event: 'progress_update',
      timestamp: new Date(),
      actor: user?.userType,
      userId: req.user.id,
      details: `Work progress updated to ${progress}%${notes ? ': ' + notes : ''}`,
      photos: photos || []
    });

    await booking.save();

    res.json({
      success: true,
      data: {
        progress: booking.workProgress,
        timeline: booking.timeline
      }
    });

  } catch (error: any) {
    console.error('Error updating progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update progress'
    });
  }
});

// Add booking review
router.post('/:id/review', auth, async (req, res) => {
  try {
    const { rating, review } = req.body;

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Only farmer can add review
    if (booking.farmerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Only the farmer can review a booking'
      });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Can only review completed bookings'
      });
    }

    if (booking.review) {
      return res.status(400).json({
        success: false,
        error: 'Review already submitted for this booking'
      });
    }

    // Add review
    booking.review = {
      rating,
      review: review || '',
      createdAt: new Date()
    };

    await booking.save();

    // Update vehicle rating
    const vehicle = await Vehicle.findById(booking.vehicleId);
    if (vehicle) {
      vehicle.updateRating(rating);
      await vehicle.save();
    }

    // Update owner rating
    const owner = await User.findById(booking.ownerId);
    if (owner) {
      owner.updateRating(rating);
      await owner.save();
    }

    res.json({
      success: true,
      data: booking.review
    });

  } catch (error: any) {
    console.error('Error adding review:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add review'
    });
  }
});

// Get booking statistics
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
      matchStage.ownerId = user._id;
    }

    const stats = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          pendingBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          inProgressBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          totalEarnings: { $sum: '$totalAmount' },
          averageRating: {
            $avg: '$review.rating'
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        totalBookings: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        inProgressBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        totalEarnings: 0,
        averageRating: 0
      }
    });

  } catch (error: any) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking statistics'
    });
  }
});

// Search bookings (admin only)
router.post('/admin/search', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can search bookings'
      });
    }

    const { filters, pagination, sort } = req.body;
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || 10, 100);
    const skip = (page - 1) * limit;

    const searchFilters: any = {};

    if (filters) {
      if (filters.bookingNumber) {
        searchFilters.bookingNumber = new RegExp(filters.bookingNumber, 'i');
      }
      if (filters.status) {
        searchFilters.status = filters.status;
      }
      if (filters.paymentStatus) {
        searchFilters.paymentStatus = filters.paymentStatus;
      }
      if (filters.vehicleId) {
        searchFilters.vehicleId = filters.vehicleId;
      }
      if (filters.farmerId) {
        searchFilters.farmerId = filters.farmerId;
      }
      if (filters.ownerId) {
        searchFilters.ownerId = filters.ownerId;
      }
      if (filters.startDate) {
        searchFilters.startTime = { $gte: new Date(filters.startDate) };
      }
      if (filters.endDate) {
        searchFilters.endTime = { $lte: new Date(filters.endDate) };
      }
    }

    const sortOptions: any = {};
    if (sort) {
      sortOptions[sort.field] = sort.order === 'asc' ? 1 : -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const bookings = await Booking.find(searchFilters)
      .populate('vehicleId', 'make model year hourlyRate registrationNumber')
      .populate('farmerId', 'firstName lastName phone email')
      .populate('ownerId', 'firstName lastName phone email')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Booking.countDocuments(searchFilters);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error: any) {
    console.error('Error searching bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search bookings'
    });
  }
});

export default router;