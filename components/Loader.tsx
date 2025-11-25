import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    interpolate,
    Easing,
} from 'react-native-reanimated';

export default function Loader({ size = 50 }: { size?: number }) {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withRepeat(
            withTiming(1, { duration: 1000, easing: Easing.linear }),
            -1,
            false // do not reverse, just loop 0->1
        );
    }, []);

    const containerStyle = useAnimatedStyle(() => {
        const rotate = interpolate(progress.value, [0, 0.5, 1], [0, 360, 720]);
        const scale = interpolate(progress.value, [0, 0.5, 1], [0.8, 1.2, 0.8]);
        return {
            transform: [{ rotate: `${rotate}deg` }, { scale }],
        };
    });

    const ball1Style = useAnimatedStyle(() => {
        const translateX = interpolate(progress.value, [0, 0.5, 1], [0, 15, 0]);
        const translateY = interpolate(progress.value, [0, 0.5, 1], [0, 15, 0]);
        const marginBottom = interpolate(progress.value, [0, 0.5, 1], [10, 0, 10]);

        return {
            transform: [{ translateX }, { translateY }],
            marginBottom,
        };
    });

    const ball1ShadowStyle = useAnimatedStyle(() => {
        const translateX = interpolate(progress.value, [0, 0.5, 1], [30, 0, 30]);
        return {
            transform: [{ translateX }],
        };
    });

    const ball2Style = useAnimatedStyle(() => {
        const translateX = interpolate(progress.value, [0, 0.5, 1], [0, 15, 0]);
        const translateY = interpolate(progress.value, [0, 0.5, 1], [0, 15, 0]);
        const marginTop = interpolate(progress.value, [0, 0.5, 1], [0, -20, 0]);

        return {
            transform: [{ translateX }, { translateY }],
            marginTop,
        };
    });

    const ball2ShadowStyle = useAnimatedStyle(() => {
        const translateX = interpolate(progress.value, [0, 0.5, 1], [30, 0, 30]);
        return {
            transform: [{ translateX }],
        };
    });

    const scale = size / 50;

    return (
        <View style={[styles.center, { width: size, height: size }]}>
            <Animated.View
                style={[
                    styles.loader,
                    containerStyle,
                    { transform: [...(containerStyle.transform || []), { scale: scale }] } // Apply size scaling on top of animation scaling
                ]}
            >
                {/* Ball 1 (Top) */}
                <Animated.View style={[styles.ball, styles.ball1, ball1Style]}>
                    {/* Shadow for Ball 1 */}
                    <Animated.View style={[styles.ball, styles.ballShadow, { backgroundColor: '#ff3d00' }, ball1ShadowStyle]} />
                </Animated.View>

                {/* Ball 2 (Bottom) */}
                <Animated.View style={[styles.ball, styles.ball2, ball2Style]}>
                    {/* Shadow for Ball 2 */}
                    <Animated.View style={[styles.ball, styles.ballShadow, { backgroundColor: '#fff' }, ball2ShadowStyle]} />
                </Animated.View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loader: {
        height: 50,
        width: 50,
        // backgroundColor: 'rgba(0,0,0,0.1)', // Debug
    },
    ball: {
        height: 20,
        width: 20,
        borderRadius: 10,
        position: 'absolute', // Inner shadow needs absolute
    },
    ball1: {
        backgroundColor: '#fff',
        position: 'relative', // Parent needs relative
        overflow: 'visible',
    },
    ball2: {
        backgroundColor: '#652497ff',
        position: 'relative',
        overflow: 'visible',
    },
    ballShadow: {
        top: 0,
        left: 0,
    },
});
