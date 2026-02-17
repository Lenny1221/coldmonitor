import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Locations from './pages/Locations';
import ColdCells from './pages/ColdCells';
import ColdCellDetail from './pages/ColdCellDetail';
import TechnicianDashboard from './pages/TechnicianDashboard';
import ManageCustomers from './pages/ManageCustomers';
import Invitations from './pages/Invitations';
import CustomerDetail from './pages/CustomerDetail';
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
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      
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

      <Route path="/" element={<NavigateToDashboard />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
