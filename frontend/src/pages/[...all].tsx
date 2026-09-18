import { Link } from 'react-router-dom';
import { TbGhost, TbArrowLeft } from 'react-icons/tb';

const NotFound = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 flex items-center justify-center px-6">
            <div className="text-center">
                <div className="relative inline-block mb-8">
                    <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse"></div>
                    <TbGhost className="relative w-24 h-24 text-indigo-600 mx-auto" />
                </div>

                <h1 className="text-9xl font-black text-slate-200 dark:text-neutral-800 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10">
                    404
                </h1>

                <h2 className="text-3xl font-bold dark:text-white mb-4">Page Not Found</h2>
                <p className="text-slate-500 dark:text-neutral-400 mb-8 max-w-md mx-auto">Sorry, the page you are looking for does not exist or has been moved to another address.
                </p>

                <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                >
                    <TbArrowLeft /> Back
                </Link>
            </div>
        </div>
    );
};

export default NotFound;