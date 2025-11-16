# 🚜 AgroRide - Tractor Booking Platform

A comprehensive platform connecting farmers with tractor and agricultural equipment owners across rural India.

## 🌟 Features

### For Farmers
- **🔍 Smart Search**: Find tractors and equipment near your location
- **📱 Mobile-First**: Works perfectly on smartphones and basic internet
- **🗣️ Voice Support**: Search and book using voice commands in Hindi/English
- **⭐ Verified Owners**: All vehicle owners are verified with complete documentation
- **📍 Real-time Tracking**: Track your booking and vehicle location live
- **💰 Transparent Pricing**: Clear hourly rates with no hidden charges
- **📊 Booking History**: Complete history of all your agricultural equipment bookings

### For Equipment Owners
- **📈 Easy Registration**: Quick vehicle and equipment registration process
- **📈 Earnings Dashboard**: Track your income and booking statistics
- **🔄 Availability Management**: Set when your equipment is available for booking
- **⭐ Rating System**: Build your reputation through customer reviews
- **📱 Instant Notifications**: Get notified immediately when someone books your equipment
- **🗺 Map Integration**: Show your service area and vehicle location

### For Platform Admins
- **📊 Comprehensive Dashboard**: Complete overview of platform operations
- **👥 User Management**: Manage farmers, equipment owners, and their verification
- **🔍 Verification System**: Document verification for vehicle owners
- **📈 Analytics**: Detailed insights into platform usage and revenue
- **🎛️ Settings Management**: Configure platform parameters and policies

## 🛠 Tech Stack

### Frontend
- **⚛️ Next.js 16**: Modern React framework with App Router
- **🎨 Tailwind CSS**: Utility-first CSS framework for responsive design
- **🌍 i18n Support**: English and Hindi language support
- **📱 PWA Ready**: Installable as mobile app with offline capabilities
- **🔊 Voice Search**: Multilingual voice commands and assistance
- **📍 Maps**: Interactive maps for location-based search

### Backend
- **🚀 Node.js & Express**: Scalable API server
- **🗄 MongoDB**: NoSQL database with geospatial indexing
- **🔌 JWT Authentication**: Secure token-based authentication
- **💳 Razorpay Integration**: Reliable payment processing for Indian market
- **⚡ Socket.IO**: Real-time updates and live tracking
- **📸 Multer**: Secure file uploads for documents and images

### DevOps & Infrastructure
- **🐳 Docker**: Containerized deployment with multi-stage builds
- **🔄 Docker Compose**: Complete development and production setup
- **🌐 Nginx**: Reverse proxy with SSL termination
- **📈 Redis**: Caching and session management
- **🔒 Security**: Comprehensive security headers and best practices

## 🚀 Quick Start

### Prerequisites
- Node.js 19+ and npm
- MongoDB 7.0+
- Redis 7.0+
- Docker & Docker Compose (optional but recommended)

### Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-org/agroride.git
cd agroride
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start development servers**
```bash
# Start backend server
npm run server

# Start frontend (in another terminal)
npm run dev
```

### Docker Deployment (Recommended)

1. **Create environment file**
```bash
# Copy and customize
cp .env.example .env
```

2. **Deploy with Docker Compose**
```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

## 📁 Project Structure

```
Agroride/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/             # Authentication pages
│   │   ├── dashboard/         # User dashboards
│   │   └── globals.css        # Global styles
│   ├── contexts/               # React contexts
│   │   ├── AuthContext.tsx     # Authentication state
│   │   ├── SocketContext.tsx   # Real-time connections
│   │   └── NotificationContext.tsx # App notifications
│   ├── lib/                   # Utility functions
│   │   ├── i18n.ts          # Internationalization
│   │   ├── socket.ts         # Socket.IO setup
│   │   └── upload.ts         # File upload handling
│   ├── routes/                 # API routes
│   │   ├── auth.ts          # Authentication endpoints
│   │   ├── vehicles.ts      # Vehicle management
│   │   ├── bookings.ts      # Booking system
│   │   └── payments.ts      # Payment processing
│   └── models/                 # Mongoose models
│       ├── User.ts           # User data model
│       ├── Vehicle.ts        # Vehicle data model
│       ├── Booking.ts        # Booking data model
│       └── Payment.ts        # Payment data model
├── public/                       # Static assets
│   ├── manifest.json          # PWA manifest
│   └── icons/               # App icons
├── locales/                      # Translation files
│   ├── en.json              # English translations
│   └── hi.json              # Hindi translations
└── docker-compose.yml             # Container orchestration
```

## 🔧 Configuration

### Environment Variables

```bash
# Application
NODE_ENV=development
PORT=3001
NEXTAUTH_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/agroride
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here

