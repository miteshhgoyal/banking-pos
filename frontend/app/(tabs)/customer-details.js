import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '@/services/api';

export default function CustomerDetailsScreen() {
    const router = useRouter();
    const { customerId } = useLocalSearchParams();

    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCustomer();
    }, []);

    const fetchCustomer = async () => {
        try {
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
            'Are you sure you want to delete this customer?',
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return '#10B981';
            case 'closed': return '#6B7280';
            case 'defaulter': return '#F59E0B';
            case 'npa': return '#EF4444';
            default: return '#6B7280';
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#1F8A70" />
            </View>
        );
    }

    const InfoRow = ({ label, value }) => (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>{label}</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937', flex: 1, textAlign: 'right' }}>
                {value || 'N/A'}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }} edges={['top']}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginLeft: 16 }}>
                        Customer Details
                    </Text>
                </View>
                <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/edit-customer', params: { customerId } })}>
                    <Ionicons name="create-outline" size={24} color="#1F8A70" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Status Badge */}
                <View style={{ padding: 20, alignItems: 'center' }}>
                    <View style={{ paddingHorizontal: 24, paddingVertical: 8, borderRadius: 20, backgroundColor: getStatusColor(customer?.status) + '20' }}>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: getStatusColor(customer?.status), textTransform: 'uppercase' }}>
                            {customer?.status}
                        </Text>
                    </View>
                </View>

                {/* Outstanding Card */}
                <View style={{ marginHorizontal: 20, marginBottom: 20, backgroundColor: '#EF4444', borderRadius: 16, padding: 20 }}>
                    <Text style={{ fontSize: 14, color: '#FFFFFF', marginBottom: 8 }}>Outstanding Amount</Text>
                    <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#FFFFFF' }}>
                        ₹{customer?.outstandingAmount?.toLocaleString()}
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                        <View>
                            <Text style={{ fontSize: 12, color: '#FEE2E2' }}>Total Paid</Text>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                                ₹{customer?.totalPaid?.toLocaleString() || '0'}
                            </Text>
                        </View>
                        <View>
                            <Text style={{ fontSize: 12, color: '#FEE2E2' }}>Penalty</Text>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                                ₹{customer?.penaltyAmount?.toLocaleString() || '0'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Basic Information */}
                <View style={{ backgroundColor: '#FFFFFF', marginHorizontal: 20, marginBottom: 20, borderRadius: 12, padding: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 }}>
                        Basic Information
                    </Text>
                    <InfoRow label="Loan ID" value={customer?.loanId} />
                    <InfoRow label="Account Number" value={customer?.accountNumber} />
                    <InfoRow label="Name" value={customer?.name} />
                    <InfoRow label="Mobile" value={customer?.mobile} />
                    <InfoRow label="Aadhaar" value={customer?.aadhaar} />
                </View>

                {/* Address */}
                <View style={{ backgroundColor: '#FFFFFF', marginHorizontal: 20, marginBottom: 20, borderRadius: 12, padding: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 }}>
                        Address
                    </Text>
                    <InfoRow label="Street" value={customer?.address?.street} />
                    <InfoRow label="City" value={customer?.address?.city} />
                    <InfoRow label="State" value={customer?.address?.state} />
                    <InfoRow label="Pincode" value={customer?.address?.pincode} />
                </View>

                {/* Loan Details */}
                <View style={{ backgroundColor: '#FFFFFF', marginHorizontal: 20, marginBottom: 20, borderRadius: 12, padding: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 }}>
                        Loan Details
                    </Text>
                    <InfoRow label="Loan Amount" value={`₹${customer?.loanDetails?.loanAmount?.toLocaleString()}`} />
                    <InfoRow label="Tenure" value={`${customer?.loanDetails?.tenure} months`} />
                    <InfoRow label="Interest Rate" value={`${customer?.loanDetails?.interestRate}%`} />
                    <InfoRow label="EMI Amount" value={`₹${customer?.loanDetails?.emiAmount?.toLocaleString()}`} />
                    <InfoRow label="EMI Frequency" value={customer?.loanDetails?.emiFrequency} />
                    <InfoRow label="Next EMI Date" value={customer?.nextEmiDate ? new Date(customer.nextEmiDate).toLocaleDateString() : 'N/A'} />
                </View>

                {/* Action Buttons */}
                <View style={{ paddingHorizontal: 20, paddingBottom: 20, gap: 12 }}>
                    <TouchableOpacity
                        style={{ backgroundColor: '#1F8A70', borderRadius: 12, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                        onPress={() => router.push({ pathname: '/(tabs)/payment', params: { customerId } })}
                    >
                        <Ionicons name="card" size={20} color="#FFFFFF" />
                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 }}>
                            Collect Payment
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{ backgroundColor: '#EF4444', borderRadius: 12, height: 56, alignItems: 'center', justifyContent: 'center' }}
                        onPress={handleDelete}
                    >
                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
                            Delete Customer
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}