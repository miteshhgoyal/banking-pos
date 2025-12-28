import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Modal,
    TextInput,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import api from '@/services/api';
import Gradient from '@/components/Gradient';

export default function HistoryScreen() {
    const router = useRouter();

    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [summary, setSummary] = useState(null);

    // Filters
    const [paymentModeFilter, setPaymentModeFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilterModal, setShowFilterModal] = useState(false);

    // Use useFocusEffect instead of useEffect
    useFocusEffect(
        useCallback(() => {
            fetchHistory();
        }, [paymentModeFilter, startDate, endDate])
    );

    const fetchHistory = async () => {
        try {
            const params = {};
            if (paymentModeFilter) params.paymentMode = paymentModeFilter;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await api.get('/collections', { params });
            if (response.data.success) {
                setCollections(response.data.data.collections || []);
                setSummary(response.data.summary || null);
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

    const clearFilters = () => {
        setPaymentModeFilter('');
        setStartDate('');
        setEndDate('');
        setShowFilterModal(false);
    };

    const applyFilters = () => {
        setShowFilterModal(false);
        setLoading(true);
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

    const getPaymentModeBg = (mode) => {
        switch (mode) {
            case 'cash': return 'bg-green-50';
            case 'upi': return 'bg-blue-50';
            case 'qr': return 'bg-purple-50';
            case 'card': return 'bg-amber-50';
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
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const renderTransaction = ({ item }) => (
        <TouchableOpacity
            className={`bg-white mb-3 rounded-2xl p-5 shadow-lg shadow-gray-200/50 border ${item.status === 'voided'
                    ? 'border-l-4 border-l-red-500 opacity-60'
                    : 'border-gray-100'
                }`}
            onPress={() => router.push({
                pathname: '/(tabs)/receipt',
                params: { collectionId: item._id }
            })}
            activeOpacity={0.7}
        >
            {item.status === 'voided' && (
                <View className="bg-red-100 rounded-xl p-2 mb-3 border border-red-200">
                    <View className="flex-row items-center justify-center">
                        <Ionicons name="close-circle" size={16} color="#DC2626" />
                        <Text className="text-xs font-bold text-red-600 ml-1.5">
                            VOIDED TRANSACTION
                        </Text>
                    </View>
                </View>
            )}

            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1 mr-3">
                    <Text className="text-lg font-bold text-gray-900 mb-1">
                        {item.customer?.name || 'Unknown Customer'}
                    </Text>
                    <View className="flex-row items-center">
                        <View className="px-2 py-0.5 bg-gray-100 rounded">
                            <Text className="text-xs font-medium text-gray-600">
                                {item.transactionId || 'N/A'}
                            </Text>
                        </View>
                    </View>
                </View>
                <View className={`w-12 h-12 rounded-xl items-center justify-center ${getPaymentModeBg(item.paymentMode)}`}>
                    <Ionicons
                        name={getPaymentModeIcon(item.paymentMode)}
                        size={24}
                        color={getPaymentModeColor(item.paymentMode)}
                    />
                </View>
            </View>

            <View className="bg-gray-50 rounded-xl p-3 mb-3">
                <View className="flex-row justify-between items-center">
                    <View>
                        <Text className="text-xs text-gray-500 mb-1">Amount</Text>
                        <Text className={`text-2xl font-black ${item.status === 'voided' ? 'text-gray-400' : 'text-teal-600'
                            }`}>
                            ₹{item.collectionAmount?.toLocaleString('en-IN') || '0'}
                        </Text>
                    </View>
                    <View className={`px-3 py-1.5 rounded-xl ${getPaymentModeBg(item.paymentMode)}`}>
                        <Text className={`text-xs font-bold uppercase ${getPaymentModeText(item.paymentMode)}`}>
                            {item.paymentMode || 'N/A'}
                        </Text>
                    </View>
                </View>
            </View>

            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <View className="w-7 h-7 rounded-lg bg-gray-100 items-center justify-center mr-2">
                        <Ionicons name="time-outline" size={14} color="#6B7280" />
                    </View>
                    <Text className="text-xs text-gray-600 font-medium">
                        {formatDate(item.timestamp)}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
            {/* Background Watermark */}
            <Image
                source={require('@/assets/ph-logo.png')}
                className="absolute bottom-20 right-8 w-32 h-32 opacity-5"
                style={{ zIndex: 0 }}
                resizeMode="contain"
            />

            {/* Modern Header */}
            <View className="bg-white pt-4 pb-4 px-6 shadow-sm">
                <View className="flex-row justify-between items-center mb-4">
                    <View>
                        <Text className="text-2xl font-bold text-gray-900 tracking-tight">
                            History
                        </Text>
                        <Text className="text-sm text-gray-500 mt-0.5">
                            {collections.length} {collections.length === 1 ? 'transaction' : 'transactions'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        className="w-11 h-11 bg-teal-50 rounded-xl items-center justify-center"
                        onPress={() => setShowFilterModal(true)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="filter" size={22} color="#1F8A70" />
                    </TouchableOpacity>
                </View>

                {/* Active Filters */}
                {(paymentModeFilter || startDate || endDate) && (
                    <View className="flex-row flex-wrap mb-3">
                        {paymentModeFilter && (
                            <View className="bg-teal-500 rounded-xl px-3 py-2 flex-row items-center mr-2 mb-2 shadow-sm">
                                <Text className="text-white text-xs font-bold mr-2">
                                    {paymentModeFilter.toUpperCase()}
                                </Text>
                                <TouchableOpacity onPress={() => setPaymentModeFilter('')}>
                                    <Ionicons name="close-circle" size={18} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        )}
                        {(startDate || endDate) && (
                            <View className="bg-teal-500 rounded-xl px-3 py-2 flex-row items-center mr-2 mb-2 shadow-sm">
                                <Text className="text-white text-xs font-bold mr-2">
                                    {startDate && new Date(startDate).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short'
                                    })}
                                    {startDate && endDate && ' - '}
                                    {endDate && new Date(endDate).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short'
                                    })}
                                </Text>
                                <TouchableOpacity onPress={() => {
                                    setStartDate('');
                                    setEndDate('');
                                }}>
                                    <Ionicons name="close-circle" size={18} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {/* Summary Card with Gradient */}
                {summary && (
                    <View className="rounded-2xl overflow-hidden shadow-lg shadow-green-500/20">
                        <Gradient type="teal">
                            <View className="p-4">
                                <View className="flex-row justify-between items-center">
                                    <View className="flex-1">
                                        <Text className="text-xs text-white/80 mb-1.5 font-medium tracking-wide">
                                            TOTAL COLLECTED
                                        </Text>
                                        <Text className="text-3xl font-black text-white">
                                            ₹{summary.totalAmount?.toLocaleString('en-IN') || '0'}
                                        </Text>
                                    </View>
                                    <View className="w-px h-14 bg-white/20 mx-4" />
                                    <View className="items-end flex-1">
                                        <Text className="text-xs text-white/80 mb-1.5 font-medium tracking-wide">
                                            TRANSACTIONS
                                        </Text>
                                        <Text className="text-3xl font-black text-white">
                                            {summary.totalTransactions || 0}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </Gradient>
                    </View>
                )}
            </View>

            {/* Transaction List */}
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#1F8A70" />
                    <Text className="mt-4 text-gray-600 text-base font-medium">Loading transactions...</Text>
                </View>
            ) : (
                <FlatList
                    data={collections}
                    renderItem={renderTransaction}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#1F8A70']}
                            tintColor="#1F8A70"
                        />
                    }
                    ListEmptyComponent={
                        <View className="items-center justify-center py-16">
                            <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center mb-4">
                                <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
                            </View>
                            <Text className="text-lg font-bold text-gray-900 mb-2">
                                No transactions yet
                            </Text>
                            <Text className="text-sm text-gray-500 text-center px-8">
                                {paymentModeFilter || startDate || endDate
                                    ? 'Try adjusting your filters'
                                    : 'Start collecting payments to see history'}
                            </Text>
                        </View>
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Filter Modal */}
            <Modal
                visible={showFilterModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <View className="flex-1 bg-black/60 justify-end">
                    <View className="bg-white rounded-t-3xl p-6">
                        {/* Modal Header */}
                        <View className="flex-row justify-between items-center mb-6">
                            <View className="flex-row items-center">
                                <View className="w-10 h-10 rounded-xl bg-teal-50 items-center justify-center mr-3">
                                    <Ionicons name="filter" size={22} color="#1F8A70" />
                                </View>
                                <Text className="text-xl font-bold text-gray-900">Filters</Text>
                            </View>
                            <TouchableOpacity
                                className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                                onPress={() => setShowFilterModal(false)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {/* Payment Mode Filter */}
                        <View className="mb-6">
                            <Text className="text-sm font-bold text-gray-700 mb-3">
                                Payment Mode
                            </Text>
                            <View className="flex-row flex-wrap -mx-1">
                                {[
                                    { value: '', label: 'All', icon: 'apps' },
                                    { value: 'cash', label: 'Cash', icon: 'cash' },
                                    { value: 'upi', label: 'UPI', icon: 'phone-portrait' },
                                    { value: 'qr', label: 'QR', icon: 'qr-code' },
                                    { value: 'card', label: 'Card', icon: 'card' }
                                ].map((mode) => (
                                    <TouchableOpacity
                                        key={mode.value}
                                        className={`px-4 py-3 rounded-xl mx-1 mb-2 flex-row items-center ${paymentModeFilter === mode.value
                                                ? 'bg-teal-500 shadow-lg shadow-teal-500/30'
                                                : 'bg-gray-100'
                                            }`}
                                        onPress={() => setPaymentModeFilter(mode.value)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons
                                            name={mode.icon}
                                            size={16}
                                            color={paymentModeFilter === mode.value ? '#FFFFFF' : '#6B7280'}
                                        />
                                        <Text className={`text-sm font-bold ml-1.5 ${paymentModeFilter === mode.value ? 'text-white' : 'text-gray-700'
                                            }`}>
                                            {mode.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Date Filters */}
                        <View className="mb-6">
                            <Text className="text-sm font-bold text-gray-700 mb-3">
                                Date Range
                            </Text>
                            <View className="mb-3">
                                <Text className="text-xs font-medium text-gray-600 mb-2">Start Date</Text>
                                <View className="flex-row items-center bg-gray-50 rounded-2xl border border-gray-200 px-4">
                                    <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                                    <TextInput
                                        className="flex-1 h-12 ml-3 text-gray-900 text-base"
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor="#9CA3AF"
                                        value={startDate}
                                        onChangeText={setStartDate}
                                    />
                                </View>
                            </View>
                            <View>
                                <Text className="text-xs font-medium text-gray-600 mb-2">End Date</Text>
                                <View className="flex-row items-center bg-gray-50 rounded-2xl border border-gray-200 px-4">
                                    <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                                    <TextInput
                                        className="flex-1 h-12 ml-3 text-gray-900 text-base"
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor="#9CA3AF"
                                        value={endDate}
                                        onChangeText={setEndDate}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View className="flex-row">
                            <TouchableOpacity
                                className="flex-1 mr-2 bg-gray-100 rounded-2xl h-14 items-center justify-center border border-gray-200"
                                onPress={clearFilters}
                                activeOpacity={0.7}
                            >
                                <Text className="text-gray-700 text-base font-bold">Clear All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 ml-2 bg-teal-500 rounded-2xl h-14 items-center justify-center shadow-2xl shadow-teal-500/30"
                                onPress={applyFilters}
                                activeOpacity={0.8}
                            >
                                <Text className="text-white text-base font-bold">Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
