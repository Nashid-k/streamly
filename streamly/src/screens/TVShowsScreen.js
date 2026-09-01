import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Image, Animated, StatusBar, Dimensions, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { movieService } from '../api/movieService';
import MovieCard from '../components/MovieCard';
import SkeletonLoader from '../components/SkeletonLoader';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const TV_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'drama', label: 'Drama' },
  { id: 'action', label: 'Action' },
  { id: 'comedy', label: 'Comedy' },
  { id: 'thriller', label: 'Thriller' },
  { id: 'scifi', label: 'Sci-Fi' },
  { id: 'crime', label: 'Crime' },
];

export default function TVShowsScreen() {
  const navigation = useNavigation();
  const [shows, setShows] = useState([]);
  const [hero, setHero] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setLoading(true);
    movieService.searchMovies('tv show series')
      .then(data => {
        const list = data?.movies || data || [];
        const tvOnly = list.filter(m => m.type === 'tv' || m.number_of_seasons || m.seasons);
        const displayList = tvOnly.length > 0 ? tvOnly : list;
        setHero(displayList[0] || null);
        setShows(displayList);
        setLoading(false);
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = activeCategory === 'all'
    ? shows
    : shows.filter(m => m.genres?.some(g => g.toLowerCase().includes(activeCategory)));

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
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)', '#09090b']}
                style={styles.heroGrad}
                locations={[0.2, 0.65, 1]}
              >
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>📺  TV SHOWS</Text>
                </View>
                <Text style={styles.heroTitle} numberOfLines={2}>{hero.title || hero.name}</Text>
                <TouchableOpacity
                  style={styles.heroBtn}
                  onPress={() => navigation.navigate('Player', {
                    tmdbId: String(hero.id || hero.tmdbId),
                    type: 'tv', season: 1, episode: 1,
                  })}
                  activeOpacity={0.85}
                >
                  <Ionicons name="play" size={16} color="black" />
                  <Text style={styles.heroBtnText}>Watch S1E1</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        )}

        {/* Category Pills */}
        <View style={styles.pillsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
            {TV_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.pill, activeCategory === cat.id && styles.pillActive]}
                onPress={() => setActiveCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pillText, activeCategory === cat.id && styles.pillTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Grid */}
        <Text style={styles.sectionTitle}>
          {activeCategory === 'all' ? 'All Shows' : TV_CATEGORIES.find(c => c.id === activeCategory)?.label}
        </Text>
        <FlatList
          data={filtered.slice(1)}
          numColumns={2}
          keyExtractor={(item, i) => `${item.id || i}`}
          scrollEnabled={false}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 }}
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
  heroContainer: { width, height: height * 0.45 },
  heroImage: { width: '100%', height: '100%', position: 'absolute' },
  heroGrad: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: 20 },
  heroBadge: { backgroundColor: 'rgba(229,9,20,0.2)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(229,9,20,0.4)' },
  heroBadgeText: { color: '#e50914', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { color: 'white', fontSize: 32, fontWeight: '900', letterSpacing: -0.5, marginBottom: 14 },
  heroBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'white', alignSelf: 'flex-start', paddingVertical: 11, paddingHorizontal: 24, borderRadius: 30 },
  heroBtnText: { color: 'black', fontSize: 14, fontWeight: '900' },
  pillsWrapper: { marginTop: 20, marginBottom: 4 },
  pillsRow: { paddingHorizontal: 16, gap: 10 },
  pill: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, backgroundColor: '#27272a' },
  pillActive: { backgroundColor: '#e50914' },
  pillText: { color: '#a1a1aa', fontSize: 13, fontWeight: '700' },
  pillTextActive: { color: 'white' },
  sectionTitle: { color: 'white', fontSize: 22, fontWeight: '900', marginLeft: 20, marginTop: 20, marginBottom: 14, letterSpacing: -0.3 },
  gridContent: { paddingBottom: 20 },
});
