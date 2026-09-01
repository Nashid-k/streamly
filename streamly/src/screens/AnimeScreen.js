import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Image, Animated, StatusBar, Dimensions, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { movieService } from '../api/movieService';
import MovieCard from '../components/MovieCard';
import SkeletonLoader from '../components/SkeletonLoader';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const ANIME_TYPES = [
  { id: 'all', label: 'All Anime' },
  { id: 'action', label: 'Action' },
  { id: 'romance', label: 'Romance' },
  { id: 'fantasy', label: 'Fantasy' },
  { id: 'scifi', label: 'Sci-Fi' },
  { id: 'horror', label: 'Horror' },
  { id: 'comedy', label: 'Comedy' },
];

export default function AnimeScreen() {
  const navigation = useNavigation();
  const [anime, setAnime] = useState([]);
  const [hero, setHero] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('all');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setLoading(true);
    movieService.searchMovies('anime')
      .then(data => {
        const list = data?.movies || data || [];
        setHero(list[0] || null);
        setAnime(list);
        setLoading(false);
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = activeType === 'all'
    ? anime
    : anime.filter(m => m.genres?.some(g => g.toLowerCase().includes(activeType)));

  const navigateToDetails = (item) => {
    navigation.navigate('MovieDetails', {
      movieId: item.id || item.tmdbId,
      platform: item.platform || item.source || 'netflix',
    });
  };

  if (loading) return <SkeletonLoader />;

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <Animated.ScrollView style={{ opacity: fadeAnim }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        {hero && (
          <TouchableOpacity activeOpacity={0.9} onPress={() => navigateToDetails(hero)}>
            <View style={styles.heroContainer}>
              <Image
                source={{ uri: hero.backdropUrl || hero.posterUrl || hero.poster_path || '' }}
                style={styles.heroImage}
                resizeMode="cover"
              />
              {/* Anime-style overlay */}
              <LinearGradient
                colors={['rgba(229,9,20,0.1)', 'transparent', 'rgba(0,0,0,0.8)', '#09090b']}
                style={styles.heroGrad}
                locations={[0, 0.3, 0.7, 1]}
              >
                <View style={styles.animeBadge}>
                  <Text style={styles.animeBadgeText}>🎌  ANIME</Text>
                </View>
                <Text style={styles.heroTitle} numberOfLines={2}>{hero.title || hero.name}</Text>
                <View style={styles.heroActions}>
                  <TouchableOpacity
                    style={styles.playBtn}
                    onPress={() => navigation.navigate('Player', {
                      tmdbId: String(hero.id || hero.tmdbId),
                      type: 'tv', season: 1, episode: 1,
                    })}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="play" size={16} color="black" />
                    <Text style={styles.playBtnText}>Watch Now</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.infoBtn}
                    onPress={() => navigateToDetails(hero)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="information-circle-outline" size={18} color="white" />
                    <Text style={styles.infoBtnText}>Details</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        )}

        {/* Type Filters */}
        <View style={{ marginTop: 20 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
            {ANIME_TYPES.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[styles.pill, activeType === t.id && styles.pillActive]}
                onPress={() => setActiveType(t.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pillText, activeType === t.id && styles.pillTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Text style={styles.sectionTitle}>Popular Anime</Text>
        <FlatList
          data={filtered.slice(1)}
          numColumns={2}
          keyExtractor={(item, i) => `anime-${item.id || i}`}
          scrollEnabled={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 12 }}
          renderItem={({ item }) => (
            <View style={{ width: (width - 48) / 2 }}>
              <MovieCard item={item} onPress={() => navigateToDetails(item)} />
            </View>
          )}
        />
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  heroContainer: { width, height: height * 0.48 },
  heroImage: { width: '100%', height: '100%', position: 'absolute' },
  heroGrad: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: 24 },
  animeBadge: { backgroundColor: 'rgba(229,9,20,0.2)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(229,9,20,0.5)' },
  animeBadgeText: { color: '#e50914', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  heroTitle: { color: 'white', fontSize: 34, fontWeight: '900', letterSpacing: -0.5, marginBottom: 16 },
  heroActions: { flexDirection: 'row', gap: 12 },
  playBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e50914', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 30 },
  playBtnText: { color: 'white', fontSize: 14, fontWeight: '900' },
  infoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  infoBtnText: { color: 'white', fontSize: 14, fontWeight: '700' },
  pillsRow: { paddingHorizontal: 16, gap: 10 },
  pill: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, backgroundColor: '#27272a' },
  pillActive: { backgroundColor: '#e50914' },
  pillText: { color: '#a1a1aa', fontSize: 13, fontWeight: '700' },
  pillTextActive: { color: 'white' },
  sectionTitle: { color: 'white', fontSize: 22, fontWeight: '900', marginLeft: 20, marginTop: 20, marginBottom: 14, letterSpacing: -0.3 },
});
