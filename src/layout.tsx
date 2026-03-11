import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar/Navbar';
import { AnimatePresence, motion } from 'framer-motion';

export const RootLayout: React.FC = () => {
  const location = useLocation();

  return (
    <>
      <Navbar />
      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
};
