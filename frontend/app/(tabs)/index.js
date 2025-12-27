import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator
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

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get('/collections/stats/today');
            if (response.data.success) {
                setStats(response.data.data.stats);
            }
        } catch (error) {
            console.error('Fetch stats error:', error);
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
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1F8A70']} />
                }
            >
                {/* Header */}
                <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                    <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>Welcome back,</Text>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937' }}>{user?.name}</Text>
                </View>

                {/* Today's Stats Card */}
                <View style={{ padding: 20 }}>
                    <Gradient type="teal" style={{ borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 }}>
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
                                    ₹{stats?.totalAmount?.toLocaleString() || '0'}
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
                            <View>
                                <Text style={{ fontSize: 12, color: '#E0F2F1' }}>Cash</Text>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                                    ₹{stats?.cashAmount?.toLocaleString() || '0'}
                                </Text>
                            </View>
                            <View>
                                <Text style={{ fontSize: 12, color: '#E0F2F1' }}>UPI</Text>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                                    ₹{stats?.upiAmount?.toLocaleString() || '0'}
                                </Text>
                            </View>
                            <View>
                                <Text style={{ fontSize: 12, color: '#E0F2F1' }}>Card</Text>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                                    ₹{stats?.cardAmount?.toLocaleString() || '0'}
                                </Text>
                            </View>
                        </View>
                    </Gradient>
                </View>

                {/* Quick Actions */}
                <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 }}>
                        Quick Actions
                    </Text>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                        <TouchableOpacity
                            style={{ flex: 1, minWidth: '47%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
                            onPress={() => router.push('/(tabs)/customers')}
                        >
                            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                                <Ionicons name="people" size={24} color="#1F8A70" />
                            </View>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>Customers</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ flex: 1, minWidth: '47%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
                            onPress={() => router.push('/(tabs)/history')}
                        >
                            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E3F2FD', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                                <Ionicons name="receipt" size={24} color="#2196F3" />
                            </View>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>History</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ flex: 1, minWidth: '47%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
                            onPress={() => router.push('/(tabs)/profile')}
                        >
                            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#F3E5F5', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                                <Ionicons name="person" size={24} color="#9C27B0" />
                            </View>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>Profile</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}