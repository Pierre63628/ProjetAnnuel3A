import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import LanguageSelector from '../components/LanguageSelector'
import {
    Mail,
    Lock,
    LogIn,
    Sparkles,
    Users,
    Home,
    Heart,
    ArrowRight,
    Eye,
    EyeOff,
    AlertCircle,
    Loader2
} from 'lucide-react'

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const { login } = useAuth()
    const { t } = useTranslation()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            await login(email, password)
            navigate('/')
        } catch (err: any) {
            setError(err.message || t('auth.login.errors.invalidCredentials'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white relative overflow-hidden">
            {/* Language Selector */}
            <div className="absolute top-4 right-4 z-20">
                <LanguageSelector />
            </div>

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500 rounded-full"></div>
                <div className="absolute top-32 right-20 w-16 h-16 bg-purple-500 rounded-full"></div>
                <div className="absolute bottom-20 left-20 w-24 h-24 bg-indigo-500 rounded-full"></div>
                <div className="absolute bottom-40 right-10 w-12 h-12 bg-blue-400 rounded-full"></div>
                <div className="absolute top-1/2 left-1/3 w-8 h-8 bg-purple-400 rounded-full"></div>
                <div className="absolute top-1/4 right-1/3 w-6 h-6 bg-indigo-400 rounded-full"></div>
            </div>

            <div className="flex min-h-screen items-center justify-center p-4 relative z-10">
                <div className="w-full max-w-md">
                    {/* Logo and Branding */}
                    <motion.div
                        className="text-center mb-8"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="flex items-center justify-center mb-4">
                            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                            NextDoorBuddy
                        </h1>
                        <p className="text-gray-600 text-lg">
                            Connectez-vous à votre quartier
                        </p>
                    </motion.div>

                    {/* Login Card */}
                    <motion.div
                        className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('auth.login.title')}</h2>
                            <p className="text-gray-600">{t('auth.login.subtitle')}</p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                <p className="text-red-700 text-sm">{error}</p>
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email Field */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                            >
                                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                    {t('auth.login.email')}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="votre@email.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm"
                                        required
                                    />
                                </div>
                            </motion.div>

                            {/* Password Field */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                            >
                                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                                    {t('auth.login.password')}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Votre mot de passe"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </motion.div>

                            {/* Submit Button */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.5 }}
                            >
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>{t('auth.login.loggingIn')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <LogIn className="w-5 h-5" />
                                            <span>{t('auth.login.loginButton')}</span>
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        </form>

                        {/* Signup Link */}
                        <motion.div
                            className="mt-8 text-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.6 }}
                        >
                            <p className="text-gray-600">
                                {t('auth.login.noAccount')}{' '}
                                <Link
                                    to="/signup"
                                    className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-300 inline-flex items-center space-x-1 group"
                                >
                                    <span>{t('auth.login.signUp')}</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                                </Link>
                            </p>
                        </motion.div>
                    </motion.div>

                    {/* Community Features */}
                    <motion.div
                        className="mt-8 grid grid-cols-3 gap-4 text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                    >
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                            <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                            <p className="text-xs text-gray-600 font-medium">Rencontrez vos voisins</p>
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                            <Home className="w-6 h-6 text-green-600 mx-auto mb-2" />
                            <p className="text-xs text-gray-600 font-medium">Événements locaux</p>
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                            <Heart className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                            <p className="text-xs text-gray-600 font-medium">Entraide communautaire</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

export default Login
