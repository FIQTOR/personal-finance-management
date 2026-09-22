
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import AdminGuard from '@/components/AdminGuard'
import type { ReactNode } from 'react'

interface Props {
    children: ReactNode
}

const PanelLayout = ({ children }: Props) => {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <div className="flex flex-1 pt-14 lg:pt-0">
                <Sidebar />
                <main className="flex-1 ml-0 lg:ml-64 pt-16 bg-white dark:bg-black overflow-hidden transition-all duration-300 w-full">
                    <AdminGuard>
                        {children}
                    </AdminGuard>
                </main>
            </div>
        </div>
    )
}

export default PanelLayout
