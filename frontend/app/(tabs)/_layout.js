import { Tabs, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
    const segments = useSegments();

    // Hide tab bar when on payment, receipt, or customer detail screens
    const hideTabBar = segments.includes('payment')
        || segments.includes('receipt')
        || segments.includes('add-customer')
        || segments.includes('customer-details')
        || segments.includes('edit-customer')
        || segments.includes('customer-transactions');

    return (
        <Tabs
            screenOptions={{
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

            {/* Hidden Screens - These are modal/stack screens within tabs */}
            <Tabs.Screen
                name="payment"
                options={{
                    href: null,
                    headerShown: false,
                    tabBarButton: () => null
                }}
            />
            <Tabs.Screen
                name="receipt"
                options={{
                    href: null,
                    headerShown: false,
                    tabBarButton: () => null
                }}
            />
            <Tabs.Screen
                name="add-customer"
                options={{
                    href: null,
                    headerShown: false,
                    tabBarButton: () => null
                }}
            />
            <Tabs.Screen
                name="customer-details"
                options={{
                    href: null,
                    headerShown: false,
                    tabBarButton: () => null
                }}
            />
            <Tabs.Screen
                name="edit-customer"
                options={{
                    href: null,
                    headerShown: false,
                    tabBarButton: () => null
                }}
            />
            <Tabs.Screen
                name="customer-transactions"
                options={{
                    href: null,
                    headerShown: false,
                    tabBarButton: () => null
                }}
            />
        </Tabs>
    );
}
