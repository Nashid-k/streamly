import React, { useRef } from 'react';
import { View, Text, Image, StyleSheet, Pressable, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import PlatformBadge from './PlatformBadge';

const buildPosterUrl = (value) => {
  if (!value || typeof value !== 'string') {
    return 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80';
  }

  if (value.startsWith('http')) return value;
  if (value.startsWith('/')) return `https://image.tmdb.org/t/p/w500${value}`;
  return value;
};

export default function MovieCard({ item, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        friction: 8,
        tension: 160,
      }),
      Animated.spring(translateYAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 140,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 7,
        tension: 120,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 7,
        tension: 120,
      }),
    ]).start();
  };

  const poster = buildPosterUrl(item?.posterUrl || item?.poster || item?.poster_path || item?.posterPath);
  const title = item?.title || item?.name || 'Untitled';
  const year = item?.releaseYear || item?.release_date?.slice(0, 4) || 'New';
  const rating = item?.imdbRating || item?.rating || '8.8';

  return (
    <Pressable
      style={styles.cardContainer}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
    >
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
          },
        ]}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: poster }} style={styles.poster} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.06)', 'rgba(0,0,0,0.82)']}
            style={styles.posterOverlay}
            locations={[0, 0.55, 1]}
          />
          {(item?.platform || item?.source) && (
            <PlatformBadge platform={item.platform || item.source} style={styles.badge} />
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.movieTitle} numberOfLines={1}>{title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.movieYear}>{year}</Text>
            <View style={styles.ratingPill}>
              <Text style={styles.movieRating}>★ {rating}</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    margin: 4,
    minHeight: 220,
  },
  card: {
    flex: 1,
    backgroundColor: '#f6f6f7',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 0.72,
    backgroundColor: '#ececef',
  },
  poster: {
    width: '100%',
    height: '100%',
    backgroundColor: '#dfe1e6',
  },
  posterOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
  },
  badge: { position: 'absolute', top: 8, right: 8 },
  cardContent: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#f7f7f8',
  },
  movieTitle: {
    color: '#121212',
    fontWeight: '800',
    fontSize: 13.5,
    letterSpacing: 0.06,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  movieYear: {
    color: '#656a72',
    fontSize: 11.5,
    fontWeight: '700',
  },
  ratingPill: {
    backgroundColor: 'rgba(19, 31, 55, 0.08)',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(19,31,55,0.1)',
  },
  movieRating: {
    color: '#1f2937',
    fontSize: 10.5,
    fontWeight: '800',
  },
});
