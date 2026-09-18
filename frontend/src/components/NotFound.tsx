
import { useNavigate } from 'react-router-dom'

const NotFound = () => {
    const navigate = useNavigate()
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Gradient Bubbles */}
            <div className='absolute w-125 h-125 bg-linear-to-r from-blue-400 to-purple-500 rounded-full blur-3xl opacity-20 -top-60 -left-20 animate-pulse'></div>
            <div className='absolute w-100 h-100 bg-linear-to-r from-pink-400 to-orange-500 rounded-full blur-3xl opacity-20 bottom-0 right-0 animate-pulse delay-700'></div>

            <div className="text-center p-8 relative z-10">
                <h1 className="text-8xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">404</h1>
                <h2 className="text-2xl font-semibold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">Page Not Found</h2>
                <p className="text-gray-700 mb-8">The page you're looking for doesn't exist or has been moved.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="inline-block px-6 py-3 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-all duration-300 shadow-lg"
                >
                    Go Back
                </button>
            </div>
        </div>
    )
}

export default NotFound