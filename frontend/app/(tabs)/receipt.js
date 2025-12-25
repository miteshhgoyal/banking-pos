// app/(tabs)/receipt.js
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

export default function ReceiptScreen() {
    const router = useRouter();
    const { collectionId } = useLocalSearchParams();

    const [collection, setCollection] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReceipt();
    }, []);

    const fetchReceipt = async () => {
        try {
            const response = await api.get(`/collections/${collectionId}`);
            if (response.data.success) {
                setCollection(response.data.data.collection);
            }
        } catch (error) {
            console.error('Fetch receipt error:', error);
            Alert.alert('Error', 'Failed to load receipt');
        } finally {
            setLoading(false);
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

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#1F8A70" />
            </View>
        );
    }

    const InfoRow = ({ label, value, valueColor = '#1F2937' }) => (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>{label}</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: valueColor }}>{value}</Text>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginLeft: 16 }}>
                        Receipt
                    </Text>
                </View>

                {/* Success Icon */}
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                        <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                    </View>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 }}>
                        ₹{collection?.collectionAmount?.toLocaleString()}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Payment Successful</Text>
                </View>

                {/* Receipt Card */}
                <View style={{ marginHorizontal: 20, marginBottom: 20, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 }}>
                        Transaction Details
                    </Text>

                    <InfoRow label="Transaction ID" value={collection?.transactionId} />
                    <InfoRow label="Date & Time" value={formatDate(collection?.timestamp)} />
                    <InfoRow label="Payment Mode" value={collection?.paymentMode?.toUpperCase()} />

                    <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 }} />

                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 }}>
                        Customer Details
                    </Text>

                    <InfoRow label="Name" value={collection?.customer?.name} />
                    <InfoRow label="Loan ID" value={collection?.customer?.loanId} />
                    <InfoRow label="Mobile" value={collection?.customer?.mobile} />

                    <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 }} />

                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 }}>
                        Payment Summary
                    </Text>

                    <InfoRow label="Collection Amount" value={`₹${collection?.collectionAmount?.toLocaleString()}`} valueColor="#10B981" />
                    <InfoRow label="Outstanding Before" value={`₹${collection?.outstandingBefore?.toLocaleString()}`} valueColor="#EF4444" />
                    <InfoRow label="Outstanding After" value={`₹${collection?.outstandingAfter?.toLocaleString()}`} valueColor="#EF4444" />
                </View>

                {/* Action Buttons */}
                <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                    <TouchableOpacity
                        style={{ backgroundColor: '#1F8A70', borderRadius: 12, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
                        onPress={() => Alert.alert('Info', 'SMS/WhatsApp integration coming soon')}
                    >
                        <Ionicons name="share-social" size={20} color="#FFFFFF" />
                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 }}>
                            Send Receipt
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{ backgroundColor: '#F3F4F6', borderRadius: 12, height: 56, alignItems: 'center', justifyContent: 'center' }}
                        onPress={() => router.push('/(tabs)/customers')}
                    >
                        <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: 'bold' }}>
                            Back to Customers
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
