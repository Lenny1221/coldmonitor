# ColdMonitor Frontend - Next.js Dashboard

Modern SaaS dashboard UI for IoT refrigeration monitoring platform built with Next.js 14, React, TypeScript, Tailwind CSS, and shadcn/ui.

## Features

- ✅ Modern authentication (login, multi-step registration)
- ✅ Responsive dashboard layout with sidebar navigation
- ✅ Customer dashboard with KPIs and charts
- ✅ Locations and cold cells management
- ✅ Detailed cold cell view with temperature charts (24h/7d/30d)
- ✅ Alerts management with filtering
- ✅ Technician dashboard for service companies
- ✅ Professional UI design (Stripe/Tesla-inspired)
- ✅ Fully responsive (desktop, tablet, mobile)

## Tech Stack

- **Next.js 14** (App Router)
- **React 18** + **TypeScript**
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **Recharts** for data visualization
- **Axios** for API calls
- **date-fns** for date formatting
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running on `http://localhost:3001`

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your API URL
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open browser**:
   Navigate to `http://localhost:3000`

## Project Structure

```
app/
  login/              # Login page
  register/           # Multi-step registration
  dashboard/          # Customer dashboard
    layout.tsx        # Dashboard layout with sidebar
    page.tsx          # Dashboard main page
  locations/          # Locations list
  coldcells/          # Cold cells list
    [id]/             # Cold cell detail page
  alerts/             # Alerts management
  technician/         # Technician dashboard
components/
  ui/                 # shadcn/ui components
  layout/             # Layout components (sidebar, topbar)
lib/
  api.ts              # API client
  utils.ts            # Utility functions
```

## Pages

### Authentication
- `/login` - Email/password login
- `/register` - 3-step registration (Account → Company → Technician)

### Customer Pages
- `/dashboard` - Overview with KPIs, charts, recent alerts
- `/locations` - List of customer locations
- `/coldcells` - Table of all cold cells
- `/coldcells/[id]` - Detailed view with charts and metrics
- `/alerts` - Filterable alerts table

### Technician Pages
- `/technician` - Global dashboard across all customers

## API Integration

The app uses a centralized API client in `lib/api.ts` with:
- Automatic token refresh
- Request/response interceptors
- Error handling

All API calls are typed and use the backend endpoints.

## Styling

- Uses Tailwind CSS with custom design tokens
- shadcn/ui components for consistent UI
- Responsive breakpoints: `sm`, `md`, `lg`, `xl`
- Mobile-first approach

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Notes

- Sidebar collapses on mobile with hamburger menu
- All pages are protected (redirect to login if not authenticated)
- Token refresh handled automatically
- Charts use Recharts with responsive containers
- Badge colors: red (critical), orange (warning), green (normal/success)

## Next Steps

- Add password reset flow
- Implement reports page
- Add settings page
- Real-time updates with WebSockets
- Push notifications
- Export functionality (CSV/PDF)

---

Built with ❄️ for cold storage monitoring
