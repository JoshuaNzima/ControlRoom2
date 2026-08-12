import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, Sparkles, Sun, Moon, Send } from 'lucide-react';

export default function ForgotPassword({ status }: { status?: string }) {
  const { data, setData, post, processing, errors } = useForm({
    email: '',
  });

  const [darkMode, setDarkMode] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Check system preference on mount
  useEffect(() => {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedMode = localStorage.getItem('coinsec-theme');
    if (savedMode) {
      setDarkMode(savedMode === 'dark');
    } else {
      setDarkMode(prefersDark);
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('coinsec-theme', newMode ? 'dark' : 'light');
  };

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post(route('password.email'));
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center relative overflow-hidden transition-colors duration-300 ${
      darkMode ? 'bg-[#0a0a0f]' : 'bg-gradient-to-br from-gray-50 to-gray-100'
    }`}>
      <Head title="CoinSec — Reset Password" />

      {/* Background decoration */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${darkMode ? 'opacity-100' : 'opacity-30'}`}>
        <div className={`absolute inset-0 ${darkMode ? 'bg-gradient-to-br from-red-950/20 via-transparent to-black' : 'bg-gradient-to-br from-red-100/50 via-white to-gray-100'}`} />
      </div>

      {/* Grid pattern - hidden in light mode for cleaner look */}
      {darkMode && (
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(220, 38, 38, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(220, 38, 38, 0.5) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      )}

      {/* Dark mode toggle */}
      <motion.button
        onClick={toggleDarkMode}
        className={`absolute top-6 right-6 p-3 rounded-full transition-all z-50 ${
          darkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white text-gray-700 hover:bg-gray-100 shadow-lg'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </motion.button>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <div className={`rounded-3xl shadow-2xl overflow-hidden transition-colors duration-300 ${
          darkMode ? 'bg-gray-900/80 border border-white/10' : 'bg-white border border-gray-200'
        }`}>
          {/* Top accent line */}
          <div className="h-1 bg-gradient-to-r from-red-600 via-red-500 to-orange-500" />

          <div className="p-8 md:p-10">
            {/* Back to login link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <Link
                href={route('login')}
                className={`inline-flex items-center gap-2 text-sm transition-colors ${
                  darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </motion.div>

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center mb-8"
            >
              <motion.div
                className="w-20 h-20 mb-4"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <img
                  src="/images/Coin-logo.png"
                  alt="CoinSec Logo"
                  className="w-full h-full object-contain"
                />
              </motion.div>
              <h1 className={`text-2xl font-bold tracking-tight transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Forgot Password?
              </h1>
              <p className={`mt-2 text-sm text-center transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No problem. Enter your email and we'll send you a reset link.
              </p>
            </motion.div>

            {/* Status message */}
            <AnimatePresence>
              {status && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-sm text-center"
                >
                  {status}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error message */}
            <AnimatePresence>
              {errors.email && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center"
                >
                  {errors.email}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={submit} className="space-y-5">
              {/* Email field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className={`block text-xs font-medium uppercase tracking-wider mb-2 transition-colors ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Email Address
                </label>
                <div className={`relative group rounded-xl overflow-hidden transition-all duration-300 ${
                  focusedField === 'email' ? 'ring-2 ring-red-500/50' : ''
                }`}>
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your email address"
                    className={`w-full border rounded-xl py-4 pl-12 pr-4 transition-all focus:outline-none ${
                      darkMode
                        ? 'bg-black/30 border-white/10 text-white placeholder-gray-500 focus:border-red-500/50'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    }`}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </motion.div>

              {/* Submit button */}
              <motion.button
                type="submit"
                disabled={processing}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative w-full group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 rounded-xl" />
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                <div className="relative flex items-center justify-center gap-2 py-4 text-white font-semibold">
                  {processing ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Send Reset Link</span>
                    </>
                  )}
                </div>
              </motion.button>
            </form>

            {/* Footer */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className={`mt-8 text-center text-xs transition-colors ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
            >
              Protected by CoinSec Security Protocol
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
