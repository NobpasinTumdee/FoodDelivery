import React from 'react';
import styles from './Spinner.module.css';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
  fullScreen?: boolean;
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'medium', 
  color = 'var(--accent-color)',
  className = '',
  fullScreen = false
}) => {
  const spinnerClass = `${styles.spinner} ${styles[size]} ${className}`;
  
  const spinnerElement = (
    <div 
      className={spinnerClass} 
      style={{ borderTopColor: color }}
      role="status"
    >
      <span className={styles.srOnly}>Loading...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className={styles.fullScreenContainer}>
        {spinnerElement}
      </div>
    );
  }

  return spinnerElement;
};
