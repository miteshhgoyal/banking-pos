import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Modal,
    TextInput
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

    // Filters
    const [paymentModeFilter, setPaymentModeFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilterModal, setShowFilterModal] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, [paymentModeFilter, startDate, endDate]);

    const fetchHistory = async () => {
        try {
            const params = {};
            if (paymentModeFilter) params.paymentMode = paymentModeFilter;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await api.get('/collections', { params });
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
                        ⚠️ VOIDED TRANSACTION
                    </Text>
                </View>
            )}

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
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: item.status === 'voided' ? '#9CA3AF' : '#1F8A70' }}>
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
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937' }}>
                        Transaction History
                    </Text>
                    <TouchableOpacity
                        style={{ padding: 8, backgroundColor: '#F3F4F6', borderRadius: 8 }}
                        onPress={() => setShowFilterModal(true)}
                    >
                        <Ionicons name="filter" size={20} color="#1F8A70" />
                    </TouchableOpacity>
                </View>

                {/* Active Filters */}
                {(paymentModeFilter || startDate || endDate) && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                        {paymentModeFilter && (
                            <View style={{ backgroundColor: '#1F8A70', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600', marginRight: 4 }}>
                                    {paymentModeFilter.toUpperCase()}
                                </Text>
                                <TouchableOpacity onPress={() => setPaymentModeFilter('')}>
                                    <Ionicons name="close-circle" size={16} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        )}
                        {(startDate || endDate) && (
                            <View style={{ backgroundColor: '#1F8A70', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600', marginRight: 4 }}>
                                    {startDate && new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                    {startDate && endDate && ' - '}
                                    {endDate && new Date(endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                </Text>
                                <TouchableOpacity onPress={() => { setStartDate(''); setEndDate(''); }}>
                                    <Ionicons name="close-circle" size={16} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

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

            {/* Filter Modal */}
            <Modal
                visible={showFilterModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937' }}>Filters</Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {/* Payment Mode Filter */}
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
                            Payment Mode
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                            {['', 'cash', 'upi', 'qr', 'card'].map((mode) => (
                                <TouchableOpacity
                                    key={mode}
                                    style={{
                                        paddingHorizontal: 16,
                                        paddingVertical: 12,
                                        borderRadius: 12,
                                        backgroundColor: paymentModeFilter === mode ? '#1F8A70' : '#F3F4F6'
                                    }}
                                    onPress={() => setPaymentModeFilter(mode)}
                                >
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: '600',
                                        color: paymentModeFilter === mode ? '#FFFFFF' : '#6B7280',
                                        textTransform: 'uppercase'
                                    }}>
                                        {mode || 'All'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Date Filters */}
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                            Date Range
                        </Text>
                        <TextInput
                            style={{
                                backgroundColor: '#F9FAFB',
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: '#E5E7EB',
                                paddingHorizontal: 16,
                                height: 48,
                                marginBottom: 12,
                                color: '#1F2937'
                            }}
                            placeholder="Start Date (YYYY-MM-DD)"
                            placeholderTextColor="#9CA3AF"
                            value={startDate}
                            onChangeText={setStartDate}
                        />
                        <TextInput
                            style={{
                                backgroundColor: '#F9FAFB',
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: '#E5E7EB',
                                paddingHorizontal: 16,
                                height: 48,
                                marginBottom: 20,
                                color: '#1F2937'
                            }}
                            placeholder="End Date (YYYY-MM-DD)"
                            placeholderTextColor="#9CA3AF"
                            value={endDate}
                            onChangeText={setEndDate}
                        />

                        {/* Action Buttons */}
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                style={{ flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center' }}
                                onPress={clearFilters}
                            >
                                <Text style={{ color: '#6B7280', fontSize: 16, fontWeight: '600' }}>Clear</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 1, backgroundColor: '#1F8A70', borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center' }}
                                onPress={applyFilters}
                            >
                                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}