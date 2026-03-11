import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Button } from '../../components/Button/Button';
import { Card } from '../../components/Card/Card';
import { Spinner } from '../../components/Spinner/Spinner';
import { Skeleton } from '../../components/Skeleton/Skeleton';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { DeliveryRound } from '../../types/database';
import styles from './CheckoutPage.module.css';

export const CheckoutPage: React.FC = () => {
  const { items, totalAmount, totalBoxes, clearCart, updateQuantity, removeItem } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState('');
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rounds, setRounds] = useState<DeliveryRound[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<number | ''>('');
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
    if (profile) {
      setAddress(profile.delivery_address || '');
    }

    const fetchRounds = async () => {
      try {
        const rData = await api.getOpenDeliveryRounds();
        setRounds(rData);
        if (rData.length > 0) {
          setSelectedRoundId(rData[0].id);
        }
      } catch (err) {
        console.error('Error fetching rounds', err);
      } finally {
        setLoadingRounds(false);
      }
    };
    fetchRounds();
  }, [user, profile, navigate]);

  useEffect(() => {
    // Loyalty program: 10 points -> 1 free box. 
    // And what if the current order pushes them over 10? The requirement says "ถ้าแต้มถึง". 
    // Assuming points are already earned from previous orders.
    // Also, calculate lowest item price to give discount
    if (profile && items.length > 0) {
      const allPrices = items
        .filter(item => item.product.category === 'RICE')
        .flatMap(item => Array(item.quantity).fill(Number(item.product.base_price)));
      
      allPrices.sort((a, b) => a - b);
      
      // Calculate how many free boxes they can get based on points
      const freeBoxesFromPoints = Math.floor(profile.points / 10);
      const applicableFreeBoxes = Math.min(freeBoxesFromPoints, allPrices.length);

      let calcDiscount = 0;
      for (let i = 0; i < applicableFreeBoxes; i++) {
        calcDiscount += allPrices[i];
      }
      setDiscount(calcDiscount);
    } else {
      setDiscount(0);
    }
  }, [items, profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSlipFile(e.target.files[0]);
    }
  };

  const netAmount = Math.max(0, totalAmount - discount);
  const currentRound = rounds.find(r => r.id === selectedRoundId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !currentRound) {
      setError("Cannot submit order. Round closed or user not logged in.");
      return;
    }
    if (!slipFile) {
      setError("Please upload the payment slip (PromptPay screenshot).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Upload Slip
      const slipUrl = await api.uploadSlip(slipFile, user.id);

      // 2. Format Items and Addons for DB
      const orderItems = items.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.base_price,
        total_price: (Number(item.product.base_price) + item.addons.reduce((sum, a) => sum + Number(a.price), 0)) * item.quantity
      }));

      const orderAddons = items.map(item => 
        item.addons.map(addon => ({
          addon_name: addon.name,
          addon_price: addon.price
        }))
      );

      // 3. Submit Order
      await api.submitOrder(
        {
          customer_id: user.id,
          delivery_round_id: currentRound.id,
          delivery_address: address,
          total_amount: totalAmount,
          discount_amount: discount,
          net_amount: netAmount,
          payment_slip_url: slipUrl,
          payment_status: 'PENDING',
          order_status: 'PENDING',
        },
        orderItems,
        orderAddons
      );

      // 4. Update points for current order? They get 1 point per box bought
      const earnedPoints = totalBoxes;
      // Also deduct points they used (applicableFreeBoxes * 10)
      const freeBoxesFromPoints = Math.floor(profile.points / 10);
      const applicableFreeBoxes = Math.min(freeBoxesFromPoints, items.filter(item => item.product.category === 'RICE').reduce((sum, item) => sum + item.quantity, 0));
      const deductedPoints = applicableFreeBoxes * 10;
      
      await api.updateCustomerProfile(user.id, {
        points: profile.points + earnedPoints - deductedPoints,
        delivery_address: address // update typical address
      });

      clearCart();
      alert("Order submitted successfully!");
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to submit order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <h2>Your Cart is Empty</h2>
        <Button onClick={() => navigate('/')}>Browse Menu</Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <Card>
          <h2>Order Summary</h2>
          <div className={styles.itemList}>
            {items.map(item => (
              <div key={item.id} className={styles.cartItem}>
                <div className={styles.itemInfo}>
                  <h4>{item.product.name}</h4>
                  {item.addons.length > 0 && (
                    <ul className={styles.addonsList}>
                      {item.addons.map(addon => (
                        <li key={addon.id}>+ {addon.name}</li>
                      ))}
                    </ul>
                  )}
                  <div className={styles.itemTotal}>
                    {formatCurrency((Number(item.product.base_price) + item.addons.reduce((s, a) => s + Number(a.price), 0)) * item.quantity)}
                  </div>
                </div>
                <div className={styles.itemActions}>
                  <div className={styles.qtyControls}>
                    <Button variant="outline" size="small" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</Button>
                    <span>{item.quantity}</span>
                    <Button variant="outline" size="small" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</Button>
                  </div>
                  <Button variant="danger" size="small" onClick={() => removeItem(item.id)}>Remove</Button>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.summaryFooter}>
            <div className={styles.summaryRow}>
              <span>Total Amount:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
            {discount > 0 && (
              <div className={styles.summaryRow}>
                <span>Loyalty Discount (10 pts = 1 Free):</span>
                <span className={styles.discountText}>- {formatCurrency(discount)}</span>
              </div>
            )}
            <div className={`${styles.summaryRow} ${styles.netAmount}`}>
              <span>Net Amount:</span>
              <span>{formatCurrency(netAmount)}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className={styles.right}>
        <Card>
          <h2>Checkout</h2>
          {error && <div className={styles.errorAlert}>{error}</div>}
          
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Delivery Round</label>
              {loadingRounds ? (
                <Skeleton height="40px" variant="rectangular" />
              ) : rounds.length > 0 ? (
                <select 
                  className={styles.select}
                  value={selectedRoundId}
                  onChange={(e) => setSelectedRoundId(Number(e.target.value))}
                  required
                >
                  {rounds.map(round => (
                    <option key={round.id} value={round.id}>
                      {round.round_name} - {formatDate(round.delivery_date)}
                    </option>
                  ))}
                </select>
              ) : (
                <div className={styles.errorAlert}>No delivery rounds available.</div>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label>Delivery Address</label>
              <textarea 
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Building, Floor, Room..."
                rows={3}
              />
            </div>

            <div className={styles.paymentSection}>
              <h3>Payment (PromptPay)</h3>
              <p>Please transfer <strong>{formatCurrency(netAmount)}</strong> to XX-XXXXXXX</p>
              <div className={styles.qrPlaceholder}>
                [QR Code Image Here]
              </div>
              <div className={styles.inputGroup}>
                <label>Upload Payment Slip</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  required
                />
              </div>
            </div>

            <Button type="submit" fullWidth size="large" disabled={loading || !currentRound}>
              {loading ? <><Spinner size="small" color="#fff" /> Processing...</> : 'Confirm Order'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
