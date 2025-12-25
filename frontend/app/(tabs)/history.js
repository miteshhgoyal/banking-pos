import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/services/api';

export default function HistoryScreen() {
    const router = useRouter();

    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await api.get('/collections');
            if (response.data.success) {
                setCollections(response.data.data.collections);
                setSummary(response.data.summary);
            }
        } catch (error) {
            console.error('Fetch history error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    const getPaymentModeIcon = (mode) => {
        switch (mode) {
            case 'cash': return 'cash';
            case 'upi': return 'phone-portrait';
            case 'qr': return 'qr-code';
            case 'card': return 'card';
            default: return 'wallet';
        }
    };

    const getPaymentModeColor = (mode) => {
        switch (mode) {
            case 'cash': return '#10B981';
            case 'upi': return '#3B82F6';
            case 'qr': return '#8B5CF6';
            case 'card': return '#F59E0B';
            default: return '#6B7280';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderTransaction = ({ item }) => (
        <TouchableOpacity
            style={{ backgroundColor: '#FFFFFF', marginBottom: 12, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
            onPress={() => router.push({ pathname: '/(tabs)/receipt', params: { collectionId: item._id } })}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 }}>
                        {item.customer?.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#6B7280' }}>
                        {item.transactionId}
                    </Text>
                </View>
                <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: getPaymentModeColor(item.paymentMode) + '20',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Ionicons name={getPaymentModeIcon(item.paymentMode)} size={20} color={getPaymentModeColor(item.paymentMode)} />
                </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F8A70' }}>
                    ₹{item.collectionAmount?.toLocaleString()}
                </Text>
                <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: getPaymentModeColor(item.paymentMode) + '20' }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: getPaymentModeColor(item.paymentMode), textTransform: 'uppercase' }}>
                        {item.paymentMode}
                    </Text>
                </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="time" size={14} color="#6B7280" />
                <Text style={{ fontSize: 12, color: '#6B7280', marginLeft: 6 }}>
                    {formatDate(item.timestamp)}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }} edges={['top']}>
            {/* Header */}
            <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 }}>
                    Transaction History
                </Text>

                {/* Summary Card */}
                {summary && (
                    <View style={{ backgroundColor: '#F0FDF4', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#86EFAC' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View>
                                <Text style={{ fontSize: 12, color: '#059669', marginBottom: 4 }}>Total Collected</Text>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#047857' }}>
                                    ₹{summary.totalAmount?.toLocaleString() || '0'}
                                </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: 12, color: '#059669', marginBottom: 4 }}>Transactions</Text>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#047857' }}>
                                    {summary.totalTransactions || 0}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>

            {/* Transaction List */}
            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color="#1F8A70" />
                </View>
            ) : (
                <FlatList
                    data={collections}
                    renderItem={renderTransaction}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{ padding: 20 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1F8A70']} />
                    }
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
                            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
                            <Text style={{ fontSize: 16, color: '#6B7280', marginTop: 16 }}>No transactions yet</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}