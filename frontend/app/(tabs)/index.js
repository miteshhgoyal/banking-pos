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
            <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#1F8A70" />
                <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 14 }}>Loading statistics...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }} edges={['top']}>
            {/* Watermark */}
            <Image
                source={require('@/assets/ph-logo.png')}
                style={{
                    position: 'absolute',
                    bottom: 40,
                    right: 20,
                    width: 80,
                    height: 80,
                    opacity: 0.1,
                    zIndex: 0
                }}
                resizeMode="contain"
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1F8A70']} />
                }
            >
                {/* Header */}
                <View style={{
                    backgroundColor: '#FFFFFF',
                    paddingHorizontal: 20,
                    paddingVertical: 24,
                    borderBottomWidth: 1,
                    borderBottomColor: '#E5E7EB',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <View>
                        <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>Welcome back,</Text>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937' }}>{user?.name || 'User'}</Text>
                    </View>
                    <Image
                        source={require('@/assets/ph-logo.png')}
                        style={{ width: 50, height: 50 }}
                        resizeMode="contain"
                    />
                </View>

                {/* Error Banner */}
                {error && (
                    <View style={{
                        margin: 20,
                        padding: 16,
                        backgroundColor: '#FEE2E2',
                        borderRadius: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderLeftWidth: 4,
                        borderLeftColor: '#DC2626'
                    }}>
                        <Ionicons name="warning" size={24} color="#DC2626" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={{ color: '#DC2626', fontSize: 14, fontWeight: '600' }}>Failed to load</Text>
                            <Text style={{ color: '#991B1B', fontSize: 12, marginTop: 2 }}>{error}</Text>
                        </View>
                        <TouchableOpacity onPress={fetchStats}>
                            <Ionicons name="refresh" size={20} color="#DC2626" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Today's Stats Card */}
                <View style={{ padding: 20 }}>
                    <Gradient type="teal" style={{
                        borderRadius: 16,
                        padding: 20,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 5,
                        overflow: 'hidden'
                    }}>
                        {/* Watermark in Card */}
                        <Image
                            source={require('@/assets/ph-logo.png')}
                            style={{
                                position: 'absolute',
                                top: -20,
                                right: -20,
                                width: 150,
                                height: 150,
                                opacity: 0.08,
                                transform: [{ rotate: '-15deg' }]
                            }}
                            resizeMode="contain"
                        />

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                            <Ionicons name="calendar" size={24} color="#FFFFFF" />
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginLeft: 8 }}>
                                Today's Collection
                            </Text>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                            <View>
                                <Text style={{ fontSize: 14, color: '#E0F2F1', marginBottom: 4 }}>Total Amount</Text>
                                <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' }}>
                                    ₹{(stats?.totalAmount || 0).toLocaleString('en-IN')}
                                </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: 14, color: '#E0F2F1', marginBottom: 4 }}>Transactions</Text>
                                <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' }}>
                                    {stats?.totalCollections || 0}
                                </Text>
                            </View>
                        </View>

                        <View style={{ height: 1, backgroundColor: '#FFFFFF40', marginVertical: 12 }} />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View style={{ alignItems: 'center' }}>
                                <Text style={{ fontSize: 12, color: '#E0F2F1', marginBottom: 4 }}>Cash</Text>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                                    ₹{(stats?.cashAmount || 0).toLocaleString('en-IN')}
                                </Text>
                            </View>
                            <View style={{ alignItems: 'center' }}>
                                <Text style={{ fontSize: 12, color: '#E0F2F1', marginBottom: 4 }}>UPI/QR</Text>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                                    ₹{(stats?.upiAmount || 0).toLocaleString('en-IN')}
                                </Text>
                            </View>
                            <View style={{ alignItems: 'center' }}>
                                <Text style={{ fontSize: 12, color: '#E0F2F1', marginBottom: 4 }}>Card</Text>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                                    ₹{(stats?.cardAmount || 0).toLocaleString('en-IN')}
                                </Text>
                            </View>
                        </View>
                    </Gradient>
                </View>

                {/* Quick Actions */}
                <View style={{ paddingHorizontal: 20, paddingBottom: 100 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 }}>
                        Quick Actions
                    </Text>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                        <TouchableOpacity
                            style={{
                                flex: 1,
                                minWidth: '47%',
                                backgroundColor: '#FFFFFF',
                                borderRadius: 12,
                                padding: 16,
                                alignItems: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.05,
                                shadowRadius: 4,
                                elevation: 2
                            }}
                            onPress={() => router.push('/(tabs)/customers')}
                            activeOpacity={0.7}
                        >
                            <View style={{
                                width: 48,
                                height: 48,
                                borderRadius: 24,
                                backgroundColor: '#E8F5E9',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 8
                            }}>
                                <Ionicons name="people" size={24} color="#1F8A70" />
                            </View>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>Customers</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{
                                flex: 1,
                                minWidth: '47%',
                                backgroundColor: '#FFFFFF',
                                borderRadius: 12,
                                padding: 16,
                                alignItems: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.05,
                                shadowRadius: 4,
                                elevation: 2
                            }}
                            onPress={() => router.push('/(tabs)/history')}
                            activeOpacity={0.7}
                        >
                            <View style={{
                                width: 48,
                                height: 48,
                                borderRadius: 24,
                                backgroundColor: '#E3F2FD',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 8
                            }}>
                                <Ionicons name="receipt" size={24} color="#2196F3" />
                            </View>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>History</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{
                                flex: 1,
                                minWidth: '47%',
                                backgroundColor: '#FFFFFF',
                                borderRadius: 12,
                                padding: 16,
                                alignItems: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.05,
                                shadowRadius: 4,
                                elevation: 2
                            }}
                            onPress={() => router.push('/(tabs)/profile')}
                            activeOpacity={0.7}
                        >
                            <View style={{
                                width: 48,
                                height: 48,
                                borderRadius: 24,
                                backgroundColor: '#F3E5F5',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 8
                            }}>
                                <Ionicons name="person" size={24} color="#9C27B0" />
                            </View>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>Profile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{
                                flex: 1,
                                minWidth: '47%',
                                backgroundColor: '#FFFFFF',
                                borderRadius: 12,
                                padding: 16,
                                alignItems: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.05,
                                shadowRadius: 4,
                                elevation: 2
                            }}
                            onPress={onRefresh}
                            activeOpacity={0.7}
                        >
                            <View style={{
                                width: 48,
                                height: 48,
                                borderRadius: 24,
                                backgroundColor: '#FFF3E0',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 8
                            }}>
                                <Ionicons name="refresh" size={24} color="#FF9800" />
                            </View>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>Refresh</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}