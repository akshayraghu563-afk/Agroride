import express from 'express';
import { Vehicle } from '../models/Vehicle';
import { User } from '../models/User';
import { auth } from '../middleware/auth';
import { upload } from '../lib/upload';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Get all vehicles with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const skip = (page - 1) * limit;

    const filters: any = {
      isActive: true,
      'documents.verificationStatus': 'approved'
    };

    // Location-based filtering
    if (req.query.lat && req.query.lng) {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      const radius = Math.min(parseInt(req.query.radius as string) || 50, 200); // max 200km

      filters.currentLocation = {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radius * 1000
        }
      };
    }

    // Vehicle type filters
    if (req.query.make) {
      filters.make = new RegExp(req.query.make as string, 'i');
    }
    if (req.query.model) {
      filters.model = new RegExp(req.query.model as string, 'i');
    }
    if (req.query.minYear) {
      filters.year = { $gte: parseInt(req.query.minYear as string) };
    }
    if (req.query.maxYear) {
      filters.year = { ...filters.year, $lte: parseInt(req.query.maxYear as string) };
    }
    if (req.query.minHorsepower) {
      filters.horsepower = { $gte: parseInt(req.query.minHorsepower as string) };
    }
    if (req.query.maxHorsepower) {
      filters.horsepower = { ...filters.horsepower, $lte: parseInt(req.query.maxHorsepower as string) };
    }
    if (req.query.maxHourlyRate) {
      filters.hourlyRate = { $lte: parseInt(req.query.maxHourlyRate as string) };
    }

    // Implement filters
    if (req.query.implements) {
      const implementsArray = (req.query.implements as string).split(',');
      filters['implements.type'] = { $in: implementsArray };
    }

    // Availability filter
    if (req.query.available === 'true') {
      filters.isAvailable = true;
      filters.maintenanceMode = false;
    }

    // Rating filter
    if (req.query.minRating) {
      filters['ratings.average'] = { $gte: parseFloat(req.query.minRating as string) };
    }

    const sort: any = {};
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const validSortFields = ['createdAt', 'hourlyRate', 'ratings.average', 'year', 'horsepower'];
    if (validSortFields.includes(sortBy)) {
      sort[sortBy] = sortOrder;
    } else {
      sort.createdAt = -1;
    }

    const vehicles = await Vehicle.find(filters)
      .populate('ownerId', 'firstName lastName phone email ratings')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Vehicle.countDocuments(filters);

    res.json({
      success: true,
      data: {
        vehicles,
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
    console.error('Error fetching vehicles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicles'
    });
  }
});

// Get vehicle by ID
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('ownerId', 'firstName lastName phone email ratings');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      data: vehicle
    });

  } catch (error: any) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicle'
    });
  }
});

// Create new vehicle (owner only)
router.post('/', auth, upload.array('photos', 10), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.userType !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Only owners can register vehicles'
      });
    }

    const vehicleData = JSON.parse(req.body.vehicleData);

    // Validate required fields
    const requiredFields = ['make', 'model', 'year', 'horsepower', 'registrationNumber', 'chassisNumber', 'hourlyRate'];
    const missingFields = requiredFields.filter(field => !vehicleData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Check for existing registration or chassis number
    const existingVehicle = await Vehicle.findOne({
      $or: [
        { registrationNumber: vehicleData.registrationNumber },
        { chassisNumber: vehicleData.chassisNumber }
      ]
    });

    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle with this registration or chassis number already exists'
      });
    }

    // Process uploaded photos
    const photos: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        photos.push(`/uploads/vehicles/${file.filename}`);
      });
    }

    // Create vehicle
    const vehicle = new Vehicle({
      ownerId: req.user.id,
      ...vehicleData,
      photos,
      documents: {
        registration: vehicleData.documents?.registration || '',
        insurance: vehicleData.documents?.insurance || '',
        pollution: vehicleData.documents?.pollution || '',
        verificationStatus: 'pending'
      }
    });

    await vehicle.save();

    // Populate owner details for response
    await vehicle.populate('ownerId', 'firstName lastName phone email');

    res.status(201).json({
      success: true,
      data: vehicle
    });

  } catch (error: any) {
    console.error('Error creating vehicle:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create vehicle'
    });
  }
});

