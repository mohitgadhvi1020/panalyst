import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PropertyProvider } from './context/PropertyContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AddProperty from './pages/AddProperty';
import EditProperty from './pages/EditProperty';
import PropertyDetail from './pages/PropertyDetail';

function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

function AuthRedirect({ children }) {
  const { broker, loading } = useAuth();
  if (loading) return null;
  if (broker) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PropertyProvider>
          <Routes>
            <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
            <Route path="/register" element={<AuthRedirect><Register /></AuthRedirect>} />

            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout><Dashboard /></AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/properties/new" element={
              <ProtectedRoute>
                <AppLayout><AddProperty /></AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/properties/:id" element={
              <ProtectedRoute>
                <AppLayout><PropertyDetail /></AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/properties/:id/edit" element={
              <ProtectedRoute>
                <AppLayout><EditProperty /></AppLayout>
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PropertyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
