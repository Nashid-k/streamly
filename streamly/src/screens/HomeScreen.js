import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  StatusBar,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { movieService } from '../api/movieService';
import LinearGradient from 'react-native-linear-gradient';
import SkeletonLoader from '../components/SkeletonLoader';
import MovieCard from '../components/MovieCard';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

const RAIL_NAMES = {
  netflix: 'Netflix Originals',
  prime: 'Prime Video',
  hotstar: 'Disney+ Hotstar',
  appletv: 'Apple TV+',
  trending: 'Trending Now',
  new: 'New Releases',
  popular: 'Popular Picks',
  top: 'Top Rated',
  action: 'Action & Adventure',
  drama: 'Drama',
  comedy: 'Comedy',
};

const SECTION_HEADER_STYLES = {
  backgroundColor: 'rgba(229, 9, 20, 0.08)',
  borderRadius: 12,
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderWidth: 1,
  borderColor: 'rgba(229, 9, 20, 0.22)',
};

function MovieRail({ title, data, navigation, onSeeAll }) {
  if (!data || data.length === 0) return null;

  const openMovie = (item) => {
    const movieId = item?.id ?? item?.tmdbId ?? item?.movieId ?? item?.movie_id ?? null;
    if (!movieId) return;

    navigation.navigate('MovieDetails', {
      movieId,
      platform: item?.platform || item?.source || item?.sourceName || 'netflix',
    });
  };

  return (
    <View style={styles.railContainer}>
      <View style={styles.railHeader}>
        <View style={styles.railTitleWrap}>
          <View style={styles.railAccent} />
          <Text style={styles.railTitle}>{title}</Text>
        </View>
        <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={data}
        keyExtractor={(item, i) => `${item?.id || item?.tmdbId || i}-${title}`}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 6 }}
        renderItem={({ item }) => (
          <View style={{ width: 108, marginRight: 10 }}>
            <MovieCard item={item} onPress={() => openMovie(item)} />
          </View>
        )}
      />
    </View>
  );
}

