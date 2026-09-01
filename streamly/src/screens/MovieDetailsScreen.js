import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { movieService } from '../api/movieService';
import DetailsSkeletonLoader from '../components/DetailsSkeletonLoader';

const { height } = Dimensions.get('window');
const BACKDROP_HEIGHT = height * 0.56;

export default function MovieDetailsScreen({ route, navigation }) {
  const routeParams = route?.params || {};
  const movieId = routeParams.movieId ?? routeParams.id ?? routeParams.tmdbId ?? null;
  const platform = routeParams.platform || 'netflix';

  const [details, setDetails] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodesLoading, setEpisodesLoading] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(32)).current;

  const loadDetails = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setRefreshing(isRefresh);

    try {
      const [movieData, similarData] = await Promise.all([
        movieService.getMovieDetails(movieId, platform),
        movieService.getSimilarMovies(movieId, platform).catch(() => []),
      ]);

      setDetails(movieData);

      const simList = similarData?.movies || similarData || [];
      setSimilar(Array.isArray(simList) ? simList : []);

      const isTV = !!(movieData?.isSeries || String(movieData?.id).includes('-tv-'));
      if (isTV) {
        try {
          const eps = await movieService.getSeasonEpisodes(movieId, 1, platform);
          setEpisodes(eps?.episodes || eps || []);
        } catch (error) {
          console.log('Episodes error', error);
        }
      }

      checkWatchlist(movieData);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 42, friction: 8, useNativeDriver: true }),
      ]).start();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!movieId) {
      setLoading(false);
      setDetails(null);
      return;
    }

    loadDetails(false);
  }, [movieId, platform]);

  const fetchSeasonEpisodes = async (seasonNum) => {
    setEpisodesLoading(true);
    try {
      const eps = await movieService.getSeasonEpisodes(movieId, seasonNum, platform);
      setEpisodes(eps?.episodes || eps || []);
    } catch (error) {
      console.error(error);
    } finally {
      setEpisodesLoading(false);
    }
  };

  const handleSeasonChange = (seasonNum) => {
    setSelectedSeason(seasonNum);
    fetchSeasonEpisodes(seasonNum);
  };

  const checkWatchlist = async (movieData) => {
    try {
      const stored = await AsyncStorage.getItem('@watchlist');
      if (!stored) return;

      const list = JSON.parse(stored);
      setInWatchlist(list.some((m) => String(m.id) === String(movieData?.id) || String(m.tmdbId) === String(movieData?.id)));
    } catch (error) {
      console.error(error);
    }
  };

  const toggleWatchlist = async () => {
    try {
      const stored = await AsyncStorage.getItem('@watchlist');
      let list = stored ? JSON.parse(stored) : [];

      if (inWatchlist) {
        list = list.filter((m) => String(m.id) !== String(movieId));
        setInWatchlist(false);
        Toast.show({ type: 'info', text1: 'Removed from Watchlist' });
      } else {
        list.push({
          id: details.id || details.tmdbId,
          title: details.title || details.name,
          poster_path: details.posterUrl || details.poster_path || details.poster,
          source: platform,
        });
        setInWatchlist(true);
        Toast.show({ type: 'success', text1: 'Added to Watchlist ✓' });
      }

      await AsyncStorage.setItem('@watchlist', JSON.stringify(list));
    } catch (error) {
      console.error(error);
    }
  };

  const handlePlay = async (s, e) => {
    if (!details && !movieId) return;
    const isSeries = !!(details?.isSeries || String(details?.id).includes('-tv-'));
    const resolvedMovieId = details?.id || details?.tmdbId || movieId;

    if (!resolvedMovieId) return;

    try {
      const stored = await AsyncStorage.getItem('@history');
      let history = stored ? JSON.parse(stored) : [];
      history = history.filter((m) => String(m.id || m.tmdbId) !== String(resolvedMovieId));
      history.unshift({
        id: resolvedMovieId,
        title: details?.title || details?.name,
        poster_path: details?.posterUrl || details?.poster_path || details?.poster,
        source: platform,
        type: isSeries ? 'tv' : 'movie',
      });

      if (history.length > 50) history = history.slice(0, 50);
      await AsyncStorage.setItem('@history', JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save history', error);
    }

    navigation.navigate('Player', {
      tmdbId: String(resolvedMovieId),
      type: isSeries ? 'tv' : 'movie',
      season: s || 1,
      episode: e || 1,
    });
  };

  if (loading) return <DetailsSkeletonLoader />;

  if (!details) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'white' }}>Error loading details.</Text>
      </View>
    );
  }

  const backdropUri = details.backdropUrl || details.backdrop || details.backdrop_path || details.posterUrl || details.poster_path || '';
  const posterUri = details.posterUrl || details.poster_path || details.poster || '';
  const title = details.title || details.name;
  const year = details.releaseYear || (details.releaseDate ? details.releaseDate.substring(0, 4) : '');
  const runtime = details.duration || (details.runtime ? `${details.runtime} min` : null);
  const description = details.longDescription || details.description || details.overview || '';
  const isSeries = !!(details.isSeries || String(details.id).includes('-tv-'));
  const numSeasons = details.seasonsCount || details.number_of_seasons || details.seasons?.length || (isSeries ? 1 : 0);
  const seasonsArray = Array.from({ length: numSeasons }, (_, i) => i + 1);
  const extraMeta = [
    { label: 'Status', value: details.status || 'Released' },
    { label: 'Language', value: details.original_language || details.language || 'English' },
    { label: 'Rating', value: details.maturityRating || details.certification || 'PG-13' },
    { label: 'Format', value: isSeries ? 'TV Series' : 'Movie' },
  ];

  const backdropTranslate = scrollY.interpolate({
    inputRange: [0, BACKDROP_HEIGHT],
    outputRange: [0, -BACKDROP_HEIGHT / 2],
    extrapolate: 'clamp',
  });

  const backdropOpacity = scrollY.interpolate({
    inputRange: [0, BACKDROP_HEIGHT / 1.5],
    outputRange: [1, 0.2],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <Animated.Image
        source={{ uri: backdropUri }}
        style={[styles.backdrop, { transform: [{ translateY: backdropTranslate }], opacity: backdropOpacity }]}
        resizeMode="cover"
      />

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
        <Ionicons name="chevron-back" size={24} color="white" />
      </TouchableOpacity>

      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeAnim }}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDetails(true)}
            tintColor="#e50914"
            colors={['#e50914', '#ffffff']}
            progressBackgroundColor="#18181b"
          />
        }
      >
        <View style={{ height: BACKDROP_HEIGHT - 52 }} />

        <Animated.View style={[styles.contentCard, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.posterRow}>
            {posterUri ? <Image source={{ uri: posterUri }} style={styles.poster} resizeMode="cover" /> : null}

            <View style={styles.quickMeta}>
              {details.matchScore && <Text style={styles.matchScore}>{details.matchScore}% Match</Text>}
              {details.maturityRating && (
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingBadgeText}>{details.maturityRating}</Text>
                </View>
              )}
              {details.imdbRating && <Text style={styles.imdb}>★ {details.imdbRating}</Text>}
              {year && <Text style={styles.yearText}>{year}</Text>}
              {runtime && <Text style={styles.yearText}>{runtime}</Text>}
              {isSeries && <Text style={styles.seriesTag}>Series</Text>}
            </View>
          </View>

          <Text style={styles.title}>{title}</Text>
          {details.tagline ? <Text style={styles.tagline}>“{details.tagline}”</Text> : null}

          {details.genres?.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreRow}>
              {details.genres.map((g, i) => (
                <View key={i} style={styles.genreChip}>
                  <Text style={styles.genreText}>{g}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.primaryAction} onPress={() => handlePlay()}>
              <Ionicons name="play" size={18} color="#000" />
              <Text style={styles.primaryActionText}>Play</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryAction} onPress={toggleWatchlist}>
              <Ionicons name={inWatchlist ? 'bookmark' : 'bookmark-outline'} size={18} color="#fff" />
              <Text style={styles.secondaryActionText}>{inWatchlist ? 'Saved' : 'Save'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionHeader}>Overview</Text>
          <Text style={styles.description}>{description}</Text>

          <View style={styles.metaGrid}>
            {extraMeta.map((item) => (
              <View key={item.label} style={styles.metaCard}>
                <Text style={styles.metaLabel}>{item.label}</Text>
                <Text style={styles.metaValue}>{item.value}</Text>
              </View>
            ))}
          </View>

          {isSeries && seasonsArray.length > 1 && (
            <View style={styles.seasonWrap}>
              <Text style={styles.sectionHeader}>Seasons</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seasonRow}>
                {seasonsArray.map((season) => (
                  <TouchableOpacity
                    key={season}
                    style={[styles.seasonChip, selectedSeason === season && styles.seasonChipActive]}
                    onPress={() => handleSeasonChange(season)}
                  >
                    <Text style={[styles.seasonChipText, selectedSeason === season && styles.seasonChipTextActive]}>S{season}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {episodesLoading ? (
                <Text style={styles.loadingText}>Loading episodes...</Text>
              ) : episodes.length > 0 ? (
                <View style={styles.episodeList}>
                  {episodes.slice(0, 4).map((episode, idx) => (
                    <TouchableOpacity
                      key={episode.id || idx}
                      style={styles.episodeCard}
                      onPress={() => handlePlay(selectedSeason, episode.episode_number || idx + 1)}
                    >
                      <Text style={styles.episodeNumber}>E{episode.episode_number || idx + 1}</Text>
                      <View style={styles.episodeMeta}>
                        <Text style={styles.episodeTitle}>{episode.name || `Episode ${episode.episode_number || idx + 1}`}</Text>
                        <Text style={styles.episodeSummary}>{episode.overview || 'Continue the story.'}</Text>
                      </View>
                      <Ionicons name="play-circle" size={20} color="#fff" />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>
          )}

          {similar.length > 0 && (
            <View style={styles.similarWrap}>
              <Text style={styles.sectionHeader}>More like this</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={similar.slice(0, 8)}
                keyExtractor={(item, index) => `${item.id || item.tmdbId || index}-similar`}
                contentContainerStyle={styles.similarList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.similarCard}
                    onPress={() => navigation.navigate('MovieDetails', { movieId: item.id || item.tmdbId, platform: item.platform || platform })}
                  >
                    <Image source={{ uri: item.posterUrl || item.poster_path || item.poster || '' }} style={styles.similarPoster} resizeMode="cover" />
                    <Text style={styles.similarTitle} numberOfLines={1}>{item.title || item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: BACKDROP_HEIGHT,
    backgroundColor: '#dfe3ea',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    top: 54,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15,15,18,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  scrollContent: { paddingBottom: 90 },
  contentCard: {
    marginTop: 180,
    backgroundColor: '#f7f7f8',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 28,
    minHeight: height,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
  },
  posterRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
  poster: {
    width: 116,
    height: 166,
    borderRadius: 22,
    backgroundColor: '#e5e7eb',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
  },
  quickMeta: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'flex-end',
  },
  matchScore: { color: '#167b54', fontWeight: '800', fontSize: 12, marginBottom: 6 },
  ratingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(17,24,39,0.06)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
    marginBottom: 6,
  },
  ratingBadgeText: { color: '#374151', fontWeight: '800', fontSize: 10 },
  imdb: { color: '#5b4a2d', fontWeight: '800', fontSize: 12, marginBottom: 4 },
  yearText: { color: '#4b5563', fontWeight: '700', fontSize: 12, marginBottom: 4 },
  seriesTag: {
    alignSelf: 'flex-start',
    color: '#111827',
    backgroundColor: '#edf0f3',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 10,
    fontWeight: '800',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
  },
  title: { color: '#111827', fontSize: 32, fontWeight: '900', letterSpacing: -0.9, marginBottom: 6 },
  tagline: { color: '#526071', fontSize: 14, fontStyle: 'italic', marginBottom: 12 },
  genreRow: { marginBottom: 18 },
  genreChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  genreText: { color: '#1f2937', fontSize: 12, fontWeight: '700' },
  actionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 22,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
  },
  primaryActionText: { color: '#ffffff', fontSize: 15, fontWeight: '900', marginLeft: 8 },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  secondaryActionText: { color: '#111827', fontSize: 14, fontWeight: '700', marginLeft: 8 },
  sectionHeader: { color: '#111827', fontSize: 20, fontWeight: '900', marginBottom: 10 },
  description: { color: '#4b5563', fontSize: 14, lineHeight: 22, marginBottom: 20 },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 22,
  },
  metaCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
    marginRight: '2%',
    marginBottom: 10,
  },
  metaLabel: { color: '#6b7280', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  metaValue: { color: '#111827', fontSize: 13, fontWeight: '700' },
  seasonWrap: { marginTop: 6 },
  seasonRow: { marginBottom: 12 },
  seasonChip: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
    marginRight: 10,
  },
  seasonChipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  seasonChipText: { color: '#374151', fontWeight: '800', fontSize: 12 },
  seasonChipTextActive: { color: '#fff' },
  loadingText: { color: '#6b7280', fontSize: 13, marginBottom: 10 },
  episodeList: { marginTop: 8 },
  episodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.05)',
    padding: 12,
    marginBottom: 10,
  },
  episodeNumber: { width: 44, color: '#111827', fontWeight: '800', fontSize: 13 },
  episodeMeta: { flex: 1, paddingRight: 10 },
  episodeTitle: { color: '#111827', fontWeight: '800', fontSize: 14, marginBottom: 4 },
  episodeSummary: { color: '#667085', fontSize: 11, lineHeight: 18 },
  similarWrap: { marginTop: 20 },
  similarList: { paddingRight: 12 },
  similarCard: { width: 110, marginRight: 12 },
  similarPoster: { width: '100%', height: 150, borderRadius: 16, backgroundColor: '#e5e7eb' },
  similarTitle: { color: '#111827', fontSize: 12, fontWeight: '700', marginTop: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
});
