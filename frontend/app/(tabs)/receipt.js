import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import api from '@/services/api';
import Gradient from '@/components/Gradient';

export default function ReceiptScreen() {
    const router = useRouter();
    const { collectionId } = useLocalSearchParams();

    const [collection, setCollection] = useState(null);
    const [loading, setLoading] = useState(true);

    // Use useFocusEffect instead of useEffect
    useFocusEffect(
        useCallback(() => {
            if (collectionId) {
                fetchReceipt();
            }
        }, [collectionId])
    );

    const fetchReceipt = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/collections/${collectionId}`);
            if (response.data.success) {
                setCollection(response.data.data.collection);
            }
        } catch (error) {
            console.error('Fetch receipt error:', error);
            Alert.alert('Error', 'Failed to load receipt details');
        } finally {
            setLoading(false);
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

    const handleShareReceipt = async () => {
        try {
            const receiptText = `
🧾 PAYMENT RECEIPT

Transaction ID: ${collection?.transactionId || 'N/A'}
Date: ${formatDate(collection?.timestamp)}

Customer: ${collection?.customer?.name || 'N/A'}
Loan ID: ${collection?.customer?.loanId || 'N/A'}

Amount Paid: ₹${collection?.collectionAmount?.toLocaleString('en-IN') || '0'}
Payment Mode: ${collection?.paymentMode?.toUpperCase() || 'N/A'}

Outstanding Before: ₹${collection?.outstandingBefore?.toLocaleString('en-IN') || '0'}
Outstanding After: ₹${collection?.outstandingAfter?.toLocaleString('en-IN') || '0'}

Collected by: ${collection?.agent?.name || 'Agent'}

Thank you for your payment! 💚
            `.trim();

            await Share.share({
                message: receiptText,
                title: 'Payment Receipt'
            });
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color="#1F8A70" />
                <Text className="mt-4 text-gray-600 text-base font-medium">Loading receipt...</Text>
            </View>
        );
    }

    if (!collection) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center px-8">
                <View className="w-24 h-24 rounded-full bg-red-100 items-center justify-center mb-4">
                    <Ionicons name="alert-circle" size={48} color="#EF4444" />
                </View>
                <Text className="text-xl font-bold text-gray-900 mb-2">Receipt Not Found</Text>
                <Text className="text-sm text-gray-500 text-center mb-6">
                    Unable to load receipt details
                </Text>
                <TouchableOpacity
                    className="bg-teal-600 rounded-2xl px-6 py-3"
                    onPress={() => router.back()}
                    activeOpacity={0.8}
                >
                    <Text className="text-white text-base font-bold">Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const InfoRow = ({ label, value, valueColor = 'text-gray-900', icon }) => (
        <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center flex-1">
                {icon && (
                    <View className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center mr-3">
                        <Ionicons name={icon} size={16} color="#6B7280" />
                    </View>
                )}
                <Text className="text-sm text-gray-600 font-medium">{label}</Text>
            </View>
            <Text className={`text-sm font-bold ${valueColor} text-right flex-1`} numberOfLines={2}>
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
                    <View>
                        <Text className="text-xl font-bold text-gray-900">
                            Payment Receipt
                        </Text>
                        <Text className="text-xs text-gray-500 mt-0.5">
                            Transaction successful
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    className="w-10 h-10 rounded-full bg-teal-50 items-center justify-center"
                    onPress={handleShareReceipt}
                    activeOpacity={0.7}
                >
                    <Ionicons name="share-outline" size={22} color="#1F8A70" />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Success Card with Gradient */}
                <View className="mx-5 mt-5 rounded-3xl overflow-hidden shadow-2xl shadow-green-500/20">
                    <Gradient type="teal">
                        <View className="p-8 items-center">
                            <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mb-4">
                                <Ionicons name="checkmark-circle" size={48} color="#FFFFFF" />
                            </View>
                            <Text className="text-sm text-white/80 mb-2 font-medium tracking-wide">
                                AMOUNT COLLECTED
                            </Text>
                            <Text className="text-5xl font-black text-white mb-2">
                                ₹{collection?.collectionAmount?.toLocaleString('en-IN') || '0'}
                            </Text>
                            <View className="px-4 py-1.5 bg-white/20 rounded-full">
                                <Text className="text-xs font-bold text-white tracking-wide">
                                    {collection?.paymentMode?.toUpperCase() || 'PAYMENT'}
                                </Text>
                            </View>
                        </View>
                    </Gradient>
                </View>

                {/* Transaction Details */}
                <View className="mx-5 mt-5 bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100">
                    <View className="flex-row items-center mb-4">
                        <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-3">
                            <Ionicons name="document-text-outline" size={24} color="#2196F3" />
                        </View>
                        <Text className="text-lg font-bold text-gray-900">
                            Transaction Details
                        </Text>
                    </View>

                    <InfoRow
                        label="Transaction ID"
                        value={collection?.transactionId}
                        icon="barcode-outline"
                    />
                    <InfoRow
                        label="Date & Time"
                        value={formatDate(collection?.timestamp)}
                        icon="calendar-outline"
                    />
                    <InfoRow
                        label="Payment Mode"
                        value={collection?.paymentMode?.toUpperCase()}
                        icon="wallet-outline"
                    />
                    <View className="mb-0">
                        <InfoRow
                            label="Status"
                            value={collection?.status?.toUpperCase() || 'COMPLETED'}
                            valueColor="text-green-600"
                            icon="checkmark-done-outline"
                        />
                    </View>
                </View>

                {/* Customer Details */}
                <View className="mx-5 mt-5 bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100">
                    <View className="flex-row items-center mb-4">
                        <View className="w-10 h-10 rounded-xl bg-teal-50 items-center justify-center mr-3">
                            <Ionicons name="person-outline" size={24} color="#1F8A70" />
                        </View>
                        <Text className="text-lg font-bold text-gray-900">
                            Customer Details
                        </Text>
                    </View>

                    <InfoRow
                        label="Name"
                        value={collection?.customer?.name}
                        icon="person-circle-outline"
                    />
                    <InfoRow
                        label="Loan ID"
                        value={collection?.customer?.loanId}
                        icon="card-outline"
                    />
                    <View className="mb-0">
                        <InfoRow
                            label="Mobile"
                            value={collection?.customer?.mobile}
                            icon="call-outline"
                        />
                    </View>
                </View>

                {/* Payment Summary */}
                <View className="mx-5 mt-5 bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100">
                    <View className="flex-row items-center mb-4">
                        <View className="w-10 h-10 rounded-xl bg-amber-50 items-center justify-center mr-3">
                            <Ionicons name="cash-outline" size={24} color="#FF9800" />
                        </View>
                        <Text className="text-lg font-bold text-gray-900">
                            Payment Summary
                        </Text>
                    </View>

                    <View className="bg-green-50 rounded-xl p-4 mb-4 border border-green-200">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-sm text-green-700 font-medium">Collection Amount</Text>
                            <Text className="text-2xl font-bold text-green-600">
                                ₹{collection?.collectionAmount?.toLocaleString('en-IN') || '0'}
                            </Text>
                        </View>
                    </View>

                    <InfoRow
                        label="Outstanding Before"
                        value={`₹${collection?.outstandingBefore?.toLocaleString('en-IN') || '0'}`}
                        valueColor="text-red-500"
                        icon="trending-up-outline"
                    />
                    <View className="mb-0">
                        <InfoRow
                            label="Outstanding After"
                            value={`₹${collection?.outstandingAfter?.toLocaleString('en-IN') || '0'}`}
                            valueColor="text-red-600"
                            icon="trending-down-outline"
                        />
                    </View>
                </View>

                {/* Agent Info */}
                <View className="mx-5 mt-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200">
                    <View className="flex-row items-center">
                        <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center border-2 border-blue-200">
                            <Ionicons name="person-circle-outline" size={28} color="#3B82F6" />
                        </View>
                        <View className="flex-1 ml-4">
                            <Text className="text-xs text-blue-600 font-medium mb-1">Collected by</Text>
                            <Text className="text-base font-bold text-blue-900">
                                {collection?.agent?.name || 'Agent'}
                            </Text>
                            {collection?.agent?.mobile && (
                                <Text className="text-xs text-blue-600 mt-0.5">
                                    {collection?.agent?.mobile}
                                </Text>
                            )}
                        </View>
                        <View className="w-9 h-9 rounded-full bg-blue-200 items-center justify-center">
                            <Ionicons name="checkmark" size={20} color="#1E40AF" />
                        </View>
                    </View>
                </View>

                {/* Remarks if available */}
                {collection?.remarks && (
                    <View className="mx-5 mt-5 bg-gray-100 rounded-2xl p-5 border border-gray-200">
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="chatbox-outline" size={20} color="#6B7280" />
                            <Text className="text-sm font-bold text-gray-700 ml-2">
                                Remarks
                            </Text>
                        </View>
                        <Text className="text-sm text-gray-600 leading-5">
                            {collection.remarks}
                        </Text>
                    </View>
                )}

                {/* Action Buttons */}
                <View className="px-5 mt-6">
                    <TouchableOpacity
                        className="bg-teal-600 rounded-2xl h-14 flex-row items-center justify-center mb-3 shadow-2xl shadow-teal-600/30"
                        onPress={() => router.push('/(tabs)/customers')}
                        activeOpacity={0.8}
                    >
                        <View className="w-9 h-9 rounded-full bg-white/20 items-center justify-center mr-2">
                            <Ionicons name="people" size={20} color="#FFFFFF" />
                        </View>
                        <Text className="text-white text-base font-bold">
                            Back to Customers
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-white rounded-2xl h-14 flex-row items-center justify-center border-2 border-gray-200 shadow-sm"
                        onPress={() => router.push('/(tabs)')}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="home-outline" size={20} color="#374151" />
                        <Text className="text-gray-700 text-base font-bold ml-2">
                            Go to Home
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
