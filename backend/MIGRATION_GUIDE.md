# Migration Guide - Production Backend Upgrade

This guide covers the migration from the basic backend to the production-ready backend foundation.

## Database Changes

### New Fields Added

1. **Device Model**:
   - `apiKey` (String, unique) - Device authentication token
   - `lastSeenAt` (DateTime, optional) - Last time device sent data
   - `firmwareVersion` (String, optional) - Device firmware version

2. **SensorReading Model**:
   - `batteryLevel` (Int, optional) - Battery percentage (0-100)

3. **Alert Model**:
   - `lastTriggeredAt` (DateTime, optional) - Updated when duplicate alert occurs
   - `resolutionNote` (String, optional) - Note when resolving alert

### Migration Steps

1. **Generate Prisma migration**:
   ```bash
   cd backend
   npm run db:generate
   npx prisma migrate dev --name add_production_fields
   ```

2. **Generate API keys for existing devices**:
   ```bash
   # Run this script to add API keys to existing devices
   npx tsx src/scripts/generate-device-keys.ts
   ```

## Code Structure Changes

### New Directory Structure

```
src/
  config/          # Configuration files
  middleware/      # Auth, rate limiting, error handling
  services/        # Business logic services
  modules/         # Feature modules (clean architecture)
    auth/
    devices/
    readings/
    alerts/
    dashboard/
  jobs/            # Background jobs
  utils/           # Utilities
  scripts/         # Seed and setup scripts
```

### API Changes

#### Authentication
- **New**: `POST /api/auth/refresh` - Refresh access token
- **Updated**: Login now returns both `accessToken` and `refreshToken`

#### Device Management
- **New**: Devices now require API keys
- **New**: `PATCH /api/devices/:id/regenerate-key` - Regenerate device API key
- **Updated**: Device creation automatically generates API key

#### Sensor Readings
- **Updated**: `POST /api/readings/devices/:serialNumber/readings` now requires `x-device-key` header
- **New**: `GET /api/readings/coldcells/:id/readings?range=24h|7d|30d` - Aggregated data for charts

#### Alerts
- **Updated**: `PATCH /api/alerts/:id/resolve` now accepts `resolutionNote` field
- **Enhanced**: Automatic alert resolution when conditions normalize

## Environment Variables

### New Required Variables

```env
# JWT Refresh Tokens
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX=100           # 100 requests per window
AUTH_RATE_LIMIT_MAX=5        # 5 auth attempts per window

# Device Offline Detection
DEVICE_OFFLINE_THRESHOLD_MINUTES=15
```

## Breaking Changes

1. **Device Authentication**: All device endpoints now require `x-device-key` header
2. **JWT Tokens**: Access tokens now expire in 15 minutes (default), use refresh tokens
3. **Error Responses**: Error format changed to include `code` field
4. **Rate Limiting**: All API routes now have rate limiting applied

## Migration Checklist

- [ ] Run database migration
- [ ] Generate API keys for existing devices
- [ ] Update environment variables
- [ ] Update frontend to use refresh tokens
- [ ] Update IoT devices to send `x-device-key` header
- [ ] Test all API endpoints
- [ ] Update API documentation
- [ ] Deploy to staging environment
- [ ] Run seed script to verify setup

## Testing

1. **Run seed script**:
   ```bash
   npm run seed
   ```

2. **Test authentication**:
   ```bash
   # Login
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"customer1@example.com","password":"customer123"}'
   
   # Refresh token
   curl -X POST http://localhost:3001/api/auth/refresh \
     -H "Content-Type: application/json" \
     -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
   ```

3. **Test device authentication**:
   ```bash
   # Get device API key from seed output or database
   curl -X POST http://localhost:3001/api/readings/devices/SN-001/readings \
     -H "Content-Type: application/json" \
     -H "x-device-key: YOUR_DEVICE_API_KEY" \
     -d '{
       "temperature": -18.5,
       "humidity": 45,
       "powerStatus": true,
       "doorStatus": false,
       "batteryLevel": 87
     }'
   ```

## Background Jobs

Background jobs are prepared but need to be scheduled. Options:

1. **node-cron** (development):
   ```bash
   npm install node-cron
   # Add to index.ts
   ```

2. **PM2** (production):
   ```bash
   pm2 start ecosystem.config.js
   ```

3. **Kubernetes CronJobs** (containerized)

4. **AWS EventBridge** (cloud)

See `src/jobs/index.ts` for job structure.

## Support

For issues during migration, check:
- Database migration logs
- Server logs (now with structured logging)
- Error responses include error codes for debugging
