import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { RootLayout } from './layout';

import { AuthPage } from './pages/Auth/AuthPage';
import { MenuPage } from './pages/Menu/MenuPage';
import { ProfilePage } from './pages/Profile/ProfilePage';
import { CheckoutPage } from './pages/Checkout/CheckoutPage';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import './App.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode, requireAdmin?: boolean }> = ({ children, requireAdmin }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (requireAdmin && profile?.role !== 'admin') return <Navigate to="/" />;
  
  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <h1>Not found this page...</h1>,
    children: [
      { index: true, element: <MenuPage /> },
      { path: "login", element: <AuthPage /> },
      { path: "register", element: <AuthPage /> },
      { 
        path: "profile", 
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "checkout", 
        element: (
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "admin", 
        element: (
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        ) 
      }
    ]
  }
]);

import { ThemeProvider } from './contexts/ThemeContext';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <RouterProvider router={router} />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
