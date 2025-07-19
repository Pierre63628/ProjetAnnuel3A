import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Evenement } from '../services/evenement.service';

interface CalendarWidgetProps {
    events: Evenement[];
    onDateClick?: (date: Date) => void;
    className?: string;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ 
    events, 
    onDateClick, 
    className = '' 
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [eventDates, setEventDates] = useState<Set<string>>(new Set());

    useEffect(() => {
        // Create a set of dates that have events
        const dates = new Set<string>();
        events.forEach(event => {
            const eventDate = new Date(event.date_evenement);
            const dateStr = eventDate.toDateString();
            dates.add(dateStr);
        });
        setEventDates(dates);
    }, [events]);

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (direction === 'prev') {
                newDate.setMonth(prev.getMonth() - 1);
            } else {
                newDate.setMonth(prev.getMonth() + 1);
            }
            return newDate;
        });
    };

    const isToday = (day: number) => {
        const today = new Date();
        return (
            today.getDate() === day &&
            today.getMonth() === currentDate.getMonth() &&
            today.getFullYear() === currentDate.getFullYear()
        );
    };

    const hasEvent = (day: number) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        return eventDates.has(date.toDateString());
    };

    const handleDateClick = (day: number) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        onDateClick?.(date);
    };

    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

    return (
        <div className={`bg-white rounded-lg ${className}`}>
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <button
                    onClick={() => navigateMonth('prev')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                
                <button
                    onClick={() => navigateMonth('next')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
                {/* Day Names */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {dayNames.map(day => (
                        <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                    {/* Empty days for month start */}
                    {emptyDays.map(day => (
                        <div key={`empty-${day}`} className="h-8"></div>
                    ))}
                    
                    {/* Month days */}
                    {days.map(day => (
                        <motion.button
                            key={day}
                            onClick={() => handleDateClick(day)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className={`
                                h-8 w-8 rounded-lg text-sm font-medium transition-all duration-200 relative
                                ${isToday(day) 
                                    ? 'bg-blue-600 text-white shadow-md' 
                                    : 'text-gray-700 hover:bg-gray-100'
                                }
                                ${hasEvent(day) && !isToday(day) 
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                    : ''
                                }
                            `}
                        >
                            {day}
                            {hasEvent(day) && (
                                <div className={`
                                    absolute bottom-0 right-0 w-2 h-2 rounded-full
                                    ${isToday(day) ? 'bg-white' : 'bg-green-500'}
                                `} />
                            )}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="px-4 pb-4">
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-600 rounded-full mr-1"></div>
                        Aujourd'hui
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                        Événement
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarWidget;
