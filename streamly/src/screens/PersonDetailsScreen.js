import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, ScrollView, TouchableOpacity, Animated, Dimensions, StatusBar } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { movieService } from '../api/movieService';
import MovieCard from '../components/MovieCard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PersonDetailsScreen({ route, navigation }) {
  const { personId } = route.params;
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    movieService.getPersonDetails(personId)
      .then(data => {
        setDetails(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [personId]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#e50914" />
      </View>
    );
  }

  if (!details) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{color: 'white'}}>Error loading actor profile.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Blurred Backdrop */}
      <Animated.Image 
        source={{ uri: details.profile_path || 'https://via.placeholder.com/300/27272a/ffffff?text=No+Photo' }} 
        style={[styles.backdrop, {
          transform: [{
            translateY: scrollY.interpolate({
              inputRange: [-SCREEN_HEIGHT, 0, SCREEN_HEIGHT],
              outputRange: [-SCREEN_HEIGHT / 2, 0, SCREEN_HEIGHT * 0.5],
              extrapolate: 'clamp'
            })
          }],
          opacity: scrollY.interpolate({
            inputRange: [0, SCREEN_HEIGHT / 3],
            outputRange: [0.6, 0.1],
            extrapolate: 'clamp'
          })
        }]} 
      />
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType="dark"
        blurAmount={25}
        reducedTransparencyFallbackColor="#09090b"
      />

      <Animated.ScrollView 
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <Image 
            source={{ uri: details.profile_path || 'https://via.placeholder.com/300/27272a/ffffff?text=No+Photo' }} 
            style={styles.profileImage} 
          />
          <Text style={styles.name}>{details.name}</Text>
          <Text style={styles.knownFor}>{details.known_for_department}</Text>
          {details.birthday && (
            <Text style={styles.metaText}>{details.birthday}</Text>
          )}
        </View>
        
        <View style={styles.content}>
          {details.biography ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Biography</Text>
              <Text style={styles.biography}>{details.biography}</Text>
            </View>
          ) : null}

          {details.movie_credits && details.movie_credits.cast && details.movie_credits.cast.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Known For</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 24, paddingRight: 8 }}>
                {details.movie_credits.cast.slice(0, 20).map(movie => {
                  const normalizedMovie = {
                    ...movie,
                    posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null
                  };
                  return (
                    <View key={movie.id} style={{ width: 140, marginRight: 16 }}>
                      <MovieCard 
                        item={normalizedMovie}
                        onPress={() => navigation.push('MovieDetails', { movieId: movie.id, platform: 'netflix' })}
                      />
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  center: { justifyContent: 'center', alignItems: 'center' },
  backdrop: { width: '100%', height: SCREEN_HEIGHT, position: 'absolute', top: 0, resizeMode: 'cover' },
  scrollContent: { paddingTop: 100, paddingBottom: 60 },
  profileHeader: { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 40 },
  profileImage: { width: 160, height: 240, borderRadius: 24, backgroundColor: '#27272a', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 15 },
  name: { color: 'white', fontSize: 32, fontWeight: '900', marginBottom: 8, letterSpacing: -0.5, textAlign: 'center' },
  knownFor: { color: '#e50914', fontSize: 16, fontWeight: '800', marginBottom: 8, letterSpacing: 0.5 },
  metaText: { color: '#a1a1aa', fontSize: 15, fontWeight: '600' },
  content: { backgroundColor: '#09090b', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 32, minHeight: SCREEN_HEIGHT * 0.5 },
  section: { marginBottom: 32 },
  sectionTitle: { color: 'white', fontSize: 22, fontWeight: '900', marginBottom: 16, paddingHorizontal: 24, letterSpacing: -0.5 },
  biography: { color: '#e4e4e7', fontSize: 16, lineHeight: 26, paddingHorizontal: 24, opacity: 0.9 }
});
