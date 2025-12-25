import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/services/api';

export default function CustomersScreen() {
    const router = useRouter();

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchCustomers();
    }, [statusFilter]);

    const fetchCustomers = async () => {
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (search) params.search = search;

            const response = await api.get('/customers', { params });
            if (response.data.success) {
                setCustomers(response.data.data.customers);
            }
        } catch (error) {
            console.error('Fetch customers error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchCustomers();
    };

    const handleSearch = () => {
        setLoading(true);
        fetchCustomers();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return '#10B981';
            case 'closed': return '#6B7280';
            case 'defaulter': return '#F59E0B';
            case 'npa': return '#EF4444';
            default: return '#6B7280';
        }
    };

    const renderCustomer = ({ item }) => (
        <TouchableOpacity
            style={{ backgroundColor: '#FFFFFF', marginBottom: 12, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
            onPress={() => router.push({ pathname: '/(tabs)/payment', params: { customerId: item._id } })}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 }}>
                        {item.name}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>
                        Loan ID: {item.loanId}
                    </Text>
                </View>
                <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: getStatusColor(item.status) + '20' }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: getStatusColor(item.status), textTransform: 'uppercase' }}>
                        {item.status}
                    </Text>
                </View>
            </View>

            <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Outstanding</Text>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#EF4444' }}>
                        ₹{item.outstandingAmount?.toLocaleString()}
                    </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>EMI Amount</Text>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>
                        ₹{item.loanDetails?.emiAmount?.toLocaleString()}
                    </Text>
                </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                <Ionicons name="call" size={14} color="#6B7280" />
                <Text style={{ fontSize: 14, color: '#6B7280', marginLeft: 6 }}>{item.mobile}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }} edges={['top']}>
            {/* Header */}
            <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 }}>
                    Customers
                </Text>

                {/* Search Bar */}
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 16, marginBottom: 12 }}>
                    <Ionicons name="search" size={20} color="#6B7280" />
                    <TextInput
                        style={{ flex: 1, height: 48, marginLeft: 12, color: '#1F2937', fontSize: 16 }}
                        placeholder="Search by name, loan ID, mobile..."
                        placeholderTextColor="#9CA3AF"
                        value={search}
                        onChangeText={setSearch}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                </View>

                {/* Status Filter */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    {['', 'active', 'defaulter', 'npa'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={{
                                paddingHorizontal: 16,
                                paddingVertical: 8,
                                borderRadius: 20,
                                backgroundColor: statusFilter === status ? '#1F8A70' : '#F3F4F6'
                            }}
                            onPress={() => setStatusFilter(status)}
                        >
                            <Text style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: statusFilter === status ? '#FFFFFF' : '#6B7280',
                                textTransform: 'capitalize'
                            }}>
                                {status || 'All'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Customer List */}
            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color="#1F8A70" />
                </View>
            ) : (
                <FlatList
                    data={customers}
                    renderItem={renderCustomer}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{ padding: 20 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1F8A70']} />
                    }
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
                            <Ionicons name="people-outline" size={64} color="#D1D5DB" />
                            <Text style={{ fontSize: 16, color: '#6B7280', marginTop: 16 }}>No customers found</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}