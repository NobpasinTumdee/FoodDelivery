import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { Button } from '../Button/Button';
import styles from './Navbar.module.css';

export const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const { totalQuantity } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) return null; // Don't show navbar on login page

  return (
    <nav className={styles.navbar}>
      <div className={styles.brand} onClick={() => navigate('/')}>
        <h3>Food Pre-order</h3>
      </div>
      
      <div className={styles.actions}>
        {user ? (
          <>
            {profile?.role === 'admin' && (
              <Button variant="outline" size="small" onClick={() => navigate('/admin')}>
                Admin
              </Button>
            )}
            <Button variant="outline" size="small" onClick={() => navigate('/profile')}>
              {profile?.nickname || 'Profile'}
            </Button>
            <div className={styles.cart} onClick={() => navigate('/checkout')}>
               🛒 {totalQuantity > 0 && <span className={styles.badge}>{totalQuantity}</span>}
            </div>
            <Button variant="secondary" size="small" onClick={handleLogout}>
              Logout
            </Button>
          </>
        ) : (
          <Button variant="primary" size="small" onClick={() => navigate('/login')}>
            Login
          </Button>
        )}
      </div>
    </nav>
  );
};
