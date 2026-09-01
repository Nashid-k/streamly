import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';

export default function SearchSkeletonLoader() {
  const pulseAnim = useRef(new Animated.Value(0.45)).current;
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ])
    );

    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    pulse.start();
    shimmer.start();

    return () => {
      pulse.stop();
      shimmer.stop();
    };
  }, [pulseAnim, shimmerAnim]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-120, 160],
  });

  const renderSkeletonItem = (key) => (
    <Animated.View key={key} style={[styles.skeletonItem, { opacity: pulseAnim }]}>
      <View style={styles.skeletonImage}>
        <Animated.View style={[styles.shimmer, { transform: [{ translateX: shimmerTranslate }] }]} />
      </View>
      <View style={styles.skeletonContent}>
        <Animated.View style={[styles.skeletonTextLine1, { opacity: pulseAnim }]} />
        <Animated.View style={[styles.skeletonTextLine2, { opacity: pulseAnim }]} />
        <Animated.View style={[styles.skeletonTextLine3, { opacity: pulseAnim }]} />
      </View>
    </Animated.View>
  );

  return <View style={styles.container}>{[1, 2, 3, 4, 5].map((item) => renderSkeletonItem(item))}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  skeletonItem: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#18181b',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  skeletonImage: {
    width: 88,
    height: 128,
    backgroundColor: '#27272a',
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '40%',
    backgroundColor: 'rgba(255,255,255,0.16)',
    transform: [{ skewX: '-18deg' }],
  },
  skeletonContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  skeletonTextLine1: {
    height: 16,
    backgroundColor: '#3f3f46',
    borderRadius: 6,
    marginBottom: 12,
    width: '72%',
  },
  skeletonTextLine2: {
    height: 14,
    backgroundColor: '#3f3f46',
    borderRadius: 6,
    marginBottom: 12,
    width: '45%',
  },
  skeletonTextLine3: {
    height: 12,
    backgroundColor: '#3f3f46',
    borderRadius: 6,
    width: '30%',
  },
});