# Payment Gateway
RAZORPAY_KEY_ID=rzp_test_key_id
RAZORPAY_KEY_SECRET=rzp_test_key_secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## 🌐 API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Vehicles
- `GET /api/vehicles` - Search vehicles with filters
- `POST /api/vehicles` - Register new vehicle (owners)
- `GET /api/vehicles/:id` - Get vehicle details
- `PUT /api/vehicles/:id` - Update vehicle (owners)
- `DELETE /api/vehicles/:id` - Delete vehicle (owners)

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id/status` - Update booking status
- `POST /api/bookings/:id/review` - Add booking review

### Payments
- `POST /api/payments/order` - Create payment order
- `POST /api/payments/verify` - Verify payment
- `POST /api/payments/cash` - Record cash payment
- `POST /api/payments/:id/refund` - Process refund

## 🔔 Real-time Events

### Socket.IO Events

#### Client to Server
- `join:room` - Join booking/vehicle room
- `location:update` - Update vehicle location
- `booking:status:update` - Update booking status
- `tracking:start` - Start live tracking

#### Server to Client
- `notification` - General notifications
- `booking:status:updated` - Booking status changed
- `tracking:updated` - Location/progress updates
- `vehicle:joined` - Successfully joined vehicle room

## 🌍 Internationalization

### Supported Languages
- **English** (`en`) - Default language
- **Hindi** (`hi`) - Complete Hindi translation

### Adding New Languages
1. Add JSON file in `locales/` (e.g., `te.json` for Telugu)
2. Update `src/lib/i18n.ts` to include new language
3. Add translations for all keys

### Usage in Components
```tsx
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();

// Simple translation
t('hello.world')

// With variables
t('welcome.user', { name: 'John' })

// Nested keys
t('features.find.title')
```

## 📱 PWA Features

### Installation
- Installable as mobile app from browser
- Works offline for basic functionality
- App shortcuts for quick access

### Offline Support
- View previously accessed vehicles
- Check booking status
- Basic app navigation

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt for password security
- **Input Validation**: Comprehensive form validation
- **CORS Protection**: Configurable CORS policies
- **Rate Limiting**: Prevent API abuse
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content Security Policy
- **Secure Headers**: HSTS, X-Frame-Options, etc.

## 🚀 Production Deployment

### Docker Deployment (Recommended)

1. **Build containers**
```bash
docker-compose build
```

2. **Deploy production**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment

1. **Build application**
```bash
npm run build
```

2. **Set up production database**
```bash
# Create MongoDB indexes
# Set up Redis cluster
```

3. **Configure reverse proxy** (Nginx example provided)
4. **Set up SSL certificates**
5. **Configure environment variables**

## 📊 Monitoring & Analytics

### Application Metrics
- User registration and login events
- Vehicle registration and availability
- Booking creation and completion
- Payment processing and revenue
- API response times and error rates

### Recommended Tools
- **Application Monitoring**: New Relic, DataDog, or Application Insights
- **Error Tracking**: Sentry
- **Log Aggregation**: ELK Stack or similar
- **Database Monitoring**: MongoDB Atlas or Percona
- **Infrastructure**: Prometheus + Grafana

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add some amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Write meaningful commit messages
- Add tests for new features
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Email**: support@agroride.com
- **Phone**: +91-XXXX-XXXXXX
- **Documentation**: https://docs.agroride.com
- **Status Page**: https://status.agroride.com

## 🙏 Acknowledgments

- Tractor and equipment owners across rural India
- Agricultural community feedback
- Open-source community contributors
- Financial technology partners (Razorpay)
- Rural development organizations

---

**🌱 Empowering Indian agriculture through technology 🚜**