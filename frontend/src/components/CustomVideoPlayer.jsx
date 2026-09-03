import React, { useEffect, useState, useRef, useCallback } from "react";
import { VideoSourceAdapter } from "../api/videoSourceAdapter";
import { movieService } from "../api/movieService";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  AlertCircle,
  Check,
  RotateCcw,
  RotateCw,
  MonitorPlay,
  Sparkles,
  SkipForward,
  FastForward,
  Rewind,
  Keyboard,
  X,
  Upload,
  Captions,
  Film,
  Link,
  Repeat,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { SubtitleEngine } from "../utils/SubtitleEngine";

const getNumericId = (idString) => {
  if (!idString) return null;
  const match = idString.toString().match(/\d+/);
  return match ? match[0] : null; // Fix C14: return null instead of non-numeric fallback
};

const ASPECT_RATIOS = [
  { name: "Default", style: { transform: "scale(1)" } },
  { name: "Crop to Fit (16:10)", style: { transform: "scale(1.11)" } },
  { name: "Crop to Fit (2.35:1)", style: { transform: "scale(1.33)" } },
  { name: "Stretch to 16:9", style: { transform: "scale(1.33, 1)" } },
  { name: "Force 4:3", style: { transform: "scale(0.75, 1)" } },
  { name: "Force 16:10", style: { transform: "scale(0.9, 1)" } },
];

const KEYBOARD_SHORTCUTS = [
  { key: "Space / K", action: "Play / Pause" },
  { key: "F", action: "Toggle Fullscreen" },
  { key: "M", action: "Toggle Mute" },
  { key: "→ / L / .", action: "Forward 10s" },
  { key: "← / J / ,", action: "Rewind 10s" },
  { key: "↑", action: "Volume Up 10%" },
  { key: "↓", action: "Volume Down 10%" },
  { key: "A", action: "Cycle Aspect Ratio" },
  { key: "Scroll ↑↓", action: "Volume Up / Down" },
  { key: "?", action: "Show Shortcuts" },
];

const LOADING_TIPS = [
  {
    text: "Press 'F' or double-tap the center to toggle fullscreen.",
    icon: Keyboard,
  },
  {
    text: "Use the left and right arrow keys to skip 10 seconds.",
    icon: Keyboard,
  },
  { text: "Press 'M' to quickly mute or unmute the player.", icon: Keyboard },
  {
    text: "Change the streaming server in the bottom right if buffering.",
    icon: Settings,
  },
  {
    text: "Press 'A' to cycle through different aspect ratios.",
    icon: MonitorPlay,
  },
  {
    text: "Swipe or double-tap the sides of the screen to seek.",
    icon: Sparkles,
  },
  {
    text: "You can adjust subtitle sync in the subtitle settings menu.",
    icon: Captions,
  },
];

