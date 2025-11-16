import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userType?: string;
}

interface LocationUpdate {
  vehicleId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
}

interface BookingUpdate {
  bookingId: string;
  status: string;
  actor: string;
  timestamp: Date;
  details?: string;
}

interface TrackingData {
  vehicleId: string;
  bookingId: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: Date;
  };
  status: string;
  estimatedArrival?: Date;
}

class SocketService {
  private io: Server | null = null;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private vehicleConnections: Map<string, Set<string>> = new Map(); // vehicleId -> Set of socketIds

  initialize(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'production'
          ? process.env.NEXTAUTH_URL
          : ['http://localhost:3000', 'http://localhost:3001'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
        const user = await User.findById(decoded.id).select('_id userType email phone');

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.userType = user.userType;

        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User connected: ${socket.userId} (${socket.userType})`);

      // Track user connection
      if (socket.userId) {
        if (!this.connectedUsers.has(socket.userId)) {
          this.connectedUsers.set(socket.userId, new Set());
        }
        this.connectedUsers.get(socket.userId)?.add(socket.id);
      }

      // Join user-specific rooms
      socket.join(`user:${socket.userId}`);
      socket.join(`type:${socket.userType}`);

      // Handle location updates (vehicle owners only)
      socket.on('location:update', async (data: LocationUpdate) => {
        try {
          if (socket.userType !== 'owner') {
            socket.emit('error', { message: 'Only owners can update vehicle locations' });
            return;
          }

          // Validate data
          if (!data.vehicleId || !data.latitude || !data.longitude) {
            socket.emit('error', { message: 'Invalid location data' });
            return;
          }

          // Update vehicle location in database
          const { Vehicle } = await import('../models/Vehicle');
          const vehicle = await Vehicle.findOneAndUpdate(
            {
              _id: data.vehicleId,
              ownerId: socket.userId
            },
            {
              currentLocation: {
                type: 'Point',
                coordinates: [data.longitude, data.latitude],
                lastUpdated: new Date(),
                accuracy: data.accuracy
              }
            },
            { new: true }
          );

          if (!vehicle) {
            socket.emit('error', { message: 'Vehicle not found or access denied' });
            return;
          }

          // Track vehicle connection
          if (!this.vehicleConnections.has(data.vehicleId)) {
            this.vehicleConnections.set(data.vehicleId, new Set());
          }
          this.vehicleConnections.get(data.vehicleId)?.add(socket.id);

          // Broadcast to relevant parties
          socket.to(`vehicle:${data.vehicleId}`).emit('location:updated', {
            vehicleId: data.vehicleId,
            location: {
              latitude: data.latitude,
              longitude: data.longitude,
              accuracy: data.accuracy,
              timestamp: data.timestamp
            },
            ownerId: socket.userId
          });

        } catch (error) {
          console.error('Location update error:', error);
          socket.emit('error', { message: 'Failed to update location' });
        }
      });

      // Handle booking tracking (vehicle owners only)
      socket.on('tracking:start', async (bookingId: string) => {
        try {
          if (socket.userType !== 'owner') {
            socket.emit('error', { message: 'Only owners can track bookings' });
            return;
          }

          const { Booking } = await import('../models/Booking');
          const booking = await Booking.findById(bookingId);

          if (!booking || booking.ownerId.toString() !== socket.userId) {
            socket.emit('error', { message: 'Booking not found or access denied' });
            return;
          }

          if (booking.status !== 'in_progress') {
            socket.emit('error', { message: 'Can only track in-progress bookings' });
            return;
          }

          socket.join(`tracking:${bookingId}`);
          socket.to(`tracking:${bookingId}`).emit('tracking:started', {
            bookingId,
            vehicleId: booking.vehicleId,
            ownerId: socket.userId
          });

        } catch (error) {
          console.error('Tracking start error:', error);
          socket.emit('error', { message: 'Failed to start tracking' });
        }
      });

      // Handle tracking updates
      socket.on('tracking:update', async (data: TrackingData) => {
        try {
          if (socket.userType !== 'owner') {
            return;
          }

          // Broadcast tracking data to farmer
          socket.to(`tracking:${data.bookingId}`).emit('tracking:updated', {
            bookingId: data.bookingId,
            location: data.location,
            status: data.status,
            estimatedArrival: data.estimatedArrival,
            vehicleId: data.vehicleId
          });

        } catch (error) {
          console.error('Tracking update error:', error);
        }
      });

      // Handle booking status updates
      socket.on('booking:status:update', async (data: BookingUpdate) => {
        try {
          const { Booking } = await import('../models/Booking');
          const booking = await Booking.findById(data.bookingId);

          if (!booking) {
            socket.emit('error', { message: 'Booking not found' });
            return;
          }

          // Check permissions
          const canUpdate =
            (socket.userType === 'farmer' && booking.farmerId.toString() === socket.userId && data.status === 'cancelled') ||
            (socket.userType === 'owner' && booking.ownerId.toString() === socket.userId) ||
            socket.userType === 'admin';

          if (!canUpdate) {
            socket.emit('error', { message: 'Permission denied' });
            return;
          }

          // Update booking status
          booking.status = data.status;
          booking.timeline.push({
            event: `status_${data.status}`,
            timestamp: new Date(),
            actor: socket.userType || 'unknown',
            userId: socket.userId,
            details: data.details || `Status changed to ${data.status}`
          });

          await booking.save();

          // Notify all relevant parties
          this.io?.to(`booking:${booking._id}`).emit('booking:status:updated', {
            bookingId: booking._id,
            status: data.status,
            actor: socket.userType,
            timestamp: new Date(),
            details: data.details
          });

        } catch (error) {
          console.error('Booking status update error:', error);
          socket.emit('error', { message: 'Failed to update booking status' });
        }
      });

      // Handle joining vehicle-specific room
      socket.on('vehicle:join', async (vehicleId: string) => {
        try {
          const { Vehicle } = await import('../models/Vehicle');
          const vehicle = await Vehicle.findById(vehicleId);

          if (!vehicle) {
            socket.emit('error', { message: 'Vehicle not found' });
            return;
          }

          // Check if user has access to this vehicle
          const hasAccess =
            vehicle.ownerId.toString() === socket.userId ||
            socket.userType === 'admin';

          if (!hasAccess) {
            socket.emit('error', { message: 'Access denied' });
            return;
          }

          socket.join(`vehicle:${vehicleId}`);
          socket.emit('vehicle:joined', { vehicleId });

        } catch (error) {
          console.error('Vehicle join error:', error);
          socket.emit('error', { message: 'Failed to join vehicle room' });
        }
      });

      // Handle joining booking-specific room
      socket.on('booking:join', async (bookingId: string) => {
        try {
          const { Booking } = await import('../models/Booking');
          const booking = await Booking.findById(bookingId);

          if (!booking) {
            socket.emit('error', { message: 'Booking not found' });
            return;
          }

          // Check if user has access to this booking
          const hasAccess =
            booking.farmerId.toString() === socket.userId ||
            booking.ownerId.toString() === socket.userId ||
            socket.userType === 'admin';

          if (!hasAccess) {
            socket.emit('error', { message: 'Access denied' });
            return;
          }

          socket.join(`booking:${bookingId}`);
          socket.join(`tracking:${bookingId}`); // Also join tracking room
          socket.emit('booking:joined', { bookingId });

        } catch (error) {
          console.error('Booking join error:', error);
          socket.emit('error', { message: 'Failed to join booking room' });
        }
      });

      // Handle notifications
      socket.on('notification:read', async (notificationId: string) => {
        try {
          // Mark notification as read in database
          // This would be implemented with a Notification model
          console.log(`Notification ${notificationId} marked as read by ${socket.userId}`);

        } catch (error) {
          console.error('Notification read error:', error);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.userId} (${socket.userType})`);

        // Remove user from tracking
        if (socket.userId) {
          const userSockets = this.connectedUsers.get(socket.userId);
          if (userSockets) {
            userSockets.delete(socket.id);
            if (userSockets.size === 0) {
              this.connectedUsers.delete(socket.userId);
            }
          }
        }

        // Remove vehicle connections
        for (const [vehicleId, socketIds] of this.vehicleConnections.entries()) {
          socketIds.delete(socket.id);
          if (socketIds.size === 0) {
            this.vehicleConnections.delete(vehicleId);
          }
        }
      });
    });

    console.log('Socket.IO server initialized');
  }

  // Send notification to specific user
  sendNotificationToUser(userId: string, notification: any) {
    this.io?.to(`user:${userId}`).emit('notification', notification);
  }

  // Send notification to all users of specific type
  sendNotificationToUserType(userType: string, notification: any) {
    this.io?.to(`type:${userType}`).emit('notification', notification);
  }

  // Broadcast to booking participants
  broadcastToBooking(bookingId: string, event: string, data: any) {
    this.io?.to(`booking:${bookingId}`).emit(event, data);
  }

  // Broadcast to vehicle tracking
  broadcastToTracking(bookingId: string, event: string, data: any) {
    this.io?.to(`tracking:${bookingId}`).emit(event, data);
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get vehicle connection status
  isVehicleConnected(vehicleId: string): boolean {
    return (this.vehicleConnections.get(vehicleId)?.size || 0) > 0;
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return (this.connectedUsers.get(userId)?.size || 0) > 0;
  }

  // Get socket instance
  getIO(): Server | null {
    return this.io;
  }

  // Graceful shutdown
  shutdown() {
    if (this.io) {
      this.io.close(() => {
        console.log('Socket.IO server closed');
      });
    }
  }
}

export const socketService = new SocketService();
export default socketService;