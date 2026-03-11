import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import styles from './Hero.module.css';
import { Button } from '../Button/Button';

export const Hero: React.FC = () => {
  const handleScroll = () => {
    const menuSection = document.getElementById('menu-section');
    menuSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={styles.hero}>
      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <span className={styles.badge}>ใหม่ 🎉 รสชาติที่คุ้นเคย</span>
        <h1 className={styles.title}>
          อร่อยทุกมื้อ <br />
          <span className={styles.highlight}>ส่งตรงถึงมือคุณ</span>
        </h1>
        <p className={styles.subtitle}>
          สั่งอาหารล่วงหน้า เลือกรอบในเวลาที่คุณต้องการ
          สะดวก รวดเร็ว และหอมกรุ่นทุกกล่อง
        </p>
        <div className={styles.actions}>
          <Button onClick={handleScroll} className={styles.primaryBtn}>
            สั่งอาหารเลย <FiArrowRight />
          </Button>
        </div>
      </motion.div>
      <motion.div
        className={styles.imageContainer}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <img
          src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop"
          alt="Delicious Food"
          className={styles.image}
        />
        <div className={styles.glow}></div>
      </motion.div>
    </div>
  );
};
