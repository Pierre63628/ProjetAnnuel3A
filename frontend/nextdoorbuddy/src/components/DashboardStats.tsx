import { motion } from 'framer-motion';
import { Card } from './ui/card';
import { Calendar, Heart, TrendingUp } from 'lucide-react';

interface DashboardStatsProps {
    todaysEventsCount: number;
    userEventsCount: number;
    loading?: boolean;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
    todaysEventsCount,
    userEventsCount,
    loading = false
}) => {
    const stats = [
        {
            title: "Événements aujourd'hui",
            value: todaysEventsCount,
            icon: Calendar,
            gradient: "from-blue-500 to-blue-600",
            iconColor: "text-blue-200"
        },
        {
            title: "Mes événements à venir",
            value: userEventsCount,
            icon: Heart,
            gradient: "from-green-500 to-green-600",
            iconColor: "text-green-200"
        },
        {
            title: "Quartier actif",
            value: "100%",
            icon: TrendingUp,
            gradient: "from-purple-500 to-purple-600",
            iconColor: "text-purple-200",
            showTrendingIcon: true
        }
    ];

    return (
        <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
        >
            {stats.map((stat, index) => (
                <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                >
                    <Card className={`p-6 bg-gradient-to-r ${stat.gradient} text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm font-medium mb-1">
                                    {stat.title}
                                </p>
                                {loading ? (
                                    <div className="animate-pulse">
                                        <div className="h-8 w-16 bg-white/20 rounded"></div>
                                    </div>
                                ) : (
                                    <p className="text-3xl font-bold flex items-center">
                                        {stat.showTrendingIcon && (
                                            <TrendingUp className="w-6 h-6 inline mr-1" />
                                        )}
                                        {stat.value}
                                    </p>
                                )}
                            </div>
                            <stat.icon className={`w-8 h-8 ${stat.iconColor}`} />
                        </div>
                    </Card>
                </motion.div>
            ))}
        </motion.div>
    );
};

export default DashboardStats;
