import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';


export default function PlayerScreen({ route }) {
  const {
    tmdbId,
    type = 'movie',
    season: initSeason,
    episode: initEp,
    title = 'Now Playing',
    provider = 'cinesrc',
  } = route.params || {};
  const navigation = useNavigation();
  const webviewRef = useRef(null);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const numericId = String(tmdbId ?? '').replace(/\D/g, '');

  const buildUrl = () => {
    if (provider === 'videm') {
      let url = `https://videm.xyz/embed/${type}/${numericId}?autoplay=true`;
      if (type === 'tv') {
        url += `&s=${initSeason || 1}&e=${initEp || 1}`;
      }
      return url;
    }

    let url = `https://cinesrc.st/embed/${type}/${numericId}?color=%23e50914&autoplay=true&controls=true&back=close`;
    if (type === 'tv') {
      url += `&s=${initSeason || 1}&e=${initEp || 1}&autonext=true&autoskip=false`;
    }
    return url;
  };

  const embedUrl = buildUrl();


  const handleMessage = (event) => {
    try {
      const raw = event.nativeEvent.data;
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;

      if (!data || !data.type) return;

      if (data.type === 'cinesrc:close') {
        navigation.goBack();
      }
    } catch (_) {
      // ignore non-CineSrc/invalid payloads
    }
  };

  const handleShouldStartLoad = ({ url, isTopFrame }) => {
    if (!isTopFrame) return true;
    if (!url) return false;
    return true;
  };

  const retryEmbed = () => {
    setHasLoadError(false);
    setReloadKey((value) => value + 1);
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      {!hasLoadError && (
        <>
          <View style={styles.topGradient} />
          <WebView
            ref={webviewRef}
            key={`${type}-${numericId}-${initSeason || 1}-${initEp || 1}-${reloadKey}`}
            source={{ uri: embedUrl }}
            style={styles.webview}
            allowsInlineMediaPlayback
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
            bounces={false}
            setSupportMultipleWindows={false}
            onShouldStartLoadWithRequest={handleShouldStartLoad}
            onMessage={handleMessage}
            renderLoading={() => null}
            onError={() => setHasLoadError(true)}
            onHttpError={() => setHasLoadError(true)}
          />
        </>
      )}

      {hasLoadError && (
        <View style={styles.fallbackOverlay}>
          <View style={styles.fallbackCard}>
            <Text style={styles.fallbackTitle}>Stream unavailable</Text>
            <Text style={styles.fallbackSubtitle}>The CineSrc embed is being interrupted by a redirect or ad layer. Try again.</Text>
            <View style={styles.fallbackActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
                <Text style={styles.secondaryText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={retryEmbed}>
                <Text style={styles.primaryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <SafeAreaView style={styles.backButtonWrap} edges={['top']} pointerEvents="box-none">
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.28)',
    zIndex: 2,
  },
  backButtonWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    pointerEvents: 'box-none',
  },
  backButton: {
    marginTop: 14,
    marginLeft: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fallbackCard: {
    width: '82%',
    maxWidth: 360,
    backgroundColor: '#111827',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 22,
  },
  fallbackTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  fallbackSubtitle: {
    color: '#d4d4d8',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  fallbackActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#e50914',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '800',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#fff',
    fontWeight: '700',
  },
});
