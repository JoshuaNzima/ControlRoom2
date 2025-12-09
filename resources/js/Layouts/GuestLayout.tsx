import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-red-50 dark:bg-gray-900 pt-6 sm:justify-center sm:pt-0">
            <div>
                <Link href="/">
                    <ApplicationLogo className="h-20 w-20 fill-current text-red-700 dark:text-gray-200" />
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-white px-6 py-6 shadow-md sm:max-w-md sm:rounded-xl border border-red-100 dark:border-gray-800">
				<div className="animate-slideUp transition-all-smooth">
					{children}
				</div>
			</div>
        </div>
    );
}
