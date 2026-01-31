# IoT Refrigeration Monitoring Platform

A production-ready, multi-tenant SaaS platform for monitoring refrigeration and freezer cells. Designed for businesses (butchers, bakeries, restaurants, florists, warehouses) and their maintenance technicians.

## 🏗️ Architecture

### Multi-Tenant Structure
- **Technicians** manage multiple **Customers**
- **Customers** have multiple **Locations**
- **Locations** contain multiple **Cold Cells** (fridge/freezer units)
- **Cold Cells** have one or more **Devices** (IoT sensors/loggers)
- **Devices** send **Sensor Readings** (temperature, humidity, power, door status)
- System automatically generates **Alerts** based on thresholds

### User Roles
- **Customer**: Business owners who monitor their cold storage
- **Technician**: Installation/maintenance partners who manage multiple customers
- **Admin**: Platform administrators

## ✨ Features

### Customer Dashboard
- **Overview Screen**: All cold cells with status indicators (Green=OK, Orange=Warning, Red=Alarm)
- **Cold Cell Detail**: Live temperature display with interactive charts
  - Last 24 hours
  - 7 days
  - 30 days
  - Min/Max values
- **Alarm History**: View and resolve active alarms
- **Reports**: Export temperature logs (structure ready for PDF/CSV)

### Technician Dashboard
- **Customer List**: Overview of all linked customers
  - Number of locations and cold cells per customer
  - Active alarm counts
- **Global Alert Overview**: All alarms across all customers
  - Filter by alarm type or urgency
  - Quick access to customer details

### Alert System
Automatic alerts triggered for:
- Temperature > max threshold
- Temperature < min threshold
- Device offline (no data for 15+ minutes)
- Power loss detected

### Notification Foundation
Service structure prepared for:
- Email notifications
- Push notifications (future mobile app)
- SMS notifications (future)

## 🛠️ Tech Stack

### Backend
- **Node.js** + **TypeScript** + **Express**
- **PostgreSQL** with **Prisma ORM**
- **JWT** authentication
- Multi-tenant data isolation
- Role-based access control

### Frontend
- **React** + **TypeScript** + **Vite**
- **Tailwind CSS** (clean SaaS-style UI)
- **Recharts** for data visualization
- **React Router** for navigation

## 📁 Project Structure

```
Project_Logger/
├── backend/
│   ├── src/
│   │   ├── index.ts                 # Main server
│   │   ├── middleware/
│   │   │   └── auth.ts              # JWT & RBAC middleware
│   │   ├── routes/
│   │   │   ├── auth.ts              # Authentication
│   │   │   ├── customers.ts         # Customer management
│   │   │   ├── locations.ts         # Location CRUD
│   │   │   ├── coldcells.ts         # Cold cell CRUD
│   │   │   ├── devices.ts           # Device management
│   │   │   ├── readings.ts          # Sensor data ingestion
│   │   │   ├── alerts.ts            # Alert management
│   │   │   └── dashboard.ts        # Dashboard data
│   │   └── services/
│   │       ├── alertService.ts      # Alert detection logic
│   │       └── notificationService.ts # Notification foundation
│   ├── prisma/
│   │   └── schema.prisma            # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.tsx           # Main layout
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx     # Auth state
│   │   ├── pages/
│   │   │   ├── Login.tsx            # Login/Register
│   │   │   ├── Dashboard.tsx        # Customer dashboard
│   │   │   ├── ColdCellDetail.tsx   # Cold cell detail with charts
│   │   │   ├── TechnicianDashboard.tsx # Technician overview
│   │   │   └── CustomerDetail.tsx   # Customer detail (technician view)
│   │   ├── services/
│   │   │   └── api.ts                # API client
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Installation

1. **Clone and navigate to the project**:
   ```bash
   cd "Project_Logger"
   ```

2. **Install dependencies**:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Set up the database**:
   ```sql
   CREATE DATABASE coldmonitor;
   ```

4. **Configure environment variables**:
   
   Backend (`backend/.env`):
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your database credentials
   ```
   
   Frontend (`frontend/.env`):
   ```bash
   cp frontend/.env.example frontend/.env
   # Edit if needed (defaults should work)
   ```

5. **Run database migrations**:
   ```bash
   cd backend
   npm run db:generate
   npm run db:migrate
   ```

6. **Start the backend**:
   ```bash
   cd backend
   npm run dev
   ```
   Backend runs on `http://localhost:3001`

7. **Start the frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`

8. **Access the application**:
   - Open `http://localhost:5173`
   - Register as a Customer or Technician
   - Start monitoring!

