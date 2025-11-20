import React from 'react';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';

// Calendar helper functions
const isSameDay = (date1: string | Date, date2: string | Date) => {
    if (!date1 || !date2) return false;
    
    let d1: Date;
    let d2: Date;
    
    if (typeof date1 === 'string') {
        // Handle both ISO strings and date strings
        d1 = date1.includes('T') ? new Date(date1) : new Date(date1 + 'T00:00:00');
    } else {
        d1 = date1;
    }
    
    if (typeof date2 === 'string') {
        // Handle both ISO strings and date strings  
        d2 = date2.includes('T') ? new Date(date2) : new Date(date2 + 'T00:00:00');
    } else {
        d2 = date2;
    }
    
    return d1.toDateString() === d2.toDateString();
};

const isDateInRange = (date: Date, startDate: string, endDate: string) => {
    if (!startDate || !endDate) return false;
    
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Handle both ISO strings and date strings
    const start = startDate.includes('T') ? new Date(startDate) : new Date(startDate + 'T00:00:00');
    const end = endDate.includes('T') ? new Date(endDate) : new Date(endDate + 'T00:00:00');
    
    return checkDate >= start && checkDate <= end;
};

interface WeekCalendarProps {
    tripStartDate?: string;
    tripEndDate?: string;
    style?: any;
}

const WeekCalendar: React.FC<WeekCalendarProps> = ({ 
    tripStartDate = '', 
    tripEndDate = '',
    style
}) => {
    const today = new Date();
    
    // Debug logging
    console.log('🗓️ WeekCalendar received:');
    console.log('  tripStartDate:', tripStartDate);
    console.log('  tripEndDate:', tripEndDate);
    console.log('  tripStartDate type:', typeof tripStartDate);
    console.log('  tripEndDate type:', typeof tripEndDate);
    
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    // Calculate the week dates starting from today (today + next 6 days)
    const getWeekDates = () => {
        const dates = [];
        
        // Create 7 days starting from today: today + next 6 days
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date);
        }
        
        return dates;
    };
    
    const weekDates = getWeekDates();
    
    const renderWeekDays = () => {
        return weekDates.map((date, index) => {
            const day = date.getDate();
            const isToday = isSameDay(date, today);
            const isStartDate = tripStartDate && isSameDay(date, tripStartDate);
            const isEndDate = tripEndDate && isSameDay(date, tripEndDate);
            const isInRange = isDateInRange(date, tripStartDate, tripEndDate);
            
            // Debug each date
            if (tripStartDate || tripEndDate) {
                console.log(`📅 Day ${day} (${date.toDateString()}):`);
                console.log(`  Checking against startDate: ${tripStartDate}`);
                console.log(`  Checking against endDate: ${tripEndDate}`);
                console.log(`  isStartDate: ${isStartDate}`);
                console.log(`  isEndDate: ${isEndDate}`);
                console.log(`  isInRange: ${isInRange}`);
                console.log(`  isToday: ${isToday}`);
            }
            
            let dayStyle = styles.weekCalendarDay;
            let textStyle: any = styles.weekCalendarDayText;
            
            if (isToday) {
                dayStyle = { ...dayStyle, ...styles.weekCalendarToday };
                textStyle = styles.weekCalendarTodayText;
            } else if (isStartDate || isEndDate) {
                dayStyle = { ...dayStyle, ...styles.weekCalendarTripDate };
                textStyle = styles.weekCalendarTripDateText;
                console.log(`🎯 Applied trip date styling to day ${day}`);
            } else if (isInRange) {
                dayStyle = { ...dayStyle, ...styles.weekCalendarTripRange };
                textStyle = styles.weekCalendarTripRangeText;
                console.log(`🎯 Applied trip range styling to day ${day}`);
            }
            
            return (
                <View key={index} style={styles.weekCalendarColumn}>
                    <Text style={styles.weekCalendarDayName}>
                        {dayNames[date.getDay()]}
                    </Text>
                    <View style={dayStyle}>
                        <Text style={textStyle}>{day}</Text>
                    </View>
                </View>
            );
        });
    };
    
    return (
        <View style={[styles.weekCalendarContainer, style]}>
            <View style={styles.weekCalendarGrid}>
                {renderWeekDays()}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    // Week Calendar styles
    weekCalendarContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 12,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    weekCalendarGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    weekCalendarColumn: {
        alignItems: 'center',
        flex: 1,
    },
    weekCalendarDayName: {
        fontSize: 12,
        fontWeight: '500',
        color: '#666',
        marginBottom: 8,
    },
    weekCalendarDay: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    weekCalendarDayText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    weekCalendarToday: {
        backgroundColor: '#007AFF',
        width: 36,
        height: 36,
        borderRadius: 18,
        transform: [{ scale: 1.05 }],
    },
    weekCalendarTodayText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    weekCalendarTripDate: {
        backgroundColor: '#34C759',
        width: 34,
        height: 34,
        borderRadius: 17,
    },
    weekCalendarTripDateText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    weekCalendarTripRange: {
        backgroundColor: '#E8F5E8',
        width: 33,
        height: 33,
        borderRadius: 16.5,
    },
    weekCalendarTripRangeText: {
        color: '#34C759',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default WeekCalendar;