// Update vehicle (owner only)
router.put('/:id', auth, upload.array('photos', 10), async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    // Check ownership
    if (vehicle.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Only vehicle owner can update vehicle details'
      });
    }

    const updateData = JSON.parse(req.body.vehicleData);

    // Prevent updating certain fields if vehicle is verified
    if (vehicle.documents.verificationStatus === 'approved') {
      const restrictedFields = ['registrationNumber', 'chassisNumber', 'documents'];
      const restrictedUpdates = restrictedFields.filter(field => updateData[field]);

      if (restrictedUpdates.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Cannot update verified fields: ${restrictedUpdates.join(', ')}`
        });
      }
    }

    // Process new photos if uploaded
    const photos: string[] = [...vehicle.photos];
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        photos.push(`/uploads/vehicles/${file.filename}`);
      });
    }

    // Update vehicle
    Object.assign(vehicle, updateData, { photos });

    // If documents are updated, reset verification status
    if (updateData.documents) {
      vehicle.documents.verificationStatus = 'pending';
      vehicle.documents.verifiedBy = undefined;
      vehicle.documents.verifiedAt = undefined;
      vehicle.documents.rejectionReason = undefined;
    }

    await vehicle.save();
    await vehicle.populate('ownerId', 'firstName lastName phone email');

    res.json({
      success: true,
      data: vehicle
    });

  } catch (error: any) {
    console.error('Error updating vehicle:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update vehicle'
    });
  }
});

// Delete vehicle (owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    // Check ownership
    if (vehicle.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Only vehicle owner can delete vehicle'
      });
    }

    // Check if vehicle has active bookings
    // This would need to be implemented when booking system is ready
    // For now, allow deletion

    // Soft delete by marking as inactive
    vehicle.isActive = false;
    await vehicle.save();

    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete vehicle'
    });
  }
});

// Get vehicles by owner (owner only)
router.get('/owner/my-vehicles', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const skip = (page - 1) * limit;

    const vehicles = await Vehicle.find({ ownerId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Vehicle.countDocuments({ ownerId: req.user.id });

    res.json({
      success: true,
      data: {
        vehicles,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching owner vehicles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicles'
    });
  }
});

// Update vehicle location (owner only)
router.put('/:id/location', auth, async (req, res) => {
  try {
    const { latitude, longitude, accuracy } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    // Check ownership
    if (vehicle.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Only vehicle owner can update location'
      });
    }

    // Update location
    vehicle.currentLocation = {
      type: 'Point',
      coordinates: [longitude, latitude],
      lastUpdated: new Date(),
      accuracy
    };

    await vehicle.save();

    res.json({
      success: true,
      data: {
        location: vehicle.currentLocation
      }
    });

  } catch (error: any) {
    console.error('Error updating vehicle location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update vehicle location'
    });
  }
});

// Toggle vehicle availability (owner only)
router.put('/:id/availability', auth, async (req, res) => {
  try {
    const { isAvailable } = req.body;

    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'isAvailable must be a boolean'
      });
    }

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    // Check ownership
    if (vehicle.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Only vehicle owner can update availability'
      });
    }

    vehicle.isAvailable = isAvailable;
    await vehicle.save();

    res.json({
      success: true,
      data: {
        isAvailable: vehicle.isAvailable
      }
    });

  } catch (error: any) {
    console.error('Error updating vehicle availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update vehicle availability'
    });
  }
});

// Verify vehicle documents (admin only)
router.put('/:id/verify', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can verify vehicle documents'
      });
    }

    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be approved or rejected'
      });
    }

    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required when rejecting documents'
      });
    }

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    vehicle.documents.verificationStatus = status;
    vehicle.documents.verifiedBy = req.user.id;
    vehicle.documents.verifiedAt = new Date();

    if (status === 'rejected') {
      vehicle.documents.rejectionReason = rejectionReason;
      vehicle.isAvailable = false;
    }

    await vehicle.save();
    await vehicle.populate('ownerId', 'firstName lastName phone email');

    res.json({
      success: true,
      data: vehicle
    });

  } catch (error: any) {
    console.error('Error verifying vehicle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify vehicle'
    });
  }
});

// Get vehicle statistics (admin only)
router.get('/admin/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can view statistics'
      });
    }

    const stats = await Vehicle.getVehicleStats();

    res.json({
      success: true,
      data: stats[0] || {
        total: 0,
        active: 0,
        available: 0,
        verified: 0,
        averageRating: 0,
        totalEarnings: 0
      }
    });

  } catch (error: any) {
    console.error('Error fetching vehicle stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicle statistics'
    });
  }
});

// Search vehicles with advanced filtering
router.post('/search', async (req, res) => {
  try {
    const {
      query,
      filters,
      location,
      pagination,
      sort
    } = req.body;

    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || 10, 100);
    const skip = (page - 1) * limit;

    const searchFilters: any = {
      isActive: true,
      'documents.verificationStatus': 'approved'
    };

    // Text search
    if (query) {
      searchFilters.$text = { $search: query };
    }

    // Apply additional filters
    if (filters) {
      Object.assign(searchFilters, filters);
    }

    // Location-based search
    if (location?.lat && location?.lng) {
      searchFilters.currentLocation = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [location.lng, location.lat]
          },
          $maxDistance: (location.radius || 50) * 1000
        }
      };
    }

    const sortOptions: any = {};
    if (sort) {
      sortOptions[sort.field] = sort.order === 'asc' ? 1 : -1;
    } else if (query) {
      sortOptions.score = { $meta: 'textScore' };
    } else {
      sortOptions.createdAt = -1;
    }

    const vehicles = await Vehicle.find(searchFilters)
      .populate('ownerId', 'firstName lastName phone ratings')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Vehicle.countDocuments(searchFilters);

    res.json({
      success: true,
      data: {
        vehicles,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error: any) {
    console.error('Error searching vehicles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search vehicles'
    });
  }
});

export default router;