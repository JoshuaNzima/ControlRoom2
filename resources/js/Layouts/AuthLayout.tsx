import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function AuthLayout({ children }: PropsWithChildren) {
    return (
        <div className="min-h-screen flex flex-col bg-red-50 dark:bg-gray-900">
            <div className="w-full px-6 py-4 flex items-center justify-between bg-white dark:bg-gray-800 border-b border-red-100 dark:border-gray-800 sticky top-0 z-30">
                <Link href="/" className="flex items-center gap-3">
                    <img src="/images/Coin-logo.png" alt="CoinSec" className="h-10 w-auto" />
                    <span className="font-semibold text-red-900 dark:text-gray-100">CoinSec</span>
                </Link>
            </div>

            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6">
                {children}
            </div>
        </div>
    );
}
