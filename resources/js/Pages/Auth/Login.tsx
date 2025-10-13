import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthLayout from '@/Layouts/AuthLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout>
            <Head title="CoinSec — Sign in" />

            <div className="w-full">
                {/* Mobile / small screens: redesigned to match coin theme */}
                <div className="w-full px-4 md:hidden">
                    <div className="w-full max-w-md mx-auto bg-[#FEE8D8] rounded-3xl shadow-lg overflow-hidden">
                        <div className="flex flex-col">
                            <div className="p-6 bg-[#FEDDC8] flex items-center justify-center">
                                <img src="/images/undraw-authentication.svg" alt="Authentication" className="w-[160px] h-auto object-contain" />
                            </div>

                            <div className="p-6 bg-white/80 backdrop-blur-md">
                                <div className="mb-4">
                                    <p className="text-sm text-coin-700 font-semibold">CoinSec</p>
                                    <h2 className="text-2xl font-bold text-gray-800">Welcome back</h2>
                                    <p className="text-sm text-gray-500">Sign in to continue</p>
                                </div>

                                {status && (
                                    <div className="mb-4 text-sm font-medium text-green-600">{status}</div>
                                )}

                                <form onSubmit={submit} className="space-y-4">
                                    <div>
                                        <InputLabel htmlFor="email" value="Email" />
                                        <TextInput
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-coin-300"
                                            autoComplete="username"
                                            isFocused={true}
                                            onChange={(e) => setData('email', e.target.value)}
                                        />
                                        <InputError message={errors.email} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="password" value="Password" />
                                        <TextInput
                                            id="password"
                                            type="password"
                                            name="password"
                                            value={data.password}
                                            className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-coin-300"
                                            autoComplete="current-password"
                                            onChange={(e) => setData('password', e.target.value)}
                                        />
                                        <InputError message={errors.password} className="mt-2" />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center">
                                            <Checkbox
                                                name="remember"
                                                checked={data.remember}
                                                onChange={(e) => setData('remember', (e.target.checked || false) as false)}
                                            />
                                            <span className="ms-2 text-sm text-gray-600">Remember me</span>
                                        </label>

                                        {canResetPassword && (
                                            <Link href={route('password.request')} className="text-sm text-coin-700 hover:underline">
                                                Forgot password?
                                            </Link>
                                        )}
                                    </div>

                                    <PrimaryButton className="w-full bg-coin-700 hover:bg-coin-800" disabled={processing}>
                                        Sign in
                                    </PrimaryButton>
                                </form>

                                <div className="mt-4 text-center text-xs text-slate-400">By signing in you agree to CoinSec's Terms and Privacy Policy.</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Desktop / md+ split layout */}
                <div className="hidden md:flex md:items-center md:justify-center md:px-4 lg:px-0">
                    <div className="w-full md:w-[80%] lg:w-[70%] bg-[#FEE8D8] rounded-3xl shadow-lg flex flex-col md:flex-row overflow-hidden">
                        {/* Image section */}
                        <div className="flex-1 flex justify-center items-center p-8 md:p-10 bg-[#FEDDC8]">
                            <img src="/images/undraw-authentication.svg" alt="Authentication illustration" className="w-[240px] md:w-[320px] lg:w-[380px] h-auto object-contain" />
                        </div>

                        {/* Form section */}
                        <div className="flex-1 bg-white/80 backdrop-blur-md p-8 md:p-12 flex flex-col justify-center">
                            <div className="max-w-sm mx-auto w-full">
                                <p className="text-sm text-coin-800 font-semibold mb-1">CoinSec</p>
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">Login</h1>

                                <form onSubmit={submit} className="flex flex-col gap-4">
                                    <div>
                                        <InputLabel htmlFor="email" value="Email" />
                                        <TextInput
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            className="w-full mt-1 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-coin-300"
                                            autoComplete="username"
                                            isFocused={true}
                                            onChange={(e) => setData('email', e.target.value)}
                                        />
                                        <InputError message={errors.email} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="password" value="Password" />
                                        <TextInput
                                            id="password"
                                            type="password"
                                            name="password"
                                            value={data.password}
                                            className="w-full mt-1 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-coin-300"
                                            autoComplete="current-password"
                                            onChange={(e) => setData('password', e.target.value)}
                                        />
                                        <InputError message={errors.password} className="mt-2" />
                                    </div>

                                    <div className="text-right">
                                        {canResetPassword && (
                                            <Link href={route('password.request')} className="text-sm text-coin-700 hover:underline">
                                                Forgot Password?
                                            </Link>
                                        )}
                                    </div>

                                    <button type="submit" className="bg-coin-700 hover:bg-coin-800 text-white font-semibold py-2 rounded-md transition">
                                        Sign in
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}
