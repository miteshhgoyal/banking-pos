// app/(tabs)/profile.js
import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/(auth)/login');
                    }
                }
            ]
        );
    };

    const ProfileRow = ({ icon, label, value }) => (
        <View style={{ backgroundColor: '#FFFFFF', padding: 16, marginBottom: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={icon} size={20} color="#1F8A70" />
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>{label}</Text>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>{value || 'Not set'}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={{ backgroundColor: '#1F8A70', paddingHorizontal: 20, paddingVertical: 40, alignItems: 'center' }}>
                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                        <Ionicons name="person" size={40} color="#1F8A70" />
                    </View>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 }}>
                        {user?.name}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#E0F2F1' }}>
                        {user?.role?.toUpperCase()}
                    </Text>
                </View>

                {/* Profile Details */}
                <View style={{ marginTop: 20 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937', paddingHorizontal: 20, marginBottom: 12 }}>
                        Account Information
                    </Text>

                    <ProfileRow icon="person-outline" label="Full Name" value={user?.name} />
                    <ProfileRow icon="mail-outline" label="Email Address" value={user?.email} />
                    <ProfileRow icon="call-outline" label="Mobile Number" value={user?.mobile} />
                    <ProfileRow icon="id-card-outline" label="Employee ID" value={user?.employeeId} />
                    <ProfileRow icon="business-outline" label="Branch" value={user?.branch} />
                    <ProfileRow icon="location-outline" label="Assigned Area" value={user?.assignedArea} />
                    <ProfileRow icon="phone-portrait-outline" label="Device ID" value={user?.deviceId} />
                </View>

                {/* Logout Button */}
                <View style={{ padding: 20 }}>
                    <TouchableOpacity
                        style={{ backgroundColor: '#EF4444', borderRadius: 12, height: 56, alignItems: 'center', justifyContent: 'center', shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}
                        onPress={handleLogout}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
                            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginLeft: 8 }}>
                                Logout
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
