import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Header from '../components/Header'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { motion } from 'framer-motion'
import { getAdminStats, getTrocStats } from '../services/admin.service'
import {
    Users,
    MapPin,
    Calendar,
    ArrowRightLeft,
    TrendingUp,
    Activity,
    BarChart3,
    Settings,
    Sparkles,
    Plus,
    Eye,
    Edit,
    Shield
} from 'lucide-react'

const AdminDashboard = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalQuartiers: 0,
        totalEvents: 0
    })
    const [trocStats, setTrocStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        byCategory: {},
        byType: {}
    })
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    // Vérifier si l'utilisateur est admin
    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/')
            return
        }

        // Charger les statistiques
        loadStats()
    }, [user, navigate])

    const loadStats = async () => {
        try {
            setIsLoading(true)
            setError('')

            const [adminStatsData, trocStatsData] = await Promise.all([
                getAdminStats(),
                getTrocStats()
            ])

            setStats(adminStatsData)
            setTrocStats(trocStatsData)
        } catch (error) {
            console.error('Erreur lors du chargement des statistiques:', error)
            setError('Erreur lors du chargement des statistiques')
        } finally {
            setIsLoading(false)
        }
    }

    if (!user || user.role !== 'admin') {
        return null
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
            <Header />

            {/* Main content */}
            <main className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Welcome Header */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center">
                            <Shield className="w-8 h-8 text-blue-600 mr-3" />
                            Tableau de bord administrateur
                        </h1>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                            Gérez et supervisez votre plateforme NextDoorBuddy
                        </p>
                    </div>
                </motion.div>

                {error && (
                    <motion.div
                        className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {error}
                        <Button
                            onClick={loadStats}
                            variant="outline"
                            size="sm"
                            className="ml-4"
                        >
                            Réessayer
                        </Button>
                    </motion.div>
                )}

                {/* Statistics Cards */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    {/* Users Stats */}
                    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Utilisateurs</p>
                                    <p className="text-3xl font-bold text-blue-600">
                                        {isLoading ? '...' : stats.totalUsers}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quartiers Stats */}
                    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Quartiers</p>
                                    <p className="text-3xl font-bold text-green-600">
                                        {isLoading ? '...' : stats.totalQuartiers}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                                    <MapPin className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Events Stats */}
                    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Événements</p>
                                    <p className="text-3xl font-bold text-purple-600">
                                        {isLoading ? '...' : stats.totalEvents}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Trocs Stats */}
                    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Trocs</p>
                                    <p className="text-3xl font-bold text-orange-600">
                                        {isLoading ? '...' : trocStats.total}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                                    <ArrowRightLeft className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Troc Statistics Detail */}
                {!isLoading && trocStats.total > 0 && (
                    <motion.div
                        className="mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                    <BarChart3 className="w-6 h-6 text-orange-600 mr-3" />
                                    Statistiques des trocs
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                                            <span className="text-green-800 font-medium">Trocs actifs</span>
                                            <span className="text-2xl font-bold text-green-600">{trocStats.active}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                                            <span className="text-red-800 font-medium">Trocs inactifs</span>
                                            <span className="text-2xl font-bold text-red-600">{trocStats.inactive}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-700">Répartition par type</h3>
                                        {Object.entries(trocStats.byType).map(([type, count]) => (
                                            <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <span className="text-gray-700 capitalize">{type}</span>
                                                <span className="font-semibold text-gray-900">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Quick Actions */}
                <motion.div
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    {/* Management Actions */}
                    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                <Settings className="w-5 h-5 text-blue-600 mr-2" />
                                Gestion
                            </h3>
                            <div className="space-y-4">
                                <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                                    <Link
                                        to="/admin/users"
                                        className="flex items-center p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 group"
                                    >
                                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                            <Users className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                Gérer les utilisateurs
                                            </h4>
                                            <p className="text-sm text-gray-500">
                                                Voir, modifier et supprimer les comptes
                                            </p>
                                        </div>
                                        <Eye className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                    </Link>
                                </motion.div>

                                <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                                    <Link
                                        to="/admin/quartiers"
                                        className="flex items-center p-4 border border-gray-200 rounded-xl hover:bg-green-50 hover:border-green-300 transition-all duration-300 group"
                                    >
                                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                            <MapPin className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <h4 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                                                Gérer les quartiers
                                            </h4>
                                            <p className="text-sm text-gray-500">
                                                Ajouter, modifier et organiser les quartiers
                                            </p>
                                        </div>
                                        <Edit className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                                    </Link>
                                </motion.div>

                                <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                                    <Link
                                        to="/admin/trocs"
                                        className="flex items-center p-4 border border-gray-200 rounded-xl hover:bg-orange-50 hover:border-orange-300 transition-all duration-300 group"
                                    >
                                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                                            <ArrowRightLeft className="w-6 h-6 text-orange-600" />
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <h4 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                                                Gérer les trocs
                                            </h4>
                                            <p className="text-sm text-gray-500">
                                                Modérer et administrer les annonces
                                            </p>
                                        </div>
                                        <Settings className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
                                    </Link>
                                </motion.div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                <Activity className="w-5 h-5 text-purple-600 mr-2" />
                                Activité récente
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                            <Users className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="font-medium text-gray-900">Utilisateurs totaux</p>
                                            <p className="text-sm text-gray-500">Membres inscrits</p>
                                        </div>
                                    </div>
                                    <span className="text-2xl font-bold text-blue-600">{stats.totalUsers}</span>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                            <Calendar className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="font-medium text-gray-900">Événements</p>
                                            <p className="text-sm text-gray-500">Total créés</p>
                                        </div>
                                    </div>
                                    <span className="text-2xl font-bold text-green-600">{stats.totalEvents}</span>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                                            <TrendingUp className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="font-medium text-gray-900">Taux d'activité</p>
                                            <p className="text-sm text-gray-500">Trocs actifs</p>
                                        </div>
                                    </div>
                                    <span className="text-2xl font-bold text-purple-600">
                                        {trocStats.total > 0 ? Math.round((trocStats.active / trocStats.total) * 100) : 0}%
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Loading State */}
                {isLoading && (
                    <motion.div
                        className="flex items-center justify-center py-12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="flex items-center space-x-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="text-gray-600 font-medium">Chargement des statistiques...</p>
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    )
}

export default AdminDashboard