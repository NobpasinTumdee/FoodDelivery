import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Button } from '../../components/Button/Button';
import { Card } from '../../components/Card/Card';
import { Modal } from '../../components/Modal/Modal';
import { Spinner } from '../../components/Spinner/Spinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './ProfilePage.module.css';

export const ProfilePage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  // Tabs & Orders
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [slipModalUrl, setSlipModalUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
    if (profile) {
      setNickname(profile.nickname || '');
      setPhone(profile.phone || '');
      setAddress(profile.delivery_address || '');
    }

    if (user && activeTab === 'orders' && orders.length === 0) {
      const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
          const data = await api.getCustomerOrders(user.id);
          setOrders(data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [user, profile, navigate, activeTab]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setMessage(null);

    try {
      await api.updateCustomerProfile(user.id, {
        nickname,
        phone,
        delivery_address: address
      });
      await refreshProfile();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            My Profile
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'orders' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Order History
          </button>
        </div>

        {activeTab === 'profile' ? (
          <div className={styles.tabContent}>
            <div className={styles.pointsBadge}>
              Loyalty Points: <strong>{profile.points}</strong>
            </div>

            {message && (
              <div className={message.type === 'success' ? styles.success : styles.error}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSave} className={styles.form}>
              <div className={styles.inputGroup}>
                <label>Nickname</label>
                <input 
                  type="text" 
                  value={nickname} 
                  onChange={e => setNickname(e.target.value)}
                  placeholder="E.g. John"
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Phone Number</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)}
                  placeholder="08X-XXX-XXXX"
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Delivery Address</label>
                <textarea 
                  value={address} 
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Building, Floor, Room, or detailed location"
                  rows={4}
                />
              </div>

              <Button type="submit" fullWidth disabled={loading}>
                {loading ? 'Saving...' : 'Save Profile'}
              </Button>
            </form>
          </div>
        ) : (
          <div className={styles.tabContent}>
            {loadingOrders ? (
              <div className={styles.center}><Spinner /></div>
            ) : orders.length === 0 ? (
              <p className={styles.emptyState}>No past orders found.</p>
            ) : (
              <div className={styles.orderList}>
                {orders.map(order => (
                  <div key={order.id} className={styles.orderItem}>
                    <div className={styles.orderHeader}>
                      <div>
                        <h4>Round: {order.delivery_rounds?.round_name}</h4>
                        <small>{formatDate(order.delivery_rounds?.delivery_date)}</small>
                      </div>
                      <span className={`${styles.statusBadge} ${styles[order.order_status.toLowerCase()]}`}>
                        {order.order_status}
                      </span>
                    </div>

                    <ul className={styles.orderItemsList}>
                      {order.order_items.map((item: any) => (
                        <li key={item.id}>
                          {item.quantity}x {item.products.name}
                          {item.order_item_addons && item.order_item_addons.length > 0 && (
                             <ul className={styles.itemAddons}>
                               {item.order_item_addons.map((addon: any, idx: number) => (
                                 <li key={idx}>+ {addon.addon_name}</li>
                               ))}
                             </ul>
                          )}
                        </li>
                      ))}
                    </ul>

                    <div className={styles.orderFooter}>
                      <strong>Total: {formatCurrency(order.net_amount)}</strong>
                      <Button 
                        variant="outline" 
                        size="small" 
                        onClick={() => setSlipModalUrl(order.payment_slip_url)}
                      >
                        View Slip
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      <Modal 
        isOpen={!!slipModalUrl} 
        onClose={() => setSlipModalUrl(null)}
        title="Payment Slip"
      >
        {slipModalUrl && (
          <div className={styles.slipViewer}>
            <img src={slipModalUrl} alt="Payment Slip" />
          </div>
        )}
      </Modal>
    </div>
  );
};
