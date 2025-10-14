import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function AuthLayout({ children }: PropsWithChildren) {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <div className="w-full px-6 py-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                    <img src="/images/Coin-logo.png" alt="CoinSec" className="h-10 w-auto" />
                    <span className="font-semibold text-slate-900">CoinSec</span>
                </Link>
            </div>

            <div className="flex-1 flex items-center justify-center px-4">
                {children}
            </div>
        </div>
    );
}
