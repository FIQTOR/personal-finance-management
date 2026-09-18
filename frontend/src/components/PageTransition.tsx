import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

const PageTransition = ({ children }: { children: ReactNode }) => {
    return (
        <motion.div
            // Animasi saat halaman pertama kali masuk
            initial={{ opacity: 0, y: 20 }}
            // Animasi saat halaman sudah tampil
            animate={{ opacity: 1, y: 0 }}
            // Animasi saat halaman akan pindah (keluar)
            exit={{ opacity: 0, y: -20 }}
            // Pengaturan durasi dan kelancaran
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full h-full"
        >
            {children}
        </motion.div>
    );
};

export default PageTransition;