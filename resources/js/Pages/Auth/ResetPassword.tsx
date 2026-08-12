import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Sparkles, Sun, Moon, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function ResetPassword({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const { data, setData, post, processing, errors, reset } = useForm({
    token: token,
    email: email,
    password: '',
    password_confirmation: '',
  });

  const [darkMode, setDarkMode] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    post(route('password.store'), {
      onFinish: () => {
        setData('password', '');
        setData('password_confirmation', '');
      },
    });
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center relative overflow-hidden transition-colors duration-300 ${
      darkMode ? 'bg-[#0a0a0f]' : 'bg-gradient-to-br from-gray-50 to-gray-100'
    }`}>
      <Head title="CoinSec — Set New Password" />

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
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
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
                Set New Password
              </h1>
              <p className={`mt-2 text-sm text-center transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Create a strong password for your account
              </p>
            </motion.div>

            {/* Error messages */}
            <AnimatePresence>
              {(errors.email || errors.password || errors.password_confirmation) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center"
                >
                  {errors.email || errors.password || errors.password_confirmation}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={submit} className="space-y-5">
              {/* Email field (readonly) */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className={`block text-xs font-medium uppercase tracking-wider mb-2 transition-colors ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Email
                </label>
                <div className={`relative group rounded-xl overflow-hidden ${
                  darkMode ? 'bg-black/30 border border-white/10' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={data.email}
                    readOnly
                    className={`w-full border-0 rounded-xl py-4 pl-12 pr-4 bg-transparent ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  />
                </div>
              </motion.div>

              {/* Password field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className={`block text-xs font-medium uppercase tracking-wider mb-2 transition-colors ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  New Password
                </label>
                <div className={`relative group rounded-xl overflow-hidden transition-all duration-300 ${
                  focusedField === 'password' ? 'ring-2 ring-red-500/50' : ''
                }`}>
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter new password"
                    className={`w-full border rounded-xl py-4 pl-12 pr-12 transition-all focus:outline-none ${
                      darkMode
                        ? 'bg-black/30 border-white/10 text-white placeholder-gray-500 focus:border-red-500/50'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    }`}
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                      darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </motion.div>

              {/* Confirm Password field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className={`block text-xs font-medium uppercase tracking-wider mb-2 transition-colors ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Confirm Password
                </label>
                <div className={`relative group rounded-xl overflow-hidden transition-all duration-300 ${
                  focusedField === 'password_confirmation' ? 'ring-2 ring-red-500/50' : ''
                }`}>
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={data.password_confirmation}
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                    onFocus={() => setFocusedField('password_confirmation')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Confirm your password"
                    className={`w-full border rounded-xl py-4 pl-12 pr-12 transition-all focus:outline-none ${
                      darkMode
                        ? 'bg-black/30 border-white/10 text-white placeholder-gray-500 focus:border-red-500/50'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    }`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                      darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </motion.div>

              {/* Submit button */}
              <motion.button
                type="submit"
                disabled={processing}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative w-full group overflow-hidden mt-6"
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
                      <ShieldCheck className="w-5 h-5" />
                      <span>Reset Password</span>
                    </>
                  )}
                </div>
              </motion.button>
            </form>

            {/* Footer */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
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
