import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import type { DeliveryRound } from '../../types/database';
import { Button } from '../../components/Button/Button';
import { Card } from '../../components/Card/Card';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './AdminDashboard.module.css';

export const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [rounds, setRounds] = useState<DeliveryRound[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      navigate('/');
    }
  }, [profile, navigate]);

  useEffect(() => {
    fetchRounds();
  }, []);

  const fetchRounds = async () => {
    try {
      // Need a way to fetch all rounds, but api.getOpenDeliveryRounds() only gets OPEN ones.
      // Let's create an inline fetch for all rounds for admin.
      const { supabase } = await import('../../services/supabaseClient');
      const { data, error } = await supabase
        .from('delivery_rounds')
        .select('*')
        .order('id', { ascending: false });
      
      if (error) throw error;
      setRounds(data as DeliveryRound[]);
      if (data && data.length > 0 && !selectedRoundId) {
        setSelectedRoundId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRoundId) {
      fetchOrders(selectedRoundId);
    }
  }, [selectedRoundId]);

  const fetchOrders = async (roundId: number) => {
    try {
      const data = await api.getOrdersForRound(roundId);
      setOrders(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      await api.updateOrderStatus(orderId, status);
      setOrders(orders.map(o => o.id === orderId ? { ...o, order_status: status } : o));
    } catch (err) {
      console.error(err);
      alert('Failed to update order status');
    }
  };

  const handleToggleRoundStatus = async (roundId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
    try {
      await api.updateRoundStatus(roundId, newStatus);
      fetchRounds();
    } catch (err) {
      console.error(err);
      alert('Failed to update round status');
    }
  };

  if (!profile || profile.role !== 'admin' || loading) return <div>Loading Admin...</div>;

  const currentRound = rounds.find(r => r.id === selectedRoundId);
  const totalSales = orders.reduce((sum, o) => sum + Number(o.net_amount), 0);
  
  // Aggregate items and addons
  const productCounts: Record<string, number> = {};
  const addonCounts: Record<string, number> = {};

  orders.forEach(order => {
    order.order_items.forEach((item: any) => {
      const pName = item.products?.name || 'Unknown Item';
      productCounts[pName] = (productCounts[pName] || 0) + item.quantity;

      item.order_item_addons.forEach((addon: any) => {
        const aName = addon.addon_name;
        addonCounts[aName] = (addonCounts[aName] || 0) + (1 * item.quantity); // assuming 1 addon per item qty
      });
    });
  });

  const statuses = ['PENDING', 'CONFIRMED', 'DELIVERING', 'COMPLETED', 'CANCELLED'];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2>Admin Dashboard</h2>
        <div className={styles.roundSelector}>
          <label>Select Round:</label>
          <select 
            value={selectedRoundId || ''} 
            onChange={(e) => setSelectedRoundId(Number(e.target.value))}
          >
            {rounds.map(r => (
              <option key={r.id} value={r.id}>
                {r.round_name} ({r.status}) - {formatDate(r.delivery_date)}
              </option>
            ))}
          </select>
          {currentRound && (
            <Button 
              variant={currentRound.status === 'OPEN' ? 'danger' : 'primary'}
              size="small"
              onClick={() => handleToggleRoundStatus(currentRound.id, currentRound.status)}
            >
              {currentRound.status === 'OPEN' ? 'Close Round' : 'Re-open Round'}
            </Button>
          )}
        </div>
      </header>

      <div className={styles.dashboardGrid}>
        <div className={styles.summarySection}>
          <Card>
            <h3>Summary (Round #{selectedRoundId})</h3>
            <div className={styles.summaryStat}>
              <span>Total Orders:</span>
              <strong>{orders.length}</strong>
            </div>
            <div className={styles.summaryStat}>
              <span>Total Sales:</span>
              <strong className={styles.salesText}>{formatCurrency(totalSales)}</strong>
            </div>
            
            <hr className={styles.divider} />
            
            <h4>Items to Prepare</h4>
            <ul className={styles.prepareList}>
              {Object.entries(productCounts).map(([name, qty]) => (
                <li key={name}>
                  <span>{name}</span>
                  <strong>x {qty}</strong>
                </li>
              ))}
            </ul>

            <hr className={styles.divider} />

            <h4>Add-ons to Prepare</h4>
            <ul className={styles.prepareList}>
              {Object.entries(addonCounts).map(([name, qty]) => (
                <li key={name}>
                  <span>{name}</span>
                  <strong>x {qty}</strong>
                </li>
              ))}
              {Object.keys(addonCounts).length === 0 && <span className={styles.emptyText}>No add-ons ordered</span>}
            </ul>
          </Card>
        </div>

        <div className={styles.ordersSection}>
          <Card>
            <h3>Customer Orders</h3>
            <div className={styles.ordersTableContainer}>
              <table className={styles.ordersTable}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Address</th>
                    <th>Slip</th>
                    <th>Net Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>
                        {order.customers?.nickname || 'Unknown'} 
                        <br/>
                        <small>{order.customers?.phone}</small>
                      </td>
                      <td className={styles.addressCell}>{order.delivery_address}</td>
                      <td>
                        {order.payment_slip_url ? (
                          <a href={order.payment_slip_url} target="_blank" rel="noreferrer" className={styles.slipLink}>View Slip</a>
                        ) : 'No Slip'}
                      </td>
                      <td>{formatCurrency(Number(order.net_amount))}</td>
                      <td>
                        <select 
                          value={order.order_status} 
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          className={`${styles.statusSelect} ${styles[order.order_status.toLowerCase()]}`}
                        >
                          {statuses.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center' }}>No orders for this round yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
