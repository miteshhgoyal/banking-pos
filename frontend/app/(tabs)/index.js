import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import Gradient from '@/components/Gradient';

export default function HomeScreen() {
    const router = useRouter();
    const { user } = useAuth();

    const [stats, setStats] = useState({
        totalCollections: 0,
        totalAmount: 0,
        cashAmount: 0,
        upiAmount: 0,
        cardAmount: 0
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setError(null);
            const response = await api.get('/collections/stats/today');

            if (response?.data?.success && response?.data?.data?.stats) {
                setStats(response.data.data.stats);
            } else {
                console.warn('Invalid stats response, using defaults');
            }
        } catch (error) {
            console.error('Fetch stats error:', error);

            const errorMessage = error?.response?.data?.message ||
                error?.message ||
                'Failed to load statistics';

            setError(errorMessage);

            if (refreshing) {
                Alert.alert('Error', errorMessage);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    if (loading) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color="#1F8A70" />
                <Text className="mt-4 text-gray-600 text-base font-medium">Loading statistics...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
            {/* Background Watermark */}
            <Image
                source={require('@/assets/ph-logo.png')}
                className="absolute bottom-20 right-8 w-32 h-32 opacity-5"
                style={{ zIndex: 0 }}
                resizeMode="contain"
            />

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#1F8A70']}
                        tintColor="#1F8A70"
                    />
                }
            >
                {/* Modern Header with Gradient Background */}
                <View className="bg-white pt-4 pb-6 px-6 shadow-sm">
                    <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-1">
                            <Text className="text-sm text-gray-500 font-medium mb-1">Welcome back</Text>
                            <Text className="text-2xl font-bold text-gray-900 tracking-tight">
                                {user?.name || 'User'}
                            </Text>
                        </View>
                        <View className="w-14 h-14 rounded-full bg-teal-50 items-center justify-center border-2 border-teal-100">
                            <Image
                                source={require('@/assets/ph-logo.png')}
                                className="w-9 h-9"
                                resizeMode="contain"
                            />
                        </View>
                    </View>

                    {/* Date Indicator */}
                    <View className="flex-row items-center mt-2">
                        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                        <Text className="text-xs text-gray-500 ml-1.5 font-medium">
                            {new Date().toLocaleDateString('en-IN', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </Text>
                    </View>
                </View>

                {/* Error Banner with Modern Design */}
                {error && (
                    <View className="mx-5 mt-4 p-4 bg-red-50 rounded-2xl flex-row items-start border border-red-200">
                        <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center">
                            <Ionicons name="alert-circle" size={22} color="#DC2626" />
                        </View>
                        <View className="flex-1 ml-3">
                            <Text className="text-red-700 text-sm font-bold">Unable to Load Data</Text>
                            <Text className="text-red-600 text-xs mt-1 leading-4">{error}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={fetchStats}
                            className="w-9 h-9 rounded-full bg-red-100 items-center justify-center ml-2"
                            activeOpacity={0.7}
                        >
                            <Ionicons name="refresh" size={18} color="#DC2626" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Modern Stats Card with Enhanced Design */}
                <View className="mx-5 mt-5 rounded-3xl overflow-hidden shadow-2xl shadow-teal-600/20">
                    <Gradient type="teal">
                        <View className="p-6">
                            {/* Card Watermark */}
                            <Image
                                source={require('@/assets/ph-logo.png')}
                                className="absolute -top-8 -right-8 w-40 h-40 opacity-10"
                                style={{ transform: [{ rotate: '-12deg' }] }}
                                resizeMode="contain"
                            />

                            {/* Card Header */}
                            <View className="flex-row items-center justify-between mb-5">
                                <View className="flex-row items-center">
                                    <View className="w-11 h-11 rounded-xl bg-white/20 items-center justify-center mr-3">
                                        <Ionicons name="stats-chart" size={24} color="#FFFFFF" />
                                    </View>
                                    <View>
                                        <Text className="text-base font-bold text-white">Today's Collection</Text>
                                        <Text className="text-xs text-white/70 mt-0.5">Real-time overview</Text>
                                    </View>
                                </View>
                                <View className="px-3 py-1.5 bg-white/20 rounded-full">
                                    <Text className="text-xs font-semibold text-white">LIVE</Text>
                                </View>
                            </View>

                            {/* Main Stats - Bento Grid Style */}
                            <View className="bg-white/10 rounded-2xl p-4 mb-4 backdrop-blur-sm">
                                <View className="flex-row justify-between items-center">
                                    <View className="flex-1">
                                        <Text className="text-xs text-white/80 mb-1.5 font-medium tracking-wide">TOTAL AMOUNT</Text>
                                        <Text className="text-4xl font-black text-white tracking-tight">
                                            ₹{(stats?.totalAmount || 0).toLocaleString('en-IN')}
                                        </Text>
                                    </View>
                                    <View className="w-px h-14 bg-white/20 mx-4" />
                                    <View className="items-end flex-1">
                                        <Text className="text-xs text-white/80 mb-1.5 font-medium tracking-wide">TRANSACTIONS</Text>
                                        <Text className="text-4xl font-black text-white tracking-tight">
                                            {stats?.totalCollections || 0}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Payment Method Breakdown */}
                            <View className="flex-row justify-between">
                                <View className="flex-1 bg-white/10 rounded-xl p-3 mr-2">
                                    <View className="flex-row items-center mb-2">
                                        <Ionicons name="cash-outline" size={18} color="#FFFFFF" />
                                        <Text className="text-xs text-white/80 ml-1.5 font-medium">Cash</Text>
                                    </View>
                                    <Text className="text-lg font-bold text-white">
                                        ₹{(stats?.cashAmount || 0).toLocaleString('en-IN')}
                                    </Text>
                                </View>

                                <View className="flex-1 bg-white/10 rounded-xl p-3 mx-1">
                                    <View className="flex-row items-center mb-2">
                                        <Ionicons name="qr-code-outline" size={18} color="#FFFFFF" />
                                        <Text className="text-xs text-white/80 ml-1.5 font-medium">UPI</Text>
                                    </View>
                                    <Text className="text-lg font-bold text-white">
                                        ₹{(stats?.upiAmount || 0).toLocaleString('en-IN')}
                                    </Text>
                                </View>

                                <View className="flex-1 bg-white/10 rounded-xl p-3 ml-2">
                                    <View className="flex-row items-center mb-2">
                                        <Ionicons name="card-outline" size={18} color="#FFFFFF" />
                                        <Text className="text-xs text-white/80 ml-1.5 font-medium">Card</Text>
                                    </View>
                                    <Text className="text-lg font-bold text-white">
                                        ₹{(stats?.cardAmount || 0).toLocaleString('en-IN')}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </Gradient>
                </View>

                {/* Quick Actions with Modern Grid */}
                <View className="px-5 pt-6 pb-8">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-xl font-bold text-gray-900">Quick Actions</Text>
                        <View className="px-2.5 py-1 bg-teal-50 rounded-lg">
                            <Text className="text-xs font-semibold text-teal-700">4 Options</Text>
                        </View>
                    </View>

                    <View className="flex-row flex-wrap -mx-1.5">
                        {/* Customers */}
                        <View className="w-1/2 px-1.5 mb-3">
                            <TouchableOpacity
                                className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100"
                                onPress={() => router.push('/(tabs)/customers')}
                                activeOpacity={0.7}
                            >
                                <View className="w-14 h-14 rounded-2xl bg-teal-50 items-center justify-center mb-3 shadow-sm">
                                    <Ionicons name="people" size={28} color="#1F8A70" />
                                </View>
                                <Text className="text-base font-bold text-gray-900 mb-0.5">Customers</Text>
                                <Text className="text-xs text-gray-500">Manage contacts</Text>
                            </TouchableOpacity>
                        </View>

                        {/* History */}
                        <View className="w-1/2 px-1.5 mb-3">
                            <TouchableOpacity
                                className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100"
                                onPress={() => router.push('/(tabs)/history')}
                                activeOpacity={0.7}
                            >
                                <View className="w-14 h-14 rounded-2xl bg-blue-50 items-center justify-center mb-3 shadow-sm">
                                    <Ionicons name="receipt" size={28} color="#2196F3" />
                                </View>
                                <Text className="text-base font-bold text-gray-900 mb-0.5">History</Text>
                                <Text className="text-xs text-gray-500">View records</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Profile */}
                        <View className="w-1/2 px-1.5 mb-3">
                            <TouchableOpacity
                                className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100"
                                onPress={() => router.push('/(tabs)/profile')}
                                activeOpacity={0.7}
                            >
                                <View className="w-14 h-14 rounded-2xl bg-purple-50 items-center justify-center mb-3 shadow-sm">
                                    <Ionicons name="person" size={28} color="#9C27B0" />
                                </View>
                                <Text className="text-base font-bold text-gray-900 mb-0.5">Profile</Text>
                                <Text className="text-xs text-gray-500">Account settings</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Refresh */}
                        <View className="w-1/2 px-1.5 mb-3">
                            <TouchableOpacity
                                className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100"
                                onPress={onRefresh}
                                activeOpacity={0.7}
                            >
                                <View className="w-14 h-14 rounded-2xl bg-amber-50 items-center justify-center mb-3 shadow-sm">
                                    <Ionicons name="refresh" size={28} color="#FF9800" />
                                </View>
                                <Text className="text-base font-bold text-gray-900 mb-0.5">Refresh</Text>
                                <Text className="text-xs text-gray-500">Update data</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Bottom Spacing */}
                <View className="h-6" />
            </ScrollView>
        </SafeAreaView>
    );
}
