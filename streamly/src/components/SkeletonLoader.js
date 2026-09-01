import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions, Easing } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 6;
const CARD_WIDTH = (width - 24) / 2 - (CARD_MARGIN * 2);

export default function SkeletonLoader() {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
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
    outputRange: [-140, 140],
  });

  const renderSkeletonCard = (key) => (
    <Animated.View key={key} style={[styles.skeletonCard, { opacity: pulseAnim }]}>
      <View style={styles.skeletonImage}>
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX: shimmerTranslate }],
            },
          ]}
        />
      </View>
      <View style={styles.skeletonContent}>
        <Animated.View style={[styles.skeletonTextLine1, { opacity: pulseAnim }]} />
        <Animated.View style={[styles.skeletonTextLine2, { opacity: pulseAnim }]} />
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Animated.View style={[styles.skeletonTitle, { opacity: pulseAnim }]} />
      </View>
      <View style={styles.grid}>{[1, 2, 3, 4, 5, 6].map((item) => renderSkeletonCard(item))}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
    paddingTop: 48,
  },
  header: {
    paddingHorizontal: 16,
    marginVertical: 18,
  },
  skeletonTitle: {
    width: 180,
    height: 32,
    backgroundColor: '#27272a',
    borderRadius: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  skeletonCard: {
    width: CARD_WIDTH,
    margin: CARD_MARGIN,
    backgroundColor: '#111827',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 20,
  },
  skeletonImage: {
    width: '100%',
    aspectRatio: 2 / 3,
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
    padding: 12,
  },
  skeletonTextLine1: {
    height: 14,
    backgroundColor: '#3f3f46',
    borderRadius: 6,
    marginBottom: 8,
    width: '80%',
  },
  skeletonTextLine2: {
    height: 12,
    backgroundColor: '#3f3f46',
    borderRadius: 6,
    width: '44%',
  },
});
