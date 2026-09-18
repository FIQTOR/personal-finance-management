
import { TbLock, TbArrowLeft } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'

export default function Forbidden() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen p-8 relative flex items-center justify-center">
            {/* Gradient Bubbles */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-red-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute top-[-5%] right-[5%] w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[10%] left-[20%] w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            </div>

            <div className="p-8 border-white/50 max-w-lg w-full text-center relative z-10">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                        <TbLock className="w-10 h-10 text-red-600" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-gray-800">Access Denied</h1>
                        <p className="text-gray-600">Sorry, you don&apos;t have permission to access this page.</p>
                    </div>

                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-red-600 to-pink-600 text-white rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg group"
                    >
                        <TbArrowLeft className="transition-transform group-hover:-translate-x-1" />
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    )
}