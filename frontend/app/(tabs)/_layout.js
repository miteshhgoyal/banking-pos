import { Tabs, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
    const segments = useSegments();

    // Hide tab bar when on payment or receipt screens
    const hideTabBar = segments.includes('payment') || segments.includes('receipt');

    return (
        <Tabs
            screenOptions={{
                // White theme with teal accent
                tabBarActiveTintColor: '#1F8A70',
                tabBarInactiveTintColor: '#9CA3AF',
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopColor: '#E5E7EB',
                    borderTopWidth: 1,
                    height: 70,
                    paddingBottom: 16,
                    paddingTop: 8,
                    display: hideTabBar ? 'none' : 'flex',
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
                headerStyle: {
                    backgroundColor: '#FFFFFF',
                },
                headerTintColor: '#1F2937',
                headerShadowVisible: true,
                headerShadowColor: '#E5E7EB',
            }}
        >
            {/* Home/Dashboard Tab - VISIBLE */}
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />

            {/* Customers List Tab - VISIBLE */}
            <Tabs.Screen
                name="customers"
                options={{
                    title: 'Customers',
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people" size={size} color={color} />
                    ),
                }}
            />

            {/* Transaction History Tab - VISIBLE */}
            <Tabs.Screen
                name="history"
                options={{
                    title: 'History',
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="receipt" size={size} color={color} />
                    ),
                }}
            />

            {/* Profile Tab - VISIBLE */}
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />

            {/* Payment Screen - HIDDEN (not shown in tab bar) */}
            <Tabs.Screen
                name="payment"
                options={{
                    href: null,
                    title: 'Payment',
                    headerShown: false,
                }}
            />

            {/* Receipt Details - HIDDEN (not shown in tab bar) */}
            <Tabs.Screen
                name="receipt"
                options={{
                    href: null,
                    title: 'Receipt',
                    headerShown: false,
                }}
            />
        </Tabs>
    );
}