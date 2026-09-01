import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { movieService } from '../api/movieService';
import SearchSkeletonLoader from '../components/SearchSkeletonLoader';

const quickTags = ['Action', 'Comedy', 'Drama', 'Sci‑Fi', 'Thriller', 'Romance'];

const buildPosterUrl = (value) => {
  if (!value || typeof value !== 'string') {
    return 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80';
  }

  if (value.startsWith('http')) return value;
  if (value.startsWith('/')) return `https://image.tmdb.org/t/p/w500${value}`;
  return value;
};

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const listAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length > 2) {
        setLoading(true);
        movieService
          .searchMovies(query)
          .then((data) => {
            const movies = data && data.movies ? data.movies : [];
            setResults(movies);
            listAnim.setValue(0);
            Animated.timing(listAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }).start();
            setLoading(false);
          })
          .catch((err) => {
            console.error(err);
            setResults([]);
            setLoading(false);
          });
      } else {
        setResults([]);
      }
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [query, listAnim]);

  const openMovieDetails = (item) => {
    const movieId = item?.id ?? item?.tmdbId ?? item?.movieId ?? item?.movie_id ?? null;
    if (!movieId) return;

    navigation.navigate('MovieDetails', {
      movieId,
      platform: item?.source || item?.platform || item?.sourceName || 'netflix',
    });
  };

  const clearSearch = () => setQuery('');

  const renderItem = ({ item }) => (
    <Animated.View
      style={{
        opacity: listAnim,
        transform: [{ translateY: listAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
      }}
    >
      <TouchableOpacity style={styles.resultItem} activeOpacity={0.9} onPress={() => openMovieDetails(item)}>
        <View style={styles.posterWrap}>
          <Image
            source={{ uri: buildPosterUrl(item.poster || item.poster_path || item.posterUrl || item.posterPath) }}
            style={styles.poster}
            resizeMode="cover"
          />
          <View style={styles.posterGlow} />
        </View>

        <View style={styles.resultInfo}>
          <Text style={styles.resultTitle}>{item.title || item.name}</Text>

          <View style={styles.metaRow}>
            {item.release_date ? <Text style={styles.resultYear}>{item.release_date.substring(0, 4)}</Text> : null}
            {item.releaseYear ? <Text style={styles.resultYear}>{item.releaseYear}</Text> : null}
            {item.imdbRating ? <Text style={styles.resultRating}>★ {item.imdbRating}</Text> : null}
          </View>

          {item.overview ? <Text style={styles.resultOverview} numberOfLines={2}>{item.overview}</Text> : null}

          <View style={styles.platformBadge}>
            <Text style={styles.platformText}>{item.sourceName || item.platform || item.source || 'Netflix'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.headerTitle}>Search</Text>
        <Text style={styles.subtitle}>Find your next obsession.</Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#a1a1aa" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Movies, shows, actors, genres..."
            placeholderTextColor="#71717a"
            value={query}
            onChangeText={setQuery}
            autoFocus={false}
            selectionColor="#e50914"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton} activeOpacity={0.8}>
              <Ionicons name="close-circle" size={18} color="#d4d4d8" />
            </TouchableOpacity>
          )}
        </View>

        {query.trim().length <= 2 && !loading && (
          <View style={styles.tagSection}>
            <Text style={styles.sectionLabel}>Popular searches</Text>
            <View style={styles.tagsWrap}>
              {quickTags.map((tag) => (
                <TouchableOpacity key={tag} style={styles.tagPill} activeOpacity={0.8} onPress={() => setQuery(tag)}>
                  <Text style={styles.tagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {loading ? (
          <SearchSkeletonLoader />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
            ListEmptyComponent={() => (
              query.trim().length > 2 && !loading ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="film-outline" size={42} color="#5b5b66" />
                  <Text style={styles.noResults}>No matches for “{query}”</Text>
                  <Text style={styles.emptyHint}>Try another title, actor, or genre.</Text>
                </View>
              ) : null
            )}
            renderItem={renderItem}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f5f7',
    paddingTop: 56,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    color: '#111827',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 4,
  },
  subtitle: {
    color: '#667085',
    fontSize: 15,
    marginBottom: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.07)',
    paddingHorizontal: 14,
    marginBottom: 18,
    height: 58,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  searchIcon: { marginRight: 10 },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f2f4f7',
  },
  searchInput: {
    flex: 1,
    color: '#111827',
    fontSize: 17,
    fontWeight: '500',
  },
  tagSection: { marginBottom: 18 },
  sectionLabel: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagPill: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 10,
  },
  tagText: {
    color: '#1f2937',
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: { paddingBottom: 140 },
  resultItem: {
    flexDirection: 'row',
    marginBottom: 14,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 6,
  },
  posterWrap: {
    width: 104,
    height: 148,
    backgroundColor: '#edf0f4',
  },
  poster: {
    width: '100%',
    height: '100%',
    backgroundColor: '#edf0f4',
  },
  posterGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '35%',
    backgroundColor: 'rgba(17,24,39,0.08)',
  },
  resultInfo: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  resultTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  resultYear: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 10,
  },
  resultRating: {
    color: '#3f3f46',
    fontSize: 12,
    fontWeight: '800',
  },
  resultOverview: { color: '#667085', fontSize: 12.5, lineHeight: 18, marginBottom: 10 },
  platformBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  platformText: {
    color: '#111827',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
  },
  noResults: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyHint: {
    color: '#667085',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