const CustomVideoPlayer = ({
  movie,
  season,
  episode,
  preferredServerIndex = 0,
  onServerChange,
  hasNextEpisode,
  onNextEpisode,
  thumbnailUrl,
  startTime = 0,
  onProgressUpdate,
}) => {
  const [activeServerIndex, setActiveServerIndex] =
    useState(preferredServerIndex);
  const activeServerIndexRef = useRef(activeServerIndex);
  useEffect(() => {
    activeServerIndexRef.current = activeServerIndex;
  }, [activeServerIndex]);
  const [iframeUrl, setIframeUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [autoSkipIntro, setAutoSkipIntro] = useState(
    () => localStorage.getItem("streamly_autoSkip") === "true",
  );
  const [autoPlayNext, setAutoPlayNext] = useState(
    () => localStorage.getItem("streamly_autoNext") !== "false",
  );
  const [doubleTapRipple, setDoubleTapRipple] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [centerIcon, setCenterIcon] = useState(null);
  const [sideIcon, setSideIcon] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSubtitlesMenu, setShowSubtitlesMenu] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [aspectRatioIndex, setAspectRatioIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState("");
  const [useNativeControls, setUseNativeControls] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [, setSeekAccumulator] = useState(0);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverX, setHoverX] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [skipIntroTime, setSkipIntroTime] = useState(null);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showUpNext, setShowUpNext] = useState(false);
  const [upNextCountdown, setUpNextCountdown] = useState(15);
  const [activeSourceId, setActiveSourceId] = useState("");
  const [, setServerErrorCounts] = useState({});
  const [, setLastServer] = useState(
    () => localStorage.getItem("streamly_lastserver") || "",
  );
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0 });
  const [isLooping, setIsLooping] = useState(false);
  const [brightness, setBrightness] = useState(1);
  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(null);
  const [audioTracks, setAudioTracks] = useState([]);
  const [currentAudioTrack, setCurrentAudioTrack] = useState(null);

  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const clickTimeoutRef = useRef(null);
  const progressBarRef = useRef(null);
  const targetSeekTimeRef = useRef(null);
  const seekAccumulatorRef = useRef(0);
  const seekTimeoutRef = useRef(null);
  const centerIconTimeoutRef = useRef(null);
  const sideIconTimeoutRef = useRef(null);
  const hasTriggeredNextRef = useRef(false);
  const skipIntroTimeoutRef = useRef(null);
  const upNextIntervalRef = useRef(null);
  const upNextShownRef = useRef(false);
  const centerIconKeyRef = useRef(0); // stable key — incremented only when icon triggers, never on re-render
  const subtitleInputRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  // Sync refs for stale closures in message listener
  const isLoopingRef = useRef(isLooping);

  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  const autoPlayNextRef = useRef(autoPlayNext);
  useEffect(() => {
    autoPlayNextRef.current = autoPlayNext;
  }, [autoPlayNext]);

  // Subtitle state
  const subtitleEngineRef = useRef(new SubtitleEngine());
  const [activeSubtitleCue, setActiveSubtitleCue] = useState(null);
  const [hasSubtitles, setHasSubtitles] = useState(false);
  const hasSubtitlesRef = useRef(false);
  useEffect(() => {
    hasSubtitlesRef.current = hasSubtitles;
  }, [hasSubtitles]);

  const [availableSubtitleLangs, setAvailableSubtitleLangs] = useState([]);
  const [isFetchingSubtitles, setIsFetchingSubtitles] = useState(false);
  const [subtitleEnabled, setSubtitleEnabled] = useState(false);
  const [subtitleFileName, setSubtitleFileName] = useState("");

  // Derived TV detection — consistent with TitleDetails isTvContent
  const isTvContent = movie?.isSeries || String(movie?.id || '').startsWith('tmdb-tv-');

  // Reset on episode/season/movie change
  useEffect(() => {
    hasTriggeredNextRef.current = false;
    upNextShownRef.current = false;
    setShowUpNext(false);
    setSkipIntroTime(null);
    setShowSkipIntro(false);
    setUpNextCountdown(15);
  }, [movie?.id, season, episode]);

  // Sync parent server changes to local state
  useEffect(() => {
    setActiveServerIndex(preferredServerIndex);
  }, [preferredServerIndex]);

  // Restore volume preference on mount
  useEffect(() => {
    const savedVol = localStorage.getItem("streamly_volume");
    const savedMuted = localStorage.getItem("streamly_muted");
    if (savedVol !== null) setVolume(parseFloat(savedVol));
    if (savedMuted === "true") setIsMuted(true);
  }, []);

  // Track Fullscreen State
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(
        !!(document.fullscreenElement || document.webkitFullscreenElement),
      );
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        onFullscreenChange,
      );
    };
  }, []);

  // Track the content we are currently playing to differentiate between server/quality switches vs next episode
  const contentSignatureRef = useRef("");

  const [dynamicTips, setDynamicTips] = useState(LOADING_TIPS);

  useEffect(() => {
    if (!isLoading && !hasInitiallyLoaded) {
      setHasInitiallyLoaded(true);
    }
  }, [isLoading, hasInitiallyLoaded]);

  useEffect(() => {
    if (movie?.id) {
      movieService
        .getSimilarMovies(movie.id, movie.platform || "tmdb")
        .then((data) => {
          if (data && data.length > 0) {
            const recommendations = data.slice(0, 4).map((m) => ({
              text: `You might also like: ${m.title || m.name} (${(m.release_date || m.first_air_date || "").substring(0, 4)})`,
              icon: Film,
            }));
            // Fisher-Yates shuffle for uniform random ordering
            const shuffled = [...LOADING_TIPS, ...recommendations];
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            setDynamicTips(shuffled);
          }
        })
        .catch(() => {}); // silently fail if similar movies can't be fetched
    }
  }, [movie]);

  useEffect(() => {
    if (!hasInitiallyLoaded) {
      const interval = setInterval(() => {
        setCurrentTipIndex((prev) => (prev + 1) % dynamicTips.length);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [hasInitiallyLoaded, dynamicTips.length]);

  // Generate URL whenever core dependencies change
  useEffect(() => {
    let watchdogTimer;

    const generateUrl = async () => {
      setIsLoading(true);
      setHasInitiallyLoaded(false);

      let resolvedImdbId =
        movie.imdbId || movie.imdb_id || movie.external_ids?.imdb_id;
      const targetId = getNumericId(movie.id);

      // Fix C12: guard against null/undefined targetId — abort URL generation if no valid ID
      if (!targetId) {
        console.warn("No valid numeric ID for movie:", movie.id);
        setIsLoading(false);
        setErrorMessage("Unable to load: no valid content ID found.");
        return;
      }

      // Only explicitly fetch IMDB ID if missing AND the current server needs it (e.g. Server 3 or 4)
      // Server 1 (CineSrc) strictly uses TMDB IDs now, so we shouldn't block its loading!
      // (2embed and vidsrcme accept IMDb ids when available)
      if (
        !resolvedImdbId &&
        (activeServerIndex === 2 || activeServerIndex === 3)
      ) {
        try {
          const extIds = await movieService.getExternalIds(movie.id);
          if (extIds?.imdb_id) resolvedImdbId = extIds.imdb_id;
        } catch (e) {
          console.warn("Failed to fetch fallback IMDB ID", e);
        }
      }

      const isTv = movie?.isSeries || String(movie?.id || '').startsWith('tmdb-tv-');
      const newSignature = `${targetId}-${isTv ? season : "m"}-${isTv ? episode : "m"}`;
      const isNewContent = contentSignatureRef.current !== newSignature;
      contentSignatureRef.current = newSignature;

      if (isNewContent) {
        setCurrentTime(0);
        setDuration(0);
        setBuffered(0);
        targetSeekTimeRef.current = null;
      }

      let url = VideoSourceAdapter.getStreamUrl(
        activeServerIndex,
        targetId,
        isTv ? season : null,
        isTv ? episode : null,
        resolvedImdbId,
        movie.title,
      );

      if (activeServerIndex === 0) {
        if (
          !isNewContent &&
          currentTime > 0 &&
          targetSeekTimeRef.current === null
        ) {
          url += `&t=${Math.floor(currentTime)}&continueprompt=false`;
        } else if (isNewContent && startTime > 0) {
          url += `&t=${Math.floor(startTime)}&continueprompt=false`;
        }
        if (useNativeControls) url = url.replace("&controls=false", "");
      }

      setIframeUrl(url);

      // Watchdog: If the iframe completely crashes (e.g. Cloudflare 500) and never sends 'cinesrc:ready'
      watchdogTimer = setTimeout(() => {
        setIsLoading((prev) => {
          if (prev) {
            console.warn(
              "Player watchdog triggered: No response from iframe after 12s. Assuming fatal crash.",
            );
            setServerErrorCounts((errs) => {
              const serverIdx = activeServerIndexRef.current; // Use ref to avoid stale closure
              const newCount = (errs[serverIdx] || 0) + 1;
              if (newCount >= 2) { // Fix #16: require 2 timeouts before switching servers
                setErrorMessage(
                  `Server ${serverIdx + 1} timed out. Trying next...`,
                );
                setTimeout(() => {
                  setErrorMessage("");
                  const nextIdx = (serverIdx + 1) %
                    VideoSourceAdapter.getServers().length;
                  setActiveServerIndex(nextIdx);
                  onServerChange?.(nextIdx);
                }, 2000);
              } else {
                // Fix #17: retry same server once before switching
                setErrorMessage(`Server ${serverIdx + 1} timed out. Retrying...`);
                setTimeout(() => setErrorMessage(""), 3000);
              }
              return { ...errs, [serverIdx]: newCount };
            });
            return false;
          }
          return prev;
        });
      }, 12000);
    };

    generateUrl();

    return () => {
      if (watchdogTimer) clearTimeout(watchdogTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeServerIndex, movie, season, episode, useNativeControls]);

  const isCineSrc = iframeUrl.includes("cinesrc.st");
  const showCustomUI = isCineSrc && !useNativeControls;

  const sendCommand = useCallback((command, args = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "cinesrc:command", command, args },
        "https://cinesrc.st"
      );
    }
  }, []);

  // Up Next countdown logic
  const startUpNextCountdown = useCallback(() => {
    if (upNextShownRef.current || !hasNextEpisode) return;
    upNextShownRef.current = true;
    setShowUpNext(true);

    if (autoPlayNextRef.current) {
      setUpNextCountdown(15);
      let count = 15;
      upNextIntervalRef.current = setInterval(() => {
        count -= 1;
        setUpNextCountdown(count);
        if (count <= 0) {
          clearInterval(upNextIntervalRef.current);
          setShowUpNext(false);
          if (!hasTriggeredNextRef.current) {
            hasTriggeredNextRef.current = true;
            onNextEpisode?.();
          }
        }
      }, 1000);
    } else {
      setUpNextCountdown(null); // Indicates manual mode
    }
  }, [hasNextEpisode, onNextEpisode]); // autoPlayNext removed: uses ref to avoid stale closure in countdown

  const dismissUpNext = useCallback(() => {
    clearInterval(upNextIntervalRef.current);
    setShowUpNext(false);
  }, []);

  useEffect(() => {
    return () => clearInterval(upNextIntervalRef.current);
  }, []);

  // Main postMessage listener
  useEffect(() => {
    if (!isCineSrc) return;
    const handleMessage = (event) => {
      if (event.origin !== "https://cinesrc.st") return;
      // Guard: CineSrc sometimes postMessages a Promise result (from play()) which
      // throws a DataCloneError on their side. We silently ignore non-plain-object data.
      if (!event.data || typeof event.data !== "object") return;
      let type, data;
      try {
        ({ type, ...data } = event.data);
      } catch {
        return;
      }

      switch (type) {
        case "cinesrc:ready":
          // Hydrate state from player ground truth
          sendCommand("setVolume", [isMuted ? 0 : volume]);
          sendCommand("setPlaybackRate", [playbackRate]);
          sendCommand("play"); // Force play immediately to remove delay
          sendCommand("getCurrentTime");
          sendCommand("getDuration");
          sendCommand("getVolume");
          sendCommand("getPaused");
          sendCommand("getPlaybackRate");
          
          // Exhaustive list of named methods for audio/quality
          sendCommand("getAudioTracks");
          sendCommand("getTracks");
          sendCommand("getAudio");
          sendCommand("getQualities");
          sendCommand("getLevels");
          sendCommand("getResolutions");
          sendCommand("getQuality");
          sendCommand("getCurrentQuality");
          sendCommand("getCurrentLevel");
          sendCommand("getCurrentResolution");
          sendCommand("getCurrentAudioTrack");
          sendCommand("getCurrentTrack");
          break;

        case "cinesrc:response":
          switch (data.command) {
            case "getCurrentTime":
              if (data.result != null && targetSeekTimeRef.current === null)
                setCurrentTime(data.result);
              break;
            case "getDuration":
              if (data.result) setDuration(data.result);
              break;
            case "getVolume":
              if (data.result != null) setVolume(data.result);
              break;
            case "getPaused":
              if (data.result != null) {
                setIsPlaying(!data.result);
              }
              break;
            case "getPlaybackRate":
              if (data.result != null) setPlaybackRate(data.result);
              break;
            case "getAudioTracks":
            case "getTracks":
            case "getAudio":
              if (data.result) setAudioTracks(data.result);
              break;
            case "getQualities":
            case "getLevels":
            case "getResolutions":
              if (data.result) setQualities(data.result);
              break;
            case "getCurrentQuality":
            case "getCurrentLevel":
            case "getCurrentResolution":
            case "getQuality":
              if (data.result != null) setCurrentQuality(data.result);
              break;
            case "getCurrentAudioTrack":
            case "getCurrentTrack":
              if (data.result != null) setCurrentAudioTrack(data.result);
              break;
            default:
              break;
          }
          break;

        case "cinesrc:loadedmetadata":
          if (data.duration) setDuration(data.duration);
          // Do NOT clear loader here, as video frames haven't necessarily buffered yet!
          break;

        case "cinesrc:waiting":
          setIsLoading(true);
          break;

        case "cinesrc:seeking":
          setIsLoading(true);
          break;

        case "cinesrc:seeked":
          // Clear loading state immediately on seek complete
          targetSeekTimeRef.current = null;
          setIsLoading(false);
          break;

        case "cinesrc:playing":
          setIsLoading(false);
          setIsPlaying(true);
          break;

        case "cinesrc:progress":
          if (data.buffered !== undefined) setBuffered(data.buffered);
          break;

        case "cinesrc:timeupdate":
          if (isLoading) setIsLoading(false);
          if (!isScrubbing && targetSeekTimeRef.current === null) {
            setCurrentTime(data.currentTime);
            onProgressUpdate?.(data.currentTime, data.duration);
            // Universal Subtitle Engine Update
            if (hasSubtitlesRef.current) {
              const cue = subtitleEngineRef.current.getActiveCue(
                data.currentTime,
              );
              // Avoid setting state if the cue hasn't changed to prevent unnecessary re-renders
              setActiveSubtitleCue((prev) =>
                prev?.start === cue?.start &&
                prev?.end === cue?.end &&
                prev?.text === cue?.text
                  ? prev
                  : cue,
              );
            }
          }
          if (data.duration) setDuration(data.duration);
          if (data.buffered !== undefined) setBuffered(data.buffered);
          if (!isScrubbing) setIsLoading(false);

          // Up Next countdown trigger (within last 30s)
          if (
            data.duration > 0 &&
            data.currentTime >= data.duration - 30 &&
            hasNextEpisode &&
            !upNextShownRef.current &&
            !isLoopingRef.current
          ) {
            startUpNextCountdown();
          }

          // Auto-play next on video end (within last 1s)
          if (
            data.duration > 0 &&
            data.currentTime >= data.duration - 1 &&
            hasNextEpisode &&
            onNextEpisode &&
            !hasTriggeredNextRef.current &&
            !isLoopingRef.current
          ) {
            hasTriggeredNextRef.current = true;
            clearInterval(upNextIntervalRef.current);
            setShowUpNext(false);
            onNextEpisode();
          }
          break;

        case "cinesrc:ended":
          if (isLoopingRef.current) {
            sendCommand("seek", [0]);
            sendCommand("play");
            return;
          }
          if (hasNextEpisode && onNextEpisode && !hasTriggeredNextRef.current) {
            hasTriggeredNextRef.current = true;
            clearInterval(upNextIntervalRef.current);
            setShowUpNext(false);
            onNextEpisode();
          }
          break;

        case "cinesrc:nextepisode":
          // CineSrc internal navigation (user clicked built-in next button)
          if (
            !data.internalNavigation &&
            onNextEpisode &&
            !hasTriggeredNextRef.current
          ) {
            hasTriggeredNextRef.current = true;
            onNextEpisode();
          }
          // If internalNavigation = true, the iframe already changed — just sync state
          break;

        case "cinesrc:skipintro":
          if (data.time != null) {
            if (autoSkipIntro) {
              sendCommand("setCurrentTime", [data.time]);
              showToast("Intro Skipped Automatically");
            } else {
              setSkipIntroTime(data.time);
              setShowSkipIntro(true);
              clearTimeout(skipIntroTimeoutRef.current);
              skipIntroTimeoutRef.current = setTimeout(
                () => setShowSkipIntro(false),
                15000,
              );
            }
          }
          break;

        case "cinesrc:sourceused":
          if (data.sourceId) {
            setActiveSourceId(data.sourceId);
            localStorage.setItem("streamly_lastserver", data.sourceId);
            setLastServer(data.sourceId);
          }
          break;

        case "cinesrc:play":
          setIsPlaying(true);
          setIsLoading(false);
          break;

        case "cinesrc:pause":
          setIsPlaying(false);
          // If paused by user or autoplay blocked, we should reveal the UI
          if (!isScrubbing) setIsLoading(false);
          break;

        case "cinesrc:ratechange":
          setPlaybackRate(data.playbackRate);
          break;

        case "cinesrc:volumechange":
          if (data.volume !== undefined) setVolume(data.volume);
          if (data.muted !== undefined) setIsMuted(data.muted);
          break;

        case "cinesrc:error":
          console.error("CineSrc Error:", data.error);
          setIsLoading(false);
          const errServerIdx = activeServerIndexRef.current; // Fix C1: use ref to avoid stale closure
          setServerErrorCounts((prev) => {
            const newCount = (prev[errServerIdx] || 0) + 1;
            const updated = { ...prev, [errServerIdx]: newCount };
            if (newCount >= 2) {
              const nextIdx = (errServerIdx + 1) % VideoSourceAdapter.getServers().length;
              setErrorMessage(
                `Server ${errServerIdx + 1} failed. Trying next…`,
              );
              setTimeout(() => {
                setErrorMessage("");
                setActiveServerIndex(nextIdx);
                onServerChange?.(nextIdx);
              }, 2500);
            } else {
              setErrorMessage("Stream failed. Retrying…");
              setTimeout(() => setErrorMessage(""), 3000);
            }
            return updated;
          });
          break;

        default:
          break;
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [
    isCineSrc,
    isScrubbing,
    volume,
    isMuted,
    playbackRate,
    sendCommand,
    hasNextEpisode,
    onNextEpisode,
    activeServerIndex,
    startUpNextCountdown,
  ]);

  const triggerCenterIcon = useCallback((type) => {
    centerIconKeyRef.current += 1;
    setCenterIcon({ type });
    if (centerIconTimeoutRef.current)
      clearTimeout(centerIconTimeoutRef.current);
    centerIconTimeoutRef.current = setTimeout(() => setCenterIcon(null), 800);
  }, []);

  const triggerSideIcon = useCallback((type, text) => {
    setSideIcon({ type, text });
    if (sideIconTimeoutRef.current) clearTimeout(sideIconTimeoutRef.current);
    sideIconTimeoutRef.current = setTimeout(() => setSideIcon(null), 800);
  }, []);

  const togglePlay = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      if (isPlaying) {
        sendCommand("pause");
        setIsPlaying(false);
        if (showCustomUI) triggerCenterIcon("pause");
      } else {
        sendCommand("play");
        setIsPlaying(true);
        if (showCustomUI) triggerCenterIcon("play");
      }
    },
    [isPlaying, sendCommand, triggerCenterIcon, showCustomUI],
  );

  const changeVolume = useCallback(
    (newVol) => {
      const v = Math.max(0, Math.min(newVol, 1));
      setVolume(v);
      localStorage.setItem("streamly_volume", v.toString());
      sendCommand("setVolume", [v]);
      if (v > 0 && isMuted) {
        setIsMuted(false);
        localStorage.setItem("streamly_muted", "false");
      }
    },
    [isMuted, sendCommand],
  );

  const toggleMute = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      localStorage.setItem("streamly_muted", newMuted.toString());
      sendCommand("setVolume", [newMuted ? 0 : volume]);
    },
    [isMuted, volume, sendCommand],
  );

  const seekRelative = useCallback(
    (seconds) => {
      // Intentionally removed setIsLoading(true) here to prevent spinner flash on seek
      const baseTime =
        targetSeekTimeRef.current !== null
          ? targetSeekTimeRef.current
          : currentTime;
      const newTime = Math.max(
        0,
        Math.min(baseTime + seconds, duration || Infinity),
      );

      targetSeekTimeRef.current = newTime;
      setCurrentTime(newTime);
      sendCommand("seek", [newTime]);

      seekAccumulatorRef.current += seconds;
      const accumulated = seekAccumulatorRef.current;

      if (accumulated > 0) triggerSideIcon("forward", `+${accumulated}s`);
      else if (accumulated < 0) triggerSideIcon("backward", `${accumulated}s`);

      if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
      seekTimeoutRef.current = setTimeout(() => {
        seekAccumulatorRef.current = 0;
      }, 1000);
    },
    [currentTime, duration, sendCommand, triggerSideIcon],
  );

  const handleSubtitleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSubtitleFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      let parsed = [];
      if (file.name.endsWith(".srt")) parsed = SubtitleEngine.parseSRT(text);
      else if (file.name.endsWith(".vtt"))
        parsed = SubtitleEngine.parseVTT(text);

      if (parsed.length > 0) {
        subtitleEngineRef.current.setCues(parsed);
        setHasSubtitles(true);
        setSubtitleEnabled(true);
        showToast("Subtitles loaded");
      } else {
        showToast("Failed to parse subtitles");
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset input
  };

  const fetchAvailableSubtitles = useCallback(
    async (silent = false) => {
      const resolvedImdbId =
        movie.imdbId || movie.imdb_id || movie.external_ids?.imdb_id;
      const fallbackQuery = movie.title
        ? `${movie.title} ${movie.releaseYear || ""}`.trim()
        : "";

      if (!resolvedImdbId && !fallbackQuery) {
        if (!silent) showToast("No ID or Title found for this movie");
        return;
      }

      setIsFetchingSubtitles(true);
      if (!silent) showToast("Searching for subtitles...");
      try {
        const { SubtitleFetcher } = await import("../api/subtitles");
        const langs = await SubtitleFetcher.searchAvailableSubtitles(
          resolvedImdbId,
          fallbackQuery,
        );
        if (langs.length > 0) {
          setAvailableSubtitleLangs(langs);
          if (!silent)
            showToast(`Found subtitles in ${langs.length} languages!`);
        } else {
          if (!silent) showToast("No subtitles found on OpenSubtitles");
        }
      } catch (err) {
        if (!silent) showToast("Failed to fetch subtitles list");
      } finally {
        setIsFetchingSubtitles(false);
      }
    },
    [
      movie.imdbId,
      movie.imdb_id,
      movie.external_ids,
      movie.title,
      movie.releaseYear,
    ],
  );

  // Auto-fetch subtitles on mount
  useEffect(() => {
    fetchAvailableSubtitles(true);
  }, [fetchAvailableSubtitles, season, episode]);

  const handleSubtitleLanguageSelect = async (link) => {
    if (!link) return;

    const langObj = availableSubtitleLangs.find((l) => l.downloadLink === link);
    if (!langObj) return;

    showToast(`Downloading ${langObj.language} subtitles...`);
    setIsFetchingSubtitles(true);
    try {
      const { SubtitleFetcher } = await import("../api/subtitles");
      const srtText = await SubtitleFetcher.downloadAndDecompress(link);
      if (srtText) {
        const parsed = SubtitleEngine.parseSRT(srtText);
        if (parsed.length > 0) {
          subtitleEngineRef.current.setCues(parsed);
          setHasSubtitles(true);
          setSubtitleEnabled(true);
          setSubtitleFileName(`Auto (${langObj.language})`);
          showToast(`${langObj.language} subtitles loaded!`);
        } else {
          showToast("Subtitle file was empty");
        }
      } else {
        showToast("Failed to download subtitle file");
      }
    } catch (err) {
      showToast("Error downloading subtitle");
    } finally {
      setIsFetchingSubtitles(false);
    }
  };

  const toggleFullscreen = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      const el = containerRef.current;
      if (!isFullscreen) {
        if (el?.requestFullscreen) el.requestFullscreen();
        else if (el?.webkitRequestFullscreen) el.webkitRequestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      }
    },
    [isFullscreen],
  );

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    if (hours > 0)
      return `${hours}:${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const showToast = useCallback((msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(""), 2000);
  }, []);

  const handleProgressScrub = useCallback(
    (e) => {
      if (!progressBarRef.current || !duration) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percentage = x / rect.width;
      const newTime = percentage * duration;
      setCurrentTime(newTime);
      targetSeekTimeRef.current = newTime;
      sendCommand("seek", [newTime]);
    },
    [duration, sendCommand],
  );

  const handleProgressHover = useCallback(
    (e) => {
      if (!progressBarRef.current || !duration) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      setHoverX(x);
      setHoverTime((x / rect.width) * duration);
    },
    [duration],
  );

  const onProgressMouseDown = (e) => {
    e.stopPropagation();
    setIsScrubbing(true);
    handleProgressScrub(e);
  };

  useEffect(() => {
    if (!isScrubbing) return;
    const onMouseMove = (e) => handleProgressScrub(e);
    const onMouseUp = () => setIsScrubbing(false);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isScrubbing, handleProgressScrub]);

  // Keyboard Controls
  useEffect(() => {
    if (!isCineSrc) return;
    const handleKeyDown = (e) => {
      if (document.activeElement.tagName.toLowerCase() === "input") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "arrowright":
        case "l":
        case ">":
        case ".":
          e.preventDefault();
          seekRelative(10);
          break;
        case "arrowleft":
        case "j":
        case "<":
        case ",":
          e.preventDefault();
          seekRelative(-10);
          break;
        case "arrowup":
          e.preventDefault();
          changeVolume(volume + 0.1);
          showToast(`Volume: ${Math.round(Math.min(volume + 0.1, 1) * 100)}%`);
          break;
        case "arrowdown":
          e.preventDefault();
          changeVolume(volume - 0.1);
          showToast(`Volume: ${Math.round(Math.max(volume - 0.1, 0) * 100)}%`);
          break;
        case "a":
          e.preventDefault();
          setAspectRatioIndex((prev) => {
            const next = (prev + 1) % ASPECT_RATIOS.length;
            showToast(`Aspect: ${ASPECT_RATIOS[next].name}`);
            return next;
          });
          break;
        case "?":
          e.preventDefault();
          setShowShortcuts((prev) => !prev);
          break;
        case "[":
          e.preventDefault();
          setBrightness((prev) => {
            const next = Math.max(0.1, prev - 0.1);
            showToast(`Brightness: ${Math.round(next * 100)}%`);
            return next;
          });
          break;
        case "]":
          e.preventDefault();
          setBrightness((prev) => {
            const next = Math.min(1, prev + 0.1);
            showToast(`Brightness: ${Math.round(next * 100)}%`);
            return next;
          });
          break;
        case "escape":
          setShowShortcuts(false);
          setShowSettings(false);
          setShowSubtitlesMenu(false);
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isCineSrc,
    togglePlay,
    toggleFullscreen,
    toggleMute,
    seekRelative,
    volume,
    changeVolume,
    showToast,
  ]);

  // Mouse Wheel Volume Control
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !showCustomUI) return;
    const handleWheel = (e) => {
      // Allow scrolling inside menus or disable volume scroll if menus are open
      if (
        showSettings ||
        showSubtitlesMenu ||
        showShortcuts ||
        e.target.closest('[data-scrollable="true"]')
      )
        return;

      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      const newVol = Math.max(0, Math.min(volume + delta, 1));
      changeVolume(newVol);
      showToast(`Volume: ${Math.round(newVol * 100)}%`);
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [
    showCustomUI,
    volume,
    changeVolume,
    showToast,
    showSettings,
    showSubtitlesMenu,
    showShortcuts,
  ]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (
      isPlaying &&
      !showSettings &&
      !showSubtitlesMenu &&
      !isLoading &&
      !isScrubbing
    ) {
      controlsTimeoutRef.current = setTimeout(
        () => setShowControls(false),
        2500,
      );
    }
  };

  const handleOverlayClick = (e) => {
    if (contextMenu.show) {
      setContextMenu({ show: false, x: 0, y: 0 });
      return;
    }
    if (showSettings) {
      setShowSettings(false);
      return;
    }
    if (showSubtitlesMenu) {
      setShowSubtitlesMenu(false);
      return;
    }
    if (showShortcuts) {
      setShowShortcuts(false);
      return;
    }
    if (isLoading) return;

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;

      // Calculate click position for smart double-click
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;
      const percentage = x / width;

      if (percentage < 0.3) {
        seekRelative(-10); // Double click left 30% -> Rewind 10s
        setDoubleTapRipple({ side: "left", id: Date.now() });
        setTimeout(() => setDoubleTapRipple(null), 600);
      } else if (percentage > 0.7) {
        seekRelative(10); // Double click right 30% -> Forward 10s
        setDoubleTapRipple({ side: "right", id: Date.now() });
        setTimeout(() => setDoubleTapRipple(null), 600);
      } else {
        toggleFullscreen(); // Double click center 40% -> Fullscreen
      }
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
        togglePlay();
      }, 200);
    }
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration ? (buffered / duration) * 100 : 0;

  // Reusable icon button style
  const iconBtn = (active = false) => ({
    background: active ? "rgba(255,255,255,0.12)" : "transparent",
    border: "none",
    color: "white",
    cursor: "pointer",
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)",
    flexShrink: 0,
  });

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "min(calc(100vw * 9/16), calc(100vh - 120px))",
        background: "#050505",
        borderRadius: isFullscreen ? "0" : "14px",
        overflow: "hidden",
        boxShadow: isFullscreen ? "none" : "0 32px 96px rgba(0,0,0,0.9)",
        cursor: showControls || !showCustomUI ? "default" : "none",
        minHeight: isFullscreen ? "100vh" : undefined,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() =>
        isPlaying &&
        !showSettings &&
        !showSubtitlesMenu &&
        !isLoading &&
        !isScrubbing &&
        setShowControls(false)
      }
      onContextMenu={(e) => {
        if (!showCustomUI) return;
        e.preventDefault();
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.min(e.clientX - rect.left, rect.width - 220);
        const y = Math.min(e.clientY - rect.top, rect.height - 280);
        setContextMenu({ show: true, x, y });
      }}
    >
      {/* ── IFRAME ─────────────────────────────────────── */}
      {iframeUrl && (
        <iframe
          ref={iframeRef}
          key={`iframe-${activeServerIndex}-${useNativeControls}`}
          src={iframeUrl}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            background: "#050505",
            pointerEvents: isCineSrc ? "auto" : (showCustomUI ? "none" : "auto"),
            opacity: isLoading && !hasInitiallyLoaded ? 0 : 1,
            transition:
              "opacity 0.3s ease, transform 0.5s cubic-bezier(0.4,0,0.2,1)",
            filter: brightness !== 1 ? `brightness(${brightness})` : undefined,
            ...ASPECT_RATIOS[aspectRatioIndex].style,
          }}
          allow="autoplay; fullscreen; picture-in-picture"
          onLoad={() => {
            if (!isCineSrc) setIsLoading(false);
          }}
        />
      )}

      {/* ── CLICK OVERLAY ─────────────────────────────── */}
      {showCustomUI && !isCineSrc && (
        <div
          onClick={handleOverlayClick}
          style={{ position: "absolute", inset: 0, zIndex: 10 }}
        />
      )}

      {/* ── CINESRC MOUSE OVERLAY — captures hover to show controls, blocks ad clicks ── */}
      {showCustomUI && isCineSrc && (
        <div
          onMouseMove={handleMouseMove}
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const pct = x / rect.width;
            if (pct < 0.3) { seekRelative(-10); setDoubleTapRipple({ side: 'left', id: Date.now() }); setTimeout(() => setDoubleTapRipple(null), 600); }
            else if (pct > 0.7) { seekRelative(10); setDoubleTapRipple({ side: 'right', id: Date.now() }); setTimeout(() => setDoubleTapRipple(null), 600); }
            else { toggleFullscreen(); }
          }}
          style={{ position: "absolute", inset: 0, zIndex: 9, cursor: showControls ? 'default' : 'none' }}
        />
      )}

      {/* ── SUBTITLE OVERLAY ──────────────────────────── */}
      {showCustomUI && subtitleEnabled && hasSubtitles && activeSubtitleCue && (
        <div
          style={{
            position: "absolute",
            bottom:
              showControls || !isPlaying || isScrubbing ? "130px" : "60px",
            left: "0",
            right: "0",
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 15,
            transition: "bottom 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div
            style={{
              background: "transparent",
              color: "white",
              padding: "8px 24px",
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              fontSize: "clamp(20px, 3.5vw, 32px)", // Responsive font size
              lineHeight: "1.4",
              fontWeight: "700",
              textShadow:
                "0 0 4px #000, 0 0 8px #000, 2px 2px 4px #000, -2px -2px 4px #000, 2px -2px 4px #000, -2px 2px 4px #000",
              textAlign: "center",
              maxWidth: "85%",
              whiteSpace: "pre-wrap",
              letterSpacing: "0.5px",
            }}
          >
            {activeSubtitleCue.text}
          </div>
        </div>
      )}

      {/* ── CINEMATIC BOTTOM VIGNETTE ─────────────────── */}
      {showCustomUI && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 11,
            pointerEvents: "none",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 22%, rgba(0,0,0,0.15) 45%, transparent 65%)",
            transition: "opacity 0.4s",
            opacity: showControls || !isPlaying || isScrubbing ? 1 : 0,
          }}
        />
      )}

      {/* ── TOP VIGNETTE ──────────────────────────────── */}
      {showCustomUI && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 11,
            pointerEvents: "none",
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 30%)",
            transition: "opacity 0.4s",
            opacity: showControls || !isPlaying ? 1 : 0,
          }}
        />
      )}

      {/* ── INITIAL LOAD BACKGROUND ───────────────────── */}
      <AnimatePresence>
        {isLoading && !hasInitiallyLoaded && thumbnailUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 4,
              backgroundImage: `url(${thumbnailUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(40px) brightness(0.3)",
              transform: "scale(1.1)",
            }}
          />
        )}
      </AnimatePresence>

      {/* ── CENTER LOADER ─────────────────────────────── */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 25,
              mass: 0.8,
            }}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 5,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              gap: "24px",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "rgba(10,10,10,0.65)",
                backdropFilter: "blur(16px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <motion.svg
                viewBox="0 0 50 50"
                style={{ width: "36px", height: "36px", overflow: "visible" }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <circle
                  cx="25"
                  cy="25"
                  r="20"
                  fill="none"
                  stroke="rgba(255,107,0,0.15)"
                  strokeWidth="3.5"
                />
                <circle
                  cx="25"
                  cy="25"
                  r="20"
                  fill="none"
                  stroke="#FF6B00"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray="40 85.6"
                  style={{ filter: "drop-shadow(0 0 4px rgba(255,107,0,0.5))" }}
                />
              </motion.svg>
            </div>

            {!hasInitiallyLoaded && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "16px",
                  maxWidth: "700px",
                  width: "90%",
                }}
                className="modal-container"
              >
                {/* Title & Status */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <div
                    style={{
                      color: "white",
                      fontSize: "28px",
                      fontWeight: "900",
                      letterSpacing: "0.5px",
                      textShadow: "0 4px 20px rgba(0,0,0,0.8)",
                      textAlign: "center",
                    }}
                  >
                    {movie?.title || movie?.name || "Loading"}
                  </div>
                  <div
                    style={{
                      color: "#FF6B00",
                      fontSize: "13px",
                      fontWeight: "800",
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      textShadow: "0 2px 10px rgba(255,107,0,0.4)",
                    }}
                  >
                    {movie?.isSeries
                      ? `Season ${season} Episode ${episode}`
                      : "Fetching High Quality Stream..."}
                  </div>
                </div>

                {/* Synopsis */}
                {movie?.overview && (
                  <div
                    style={{
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "14px",
                      lineHeight: "1.6",
                      textAlign: "center",
                      marginTop: "8px",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textShadow: "0 2px 12px rgba(0,0,0,0.9)",
                    }}
                  >
                    {movie.overview}
                  </div>
                )}

                {/* Rotating Tips */}
                <div
                  style={{
                    marginTop: "24px",
                    height: "40px",
                    position: "relative",
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <AnimatePresence mode="wait">
                    {dynamicTips[currentTipIndex] &&
                      (() => {
                        const TipIcon = dynamicTips[currentTipIndex].icon;
                        return (
                          <motion.div
                            key={currentTipIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            style={{
                              position: "absolute",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              background: "rgba(0,0,0,0.5)",
                              padding: "10px 20px",
                              borderRadius: "100px",
                              border: "1px solid rgba(255,255,255,0.1)",
                              backdropFilter: "blur(12px)",
                              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <TipIcon size={14} color="#FF6B00" />
                            <span
                              style={{
                                color: "rgba(255,255,255,0.9)",
                                fontSize: "13px",
                                fontWeight: "600",
                                letterSpacing: "0.3px",
                              }}
                            >
                              {dynamicTips[currentTipIndex].text}
                            </span>
                          </motion.div>
                        );
                      })()}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ERROR BANNER ──────────────────────────────── */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            style={{
              position: "absolute",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(220,38,38,0.9)",
              color: "white",
              padding: "10px 22px",
              borderRadius: "100px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              zIndex: 60,
              backdropFilter: "blur(12px)",
              fontWeight: "600",
              fontSize: "13px",
              boxShadow: "0 8px 24px rgba(220,38,38,0.4)",
              whiteSpace: "nowrap",
            }}
          >
            <AlertCircle size={16} /> {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOAST ─────────────────────────────────────── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -14, x: "-50%", scale: 0.92 }}
            animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
            exit={{ opacity: 0, y: -10, x: "-50%", scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              top: "28px",
              left: "50%",
              background: "rgba(15,15,15,0.88)",
              color: "white",
              padding: "9px 22px",
              borderRadius: "100px",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.1)",
              zIndex: 62,
              fontWeight: "600",
              fontSize: "13px",
              pointerEvents: "none",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              whiteSpace: "nowrap",
            }}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SHORTCUTS OVERLAY ─────────────────────────── */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShortcuts(false)}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 70,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(10px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 8 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "rgba(12,12,12,0.96)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "22px",
                padding: "28px 30px",
                width: "310px",
                color: "white",
                boxShadow: "0 40px 80px rgba(0,0,0,0.7)",
                backdropFilter: "blur(30px)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "22px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "8px",
                      background: "rgba(255,107,0,0.15)",
                      border: "1px solid rgba(255,107,0,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Keyboard size={16} color="#FF6B00" />
                  </div>
                  <span style={{ fontWeight: "800", fontSize: "15px" }}>
                    Keyboard Shortcuts
                  </span>
                </div>
                <button
                  onClick={() => setShowShortcuts(false)}
                  style={{
                    ...iconBtn(),
                    width: "30px",
                    height: "30px",
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  <X size={16} />
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "11px",
                }}
              >
                {KEYBOARD_SHORTCUTS.map(({ key, action }) => (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        color: "rgba(255,255,255,0.5)",
                        fontSize: "13px",
                      }}
                    >
                      {action}
                    </span>
                    <span
                      style={{
                        background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        padding: "3px 11px",
                        borderRadius: "6px",
                        fontFamily: "monospace",
                        fontWeight: "700",
                        fontSize: "11px",
                        color: "#FF6B00",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {key}
                    </span>
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: "22px",
                  paddingTop: "16px",
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                  textAlign: "center",
                  color: "rgba(255,255,255,0.3)",
                  fontSize: "12px",
                }}
              >
                Press{" "}
                <span
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontFamily: "monospace",
                    fontWeight: "700",
                  }}
                >
                  ?
                </span>{" "}
                or click anywhere to dismiss
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showCustomUI && (
        <>
          {/* ── CENTER PLAY/PAUSE FLASH ─────────────────── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <AnimatePresence>
              {centerIcon && (
                <motion.div
                  key={centerIcon.type + centerIconKeyRef.current}
                  initial={{ opacity: 0, scale: 0.8, filter: "blur(8px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 1.3, filter: "blur(8px)" }}
                  transition={{
                    duration: 0.3,
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                  }}
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    background: "rgba(10,10,10,0.65)",
                    backdropFilter: "blur(16px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    position: "absolute",
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0.8, scale: 0.8 }}
                    animate={{ opacity: 0, scale: 1.8 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    style={{
                      position: "absolute",
                      inset: -1,
                      borderRadius: "50%",
                      border: "2px solid rgba(255,107,0,0.4)",
                    }}
                  />
                  {centerIcon.type === "play" ? (
                    <Play
                      size={32}
                      fill="#FF6B00"
                      color="#FF6B00"
                      style={{ marginLeft: "4px" }}
                    />
                  ) : (
                    <Pause size={32} fill="#FF6B00" color="#FF6B00" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── DOUBLE TAP RIPPLE ───────────────────────────── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 11,
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
            }}
          >
            <AnimatePresence>
              {doubleTapRipple && (
                <motion.div
                  key={doubleTapRipple.id}
                  initial={{
                    opacity: 0.7,
                    scale: 0.8,
                    x: doubleTapRipple.side === "left" ? -50 : 50,
                  }}
                  animate={{
                    opacity: 0,
                    scale: 1.5,
                    x: doubleTapRipple.side === "left" ? -10 : 10,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  style={{
                    position: "absolute",
                    [doubleTapRipple.side]: 0,
                    width: "30%",
                    height: "100%",
                    background: `radial-gradient(ellipse at ${doubleTapRipple.side} center, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)`,
                    borderTopLeftRadius:
                      doubleTapRipple.side === "right" ? "50%" : "0",
                    borderBottomLeftRadius:
                      doubleTapRipple.side === "right" ? "50%" : "0",
                    borderTopRightRadius:
                      doubleTapRipple.side === "left" ? "50%" : "0",
                    borderBottomRightRadius:
                      doubleTapRipple.side === "left" ? "50%" : "0",
                  }}
                />
              )}
            </AnimatePresence>
          </div>

          {/* ── SIDE SEEK INDICATORS ────────────────────── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 12,
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: "30%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AnimatePresence>
                {sideIcon?.type === "backward" && (
                  <motion.div
                    key="bwd"
                    initial={{ opacity: 0, scale: 0.6, x: -30 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 1.1, x: -15 }}
                    transition={{
                      type: "spring",
                      stiffness: 450,
                      damping: 25,
                      mass: 0.8,
                    }}
                    style={{
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      width: "85px",
                      height: "85px",
                      borderRadius: "50%",
                      background: "rgba(10,10,10,0.65)",
                      backdropFilter: "blur(16px)",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <motion.div
                      key={sideIcon.text}
                      initial={{ scale: 0.5, x: 10 }}
                      animate={{ scale: 1, x: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: "4px",
                      }}
                    >
                      <Rewind
                        size={32}
                        color="#FF6B00"
                        strokeWidth={2}
                        fill="rgba(255,107,0,0.2)"
                      />
                    </motion.div>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "800",
                        color: "#FF6B00",
                        fontVariantNumeric: "tabular-nums",
                        fontFamily: "monospace",
                        letterSpacing: "0.5px",
                        marginBottom: "2px",
                      }}
                    >
                      {sideIcon.text}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: "30%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AnimatePresence>
                {sideIcon?.type === "forward" && (
                  <motion.div
                    key="fwd"
                    initial={{ opacity: 0, scale: 0.6, x: 30 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 1.1, x: 15 }}
                    transition={{
                      type: "spring",
                      stiffness: 450,
                      damping: 25,
                      mass: 0.8,
                    }}
                    style={{
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      width: "85px",
                      height: "85px",
                      borderRadius: "50%",
                      background: "rgba(10,10,10,0.65)",
                      backdropFilter: "blur(16px)",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <motion.div
                      key={sideIcon.text}
                      initial={{ scale: 0.5, x: -10 }}
                      animate={{ scale: 1, x: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: "4px",
                      }}
                    >
                      <FastForward
                        size={32}
                        color="#FF6B00"
                        strokeWidth={2}
                        fill="rgba(255,107,0,0.2)"
                      />
                    </motion.div>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "800",
                        color: "#FF6B00",
                        fontVariantNumeric: "tabular-nums",
                        fontFamily: "monospace",
                        letterSpacing: "0.5px",
                        marginBottom: "2px",
                      }}
                    >
                      {sideIcon.text}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── NATIVE PLAYER EXIT ─────────────────────── */}
          {useNativeControls && (
            <AnimatePresence>
              {showControls && (
                <motion.div
                  initial={{ opacity: 0, y: -14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  style={{
                    position: "absolute",
                    top: "20px",
                    right: "20px",
                    zIndex: 50,
                  }}
                >
                  <button
                    onClick={() => setUseNativeControls(false)}
                    style={{
                      background: "rgba(255,107,0,0.9)",
                      color: "white",
                      border: "none",
                      padding: "9px 18px",
                      borderRadius: "100px",
                      cursor: "pointer",
                      fontWeight: "700",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      backdropFilter: "blur(12px)",
                      boxShadow: "0 4px 16px rgba(255,107,0,0.4)",
                      transition: "all 0.2s",
                    }}
                  >
                    <MonitorPlay size={15} /> Exit Native
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* ── SUBTITLES PANEL ────────────────────────── */}
          <AnimatePresence>
            {showSubtitlesMenu && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  bottom: "90px",
                  right: "48px",
                  zIndex: 50,
                  background: "rgba(10,10,10,0.94)",
                  backdropFilter: "blur(30px) saturate(160%)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: "20px",
                  padding: "18px",
                  width: "255px",
                  color: "white",
                  boxShadow: "0 24px 56px rgba(0,0,0,0.7)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "rgba(255,255,255,0.35)",
                      textTransform: "uppercase",
                      letterSpacing: "1.5px",
                      fontWeight: "700",
                    }}
                  >
                    Subtitles
                  </div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setSubtitleEnabled(!subtitleEnabled);
                    }}
                    style={{
                      width: "36px",
                      height: "20px",
                      background: subtitleEnabled
                        ? "#FF6B00"
                        : "rgba(255,255,255,0.15)",
                      borderRadius: "100px",
                      position: "relative",
                      cursor: "pointer",
                      transition: "background 0.3s",
                    }}
                  >
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        background: "white",
                        borderRadius: "50%",
                        position: "absolute",
                        top: "2px",
                        left: subtitleEnabled ? "18px" : "2px",
                        transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                      }}
                    />
                  </div>
                </div>

                <div
                  data-scrollable="true"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  {availableSubtitleLangs.length > 0 ? (
                    availableSubtitleLangs.map((lang, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          handleSubtitleLanguageSelect(lang.downloadLink);
                          setShowSubtitlesMenu(false);
                        }}
                        style={{
                          background: "transparent",
                          color: "rgba(255,255,255,0.85)",
                          border: "none",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "600",
                          textAlign: "left",
                          transition: "all 0.18s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(255,255,255,0.05)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        {lang.language}
                      </button>
                    ))
                  ) : (
                    <div
                      style={{
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.5)",
                        textAlign: "center",
                        padding: "8px",
                      }}
                    >
                      {isFetchingSubtitles
                        ? "Searching OpenSubtitles..."
                        : "No subtitles found online"}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    height: "1px",
                    background: "rgba(255,255,255,0.06)",
                  }}
                />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    subtitleInputRef.current?.click();
                    setShowSubtitlesMenu(false);
                  }}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    color: "white",
                    border: "1px dashed rgba(255,255,255,0.15)",
                    padding: "11px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.18s",
                  }}
                >
                  <Upload size={14} />{" "}
                  {subtitleFileName || "Upload Custom (.srt)"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── SETTINGS PANEL ────────────────────────── */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  bottom: "90px",
                  right: "16px",
                  zIndex: 50,
                  background: "rgba(10,10,10,0.94)",
                  backdropFilter: "blur(30px) saturate(160%)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: "20px",
                  padding: "18px",
                  width: "255px",
                  color: "white",
                  boxShadow: "0 24px 56px rgba(0,0,0,0.7)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "rgba(255,255,255,0.35)",
                      textTransform: "uppercase",
                      letterSpacing: "1.5px",
                      fontWeight: "700",
                      marginBottom: "12px",
                    }}
                  >
                    Playback Speed
                  </div>
                  <div
                    style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}
                  >
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => {
                          sendCommand("setPlaybackRate", [rate]);
                          setPlaybackRate(rate);
                          setShowSettings(false);
                        }}
                        style={{
                          background:
                            playbackRate === rate
                              ? "white"
                              : "rgba(255,255,255,0.05)",
                          color: playbackRate === rate ? "#000" : "white",
                          border:
                            playbackRate === rate
                              ? "none"
                              : "1px solid rgba(255,255,255,0.08)",
                          padding: "7px 11px",
                          borderRadius: "100px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "800",
                          transition: "all 0.18s",
                        }}
                      >
                        {rate}×
                      </button>
                    ))}
                  </div>
                </div>
                
                {qualities && qualities.length > 0 && (
                  <div
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      padding: "12px",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.35)",
                        textTransform: "uppercase",
                        letterSpacing: "1.5px",
                        fontWeight: "700",
                        marginBottom: "12px",
                      }}
                    >
                      Quality
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {qualities.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            sendCommand("setQuality", [q.id || idx]);
                            sendCommand("setLevel", [q.id || idx]);
                            sendCommand("setResolution", [q.id || idx]);
                            setCurrentQuality(q);
                            setShowSettings(false);
                          }}
                          style={{
                            background:
                              (currentQuality?.id === q.id || currentQuality === q)
                                ? "white"
                                : "rgba(255,255,255,0.05)",
                            color: (currentQuality?.id === q.id || currentQuality === q) ? "#000" : "white",
                            border: "none",
                            padding: "7px 11px",
                            borderRadius: "100px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "800",
                          }}
                        >
                          {q.name || q.height + 'p' || q.label || 'Quality ' + idx}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {audioTracks && audioTracks.length > 0 && (
                  <div
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      padding: "12px",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.35)",
                        textTransform: "uppercase",
                        letterSpacing: "1.5px",
                        fontWeight: "700",
                        marginBottom: "12px",
                      }}
                    >
                      Audio Track
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {audioTracks.map((t, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            sendCommand("setAudioTrack", [t.id || idx]);
                            sendCommand("setAudio", [t.id || idx]);
                            sendCommand("setTrack", [t.id || idx]);
                            setCurrentAudioTrack(t);
                            setShowSettings(false);
                          }}
                          style={{
                            background:
                              (currentAudioTrack?.id === t.id || currentAudioTrack === t)
                                ? "rgba(255,107,0,0.15)"
                                : "rgba(255,255,255,0.04)",
                            color: (currentAudioTrack?.id === t.id || currentAudioTrack === t) ? "#FF6B00" : "rgba(255,255,255,0.65)",
                            border: "1px solid transparent",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "600",
                            textAlign: "left"
                          }}
                        >
                          {t.name || t.label || t.language || 'Track ' + idx}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "rgba(255,255,255,0.35)",
                      textTransform: "uppercase",
                      letterSpacing: "1.5px",
                      fontWeight: "700",
                      marginBottom: "12px",
                    }}
                  >
                    Aspect Ratio
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                    }}
                  >
                    {ASPECT_RATIOS.map((ar, idx) => (
                      <button
                        key={ar.name}
                        onClick={() => {
                          setAspectRatioIndex(idx);
                          showToast(`Aspect: ${ar.name}`);
                          setShowSettings(false);
                        }}
                        style={{
                          background:
                            aspectRatioIndex === idx
                              ? "rgba(255,107,0,0.15)"
                              : "rgba(255,255,255,0.04)",
                          color:
                            aspectRatioIndex === idx
                              ? "#FF6B00"
                              : "rgba(255,255,255,0.65)",
                          border:
                            aspectRatioIndex === idx
                              ? "1px solid rgba(255,107,0,0.35)"
                              : "1px solid transparent",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "600",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          transition: "all 0.18s",
                        }}
                      >
                        {ar.name}{" "}
                        {aspectRatioIndex === idx && (
                          <Check size={13} strokeWidth={3} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Automations */}
                <div
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "rgba(255,255,255,0.35)",
                      textTransform: "uppercase",
                      letterSpacing: "1.5px",
                      fontWeight: "700",
                      marginBottom: "12px",
                    }}
                  >
                    Automations
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "rgba(255,255,255,0.85)",
                        }}
                      >
                        Auto-Skip Intro
                      </span>
                      <div
                        onClick={() => {
                          const v = !autoSkipIntro;
                          setAutoSkipIntro(v);
                          localStorage.setItem("streamly_autoSkip", v);
                        }}
                        style={{
                          width: "36px",
                          height: "20px",
                          background: autoSkipIntro
                            ? "#FF6B00"
                            : "rgba(255,255,255,0.15)",
                          borderRadius: "100px",
                          position: "relative",
                          cursor: "pointer",
                          transition: "background 0.3s",
                        }}
                      >
                        <div
                          style={{
                            width: "16px",
                            height: "16px",
                            background: "white",
                            borderRadius: "50%",
                            position: "absolute",
                            top: "2px",
                            left: autoSkipIntro ? "18px" : "2px",
                            transition:
                              "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                          }}
                        />
                      </div>
                    </div>

                    {movie?.isSeries && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "rgba(255,255,255,0.85)",
                          }}
                        >
                          Auto-Play Next
                        </span>
                        <div
                          onClick={() => {
                            const v = !autoPlayNext;
                            setAutoPlayNext(v);
                            localStorage.setItem("streamly_autoNext", v);
                          }}
                          style={{
                            width: "36px",
                            height: "20px",
                            background: autoPlayNext
                              ? "#FF6B00"
                              : "rgba(255,255,255,0.15)",
                            borderRadius: "100px",
                            position: "relative",
                            cursor: "pointer",
                            transition: "background 0.3s",
                          }}
                        >
                          <div
                            style={{
                              width: "16px",
                              height: "16px",
                              background: "white",
                              borderRadius: "50%",
                              position: "absolute",
                              top: "2px",
                              left: autoPlayNext ? "18px" : "2px",
                              transition:
                                "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    height: "1px",
                    background: "rgba(255,255,255,0.06)",
                  }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUseNativeControls(true);
                    setShowSettings(false);
                  }}
                  style={{
                    background: "rgba(255,107,0,0.1)",
                    color: "#FF6B00",
                    border: "1px solid rgba(255,107,0,0.2)",
                    padding: "11px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.18s",
                  }}
                >
                  <Captions size={15} /> Native Subtitles &amp; Audio
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── BOTTOM CONTROLS ZONE ────────────────────── */}
          <AnimatePresence>
            {(showControls || !isPlaying || isScrubbing) && (
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 14 }}
                transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 20,
                  pointerEvents: "none",
                }}
              >
                {/* Attachment Row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    padding: "0 20px",
                    marginBottom: "12px",
                    pointerEvents: "none",
                  }}
                >
                  {/* Skip Intro */}
                  <div style={{ pointerEvents: "auto" }}>
                    <AnimatePresence>
                      {showSkipIntro && skipIntroTime != null && (
                        <motion.button
                          initial={{ opacity: 0, x: -20, scale: 0.9 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -16, scale: 0.93 }}
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 26,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            sendCommand("seek", [skipIntroTime]);
                            setShowSkipIntro(false);
                          }}
                          style={{
                            background: "rgba(8,8,8,0.85)",
                            color: "white",
                            border: "1.5px solid #FF6B00",
                            padding: "10px 20px",
                            borderRadius: "10px",
                            cursor: "pointer",
                            fontWeight: "700",
                            backdropFilter: "blur(16px)",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "13px",
                            boxShadow:
                              "0 0 20px rgba(255,107,0,0.25), 0 8px 20px rgba(0,0,0,0.4)",
                          }}
                        >
                          <FastForward
                            size={15}
                            color="#FF6B00"
                            fill="#FF6B00"
                          />{" "}
                          Skip Intro
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Right: Up Next + Next Ep */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "8px",
                      pointerEvents: "auto",
                    }}
                  >
                    <AnimatePresence>
                      {showUpNext && hasNextEpisode && (
                        <motion.div
                          initial={{ opacity: 0, x: 24, scale: 0.92 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: 18, scale: 0.94 }}
                          transition={{
                            type: "spring",
                            stiffness: 360,
                            damping: 26,
                          }}
                          style={{
                            background: "rgba(8,8,8,0.88)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "14px",
                            padding: "12px 16px",
                            display: "flex",
                            alignItems: "center",
                            gap: "14px",
                            backdropFilter: "blur(20px)",
                            boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: "10px",
                                color: "rgba(255,255,255,0.4)",
                                fontWeight: "700",
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                marginBottom: "3px",
                              }}
                            >
                              Up Next
                            </div>
                            <div
                              style={{
                                fontSize: "14px",
                                color: "white",
                                fontWeight: "700",
                              }}
                            >
                              Episode {(episode || 0) + 1}
                            </div>
                          </div>
                          <div
                            style={{
                              position: "relative",
                              width: "40px",
                              height: "40px",
                              flexShrink: 0,
                            }}
                          >
                            <svg
                              width="40"
                              height="40"
                              style={{
                                position: "absolute",
                                inset: 0,
                                transform: "rotate(-90deg)",
                              }}
                            >
                              <circle
                                cx="20"
                                cy="20"
                                r="16"
                                fill="none"
                                stroke="rgba(255,255,255,0.08)"
                                strokeWidth="2.5"
                              />
                              <circle
                                cx="20"
                                cy="20"
                                r="16"
                                fill="none"
                                stroke="#FF6B00"
                                strokeWidth="2.5"
                                strokeDasharray={`${2 * Math.PI * 16}`}
                                strokeDashoffset={`${2 * Math.PI * 16 * (1 - upNextCountdown / 15)}`}
                                strokeLinecap="round"
                                style={{
                                  transition: "stroke-dashoffset 0.9s linear",
                                }}
                              />
                            </svg>
                            <span
                              style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                fontWeight: "800",
                                color: "white",
                              }}
                            >
                              {upNextCountdown}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissUpNext();
                            }}
                            style={{
                              background: "rgba(255,255,255,0.07)",
                              border: "none",
                              color: "rgba(255,255,255,0.5)",
                              cursor: "pointer",
                              width: "26px",
                              height: "26px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <X size={14} />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {hasNextEpisode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNextEpisode?.();
                        }}
                        style={{
                          background: "#FF6B00",
                          color: "white",
                          border: "none",
                          padding: "9px 17px",
                          borderRadius: "9px",
                          cursor: "pointer",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          gap: "7px",
                          boxShadow: "0 4px 16px rgba(255,107,0,0.4)",
                          fontSize: "13px",
                          transition: "all 0.18s",
                        }}
                      >
                        Next Episode{" "}
                        <SkipForward size={15} fill="currentColor" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar — z-index 20 ensures it covers any CineSrc native bar */}
                <div
                  ref={progressBarRef}
                  onMouseDown={onProgressMouseDown}
                  onMouseMove={handleProgressHover}
                  onMouseLeave={() => setHoverTime(null)}
                  className="group/bar"
                  style={{
                    position: "relative",
                    zIndex: 20,
                    height: "22px",
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    padding: "0 20px",
                    pointerEvents: "auto",
                    marginBottom: "4px",
                  }}
                >
                  <AnimatePresence>
                    {hoverTime != null && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          position: "absolute",
                          bottom: "22px",
                          left: `${hoverX + 20}px`,
                          transform: "translateX(-50%)",
                          pointerEvents: "none",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {/* Timestamp pill only */}
                        <div
                          style={{
                            background: "rgba(8,8,8,0.95)",
                            color: "white",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "800",
                            fontFamily: "monospace",
                            whiteSpace: "nowrap",
                            border: "1px solid rgba(255,255,255,0.12)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {formatTime(hoverTime)}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: hoverTime != null ? "5px" : "3px",
                      background: "rgba(255,255,255,0.18)",
                      borderRadius: "3px",
                      transition: "height 0.2s cubic-bezier(0.4,0,0.2,1)",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: `${bufferedPercent}%`,
                        background: "rgba(255,255,255,0.22)",
                        borderRadius: "3px",
                        transition: "width 0.4s",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: `${progressPercent}%`,
                        background:
                          "linear-gradient(90deg, rgba(255,107,0,0.8), #FF6B00)",
                        borderRadius: "3px",
                        boxShadow:
                          "0 0 10px rgba(255,107,0,0.5), 0 0 4px rgba(255,107,0,0.4)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        left: `${progressPercent}%`,
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        background: "white",
                        opacity: 1,
                        boxShadow:
                          "0 2px 8px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,107,0,0.4)",
                      }}
                    />
                  </div>
                </div>

                {/* Control Row */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "2px 16px 16px",
                    pointerEvents: "auto",
                    position: "relative",
                  }}
                >
                  {/* Left */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <motion.button
                      onClick={togglePlay}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.92 }}
                      style={{
                        background: "white",
                        border: "none",
                        color: "black",
                        cursor: "pointer",
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
                        flexShrink: 0,
                      }}
                      title={isPlaying ? "Pause (K)" : "Play (K)"}
                    >
                      {isPlaying ? (
                        <Pause size={18} fill="currentColor" />
                      ) : (
                        <Play
                          size={18}
                          fill="currentColor"
                          style={{ marginLeft: "2px" }}
                        />
                      )}
                    </motion.button>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        seekRelative(-10);
                      }}
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.9 }}
                      style={iconBtn()}
                      title="Rewind 10s (J)"
                    >
                      <RotateCcw size={18} />
                    </motion.button>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        seekRelative(10);
                      }}
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.9 }}
                      style={iconBtn()}
                      title="Forward 10s (L)"
                    >
                      <RotateCw size={18} />
                    </motion.button>
                    <motion.div
                      initial={false}
                      animate={{ width: "auto" }}
                      onMouseEnter={() => setIsVolumeHovered(true)}
                      onMouseLeave={() => setIsVolumeHovered(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        background: "rgba(255,255,255,0.08)",
                        borderRadius: "100px",
                        overflow: "hidden",
                      }}
                    >
                      <motion.button
                        onClick={toggleMute}
                        whileHover={{ scale: 1.12 }}
                        whileTap={{ scale: 0.9 }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "white",
                          cursor: "pointer",
                          width: "38px",
                          height: "38px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                        title="Mute (M)"
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX size={18} />
                        ) : (
                          <Volume2 size={18} />
                        )}
                      </motion.button>
                      <motion.div
                        initial={false}
                        animate={{
                          width: isVolumeHovered ? 68 : 0,
                          opacity: isVolumeHovered ? 1 : 0,
                          marginRight: isVolumeHovered ? 12 : 0,
                        }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          overflow: "hidden",
                        }}
                      >
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.02"
                          value={isMuted ? 0 : volume}
                          onChange={(e) => {
                            e.stopPropagation();
                            changeVolume(parseFloat(e.target.value));
                          }}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            width: "68px",
                            accentColor: "#FF6B00",
                            cursor: "pointer",
                            height: "3px",
                            flexShrink: 0,
                          }}
                        />
                      </motion.div>
                    </motion.div>
                    <div
                      style={{
                        marginLeft: "8px",
                        fontFamily: "monospace",
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "rgba(255,255,255,0.9)",
                        letterSpacing: "0.5px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatTime(currentTime)}
                      <span
                        style={{
                          color: "rgba(255,255,255,0.3)",
                          fontWeight: "400",
                        }}
                      >
                        /
                      </span>
                      <span
                        style={{
                          color: "rgba(255,255,255,0.5)",
                          fontWeight: "500",
                        }}
                      >
                        {formatTime(duration)}
                      </span>
                    </div>
                  </div>

                  {/* Center Title */}
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      transform: "translateX(-50%)",
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      pointerEvents: "none",
                      whiteSpace: "nowrap",
                      maxWidth: "38%",
                      overflow: "hidden",
                    }}
                  >
                    <span
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        backdropFilter: "blur(4px)",
                        padding: "2px 7px",
                        borderRadius: "4px",
                        fontSize: "9px",
                        fontWeight: "900",
                        color: "rgba(255,255,255,0.9)",
                        letterSpacing: "1.2px",
                        border: "1px solid rgba(255,255,255,0.12)",
                        flexShrink: 0,
                      }}
                    >
                      {isTvContent ? `S${season} E${episode}` : "MOVIE"}
                    </span>
                    <span
                      style={{
                        color: "rgba(255,255,255,0.85)",
                        fontSize: "12px",
                        fontWeight: "700",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {movie.title || movie.name}
                    </span>
                    {isTvContent && (
                      <span
                        style={{
                          color: "#FF6B00",
                          fontSize: "12px",
                          fontWeight: "800",
                          flexShrink: 0,
                        }}
                      >
                        — Ep {episode}
                      </span>
                    )}
                    {playbackRate !== 1 && (
                      <span
                        style={{
                          background: "rgba(255,107,0,0.18)",
                          border: "1px solid rgba(255,107,0,0.35)",
                          color: "#FF6B00",
                          fontSize: "9px",
                          fontWeight: "900",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          flexShrink: 0,
                        }}
                      >
                        {playbackRate}×
                      </span>
                    )}
                  </div>

                  {/* Right */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "2px",
                    }}
                  >
                    {activeSourceId && (
                      <span
                        style={{
                          fontSize: "9px",
                          color: "rgba(255,255,255,0.3)",
                          fontWeight: "700",
                          padding: "2px 7px",
                          background: "rgba(255,255,255,0.05)",
                          borderRadius: "5px",
                          marginRight: "4px",
                          whiteSpace: "nowrap",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {activeSourceId}
                      </span>
                    )}

                    {/* Subtitle Selector Trigger */}
                    <input
                      type="file"
                      accept=".srt,.vtt"
                      ref={subtitleInputRef}
                      onChange={handleSubtitleUpload}
                      style={{ display: "none" }}
                    />
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSubtitlesMenu(!showSubtitlesMenu);
                        setShowSettings(false);
                      }}
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.9 }}
                      style={{
                        ...iconBtn(subtitleEnabled || showSubtitlesMenu),
                        position: "relative",
                      }}
                      title={
                        subtitleFileName
                          ? `Subtitle: ${subtitleFileName}`
                          : "Subtitles"
                      }
                    >
                      <Captions
                        size={17}
                        style={{
                          transition: "transform 0.4s",
                          transform: showSubtitlesMenu
                            ? "scale(1.1)"
                            : "scale(1)",
                        }}
                      />
                      {subtitleEnabled && (
                        <div
                          style={{
                            position: "absolute",
                            top: "4px",
                            right: "4px",
                            width: "6px",
                            height: "6px",
                            background: "#FF6B00",
                            borderRadius: "50%",
                          }}
                        />
                      )}
                    </motion.button>

                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowShortcuts((p) => !p);
                      }}
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.9 }}
                      style={iconBtn(showShortcuts)}
                      title="Shortcuts (?)"
                    >
                      <Keyboard size={17} />
                    </motion.button>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSettings(!showSettings);
                        setShowSubtitlesMenu(false);
                      }}
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.9 }}
                      style={iconBtn(showSettings)}
                      title="Settings"
                    >
                      <Settings
                        size={17}
                        style={{
                          transition: "transform 0.4s",
                          transform: showSettings
                            ? "rotate(60deg)"
                            : "rotate(0)",
                        }}
                      />
                    </motion.button>
                    <motion.button
                      onClick={toggleFullscreen}
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.9 }}
                      style={iconBtn()}
                      title={
                        isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"
                      }
                    >
                      {isFullscreen ? (
                        <Minimize size={17} />
                      ) : (
                        <Maximize size={17} />
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* ── CONTEXT MENU ───────────────────────────────── */}
          <AnimatePresence>
            {contextMenu.show && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: "absolute",
                  left: contextMenu.x,
                  top: contextMenu.y,
                  zIndex: 100,
                  background: "rgba(15,15,15,0.85)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  padding: "8px 0",
                  minWidth: "220px",
                  boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
                  pointerEvents: "auto",
                  display: "flex",
                  flexDirection: "column",
                }}
                onClick={(e) => e.stopPropagation()}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <div
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setContextMenu({ show: false, x: 0, y: 0 });
                    showToast("URL Copied to Clipboard");
                  }}
                  style={{
                    padding: "10px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: "pointer",
                    color: "white",
                    fontSize: "13px",
                    fontWeight: "500",
                  }}
                >
                  <Link size={14} /> Copy video URL
                </div>
                <div
                  onClick={() => {
                    setIsLooping(!isLooping);
                    setContextMenu({ show: false, x: 0, y: 0 });
                    showToast(isLooping ? "Loop Disabled" : "Loop Enabled");
                  }}
                  style={{
                    padding: "10px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: "pointer",
                    color: "white",
                    fontSize: "13px",
                    fontWeight: "500",
                  }}
                >
                  <Repeat size={14} color={isLooping ? "#FF6B00" : "white"} />{" "}
                  {isLooping ? "Loop is On" : "Loop is Off"}
                </div>
                <div
                  onClick={() => {
                    togglePlay();
                    setContextMenu({ show: false, x: 0, y: 0 });
                  }}
                  style={{
                    padding: "10px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: "pointer",
                    color: "white",
                    fontSize: "13px",
                    fontWeight: "500",
                  }}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}{" "}
                  {isPlaying ? "Pause" : "Play"}
                </div>
                <div
                  onClick={() => {
                    toggleMute();
                    setContextMenu({ show: false, x: 0, y: 0 });
                  }}
                  style={{
                    padding: "10px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: "pointer",
                    color: "white",
                    fontSize: "13px",
                    fontWeight: "500",
                  }}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX size={14} />
                  ) : (
                    <Volume2 size={14} />
                  )}{" "}
                  {isMuted || volume === 0 ? "Unmute" : "Mute"}
                </div>
                <div
                  style={{
                    height: "1px",
                    background: "rgba(255,255,255,0.1)",
                    margin: "4px 0",
                  }}
                />
                <div
                  onClick={() => {
                    setIsLoading(true);
                    setIframeUrl("");
                    setTimeout(() => {
                      setHasInitiallyLoaded(false);
                      contentSignatureRef.current = "";
                    }, 100);
                    setContextMenu({ show: false, x: 0, y: 0 });
                    showToast("Reloading Player...");
                  }}
                  style={{
                    padding: "10px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: "pointer",
                    color: "white",
                    fontSize: "13px",
                    fontWeight: "500",
                  }}
                >
                  <RefreshCw size={14} /> Troubleshoot (Reload)
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

export default CustomVideoPlayer;
