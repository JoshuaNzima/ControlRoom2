import { Head, Link, usePage, router } from '@inertiajs/react';
import { FormEventHandler, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, User, ArrowRight, Fingerprint, Sparkles, Sun, Moon, Shield } from 'lucide-react';

export default function Login({
  status,
  canResetPassword,
}: {
  status?: string;
  canResetPassword: boolean;
}) {
  const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '';
  const { errors } = usePage().props as any;

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'login' | 'password' | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; size: number }>>([]);

  // Generate particles on mount
  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
      size: Math.random() * 4 + 2,
    }));
    setParticles(newParticles);
  }, []);

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
    setProcessing(true);
    (router as any).post(
      route('login'),
      { login, password, remember, _token: csrf },
      {
        onFinish: () => setProcessing(false),
        onError: () => setProcessing(false),
      }
    );
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center relative overflow-hidden transition-colors duration-300 ${
      darkMode ? 'bg-[#0a0a0f]' : 'bg-gradient-to-br from-gray-50 to-gray-100'
    }`}>
      <Head title="CoinSec — Sign In" />

      {/* Background decoration */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${darkMode ? 'opacity-100' : 'opacity-30'}`}>
        <div className={`absolute inset-0 ${darkMode ? 'bg-gradient-to-br from-red-950/20 via-transparent to-black' : 'bg-gradient-to-br from-red-100/50 via-white to-gray-100'}`} />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(${darkMode ? 'rgba(220, 38, 38' : 'rgba(0, 0, 0'}, 0.5) 1px, transparent 1px), linear-gradient(90deg, ${darkMode ? 'rgba(220, 38, 38' : 'rgba(0, 0, 0'}, 0.5) 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
      }} />

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
            {/* Logo with animated glow and particles */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center mb-8 relative"
            >
              {/* Particle effects */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {particles.map((particle) => (
                  <motion.div
                    key={particle.id}
                    className={`absolute rounded-full ${darkMode ? 'bg-red-500/30' : 'bg-red-500/20'}`}
                    style={{
                      left: `${particle.x}%`,
                      top: `${particle.y}%`,
                      width: particle.size,
                      height: particle.size,
                    }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 0.8, 0.3],
                      y: [0, -20, 0],
                    }}
                    transition={{
                      duration: 3,
                      delay: particle.delay,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>

              {/* Glowing logo container */}
              <motion.div
                className="relative w-28 h-28 mb-4"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(220, 38, 38, 0.3)',
                    '0 0 40px rgba(220, 38, 38, 0.5)',
                    '0 0 20px rgba(220, 38, 38, 0.3)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {/* Outer glow ring */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{
                    background: 'radial-gradient(circle, rgba(220, 38, 38, 0.2) 0%, transparent 70%)',
                  }}
                />

                {/* Inner pulse ring */}
                <motion.div
                  className="absolute inset-2 rounded-full border-2 border-red-500/30"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />

                {/* Logo image */}
                <motion.div
                  className="relative z-10 w-full h-full flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <img
                    src="/images/Coin-logo.png"
                    alt="CoinSec Logo"
                    className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                  />
                </motion.div>

                {/* Shield icon overlay */}
                <motion.div
                  className="absolute -bottom-1 -right-1 bg-gradient-to-br from-red-600 to-red-700 rounded-full p-1.5 shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
                >
                  <Shield className="w-3 h-3 text-white" />
                </motion.div>
              </motion.div>

              {/* Title with gradient */}
              <motion.h1
                className="text-2xl font-bold tracking-tight"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <span className={`bg-gradient-to-r from-red-600 via-red-500 to-orange-500 bg-clip-text text-transparent`}>
                  CoinSec
                </span>
              </motion.h1>
              <motion.p
                className={`mt-1 text-sm transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Security Operations Platform
              </motion.p>
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

            {/* Login form */}
            <form onSubmit={submit} className="space-y-5">
              {/* Login field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className={`block text-xs font-medium uppercase tracking-wider mb-2 transition-colors ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Email or Phone
                </label>
                <div className={`relative group rounded-xl overflow-hidden transition-all duration-300 ${
                  focusedField === 'login' ? 'ring-2 ring-red-500/50' : ''
                }`}>
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    onFocus={() => setFocusedField('login')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your email or phone"
                    className={`w-full border rounded-xl py-4 pl-12 pr-4 transition-all focus:outline-none ${
                      darkMode
                        ? 'bg-black/30 border-white/10 text-white placeholder-gray-500 focus:border-red-500/50'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    }`}
                    autoComplete="username"
                    autoFocus
                  />
                </div>
                {errors.login && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-xs text-red-500">
                    {errors.login}
                  </motion.p>
                )}
              </motion.div>

              {/* Password field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className={`block text-xs font-medium uppercase tracking-wider mb-2 transition-colors ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Password
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your password"
                    className={`w-full border rounded-xl py-4 pl-12 pr-12 transition-all focus:outline-none ${
                      darkMode
                        ? 'bg-black/30 border-white/10 text-white placeholder-gray-500 focus:border-red-500/50'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    }`}
                    autoComplete="current-password"
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
                {errors.password && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-xs text-red-500">
                    {errors.password}
                  </motion.p>
                )}
              </motion.div>

              {/* Remember me and forgot password */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-between"
              >
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className={`w-5 h-5 rounded border transition-all ${
                      darkMode
                        ? 'border-white/20 bg-black/30 peer-checked:bg-red-600 peer-checked:border-red-600'
                        : 'border-gray-300 bg-white peer-checked:bg-red-600 peer-checked:border-red-600'
                    }`} />
                    <svg className="absolute inset-0 w-5 h-5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className={`text-sm transition-colors ${darkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-500 group-hover:text-gray-700'}`}>
                    Remember me
                  </span>
                </label>

                {canResetPassword && (
                  <Link href={route('password.request')} className="text-sm text-red-500 hover:text-red-600 transition-colors">
                    Forgot password?
                  </Link>
                )}
              </motion.div>

              {/* Submit button */}
              <motion.button
                type="submit"
                disabled={processing}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
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
                      <Fingerprint className="w-5 h-5" />
                      <span>Sign In</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </motion.button>
            </form>

            {/* Footer */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
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
