import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import api from '@/services/api';
import Gradient from '@/components/Gradient';

export default function CustomerDetailsScreen() {
    const router = useRouter();
    const { customerId } = useLocalSearchParams();

    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);

    // Use useFocusEffect to refresh data when returning to this screen
    useFocusEffect(
        useCallback(() => {
            if (customerId) {
                fetchCustomer();
            }
        }, [customerId])
    );

    const fetchCustomer = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/customers/${customerId}`);
            if (response.data.success) {
                setCustomer(response.data.data.customer);
            }
        } catch (error) {
            console.error('Fetch customer error:', error);
            Alert.alert('Error', 'Failed to load customer details');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Customer',
            'Are you sure you want to delete this customer? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/customers/${customerId}`);
                            Alert.alert('Success', 'Customer deleted successfully', [
                                { text: 'OK', onPress: () => router.back() }
                            ]);
                        } catch (error) {
                            Alert.alert('Error', error.response?.data?.message || 'Failed to delete customer');
                        }
                    }
                }
            ]
        );
    };

    const getStatusBgColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-50';
            case 'closed': return 'bg-gray-100';
            case 'defaulter': return 'bg-amber-50';
            case 'npa': return 'bg-red-50';
            default: return 'bg-gray-100';
        }
    };

    const getStatusTextColor = (status) => {
        switch (status) {
            case 'active': return 'text-green-600';
            case 'closed': return 'text-gray-600';
            case 'defaulter': return 'text-amber-600';
            case 'npa': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color="#1F8A70" />
                <Text className="mt-4 text-gray-600 text-base font-medium">Loading details...</Text>
            </View>
        );
    }

    const InfoRow = ({ label, value, icon }) => (
        <View className="flex-row justify-between items-center py-4 border-b border-gray-100">
            <View className="flex-row items-center flex-1">
                {icon && (
                    <View className="w-8 h-8 rounded-lg bg-teal-50 items-center justify-center mr-3">
                        <Ionicons name={icon} size={16} color="#1F8A70" />
                    </View>
                )}
                <Text className="text-sm text-gray-600 font-medium">{label}</Text>
            </View>
            <Text className="text-sm font-bold text-gray-900 flex-1 text-right" numberOfLines={2}>
                {value || 'N/A'}
            </Text>
        </View>
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
            <View className="flex-row items-center justify-between px-6 py-4 bg-white shadow-sm">
                <View className="flex-row items-center flex-1">
                    <TouchableOpacity
                        className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-4"
                        onPress={() => router.back()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={22} color="#1F2937" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-xl font-bold text-gray-900">
                            Customer Details
                        </Text>
                        <Text className="text-xs text-gray-500 mt-0.5">
                            ID: {customer?.loanId}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    className="w-10 h-10 rounded-full bg-teal-50 items-center justify-center"
                    onPress={() => router.push({ pathname: '/(tabs)/edit-customer', params: { customerId } })}
                    activeOpacity={0.7}
                >
                    <Ionicons name="create-outline" size={22} color="#1F8A70" />
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
            >
                {/* Customer Name & Status Badge */}
                <View className="bg-white pt-6 pb-5 items-center border-b border-gray-100">
                    <Text className="text-2xl font-bold text-gray-900 mb-3">
                        {customer?.name}
                    </Text>
                    <View className={`px-6 py-2 rounded-xl ${getStatusBgColor(customer?.status)}`}>
                        <Text className={`text-sm font-bold uppercase tracking-wide ${getStatusTextColor(customer?.status)}`}>
                            {customer?.status}
                        </Text>
                    </View>
                </View>

                {/* Outstanding Card with Gradient */}
                <View className="mx-5 mt-5 rounded-3xl overflow-hidden shadow-2xl shadow-red-500/20">
                    <Gradient type="red">
                        <View className="p-6">
                            <View className="flex-row items-center mb-3">
                                <View className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center mr-3">
                                    <Ionicons name="wallet" size={22} color="#FFFFFF" />
                                </View>
                                <Text className="text-sm text-white/90 font-medium">Outstanding Amount</Text>
                            </View>
                            <Text className="text-5xl font-black text-white mb-5">
                                ₹{customer?.outstandingAmount?.toLocaleString('en-IN') || '0'}
                            </Text>

                            <View className="flex-row justify-between">
                                <View className="flex-1 bg-white/10 rounded-xl p-3 mr-2">
                                    <Text className="text-xs text-white/80 mb-1.5 font-medium">Total Paid</Text>
                                    <Text className="text-lg font-bold text-white">
                                        ₹{customer?.totalPaid?.toLocaleString('en-IN') || '0'}
                                    </Text>
                                </View>
                                <View className="flex-1 bg-white/10 rounded-xl p-3 ml-2">
                                    <Text className="text-xs text-white/80 mb-1.5 font-medium">Penalty</Text>
                                    <Text className="text-lg font-bold text-white">
                                        ₹{customer?.penaltyAmount?.toLocaleString('en-IN') || '0'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </Gradient>
                </View>

                {/* Basic Information */}
                <View className="bg-white mx-5 mt-5 rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100">
                    <View className="flex-row items-center mb-4">
                        <View className="w-10 h-10 rounded-xl bg-teal-50 items-center justify-center mr-3">
                            <Ionicons name="person-circle-outline" size={24} color="#1F8A70" />
                        </View>
                        <Text className="text-lg font-bold text-gray-900">
                            Basic Information
                        </Text>
                    </View>
                    <InfoRow label="Account Number" value={customer?.accountNumber} icon="card-outline" />
                    <InfoRow label="Name" value={customer?.name} icon="person-outline" />
                    <InfoRow label="Mobile" value={customer?.mobile} icon="call-outline" />
                    <InfoRow label="Aadhaar" value={customer?.aadhaar} icon="finger-print-outline" />
                </View>

                {/* Address */}
                <View className="bg-white mx-5 mt-5 rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100">
                    <View className="flex-row items-center mb-4">
                        <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-3">
                            <Ionicons name="location-outline" size={24} color="#2196F3" />
                        </View>
                        <Text className="text-lg font-bold text-gray-900">
                            Address
                        </Text>
                    </View>
                    <InfoRow label="Street" value={customer?.address?.street} icon="home-outline" />
                    <InfoRow label="City" value={customer?.address?.city} icon="business-outline" />
                    <InfoRow label="State" value={customer?.address?.state} icon="map-outline" />
                    <InfoRow label="Pincode" value={customer?.address?.pincode} icon="navigate-outline" />
                </View>

                {/* Loan Details */}
                <View className="bg-white mx-5 mt-5 rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100">
                    <View className="flex-row items-center mb-4">
                        <View className="w-10 h-10 rounded-xl bg-amber-50 items-center justify-center mr-3">
                            <Ionicons name="cash-outline" size={24} color="#FF9800" />
                        </View>
                        <Text className="text-lg font-bold text-gray-900">
                            Loan Details
                        </Text>
                    </View>
                    <InfoRow
                        label="Loan Amount"
                        value={`₹${customer?.loanDetails?.loanAmount?.toLocaleString('en-IN') || '0'}`}
                        icon="wallet-outline"
                    />
                    <InfoRow label="Tenure" value={`${customer?.loanDetails?.tenure || '0'} months`} icon="time-outline" />
                    <InfoRow label="Interest Rate" value={`${customer?.loanDetails?.interestRate || '0'}%`} icon="trending-up-outline" />
                    <InfoRow
                        label="EMI Amount"
                        value={`₹${customer?.loanDetails?.emiAmount?.toLocaleString('en-IN') || '0'}`}
                        icon="repeat-outline"
                    />
                    <InfoRow label="EMI Frequency" value={customer?.loanDetails?.emiFrequency || 'N/A'} icon="calendar-outline" />
                    <InfoRow
                        label="Disbursed Date"
                        value={customer?.loanDetails?.disbursedDate ? new Date(customer.loanDetails.disbursedDate).toLocaleDateString('en-IN') : 'N/A'}
                        icon="checkmark-circle-outline"
                    />
                    <InfoRow
                        label="Next EMI Date"
                        value={customer?.nextEmiDate ? new Date(customer.nextEmiDate).toLocaleDateString('en-IN') : 'N/A'}
                        icon="alarm-outline"
                    />
                </View>

                {/* Action Buttons */}
                <View className="px-5 mt-6 mb-8">
                    <TouchableOpacity
                        className="bg-teal-600 rounded-2xl h-14 flex-row items-center justify-center mb-3 shadow-2xl shadow-teal-600/30"
                        onPress={() => router.push({ pathname: '/(tabs)/payment', params: { customerId } })}
                        activeOpacity={0.8}
                    >
                        <View className="w-9 h-9 rounded-full bg-white/20 items-center justify-center mr-2">
                            <Ionicons name="card" size={20} color="#FFFFFF" />
                        </View>
                        <Text className="text-white text-base font-bold">
                            Collect Payment
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-red-500 rounded-2xl h-14 flex-row items-center justify-center shadow-2xl shadow-red-500/30"
                        onPress={handleDelete}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                        <Text className="text-white text-base font-bold ml-2">
                            Delete Customer
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
