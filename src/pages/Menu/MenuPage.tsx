import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { Product, Addon, DeliveryRound } from '../../types/database';
import { useCart } from '../../contexts/CartContext';
import { Card } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Modal } from '../../components/Modal/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './MenuPage.module.css';

export const MenuPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [rounds, setRounds] = useState<DeliveryRound[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [quantity, setQuantity] = useState(1);

  const { addItem } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pData, aData, rData] = await Promise.all([
          api.getProducts(),
          api.getAddons(),
          api.getOpenDeliveryRounds()
        ]);
        setProducts(pData);
        setAddons(aData);
        setRounds(rData);
      } catch (error) {
        console.error('Error fetching menu data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setSelectedAddons([]);
    setQuantity(1);
  };

  const handleAddonToggle = (addon: Addon) => {
    setSelectedAddons(prev => 
      prev.some(a => a.id === addon.id)
        ? prev.filter(a => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  const handleAddToCart = () => {
    if (selectedProduct) {
      addItem(selectedProduct, quantity, selectedAddons);
      setSelectedProduct(null);
    }
  };

  if (loading) return <div className={styles.loading}>Loading Menu...</div>;

  const riceProducts = products.filter(p => p.category === 'RICE');
  const snackProducts = products.filter(p => p.category === 'SNACK');
  const availableAddons = selectedProduct 
    ? addons.filter(a => a.product_id === selectedProduct.id) 
    : [];

  const currentRound = rounds.length > 0 ? rounds[0] : null;

  return (
    <div className={styles.container}>
      {currentRound ? (
        <div className={styles.roundBanner}>
          <h3>🚀 Now Open: {currentRound.round_name}</h3>
          <p>Delivery Date: {formatDate(currentRound.delivery_date)}</p>
        </div>
      ) : (
        <div className={styles.closedBanner}>
          <h3>Currently Closed for Pre-orders</h3>
        </div>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Main Dishes (RICE)</h2>
        <div className={styles.grid}>
          {riceProducts.map(product => (
            <Card 
              key={product.id} 
              className={styles.productCard} 
              onClick={() => handleProductClick(product)}
            >
              <div className={styles.productImagePlaceholder}>
                {product.image_url ? (
                   <img src={product.image_url} alt={product.name} />
                ) : (
                  <span>🥗</span>
                )}
              </div>
              <div className={styles.productInfo}>
                <h4>{product.name}</h4>
                <p className={styles.price}>{formatCurrency(product.base_price)}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Snacks & Desserts</h2>
        <div className={styles.grid}>
          {snackProducts.map(product => (
            <Card 
              key={product.id} 
              className={styles.productCard} 
              onClick={() => handleProductClick(product)}
            >
              <div className={styles.productImagePlaceholder}>
                {product.image_url ? (
                   <img src={product.image_url} alt={product.name} />
                ) : (
                  <span>🍰</span>
                )}
              </div>
              <div className={styles.productInfo}>
                <h4>{product.name}</h4>
                <p className={styles.price}>{formatCurrency(product.base_price)}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Add to Cart Modal */}
      <Modal 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.name}
      >
        {selectedProduct && (
          <div className={styles.modalContent}>
            {selectedProduct.detail && (
              <p className={styles.detail}>{selectedProduct.detail}</p>
            )}
            
            <div className={styles.priceRow}>
              <span>Base Price:</span>
              <strong>{formatCurrency(selectedProduct.base_price)}</strong>
            </div>

            {availableAddons.length > 0 && (
              <div className={styles.addonsSection}>
                <h4>Add-ons</h4>
                {availableAddons.map(addon => (
                  <label key={addon.id} className={styles.addonLabel}>
                    <input 
                      type="checkbox" 
                      checked={selectedAddons.some(a => a.id === addon.id)}
                      onChange={() => handleAddonToggle(addon)}
                    />
                    <span>{addon.name} (+{formatCurrency(addon.price)})</span>
                  </label>
                ))}
              </div>
            )}

            <div className={styles.quantitySection}>
              <h4>Quantity</h4>
              <div className={styles.quantityControls}>
                <Button 
                  variant="outline" 
                  size="small" 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >-</Button>
                <span className={styles.qtyDisplay}>{quantity}</span>
                <Button 
                  variant="outline" 
                  size="small" 
                  onClick={() => setQuantity(quantity + 1)}
                >+</Button>
              </div>
            </div>

            <Button 
              fullWidth 
              size="large" 
              onClick={handleAddToCart}
              className={styles.addToCartBtn}
            >
              Add to Cart - {formatCurrency((selectedProduct.base_price + selectedAddons.reduce((sum, a) => sum + Number(a.price), 0)) * quantity)}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
