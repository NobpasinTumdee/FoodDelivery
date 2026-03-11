import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Button } from '../../components/Button/Button';
import { Card } from '../../components/Card/Card';
import styles from './ProfilePage.module.css';

export const ProfilePage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
    if (profile) {
      setNickname(profile.nickname || '');
      setPhone(profile.phone || '');
      setAddress(profile.delivery_address || '');
    }
  }, [user, profile, navigate]);

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
        <h2>My Profile</h2>
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
      </Card>
    </div>
  );
};
