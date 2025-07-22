import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { getQuartiers, Quartier } from '../services/quartier.service'
import AddressAutocomplete from '../components/AddressAutocomplete'
import LanguageSelector from '../components/LanguageSelector'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import logoSvg from '../assets/logo.svg'
import {
    User,
    Mail,
    Lock,
    Phone,
    MapPin,
    Calendar,
    Users,
    Eye,
    EyeOff,
    AlertCircle,
    Loader2,
    ArrowRight
} from 'lucide-react'

const Signup = () => {
    const { t } = useTranslation()
    const [nom, setNom] = useState('')
    const [prenom, setPrenom] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [telephone, setTelephone] = useState('')
    const [adresse, setAdresse] = useState('')
    const [latitude, setLatitude] = useState<number | null>(null)
    const [longitude, setLongitude] = useState<number | null>(null)
    const [dateNaissance, setDateNaissance] = useState('')
    const [quartierId, setQuartierId] = useState('')

    // Correct: always initialized as an array!
    const [quartiers, setQuartiers] = useState<Quartier[]>([])
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingQuartiers, setIsLoadingQuartiers] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const { register } = useAuth()
    const navigate = useNavigate()

    // Charger les quartiers au chargement du composant
    useEffect(() => {
        const fetchQuartiers = async () => {
            setIsLoadingQuartiers(true);
            try {
                console.log('Début de la récupération des quartiers...');
                const data = await getQuartiers();
                console.log('Quartiers récupérés dans Signup:', data);
                setQuartiers(data);
            } catch (error) {
                // Safe: error is unknown in TS!
                setError('Impossible de charger les quartiers. Veuillez réessayer.');
            } finally {
                setIsLoadingQuartiers(false);
            }
        };

        fetchQuartiers();
    }, [])

    const validateForm = () => {
        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas')
            return false
        }

        if (password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères')
            return false
        }

        const hasUpperCase = /[A-Z]/.test(password)
        const hasLowerCase = /[a-z]/.test(password)
        const hasNumbers = /[0-9]/.test(password)
        const hasSpecialChar = /[\W_]/.test(password)

        if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
            setError('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial')
            return false
        }

        if (telephone && !/^[0-9]{10}$/.test(telephone)) {
            setError('Le numéro de téléphone doit contenir 10 chiffres')
            return false
        }

        if (!adresse.trim()) {
            setError('L\'adresse est requise pour une application de quartier')
            return false
        }

        if (!quartierId) {
            setError('Veuillez sélectionner un quartier')
            return false
        }

        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!validateForm()) {
            return
        }

        setIsLoading(true)

        try {
            const result = await register({
                nom,
                prenom,
                email,
                password,
                telephone,
                adresse,
                latitude: latitude || undefined,
                longitude: longitude || undefined,
                date_naissance: dateNaissance || undefined,
                quartier_id: quartierId ? parseInt(quartierId) : undefined
            })

            // Redirect to verification sent page
            console.log('Signup - Navigating to verification with state:', {
                email: result.user.email,
                userId: result.user.id
            });
            navigate('/verification-sent', {
                state: {
                    email: result.user.email,
                    userId: result.user.id
                }
            })
        } catch (err: unknown) {
            // Safe error message extraction
            setError(
                err instanceof Error
                    ? err.message
                    : t('auth.signup.errors.registrationError')
            )
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

            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
            </div>

            <div className="flex min-h-screen items-center justify-center p-4 relative z-10">
                <div className="w-full max-w-2xl">
                    {/* Logo and Branding */}
                    <motion.div
                        className="text-center mb-8"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="flex items-center justify-center mb-4">
                            <img src={logoSvg} alt="Logo" className="w-32 h-32 sm:w-40 sm:h-40" />
                        </div>
                        <h1 className="text-indigo-600 text-xl sm:text-2xl font-semibold">
                            Rejoignez votre quartier
                        </h1>
                        <p className="text-gray-600 mt-2 text-sm sm:text-base">
                            Créez votre compte pour commencer à échanger avec vos voisins
                        </p>
                    </motion.div>

                    {/* Signup Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                            <CardHeader className="text-center pb-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('auth.signup.title')}</h2>
                                <p className="text-gray-600">Remplissez les informations ci-dessous</p>
                            </CardHeader>
                            <CardContent className="p-6 sm:p-8">
                                {/* Error Message */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-6 flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-lg border border-red-200"
                                    >
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        <p className="text-sm font-medium">{error}</p>
                                    </motion.div>
                                )}

                                {/* Loading State */}
                                {isLoadingQuartiers && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="mb-6 flex items-center justify-center space-x-2 text-blue-600 bg-blue-50 p-4 rounded-lg"
                                    >
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="text-sm">Chargement des quartiers...</span>
                                    </motion.div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Personal Information Section */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.3 }}
                                        className="space-y-4"
                                    >
                                        <div className="flex items-center space-x-2 mb-4">
                                            <User className="w-5 h-5 text-blue-600" />
                                            <h3 className="text-lg font-semibold text-gray-900">Informations personnelles</h3>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
                                                    Nom *
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        id="nom"
                                                        type="text"
                                                        placeholder="Votre nom"
                                                        value={nom}
                                                        onChange={e => setNom(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                                                        required
                                                    />
                                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label htmlFor="prenom" className="block text-sm font-medium text-gray-700">
                                                    Prénom *
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        id="prenom"
                                                        type="text"
                                                        placeholder="Votre prénom"
                                                        value={prenom}
                                                        onChange={e => setPrenom(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                                                        required
                                                    />
                                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                                Email *
                                            </label>
                                            <div className="relative">
                                                <input
                                                    id="email"
                                                    type="email"
                                                    placeholder="votre@email.com"
                                                    value={email}
                                                    onChange={e => setEmail(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                                                    required
                                                />
                                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                                Mot de passe *
                                            </label>
                                            <div className="relative">
                                                <input
                                                    id="password"
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Votre mot de passe"
                                                    value={password}
                                                    onChange={e => setPassword(e.target.value)}
                                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                                                    required
                                                />
                                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                                Confirmer le mot de passe *
                                            </label>
                                            <div className="relative">
                                                <input
                                                    id="confirmPassword"
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="Confirmez votre mot de passe"
                                                    value={confirmPassword}
                                                    onChange={e => setConfirmPassword(e.target.value)}
                                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                                                    required
                                                />
                                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Contact & Location Information Section */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.4 }}
                                        className="space-y-4 pt-6 border-t border-gray-200"
                                    >
                                        <div className="flex items-center space-x-2 mb-4">
                                            <MapPin className="w-5 h-5 text-blue-600" />
                                            <h3 className="text-lg font-semibold text-gray-900">Contact et localisation</h3>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label htmlFor="telephone" className="block text-sm font-medium text-gray-700">
                                                    Téléphone
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        id="telephone"
                                                        type="tel"
                                                        placeholder="0601020304"
                                                        value={telephone}
                                                        onChange={e => setTelephone(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                                                    />
                                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label htmlFor="dateNaissance" className="block text-sm font-medium text-gray-700">
                                                    Date de naissance
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        id="dateNaissance"
                                                        type="date"
                                                        value={dateNaissance}
                                                        onChange={e => setDateNaissance(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                                                    />
                                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="adresse" className="block text-sm font-medium text-gray-700">
                                                Adresse *
                                            </label>
                                            <div className="relative">
                                                <AddressAutocomplete
                                                    initialValue={adresse}
                                                    required={true}
                                                    onAddressSelect={(selectedAddress) => {
                                                        setAdresse(selectedAddress.adresse);
                                                        setLatitude(selectedAddress.latitude);
                                                        setLongitude(selectedAddress.longitude);
                                                        console.log(selectedAddress);

                                                        if (selectedAddress.quartierFound && selectedAddress.quartier_id) {
                                                            setQuartierId(String(selectedAddress.quartier_id));
                                                        } else if (selectedAddress.postcode && quartiers.length > 0) {
                                                            const matchingQuartier = quartiers.find(
                                                                q => q.code_postal === selectedAddress.postcode
                                                            );
                                                            if (matchingQuartier) {
                                                                setQuartierId(String(matchingQuartier.id));
                                                            } else {
                                                                setQuartierId('');
                                                            }
                                                        } else {
                                                            setQuartierId('');
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Commencez à saisir votre adresse pour voir les suggestions
                                            </p>
                                        </div>
                                    </motion.div>

                                    {/* Submit Button */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.5 }}
                                        className="pt-6"
                                    >
                                        <Button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    <span>Inscription en cours...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Users className="w-5 h-5" />
                                                    <span>{t('auth.signup.signupButton')}</span>
                                                </>
                                            )}
                                        </Button>
                                    </motion.div>

                                    {/* Login Link */}
                                    <motion.div
                                        className="mt-8 text-center"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.5, delay: 0.6 }}
                                    >
                                        <p className="text-gray-600">
                                            {t('auth.signup.alreadyHaveAccount')}{' '}
                                            <Link
                                                to="/login"
                                                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-300 inline-flex items-center space-x-1 group"
                                            >
                                                <span>{t('auth.signup.loginLink')}</span>
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                                            </Link>
                                        </p>
                                    </motion.div>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

export default Signup
