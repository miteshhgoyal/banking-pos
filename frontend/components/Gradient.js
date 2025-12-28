import { LinearGradient } from 'expo-linear-gradient';

const GRADIENTS = {
    teal: ['#1F8A70', '#00695C'],
    green: ['#10B981', '#059669'],
    blue: ['#3B82F6', '#2563EB'],
    tealGreen: ['#1F8A70', '#10B981'],
    red: ['#DC2626', '#991B1B'],
};

export default function Gradient({ type = 'teal', children, style = {} }) {
    // Safeguard: Ensure colors is always a valid array
    const colors = GRADIENTS[type] || GRADIENTS.teal;

    return (
        <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={style}
        >
            {children}
        </LinearGradient>
    );
}