## 📡 IoT Device Integration

### Sending Sensor Readings

Devices send data to the ingestion endpoint:

**Endpoint**: `POST /api/readings/devices/:serialNumber/readings`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "temperature": 4.5,
  "humidity": 65.0,
  "powerStatus": true,
  "doorStatus": false
}
```

**Example using curl**:
```bash
curl -X POST http://localhost:3001/api/readings/devices/SN-12345/readings \
  -H "Content-Type: application/json" \
  -d '{
    "temperature": 4.5,
    "humidity": 65.0,
    "powerStatus": true,
    "doorStatus": false
  }'
```

**Note**: Device authentication via API key can be added. For now, devices are identified by serial number.

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Customer registration
- `POST /api/auth/register/technician` - Technician registration
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Customers
- `GET /api/customers/me` - Get current customer data
- `GET /api/customers/:id` - Get customer by ID (Technician/Admin)

### Locations
- `GET /api/locations` - List all locations (Customer)
- `GET /api/locations/:id` - Get location details
- `POST /api/locations` - Create location
- `PATCH /api/locations/:id` - Update location
- `DELETE /api/locations/:id` - Delete location

### Cold Cells
- `GET /api/coldcells/location/:locationId` - Get cold cells for location
- `GET /api/coldcells/:id` - Get cold cell details
- `POST /api/coldcells` - Create cold cell
- `PATCH /api/coldcells/:id` - Update cold cell
- `DELETE /api/coldcells/:id` - Delete cold cell

### Devices
- `GET /api/devices/coldcell/:coldCellId` - Get devices for cold cell
- `GET /api/devices/serial/:serialNumber` - Get device by serial
- `POST /api/devices` - Create device
- `PATCH /api/devices/:id/status` - Update device status

### Sensor Readings
- `POST /api/readings/devices/:serialNumber/readings` - Submit reading (IoT endpoint)
- `GET /api/readings/coldcells/:id/readings` - Get readings for cold cell
- `GET /api/readings/devices/:deviceId/readings` - Get readings for device

### Alerts
- `GET /api/alerts` - Get alerts (Customer)
- `GET /api/alerts/technician` - Get all alerts (Technician)
- `GET /api/alerts/:id` - Get alert details
- `PATCH /api/alerts/:id/resolve` - Resolve alert

### Dashboard
- `GET /api/dashboard/customer` - Customer dashboard data
- `GET /api/dashboard/technician` - Technician dashboard data

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Role-Based Access Control**: Customer/Technician/Admin roles
- **Multi-Tenant Isolation**: Data access restricted by role
- **CORS Protection**: Configured for frontend origin
- **SQL Injection Protection**: Prisma ORM parameterized queries

## 📊 Database Schema

### Core Models
- **User**: Authentication accounts
- **Technician**: Technician profiles
- **Customer**: Customer profiles with technician linkage
- **Location**: Customer locations
- **ColdCell**: Refrigeration/freezer units
- **Device**: IoT sensors/loggers
- **SensorReading**: Temperature and sensor data
- **Alert**: Alarm records

See `backend/prisma/schema.prisma` for complete schema.

## 🎨 UI Design

- Clean, modern SaaS-style interface
- Light theme with professional industrial-tech feel
- Responsive design (mobile-ready)
- Status indicators: Green (OK), Orange (Warning), Red (Alarm)
- Interactive charts with Recharts
- Intuitive navigation

## 🔔 Notification System

The notification service foundation is ready for integration with:
- **Email**: SendGrid, AWS SES, SMTP
- **Push**: Firebase Cloud Messaging (FCM), Apple Push Notification Service (APNS)
- **SMS**: Twilio, AWS SNS

See `backend/src/services/notificationService.ts` for the structure.

## 🚧 Future Enhancements

- Email verification flow
- Password reset functionality
- Device API key authentication
- PDF report generation
- CSV export for temperature logs
- Daily/weekly automatic reports
- Mobile app (React Native)
- Real-time WebSocket updates
- Advanced analytics and predictions
- Multi-language support

## 🛠️ Development

### Backend
```bash
cd backend
npm run dev          # Development with hot reload
npm run build        # Build for production
npm run start        # Run production build
npm run db:studio    # Open Prisma Studio (database GUI)
npm run db:migrate   # Run migrations
```

### Frontend
```bash
cd frontend
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
```

## 📝 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/coldmonitor
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

## 📄 License

ISC

## 🤝 Support

For issues, questions, or contributions, please create an issue in the repository.

---

**Built with ❄️ for cold storage monitoring**
