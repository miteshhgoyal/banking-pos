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

    const getPaymentModeBg = (mode) => {
        switch (mode) {
            case 'cash': return 'bg-green-100';
            case 'upi': return 'bg-blue-100';
            case 'qr': return 'bg-purple-100';
            case 'card': return 'bg-amber-100';
            default: return 'bg-gray-100';
        }
    };

    const getPaymentModeText = (mode) => {
        switch (mode) {
            case 'cash': return 'text-green-600';
            case 'upi': return 'text-blue-600';
            case 'qr': return 'text-purple-600';
            case 'card': return 'text-amber-600';
            default: return 'text-gray-600';
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
            className={`bg-white mb-3 rounded-xl p-4 shadow-sm border ${item.status === 'voided' ? 'border-l-4 border-l-red-500 opacity-60' : 'border-gray-100'
                }`}
            onPress={() => router.push({ pathname: '/(tabs)/receipt', params: { collectionId: item._id } })}
            activeOpacity={0.7}
        >
            {item.status === 'voided' && (
                <View className="bg-red-100 rounded-lg p-2 mb-3">
                    <Text className="text-xs font-semibold text-red-600 text-center">
                        VOIDED
                    </Text>
                </View>
            )}

            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-700 mb-1">
                        {item.transactionId}
                    </Text>
                    <Text className="text-xs text-gray-400">
                        Agent: {item.agent?.name}
                    </Text>
                </View>
                <View className={`w-10 h-10 rounded-full items-center justify-center ${getPaymentModeBg(item.paymentMode)}`}>
                    <Ionicons
                        name={getPaymentModeIcon(item.paymentMode)}
                        size={20}
                        color={getPaymentModeColor(item.paymentMode)}
                    />
                </View>
            </View>

            <View className="flex-row justify-between items-center mb-2">
                <Text className={`text-2xl font-bold ${item.status === 'voided' ? 'text-gray-400' : 'text-[#1F8A70]'
                    }`}>
                    ₹{item.collectionAmount?.toLocaleString()}
                </Text>
                <View className={`px-3 py-1 rounded-lg ${getPaymentModeBg(item.paymentMode)}`}>
                    <Text className={`text-xs font-semibold uppercase ${getPaymentModeText(item.paymentMode)}`}>
                        {item.paymentMode}
                    </Text>
                </View>
            </View>

            <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                    <Ionicons name="time" size={14} color="#6B7280" />
                    <Text className="text-xs text-gray-500 ml-1.5">
                        {formatDate(item.timestamp)}
                    </Text>
                </View>
                <Text className="text-xs text-gray-500">
                    Balance: ₹{item.outstandingAfter?.toLocaleString()}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
            {/* Header */}
            <View className="bg-white px-5 py-4 border-b border-gray-200">
                <View className="flex-row items-center mb-3">
                    <TouchableOpacity
                        className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-4"
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-900">
                        Transaction History
                    </Text>
                </View>
                <Text className="text-sm text-gray-600">
                    {customerName}
                </Text>
            </View>

            {/* Summary Card */}
            <View className="p-5">
                <View className="bg-green-50 rounded-xl p-4 border border-green-300 shadow-sm">
                    <View className="flex-row justify-between">
                        <View>
                            <Text className="text-xs text-green-700 mb-1">Total Collected</Text>
                            <Text className="text-2xl font-bold text-green-800">
                                ₹{totalCollected?.toLocaleString() || '0'}
                            </Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-xs text-green-700 mb-1">Transactions</Text>
                            <Text className="text-2xl font-bold text-green-800">
                                {transactions.length}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Transaction List */}
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#1F8A70" />
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    renderItem={renderTransaction}
                    keyExtractor={(item) => item._id}
                    contentContainerClassName="px-5 pb-5"
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#1F8A70']}
                            tintColor="#1F8A70"
                        />
                    }
                    ListEmptyComponent={
                        <View className="items-center justify-center py-10">
                            <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
                                <Ionicons name="receipt-outline" size={40} color="#D1D5DB" />
                            </View>
                            <Text className="text-base font-semibold text-gray-900 mb-1">
                                No transactions yet
                            </Text>
                            <Text className="text-sm text-gray-500">
                                Transactions will appear here
                            </Text>
                        </View>
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}
