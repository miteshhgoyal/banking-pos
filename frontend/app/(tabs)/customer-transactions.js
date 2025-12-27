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
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '@/services/api';

export default function CustomerTransactionsScreen() {
    const router = useRouter();
    const { customerId, customerName } = useLocalSearchParams();

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [totalCollected, setTotalCollected] = useState(0);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const response = await api.get(`/collections/customer/${customerId}`);
            if (response.data.success) {
                setTransactions(response.data.data.collections);
                setTotalCollected(response.data.totalCollected);
            }
        } catch (error) {
            console.error('Fetch transactions error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchTransactions();
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
            style={{
                backgroundColor: '#FFFFFF',
                marginBottom: 12,
                borderRadius: 12,
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
                borderLeftWidth: item.status === 'voided' ? 4 : 0,
                borderLeftColor: '#EF4444',
                opacity: item.status === 'voided' ? 0.6 : 1
            }}
            onPress={() => router.push({ pathname: '/(tabs)/receipt', params: { collectionId: item._id } })}
        >
            {item.status === 'voided' && (
                <View style={{ backgroundColor: '#FEE2E2', borderRadius: 6, padding: 8, marginBottom: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#DC2626', textAlign: 'center' }}>
                        ⚠️ VOIDED
                    </Text>
                </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 4 }}>
                        {item.transactionId}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
                        Agent: {item.agent?.name}
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
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: item.status === 'voided' ? '#9CA3AF' : '#1F8A70' }}>
                    ₹{item.collectionAmount?.toLocaleString()}
                </Text>
                <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: getPaymentModeColor(item.paymentMode) + '20' }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: getPaymentModeColor(item.paymentMode), textTransform: 'uppercase' }}>
                        {item.paymentMode}
                    </Text>
                </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="time" size={14} color="#6B7280" />
                    <Text style={{ fontSize: 12, color: '#6B7280', marginLeft: 6 }}>
                        {formatDate(item.timestamp)}
                    </Text>
                </View>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>
                    Balance: ₹{item.outstandingAfter?.toLocaleString()}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }} edges={['top']}>
            {/* Header */}
            <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginLeft: 16 }}>
                        Transaction History
                    </Text>
                </View>
                <Text style={{ fontSize: 14, color: '#6B7280' }}>
                    {customerName}
                </Text>
            </View>

            {/* Summary Card */}
            <View style={{ padding: 20 }}>
                <View style={{ backgroundColor: '#F0FDF4', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#86EFAC' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View>
                            <Text style={{ fontSize: 12, color: '#059669', marginBottom: 4 }}>Total Collected</Text>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#047857' }}>
                                ₹{totalCollected?.toLocaleString() || '0'}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 12, color: '#059669', marginBottom: 4 }}>Transactions</Text>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#047857' }}>
                                {transactions.length}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Transaction List */}
            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color="#1F8A70" />
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    renderItem={renderTransaction}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1F8A70']} />
                    }
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
                            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
                            <Text style={{ fontSize: 16, color: '#6B7280', marginTop: 16 }}>
                                No transactions yet
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}