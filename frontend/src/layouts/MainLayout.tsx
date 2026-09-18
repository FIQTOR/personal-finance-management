
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

const MainLayout = ({ children }: Props) => {

    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="flex-1">
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;