import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/Login';
import Home from './pages/Home';
import Product from './pages/Product';
import Oplossingen from './pages/Oplossingen';
import Prijzen from './pages/Prijzen';
import Handleidingen from './pages/Handleidingen';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import MarketingLayout from './components/MarketingLayout';
import VerifyEmailSent from './pages/VerifyEmailSent';
import VerifyEmailRequired from './pages/VerifyEmailRequired';
import Dashboard from './pages/Dashboard';
import Locations from './pages/Locations';
import ColdCells from './pages/ColdCells';
import ColdCellDetail from './pages/ColdCellDetail';
import Alarmeringen from './pages/Alarmeringen';
import HACCPAuditReport from './pages/HACCPAuditReport';
import TechnicianDashboard from './pages/TechnicianDashboard';
import ManageCustomers from './pages/ManageCustomers';
import Invitations from './pages/Invitations';
import CustomerDetail from './pages/CustomerDetail';
import MijnTickets from './pages/MijnTickets';
import OnderhoudTickets from './pages/OnderhoudTickets';
import RefrigerantLogbook from './pages/RefrigerantLogbook';
import RefrigerantLogbookClient from './pages/RefrigerantLogbookClient';
import Layout from './components/Layout';

function NavigateToDashboard() {
  const { user } = useAuth();
  const target = user?.role === 'TECHNICIAN' || user?.role === 'ADMIN' ? '/technician' : '/dashboard';
  return <Navigate to={target} />;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Laden...</div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/verify-email-sent" element={!user ? <VerifyEmailSent /> : <Navigate to="/" />} />
      <Route path="/verify-email-required" element={!user ? <VerifyEmailRequired /> : <Navigate to="/" />} />
      
      {/* Customer Routes */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/locations"
        element={
          <PrivateRoute>
            <Layout>
              <Locations />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/coldcells"
        element={
          <PrivateRoute>
            <Layout>
              <ColdCells />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/coldcell/:id"
        element={
          <PrivateRoute>
            <Layout>
              <ColdCellDetail />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/invitations"
        element={
          <PrivateRoute>
            <Layout>
              <Invitations />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/alarmeringen"
        element={
          <PrivateRoute>
            <Layout>
              <Alarmeringen />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/haccp-rapport"
        element={
          <PrivateRoute>
            <Layout>
              <HACCPAuditReport />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/tickets"
        element={
          <PrivateRoute>
            <Layout>
              <MijnTickets />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/koudemiddelen-logboek"
        element={
          <PrivateRoute>
            <Layout>
              <RefrigerantLogbookClient />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route path="/settings" element={<Navigate to="/alarmeringen" replace />} />

      {/* Technician Routes */}
      {(user?.role === 'TECHNICIAN' || user?.role === 'ADMIN') && (
        <>
          <Route
            path="/technician"
            element={
              <PrivateRoute>
                <Layout>
                  <TechnicianDashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/technician/customers"
            element={
              <PrivateRoute>
                <Layout>
                  <ManageCustomers />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/technician/onderhoud"
            element={
              <PrivateRoute>
                <Layout>
                  <OnderhoudTickets />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/technician/koudemiddelen-logboek"
            element={
              <PrivateRoute>
                <Layout>
                  <RefrigerantLogbook />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <PrivateRoute>
                <Layout>
                  <CustomerDetail />
                </Layout>
              </PrivateRoute>
            }
          />
        </>
      )}

      {/* Marketing pages (publiek) */}
      <Route path="/" element={user ? <NavigateToDashboard /> : <MarketingLayout><Home /></MarketingLayout>} />
      <Route path="/product" element={<MarketingLayout><Product /></MarketingLayout>} />
      <Route path="/oplossingen" element={<MarketingLayout><Oplossingen /></MarketingLayout>} />
      <Route path="/prijzen" element={<MarketingLayout><Prijzen /></MarketingLayout>} />
      <Route path="/handleidingen" element={<MarketingLayout><Handleidingen /></MarketingLayout>} />
      <Route path="/faq" element={<MarketingLayout><FAQ /></MarketingLayout>} />
      <Route path="/contact" element={<MarketingLayout><Contact /></MarketingLayout>} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