export default function HomeScreen() {
  const [heroMovie, setHeroMovie] = useState(null);
  const [rails, setRails] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  const loadContinueWatching = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('@history');
      if (!stored) {
        setContinueWatching([]);
        return;
      }

      const history = JSON.parse(stored);
      const items = history.slice(0, 6).map((item) => ({
        ...item,
        posterUrl: item.poster_path
          ? item.poster_path.startsWith('http')
            ? item.poster_path
            : `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : item.poster || '',
      }));

      setContinueWatching(items);
    } catch (err) {
      console.error(err);
      setContinueWatching([]);
    }
  }, []);

  const loadFeaturedMovies = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setRefreshing(isRefresh);

    try {
      const data = await movieService.getFeaturedMovies();
      let allMovies = [];
      let builtRails = [];

      if (Array.isArray(data)) {
        allMovies = data;
      } else if (data && typeof data === 'object') {
        const keys = Object.keys(data);
        keys.forEach((key) => {
          const arr = data[key];
          if (Array.isArray(arr) && arr.length > 0) {
            if (allMovies.length === 0) allMovies = arr;
            builtRails.push({
              title: RAIL_NAMES[key] || key.charAt(0).toUpperCase() + key.slice(1),
              data: arr,
            });
          }
        });
      }

      if (builtRails.length === 0 && allMovies.length > 0) {
        const chunks = [
          { title: 'Trending Now', data: allMovies.slice(1, 11) },
          { title: 'New Releases', data: allMovies.slice(11, 21) },
          { title: 'Popular Picks', data: allMovies.slice(21, 31) },
          { title: 'Discover More', data: allMovies.slice(31, 51) },
        ].filter((r) => r.data.length > 0);
        builtRails = chunks;
      }

      setHeroMovie(allMovies[0] || (builtRails[0]?.data[0]) || null);
      setRails(builtRails);
      await loadContinueWatching();

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fadeAnim]);

  useEffect(() => {
    loadFeaturedMovies(false);
  }, [loadFeaturedMovies]);

  const quickActions = [
    { label: 'Trending', icon: 'flame', route: 'Discover' },
    { label: 'Search', icon: 'search', route: 'Search' },
    { label: 'History', icon: 'time', route: 'History' },
    { label: 'My List', icon: 'bookmark', route: 'Watchlist' },
  ];

  const renderQuickActions = () => (
    <View style={styles.quickActionsWrap}>
      {quickActions.map((action) => (
        <TouchableOpacity
          key={action.label}
          activeOpacity={0.9}
          style={styles.quickActionButton}
          onPress={() => navigation.navigate(action.route)}
        >
          <View style={styles.quickActionIconWrap}>
            <Ionicons name={action.icon} size={16} color="#111827" />
          </View>
          <Text style={styles.quickActionText}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContinueWatching = () => {
    if (!continueWatching.length) return null;

    return (
      <View style={styles.continueContainer}>
        <View style={styles.railHeader}>
          <View style={styles.railTitleWrap}>
            <View style={styles.railAccent} />
            <Text style={styles.railTitle}>Continue Watching</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('History')} activeOpacity={0.7}>
            <Text style={styles.seeAll}>View all</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={continueWatching}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}
          keyExtractor={(item, index) => `${item.id || item.tmdbId || index}-continue`}
          renderItem={({ item }) => {
            const movieId = item?.id ?? item?.tmdbId ?? null;
            if (!movieId) return null;

            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('MovieDetails', { movieId, platform: item.source || 'netflix' })}
                style={styles.continueCard}
              >
                <Image source={{ uri: item.posterUrl }} style={styles.continuePoster} resizeMode="cover" />
                <View style={styles.continueOverlay}>
                  <Ionicons name="play-circle" size={26} color="white" />
                </View>
                <View style={styles.continueMeta}>
                  <Text style={styles.continueTitle} numberOfLines={1}>{item.title || item.name}</Text>
                  <Text style={styles.continueType}>{item.type === 'tv' ? 'Series' : 'Movie'}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  };

  const heroScale = scrollY.interpolate({
    inputRange: [0, 160],
    outputRange: [1, 1.08],
    extrapolate: 'clamp',
  });

  const heroOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const openMovieDetails = useCallback((movie) => {
    if (!movie) return;
    const movieId = movie.id || movie.tmdbId || movie.movieId || movie.movie_id;
    if (!movieId) return;

    navigation.navigate('MovieDetails', {
      movieId,
      platform: movie.platform || movie.source || movie.sourceName || 'netflix',
    });
  }, [navigation]);

  const handleHeroPress = useCallback(() => {
    if (!heroMovie) return;
    openMovieDetails(heroMovie);
  }, [heroMovie, openMovieDetails]);

  const handleHeroPlay = useCallback(() => {
    if (!heroMovie) return;
    const tmdbId = String(heroMovie.id || heroMovie.tmdbId);
    navigation.navigate('Player', {
      tmdbId,
      type: 'movie',
    });
  }, [heroMovie, navigation]);

  if (loading && !refreshing) return <SkeletonLoader />;

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadFeaturedMovies(true)}
            tintColor="#111827"
            colors={['#111827', '#dfe3ea']}
            progressBackgroundColor="#f3f4f6"
          />
        }
      >
        {heroMovie && (
          <TouchableOpacity activeOpacity={0.95} onPress={handleHeroPress}>
            <Animated.View style={[styles.heroContainer, { transform: [{ scale: heroScale }], opacity: heroOpacity }]}>

              <Image
                source={{ uri: heroMovie.backdropUrl || heroMovie.posterUrl || heroMovie.poster_path || heroMovie.poster || '' }}
                style={styles.heroImage}
                resizeMode="cover"
              />
              <View style={styles.topHeader}>
                <View style={styles.logoPill}>
                  <Text style={styles.logoText}>STREAMLY</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Search')}
                    style={styles.bellIcon}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="search" size={20} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('History')}
                    style={styles.bellIcon}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="time-outline" size={20} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Notifications')}
                    style={styles.bellIcon}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="notifications-outline" size={20} color="white" />
                    <View style={styles.badge} />
                  </TouchableOpacity>
                </View>
              </View>

              <LinearGradient
                colors={['rgba(17,17,19,0.08)', 'rgba(17,17,19,0.28)', 'rgba(17,17,19,0.82)', '#f5f5f7']}
                style={styles.heroGradient}
                locations={[0, 0.38, 0.7, 1]}
              >
                <View style={styles.heroBadgeRow}>
                  {heroMovie.platform && (
                    <View style={styles.platformBadge}>
                      <Text style={styles.platformBadgeText}>{(heroMovie.platform || '').toUpperCase()}</Text>
                    </View>
                  )}
                  <Text style={styles.heroBadgeText}>FEATURED</Text>
                </View>
                <Text style={styles.heroTitle} numberOfLines={2}>
                  {heroMovie.title || heroMovie.name}
                </Text>
                <View style={styles.heroMeta}>
                  {heroMovie.releaseYear && <Text style={styles.heroMetaText}>{heroMovie.releaseYear}</Text>}
                  {heroMovie.imdbRating && (
                    <>
                      <Text style={styles.heroDot}>•</Text>
                      <Text style={styles.heroMetaText}>⭐ {heroMovie.imdbRating}</Text>
                    </>
                  )}
                </View>
                <View style={styles.heroActions}>
                  <TouchableOpacity style={styles.heroPlayBtn} onPress={handleHeroPlay} activeOpacity={0.85}>
                    <Ionicons name="play" size={18} color="black" />
                    <Text style={styles.heroPlayText}>Play Now</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.heroInfoBtn} onPress={handleHeroPress} activeOpacity={0.85}>
                    <Ionicons name="information-circle-outline" size={20} color="white" />
                    <Text style={styles.heroInfoText}>More Info</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        )}

        {renderQuickActions()}
        {renderContinueWatching()}

        <View style={styles.railsContainer}>
          {rails.map((rail, idx) => (
            <MovieRail
              key={`${rail.title}-${idx}`}
              title={rail.title}
              data={rail.data}
              navigation={navigation}
              onSeeAll={() => navigation.navigate('Discover')}
            />
          ))}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  topHeader: {
    position: 'absolute',
    top: 52,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  logoPill: {
    backgroundColor: 'rgba(17,17,19,0.28)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoText: { color: '#ffffff', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  bellIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(17,17,17,0.34)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  badge: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#ff4d4f',
  },
  heroContainer: { width, height: height * 0.62, position: 'relative' },
  heroImage: { width: '100%', height: '100%', position: 'absolute' },
  heroGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: height * 0.44,
    justifyContent: 'flex-end',
    paddingBottom: 26,
    paddingHorizontal: 20,
  },
  heroBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  platformBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  platformBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  heroBadgeText: { color: '#f0f0f0', fontSize: 11, fontWeight: '700', letterSpacing: 1.4 },
  heroTitle: {
    color: 'white', fontSize: 38, fontWeight: '900',
    letterSpacing: -0.8, marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 6 },
  heroMetaText: { color: '#eaeaea', fontSize: 14, fontWeight: '600' },
  heroDot: { color: '#d6d6d6', fontSize: 14 },
  heroActions: { flexDirection: 'row', gap: 12 },
  heroPlayBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f5f5f7',
    paddingVertical: 13, paddingHorizontal: 26,
    borderRadius: 30,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18, shadowRadius: 12, elevation: 5,
  },
  heroPlayText: { color: '#111111', fontSize: 15, fontWeight: '900' },
  heroInfoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 13, paddingHorizontal: 22,
    borderRadius: 30,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  heroInfoText: { color: 'white', fontSize: 15, fontWeight: '700' },
  quickActionsWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
    paddingVertical: 12,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
  },
  quickActionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#eef1f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionText: { color: '#1f2937', fontSize: 10.5, fontWeight: '700' },
  continueContainer: { marginTop: 18, marginBottom: 8 },
  continueCard: {
    width: 140,
    marginRight: 10,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  continuePoster: { width: '100%', height: 190, backgroundColor: '#e6e7eb' },
  continueOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueMeta: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  continueTitle: { color: '#111111', fontSize: 12.5, fontWeight: '800', marginBottom: 4 },
  continueType: { color: '#6b7280', fontSize: 10.5, fontWeight: '600' },
  railsContainer: { backgroundColor: '#f5f5f7', paddingTop: 4, paddingBottom: 100 },
  railContainer: { marginTop: 20 },
  railHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 12,
  },
  railTitle: { color: '#111111', fontSize: 18, fontWeight: '900', letterSpacing: -0.2 },
  seeAll: { color: '#6b7280', fontSize: 12, fontWeight: '600' },
});
