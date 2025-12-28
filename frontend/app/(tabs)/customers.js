import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import api from '@/services/api';

export default function CustomersScreen() {
    const router = useRouter();

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Use useFocusEffect to refresh data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchCustomers();
        }, [statusFilter, search])
    );

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

    const getStatusBg = (status) => {
        switch (status) {
            case 'active': return 'bg-green-50';
            case 'closed': return 'bg-gray-100';
            case 'defaulter': return 'bg-amber-50';
            case 'npa': return 'bg-red-50';
            default: return 'bg-gray-100';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'active': return 'text-green-600';
            case 'closed': return 'text-gray-600';
            case 'defaulter': return 'text-amber-600';
            case 'npa': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'active': return 'checkmark-circle';
            case 'closed': return 'close-circle';
            case 'defaulter': return 'warning';
            case 'npa': return 'alert-circle';
            default: return 'ellipse';
        }
    };

    const renderCustomer = ({ item }) => (
        <TouchableOpacity
            className="bg-white mb-3 rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100"
            onPress={() => router.push({
                pathname: '/(tabs)/customer-details',
                params: { customerId: item._id }
            })}
            activeOpacity={0.7}
        >
            {/* Header Row */}
            <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1 mr-3">
                    <Text className="text-lg font-bold text-gray-900 mb-1">
                        {item.name}
                    </Text>
                    <View className="flex-row items-center">
                        <View className="px-2 py-0.5 bg-gray-100 rounded mr-2">
                            <Text className="text-xs font-medium text-gray-600">
                                ID: {item.loanId}
                            </Text>
                        </View>
                    </View>
                </View>
                <View className={`px-3 py-1.5 rounded-xl flex-row items-center ${getStatusBg(item.status)}`}>
                    <Ionicons
                        name={getStatusIcon(item.status)}
                        size={14}
                        color={getStatusText(item.status).includes('green') ? '#059669' :
                            getStatusText(item.status).includes('amber') ? '#D97706' :
                                getStatusText(item.status).includes('red') ? '#DC2626' : '#6B7280'}
                    />
                    <Text className={`text-xs font-bold uppercase ml-1 ${getStatusText(item.status)}`}>
                        {item.status}
                    </Text>
                </View>
            </View>

            {/* Stats Grid */}
            <View className="bg-gray-50 rounded-xl p-3 mb-3">
                <View className="flex-row justify-between">
                    <View className="flex-1">
                        <Text className="text-xs text-gray-500 mb-1 font-medium">Outstanding</Text>
                        <Text className="text-xl font-bold text-red-600">
                            ₹{item.outstandingAmount?.toLocaleString('en-IN') || '0'}
                        </Text>
                    </View>
                    <View className="w-px bg-gray-200 mx-3" />
                    <View className="flex-1 items-end">
                        <Text className="text-xs text-gray-500 mb-1 font-medium">EMI Amount</Text>
                        <Text className="text-xl font-bold text-gray-900">
                            ₹{item.loanDetails?.emiAmount?.toLocaleString('en-IN') || '0'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Contact Info */}
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                    <View className="w-8 h-8 rounded-full bg-teal-50 items-center justify-center mr-2">
                        <Ionicons name="call" size={16} color="#1F8A70" />
                    </View>
                    <Text className="text-sm text-gray-700 font-medium">{item.mobile}</Text>
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
                <View className="flex-row items-center justify-between mb-4">
                    <View>
                        <Text className="text-2xl font-bold text-gray-900 tracking-tight">
                            Customers
                        </Text>
                        <Text className="text-sm text-gray-500 mt-0.5">
                            {customers.length} {customers.length === 1 ? 'customer' : 'customers'}
                        </Text>
                    </View>
                    <View className="w-12 h-12 rounded-full bg-teal-50 items-center justify-center">
                        <Ionicons name="people" size={24} color="#1F8A70" />
                    </View>
                </View>

                {/* Modern Search Bar */}
                <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 mb-4 border border-gray-200">
                    <Ionicons name="search" size={20} color="#6B7280" />
                    <TextInput
                        className="flex-1 h-12 ml-3 text-gray-900 text-base"
                        placeholder="Search customers..."
                        placeholderTextColor="#9CA3AF"
                        value={search}
                        onChangeText={setSearch}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => {
                            setSearch('');
                            setLoading(true);
                            fetchCustomers();
                        }}>
                            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Modern Status Filter Chips */}
                <View className="flex-row flex-wrap -mx-1">
                    {[
                        { value: '', label: 'All', icon: 'apps' },
                        { value: 'active', label: 'Active', icon: 'checkmark-circle' },
                        { value: 'defaulter', label: 'Defaulter', icon: 'warning' },
                        { value: 'npa', label: 'NPA', icon: 'alert-circle' }
                    ].map((filter) => (
                        <TouchableOpacity
                            key={filter.value}
                            className={`px-4 py-2.5 rounded-xl mx-1 mb-2 flex-row items-center ${statusFilter === filter.value
                                ? 'bg-teal-600 shadow-lg shadow-teal-600/30'
                                : 'bg-gray-100'
                                }`}
                            onPress={() => {
                                setStatusFilter(filter.value);
                                setLoading(true);
                            }}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={filter.icon}
                                size={16}
                                color={statusFilter === filter.value ? '#FFFFFF' : '#6B7280'}
                            />
                            <Text className={`text-sm font-semibold ml-1.5 ${statusFilter === filter.value ? 'text-white' : 'text-gray-700'
                                }`}>
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Customer List */}
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#1F8A70" />
                    <Text className="mt-4 text-gray-600 text-base font-medium">Loading customers...</Text>
                </View>
            ) : (
                <FlatList
                    data={customers}
                    renderItem={renderCustomer}
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
                                <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                            </View>
                            <Text className="text-lg font-bold text-gray-900 mb-2">
                                No customers found
                            </Text>
                            <Text className="text-sm text-gray-500 text-center px-8">
                                {search
                                    ? 'Try adjusting your search or filters'
                                    : 'Add your first customer to get started'}
                            </Text>
                        </View>
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Floating Add Button */}
            <TouchableOpacity
                className="absolute right-6 bottom-6 w-16 h-16 rounded-2xl bg-teal-600 items-center justify-center shadow-2xl shadow-teal-600/50"
                onPress={() => router.push('/(tabs)/add-customer')}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={32} color="#FFFFFF" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}
