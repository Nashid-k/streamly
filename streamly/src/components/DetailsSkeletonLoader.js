import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions, Easing } from 'react-native';

const { height } = Dimensions.get('window');

export default function DetailsSkeletonLoader() {
  const pulseAnim = useRef(new Animated.Value(0.42)).current;
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.42, duration: 700, useNativeDriver: true }),
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
    outputRange: [-180, 200],
  });

  const ShimmerBlock = ({ style }) => (
    <Animated.View style={[style, { opacity: pulseAnim }]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX: shimmerTranslate }],
          },
        ]}
      />
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <ShimmerBlock style={styles.skeletonBackdrop} />
      <View style={styles.content}>
        <ShimmerBlock style={styles.skeletonTitle} />
        <ShimmerBlock style={styles.skeletonMetaRow} />
        <View style={styles.actionRow}>
          <ShimmerBlock style={styles.skeletonButtonLarge} />
          <ShimmerBlock style={styles.skeletonButtonSmall} />
        </View>
        <ShimmerBlock style={[styles.skeletonTextLine, { width: '100%' }]} />
        <ShimmerBlock style={[styles.skeletonTextLine, { width: '90%' }]} />
        <ShimmerBlock style={[styles.skeletonTextLine, { width: '80%' }]} />
        <ShimmerBlock style={[styles.skeletonTextLine, { width: '60%' }]} />

        <ShimmerBlock style={[styles.skeletonTitle, { width: 120, marginTop: 40 }]} />
        <View style={styles.castRow}>
          <ShimmerBlock style={styles.skeletonCastImage} />
          <ShimmerBlock style={styles.skeletonCastImage} />
          <ShimmerBlock style={styles.skeletonCastImage} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  skeletonBackdrop: {
    width: '100%',
    height: height * 0.4,
    backgroundColor: '#18181b',
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: '#09090b',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
  },
  skeletonTitle: {
    width: 250,
    height: 36,
    backgroundColor: '#27272a',
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
  },
  skeletonMetaRow: {
    width: 180,
    height: 16,
    backgroundColor: '#27272a',
    borderRadius: 6,
    marginBottom: 24,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  skeletonButtonLarge: {
    flex: 2,
    height: 48,
    backgroundColor: '#27272a',
    borderRadius: 16,
    overflow: 'hidden',
  },
  skeletonButtonSmall: {
    flex: 1,
    height: 48,
    backgroundColor: '#27272a',
    borderRadius: 16,
    overflow: 'hidden',
  },
  skeletonTextLine: {
    height: 14,
    backgroundColor: '#27272a',
    borderRadius: 6,
    marginBottom: 10,
    overflow: 'hidden',
  },
  castRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  skeletonCastImage: {
    width: 110,
    height: 160,
    backgroundColor: '#27272a',
    borderRadius: 14,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '40%',
    backgroundColor: 'rgba(255,255,255,0.18)',
    transform: [{ skewX: '-18deg' }],
  },
});
