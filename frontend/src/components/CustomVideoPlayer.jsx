import React, { useEffect, useState, useRef, useCallback } from "react";
import { VideoSourceAdapter } from "../api/videoSourceAdapter";
import { movieService } from "../api/movieService";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Settings, AlertCircle, Check, RotateCcw, RotateCw,
  SkipForward, FastForward, Rewind,
  Keyboard, X, Upload, Captions, Film, Link, Repeat, RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SubtitleEngine } from "../utils/SubtitleEngine";

const getNumericId = (s) => {
  if (!s) return null;
  const m = s.toString().match(/\d+/);
  return m ? m[0] : null;
};

const ASPECT_RATIOS = [
  { name: "Fit (16:9)", style: { transform: "scale(1)" } },
  { name: "Crop 16:10", style: { transform: "scale(1.111)" } },
  { name: "Crop 2.35:1", style: { transform: "scale(1.322)" } },
  { name: "Crop 2.39:1", style: { transform: "scale(1.344)" } },
  { name: "Crop 4:3", style: { transform: "scale(1.333)" } },
  { name: "Extra Zoom", style: { transform: "scale(1.18)" } },
];

const KEYBOARD_SHORTCUTS = [
  { key: "Space / K", action: "Play / Pause" },
  { key: "F", action: "Fullscreen" },
  { key: "M", action: "Mute" },
  { key: "→ / L", action: "Forward 10s" },
  { key: "← / J", action: "Rewind 10s" },
  { key: "↑↓", action: "Volume" },
  { key: "A", action: "Aspect Ratio" },
  { key: "?", action: "Shortcuts" },
];

const LOADING_TIPS = [
  { text: "Double-tap center for fullscreen", icon: Keyboard },
  { text: "Arrow keys to seek 10 seconds", icon: Keyboard },
  { text: "Scroll to adjust volume", icon: Keyboard },
  { text: "Press ? for all shortcuts", icon: Keyboard },
  { text: "Right-click for more options", icon: Settings },
];

/* ═══ VOID Design Tokens ═══════════════════════════════════════ */
const V = {
  bg: "#06060a",
  accent: "#E8A838",
  accentDim: "rgba(232,168,56,0.12)",
  accentBorder: "rgba(232,168,56,0.3)",
  accentGlow: "rgba(232,168,56,0.4)",
  text: "#fff",
  dim: "rgba(255,255,255,0.45)",
  faint: "rgba(255,255,255,0.18)",
  glass: "rgba(6,6,10,0.85)",
  glassBorder: "rgba(255,255,255,0.06)",
  surface: "#0e0e14",
};

const CustomVideoPlayer = ({
  movie, season, episode, preferredServerIndex = 0, onServerChange,
  hasNextEpisode, onNextEpisode, thumbnailUrl, startTime = 0, onProgressUpdate,
}) => {
  /* ═══ State ══════════════════════════════════════════════════════ */
  const [activeServerIndex, setActiveServerIndex] = useState(preferredServerIndex);
  const activeServerIndexRef = useRef(activeServerIndex);
  useEffect(() => { activeServerIndexRef.current = activeServerIndex; }, [activeServerIndex]);

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
  const [showVolumePopup, setShowVolumePopup] = useState(false);
  const [showAspectRatioPopup, setShowAspectRatioPopup] = useState(false);
  const [autoSkipIntro, setAutoSkipIntro] = useState(() => localStorage.getItem("streamly_autoSkip") === "true");
  const [autoPlayNext, setAutoPlayNext] = useState(() => localStorage.getItem("streamly_autoNext") !== "false");
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
  const [, setLastServer] = useState(() => localStorage.getItem("streamly_lastserver") || "");
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0 });
  const [isLooping, setIsLooping] = useState(false);
  const [brightness, setBrightness] = useState(1);
  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(null);
  const [audioTracks, setAudioTracks] = useState([]);
  const [currentAudioTrack, setCurrentAudioTrack] = useState(null);
  const [showPausedInfo, setShowPausedInfo] = useState(false);
  const pausedInfoTimerRef = useRef(null);

  /* ═══ Refs ════════════════════════════════════════════════════════ */
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
  const centerIconKeyRef = useRef(0);
  const subtitleInputRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const volumePopupRef = useRef(null);
  const aspectRatioPopupRef = useRef(null);
  const volumeBarRef = useRef(null);
  const isDraggingVolumeRef = useRef(false);
  const isLoopingRef = useRef(isLooping);
  useEffect(() => { isLoopingRef.current = isLooping; }, [isLooping]);

  const isCineSrc = iframeUrl.includes("cinesrc.st");
  const showCustomUI = isCineSrc && !useNativeControls;

  /* Auto-hide paused info */
  useEffect(() => {
    if (pausedInfoTimerRef.current) clearTimeout(pausedInfoTimerRef.current);
    if (!isPlaying && !isLoading && showCustomUI && hasInitiallyLoaded && duration > 0) {
      pausedInfoTimerRef.current = setTimeout(() => setShowPausedInfo(true), 1500);
    } else {
      setShowPausedInfo(false);
    }
    return () => { if (pausedInfoTimerRef.current) clearTimeout(pausedInfoTimerRef.current); };
  }, [isPlaying, isLoading, showCustomUI, hasInitiallyLoaded]);

  const autoPlayNextRef = useRef(autoPlayNext);
  useEffect(() => { autoPlayNextRef.current = autoPlayNext; }, [autoPlayNext]);

  const subtitleEngineRef = useRef(new SubtitleEngine());
  const [activeSubtitleCue, setActiveSubtitleCue] = useState(null);
  const [hasSubtitles, setHasSubtitles] = useState(false);
  const hasSubtitlesRef = useRef(false);
  useEffect(() => { hasSubtitlesRef.current = hasSubtitles; }, [hasSubtitles]);
  const [availableSubtitleLangs, setAvailableSubtitleLangs] = useState([]);
  const [isFetchingSubtitles, setIsFetchingSubtitles] = useState(false);
  const [subtitleEnabled, setSubtitleEnabled] = useState(false);
  const [subtitleFileName, setSubtitleFileName] = useState("");

  const isTvContent = movie?.isSeries || String(movie?.id || "").startsWith("tmdb-tv-");

  useEffect(() => {
    hasTriggeredNextRef.current = false;
    upNextShownRef.current = false;
    setShowUpNext(false);
    setSkipIntroTime(null);
    setShowSkipIntro(false);
    setUpNextCountdown(15);
  }, [movie?.id, season, episode]);

  useEffect(() => { setActiveServerIndex(preferredServerIndex); }, [preferredServerIndex]);

  useEffect(() => {
    const sv = localStorage.getItem("streamly_volume");
    const sm = localStorage.getItem("streamly_muted");
    if (sv !== null) setVolume(parseFloat(sv));
    if (sm === "true") setIsMuted(true);
  }, []);

  useEffect(() => {
    const h = () => setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement));
    document.addEventListener("fullscreenchange", h);
    document.addEventListener("webkitfullscreenchange", h);
    return () => {
      document.removeEventListener("fullscreenchange", h);
      document.removeEventListener("webkitfullscreenchange", h);
    };
  }, []);

  const contentSignatureRef = useRef("");
  const [dynamicTips, setDynamicTips] = useState(LOADING_TIPS);

  useEffect(() => {
    if (!isLoading && !hasInitiallyLoaded) setHasInitiallyLoaded(true);
  }, [isLoading, hasInitiallyLoaded]);

  useEffect(() => {
    if (movie?.id) {
      movieService.getSimilarMovies(movie.id, movie.platform || "tmdb").then((data) => {
        if (data?.length > 0) {
          const recs = data.slice(0, 3).map((m) => ({ text: m.title || m.name, icon: Film }));
          const s = [...LOADING_TIPS, ...recs];
          for (let i = s.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [s[i], s[j]] = [s[j], s[i]];
          }
          setDynamicTips(s);
        }
      }).catch(() => {});
    }
  }, [movie]);

  useEffect(() => {
    if (!hasInitiallyLoaded) {
      const iv = setInterval(() => setCurrentTipIndex((p) => (p + 1) % dynamicTips.length), 4000);
      return () => clearInterval(iv);
    }
  }, [hasInitiallyLoaded, dynamicTips.length]);

  /* ═══ URL Generation ════════════════════════════════════════════════ */
  useEffect(() => {
    let watchdogTimer;
    const gen = async () => {
      setIsLoading(true);
      setHasInitiallyLoaded(false);
      let imdbId = movie.imdbId || movie.imdb_id || movie.external_ids?.imdb_id;
      const tid = getNumericId(movie.id);
      if (!tid) { setIsLoading(false); setErrorMessage("No valid content ID."); return; }
      if (!imdbId && (activeServerIndex === 2 || activeServerIndex === 3)) {
        try {
          const e = await movieService.getExternalIds(movie.id);
          if (e?.imdb_id) imdbId = e.imdb_id;
        } catch {}
      }
      const isTv = movie?.isSeries || String(movie?.id || "").startsWith("tmdb-tv-");
      const sig = `${tid}-${isTv ? season : "m"}-${isTv ? episode : "m"}`;
      const isNew = contentSignatureRef.current !== sig;
      contentSignatureRef.current = sig;
      if (isNew) { setCurrentTime(0); setDuration(0); setBuffered(0); targetSeekTimeRef.current = null; }
      let url = VideoSourceAdapter.getStreamUrl(activeServerIndex, tid, isTv ? season : null, isTv ? episode : null, imdbId, movie.title);
      if (activeServerIndex === 0) {
        if (!isNew && currentTime > 0 && !targetSeekTimeRef.current) url += `&t=${Math.floor(currentTime)}&continueprompt=false`;
        else if (isNew && startTime > 0) url += `&t=${Math.floor(startTime)}&continueprompt=false`;
        if (useNativeControls) url = url.replace("&controls=false", "");
      }
      setIframeUrl(url);
      // CineSrc needs more time to initialize — use 20s watchdog
      const watchdogDelay = activeServerIndex === 0 ? 20000 : 12000;
      watchdogTimer = setTimeout(() => {
        setIsLoading((prev) => {
          if (prev) {
            setServerErrorCounts((errs) => {
              const si = activeServerIndexRef.current;
              const nc = (errs[si] || 0) + 1;
              if (nc >= 2) {
                setErrorMessage(`Server ${si + 1} timed out`);
                setTimeout(() => {
                  setErrorMessage("");
                  const ni = (si + 1) % VideoSourceAdapter.getServers().length;
                  setActiveServerIndex(ni);
                  onServerChange?.(ni);
                }, 2000);
              } else {
                setErrorMessage("Retrying...");
                setTimeout(() => setErrorMessage(""), 3000);
              }
              return { ...errs, [si]: nc };
            });
            return false;
          }
          return prev;
        });
      }, watchdogDelay);
    };
    gen();
    return () => { if (watchdogTimer) clearTimeout(watchdogTimer); };
  }, [activeServerIndex, movie, season, episode, useNativeControls]);

  const sendCommand = useCallback((c, a = []) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: "cinesrc:command", command: c, args: a }, "https://cinesrc.st");
    }
  }, []);

  /* ═══ Up Next ═══════════════════════════════════════════════════════ */
  const startUpNextCountdown = useCallback(() => {
    if (upNextShownRef.current || !hasNextEpisode) return;
    upNextShownRef.current = true;
    setShowUpNext(true);
    if (autoPlayNextRef.current) {
      setUpNextCountdown(15);
      let c = 15;
      upNextIntervalRef.current = setInterval(() => {
        c -= 1;
        setUpNextCountdown(c);
        if (c <= 0) {
          clearInterval(upNextIntervalRef.current);
          setShowUpNext(false);
          if (!hasTriggeredNextRef.current) {
            hasTriggeredNextRef.current = true;
            onNextEpisode?.();
          }
        }
      }, 1000);
    } else {
      setUpNextCountdown(null);
    }
  }, [hasNextEpisode, onNextEpisode]);

  const dismissUpNext = useCallback(() => {
    clearInterval(upNextIntervalRef.current);
    setShowUpNext(false);
  }, []);

  useEffect(() => () => clearInterval(upNextIntervalRef.current), []);

  /* ═══ PostMessage Listener ═════════════════════════════════════════ */
  useEffect(() => {
    if (!isCineSrc) return;
    const h = (ev) => {
      if (ev.origin !== "https://cinesrc.st" || !ev.data || typeof ev.data !== "object") return;
      let t, d;
      try { ({ type: t, ...d } = ev.data); } catch { return; }
      switch (t) {
        case "cinesrc:ready":
          sendCommand("setVolume", [isMuted ? 0 : volume]);
          sendCommand("setPlaybackRate", [playbackRate]);
          sendCommand("play");
          sendCommand("getCurrentTime");
          sendCommand("getDuration");
          sendCommand("getVolume");
          sendCommand("getPaused");
          sendCommand("getPlaybackRate");
          sendCommand("getAudioTracks");
          sendCommand("getQualities");
          break;
        case "cinesrc:response":
          switch (d.command) {
            case "getCurrentTime": if (d.result != null && !targetSeekTimeRef.current) setCurrentTime(d.result); break;
            case "getDuration": if (d.result) setDuration(d.result); break;
            case "getVolume": if (d.result != null) setVolume(d.result); break;
            case "getPaused": if (d.result != null) setIsPlaying(!d.result); break;
            case "getPlaybackRate": if (d.result != null) setPlaybackRate(d.result); break;
            case "getAudioTracks": case "getTracks": case "getAudio": if (d.result) setAudioTracks(d.result); break;
            case "getQualities": case "getLevels": case "getResolutions": if (d.result) setQualities(d.result); break;
            case "getCurrentQuality": case "getCurrentLevel": case "getCurrentResolution": case "getQuality": if (d.result != null) setCurrentQuality(d.result); break;
            case "getCurrentAudioTrack": case "getCurrentTrack": if (d.result != null) setCurrentAudioTrack(d.result); break;
            default: break;
          }
          break;
        case "cinesrc:loadedmetadata": if (d.duration) setDuration(d.duration); break;
        case "cinesrc:waiting": setIsLoading(true); break;
        case "cinesrc:seeking": setIsLoading(true); break;
        case "cinesrc:seeked": targetSeekTimeRef.current = null; setIsLoading(false); break;
        case "cinesrc:playing": setIsLoading(false); setIsPlaying(true); break;
        case "cinesrc:progress": if (d.buffered !== undefined) setBuffered(d.buffered); break;
        case "cinesrc:timeupdate":
          if (isLoading) setIsLoading(false);
          if (!isScrubbing && !targetSeekTimeRef.current) {
            setCurrentTime(d.currentTime);
            onProgressUpdate?.(d.currentTime, d.duration);
            if (hasSubtitlesRef.current) {
              const cue = subtitleEngineRef.current.getActiveCue(d.currentTime);
              setActiveSubtitleCue((p) => p?.start === cue?.start && p?.end === cue?.end ? p : cue);
            }
          }
          if (d.duration) setDuration(d.duration);
          if (d.buffered !== undefined) setBuffered(d.buffered);
          if (!isScrubbing) setIsLoading(false);
          if (d.duration > 0 && d.currentTime >= d.duration - 30 && hasNextEpisode && !upNextShownRef.current && !isLoopingRef.current) startUpNextCountdown();
          if (d.duration > 0 && d.currentTime >= d.duration - 1 && hasNextEpisode && onNextEpisode && !hasTriggeredNextRef.current && !isLoopingRef.current) {
            hasTriggeredNextRef.current = true;
            clearInterval(upNextIntervalRef.current);
            setShowUpNext(false);
            onNextEpisode();
          }
          break;
        case "cinesrc:ended":
          if (isLoopingRef.current) { sendCommand("seek", [0]); sendCommand("play"); return; }
          if (hasNextEpisode && !hasTriggeredNextRef.current) {
            hasTriggeredNextRef.current = true;
            clearInterval(upNextIntervalRef.current);
            setShowUpNext(false);
            onNextEpisode();
          }
          break;
        case "cinesrc:nextepisode":
          if (!d.internalNavigation && onNextEpisode && !hasTriggeredNextRef.current) {
            hasTriggeredNextRef.current = true;
            onNextEpisode();
          }
          break;
        case "cinesrc:skipintro":
          if (d.time != null) {
            if (autoSkipIntro) {
              sendCommand("setCurrentTime", [d.time]);
              showToast("Intro skipped");
            } else {
              setSkipIntroTime(d.time);
              setShowSkipIntro(true);
              clearTimeout(skipIntroTimeoutRef.current);
              skipIntroTimeoutRef.current = setTimeout(() => setShowSkipIntro(false), 12000);
            }
          }
          break;
        case "cinesrc:sourceused":
          if (d.sourceId) {
            setActiveSourceId(d.sourceId);
            localStorage.setItem("streamly_lastserver", d.sourceId);
            setLastServer(d.sourceId);
          }
          break;
        case "cinesrc:play": setIsLoading(false); setIsPlaying(true); break;
        case "cinesrc:pause": setIsPlaying(false); if (!isScrubbing) setIsLoading(false); break;
        case "cinesrc:ratechange": setPlaybackRate(d.playbackRate); break;
        case "cinesrc:volumechange":
          if (d.volume !== undefined) setVolume(d.volume);
          if (d.muted !== undefined) setIsMuted(d.muted);
          break;
        case "cinesrc:error":
          setIsLoading(false);
          const ei = activeServerIndexRef.current;
          setServerErrorCounts((p) => {
            const nc = (p[ei] || 0) + 1;
            if (nc >= 2) {
              setErrorMessage("Server failed");
              setTimeout(() => {
                setErrorMessage("");
                const ni = (ei + 1) % VideoSourceAdapter.getServers().length;
                setActiveServerIndex(ni);
                onServerChange?.(ni);
              }, 2500);
            } else {
              setErrorMessage("Retrying...");
              setTimeout(() => setErrorMessage(""), 3000);
            }
            return { ...p, [ei]: nc };
          });
          break;
        default: break;
      }
    };
    window.addEventListener("message", h);
    return () => window.removeEventListener("message", h);
  }, [isCineSrc, isScrubbing, volume, isMuted, playbackRate, sendCommand, hasNextEpisode, onNextEpisode, activeServerIndex, startUpNextCountdown, isLoading, onProgressUpdate]);

  /* ═══ Actions ══════════════════════════════════════════════════════ */
  const triggerCenterIcon = useCallback((type) => {
    centerIconKeyRef.current += 1;
    setCenterIcon({ type });
    if (centerIconTimeoutRef.current) clearTimeout(centerIconTimeoutRef.current);
    centerIconTimeoutRef.current = setTimeout(() => setCenterIcon(null), 700);
  }, []);

  const triggerSideIcon = useCallback((type, text) => {
    setSideIcon({ type, text });
    if (sideIconTimeoutRef.current) clearTimeout(sideIconTimeoutRef.current);
    sideIconTimeoutRef.current = setTimeout(() => setSideIcon(null), 700);
  }, []);

  const togglePlay = useCallback((e) => {
    if (e) e.stopPropagation();
    if (isPlaying) {
      sendCommand("pause");
      setIsPlaying(false);
      if (showCustomUI) triggerCenterIcon("pause");
    } else {
      sendCommand("play");
      setIsPlaying(true);
      if (showCustomUI) triggerCenterIcon("play");
      setShowPausedInfo(false);
    }
  }, [isPlaying, sendCommand, triggerCenterIcon, showCustomUI]);

  const changeVolume = useCallback((nv) => {
    const v = Math.max(0, Math.min(nv, 1));
    setVolume(v);
    localStorage.setItem("streamly_volume", v.toString());
    sendCommand("setVolume", [v]);
    if (v > 0 && isMuted) {
      setIsMuted(false);
      localStorage.setItem("streamly_muted", "false");
    }
    // Show volume popup briefly
    setShowVolumePopup(true);
    if (volumePopupRef.current) clearTimeout(volumePopupRef.current);
    volumePopupRef.current = setTimeout(() => setShowVolumePopup(false), 800);
  }, [isMuted, sendCommand]);

  const toggleMute = useCallback((e) => {
    if (e) e.stopPropagation();
    const n = !isMuted;
    setIsMuted(n);
    localStorage.setItem("streamly_muted", n.toString());
    sendCommand("setVolume", [n ? 0 : volume]);
  }, [isMuted, volume, sendCommand]);

  const seekRelative = useCallback((s) => {
    const base = targetSeekTimeRef.current ?? currentTime;
    const nt = Math.max(0, Math.min(base + s, duration || Infinity));
    targetSeekTimeRef.current = nt;
    setCurrentTime(nt);
    sendCommand("seek", [nt]);
    seekAccumulatorRef.current += s;
    const a = seekAccumulatorRef.current;
    if (a > 0) triggerSideIcon("forward", `+${a}s`);
    else if (a < 0) triggerSideIcon("backward", `${a}s`);
    if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
    seekTimeoutRef.current = setTimeout(() => { seekAccumulatorRef.current = 0; }, 1000);
  }, [currentTime, duration, sendCommand, triggerSideIcon]);

  const handleSubtitleUpload = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setSubtitleFileName(f.name);
    const r = new FileReader();
    r.onload = (ev) => {
      const t = ev.target.result;
      let p = [];
      if (f.name.endsWith(".srt")) p = SubtitleEngine.parseSRT(t);
      else if (f.name.endsWith(".vtt")) p = SubtitleEngine.parseVTT(t);
      if (p.length > 0) {
        subtitleEngineRef.current.setCues(p);
        setHasSubtitles(true);
        setSubtitleEnabled(true);
        showToast("Subtitles loaded");
      } else showToast("Parse failed");
    };
    r.readAsText(f);
    e.target.value = null;
  };

  const fetchAvailableSubtitles = useCallback(async (silent = false) => {
    const imdbId = movie.imdbId || movie.imdb_id || movie.external_ids?.imdb_id;
    const fq = movie.title ? `${movie.title} ${movie.releaseYear || ""}`.trim() : "";
    if (!imdbId && !fq) return;
    setIsFetchingSubtitles(true);
    if (!silent) showToast("Searching subtitles...");
    try {
      const { SubtitleFetcher } = await import("../api/subtitles");
      const langs = await SubtitleFetcher.searchAvailableSubtitles(imdbId, fq);
      if (langs.length) {
        setAvailableSubtitleLangs(langs);
        if (!silent) showToast(`Found ${langs.length} languages`);
      } else if (!silent) showToast("No subtitles found");
    } catch {
      if (!silent) showToast("Search failed");
    } finally {
      setIsFetchingSubtitles(false);
    }
  }, [movie.imdbId, movie.imdb_id, movie.external_ids, movie.title, movie.releaseYear]);

  useEffect(() => { fetchAvailableSubtitles(true); }, [fetchAvailableSubtitles, season, episode]);

  const handleSubtitleLanguageSelect = async (link) => {
    if (!link) return;
    const lo = availableSubtitleLangs.find((l) => l.downloadLink === link);
    if (!lo) return;
    showToast(`Downloading ${lo.language}...`);
    setIsFetchingSubtitles(true);
    try {
      const { SubtitleFetcher } = await import("../api/subtitles");
      const txt = await SubtitleFetcher.downloadAndDecompress(link);
      if (txt) {
        const p = SubtitleEngine.parseSRT(txt);
        if (p.length) {
          subtitleEngineRef.current.setCues(p);
          setHasSubtitles(true);
          setSubtitleEnabled(true);
          setSubtitleFileName(`Auto (${lo.language})`);
          showToast(`${lo.language} loaded!`);
        } else showToast("Empty file");
      } else showToast("Download failed");
    } catch { showToast("Error"); }
    finally { setIsFetchingSubtitles(false); }
  };

  const toggleFullscreen = useCallback((e) => {
    if (e) e.stopPropagation();
    const el = containerRef.current;
    if (!isFullscreen) el?.requestFullscreen?.() || el?.webkitRequestFullscreen?.();
    else document.exitFullscreen?.() || document.webkitExitFullscreen?.();
  }, [isFullscreen]);

  const fmt = (t) => {
    if (!t || isNaN(t)) return "0:00";
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = Math.floor(t % 60);
    return h > 0
      ? `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`
      : `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const showToast = useCallback((msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(""), 2000);
  }, []);

  /* ═══ Progress Bar ═════════════════════════════════════════════════ */
  const handleProgressScrub = useCallback((e) => {
    if (!progressBarRef.current || !duration) return;
    const r = progressBarRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - r.left, r.width));
    const nt = (x / r.width) * duration;
    setCurrentTime(nt);
    targetSeekTimeRef.current = nt;
    sendCommand("seek", [nt]);
  }, [duration, sendCommand]);

  const handleProgressHover = useCallback((e) => {
    if (!progressBarRef.current || !duration) return;
    const r = progressBarRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - r.left, r.width));
    setHoverX(x);
    setHoverTime((x / r.width) * duration);
  }, [duration]);

  const onProgressMouseDown = (e) => {
    e.stopPropagation();
    setIsScrubbing(true);
    handleProgressScrub(e);
  };

  useEffect(() => {
    if (!isScrubbing) return;
    const mm = (e) => handleProgressScrub(e);
    const mu = () => setIsScrubbing(false);
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
    return () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", mu);
    };
  }, [isScrubbing, handleProgressScrub]);

  /* ═══ Keyboard ═════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!isCineSrc) return;
    const h = (e) => {
      if (document.activeElement?.tagName === "input" || e.ctrlKey || e.metaKey || e.altKey) return;
      switch (e.key.toLowerCase()) {
        case " ": case "k": e.preventDefault(); togglePlay(); break;
        case "f": e.preventDefault(); toggleFullscreen(); break;
        case "m": e.preventDefault(); toggleMute(); break;
        case "arrowright": case "l": case ">": case ".": e.preventDefault(); seekRelative(10); break;
        case "arrowleft": case "j": case "<": case ",": e.preventDefault(); seekRelative(-10); break;
        case "arrowup": e.preventDefault(); changeVolume(volume + 0.1); break;
        case "arrowdown": e.preventDefault(); changeVolume(volume - 0.1); break;
        case "a": e.preventDefault(); setAspectRatioIndex((p) => (p + 1) % ASPECT_RATIOS.length); setShowAspectRatioPopup(true); if (aspectRatioPopupRef.current) clearTimeout(aspectRatioPopupRef.current); aspectRatioPopupRef.current = setTimeout(() => setShowAspectRatioPopup(false), 1200); break;
        case "?": e.preventDefault(); setShowShortcuts((p) => !p); break;
        case "escape": setShowShortcuts(false); setShowSettings(false); setShowSubtitlesMenu(false); break;
        default: break;
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isCineSrc, togglePlay, toggleFullscreen, toggleMute, seekRelative, volume, changeVolume]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !showCustomUI) return;
    const h = (e) => {
      if (showSettings || showSubtitlesMenu || showShortcuts) return;
      e.preventDefault();
      changeVolume(volume + (e.deltaY < 0 ? 0.05 : -0.05));
    };
    el.addEventListener("wheel", h, { passive: false });
    return () => el.removeEventListener("wheel", h);
  }, [showCustomUI, volume, changeVolume, showSettings, showSubtitlesMenu, showShortcuts]);

  /* ═══ Auto-hide controls ══════════════════════════════════════════ */
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying && !showSettings && !showSubtitlesMenu && !isLoading && !isScrubbing) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying, showSettings, showSubtitlesMenu, isLoading, isScrubbing]);

  const handleOverlayClick = (e) => {
    if (contextMenu.show) { setContextMenu({ show: false, x: 0, y: 0 }); return; }
    if (showSettings) { setShowSettings(false); return; }
    if (showSubtitlesMenu) { setShowSubtitlesMenu(false); return; }
    if (showShortcuts) { setShowShortcuts(false); return; }
    if (isLoading) return;
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      const r = containerRef.current.getBoundingClientRect();
      const pct = (e.clientX - r.left) / r.width;
      if (pct < 0.3) {
        seekRelative(-10);
        setDoubleTapRipple({ side: "left", id: Date.now() });
        setTimeout(() => setDoubleTapRipple(null), 500);
      } else if (pct > 0.7) {
        seekRelative(10);
        setDoubleTapRipple({ side: "right", id: Date.now() });
        setTimeout(() => setDoubleTapRipple(null), 500);
      } else {
        toggleFullscreen();
      }
    } else {
      clickTimeoutRef.current = setTimeout(() => { clickTimeoutRef.current = null; togglePlay(); }, 250);
    }
  };

  const pp = duration > 0 ? Math.max(0, Math.min((currentTime / duration) * 100, 100)) : 0;
  const bp = duration > 0 ? Math.max(0, Math.min((buffered / duration) * 100, 100)) : 0;
  const controlsVisible = showControls || !isPlaying || isScrubbing;

  /* ════════════════════════════════════════════════════════════════════
     VOID RENDER — Cinematic, auto-hiding, amber accent, no badges
     ════════════════════════════════════════════════════════════════════ */
  return (
    <div
      ref={containerRef}
      style={{
        position: "relative", width: "100%",
        aspectRatio: isFullscreen ? undefined : "16/9",
        height: isFullscreen ? "100vh" : "auto",
        maxHeight: isFullscreen ? "100vh" : "calc(100vh - 120px)",
        background: V.bg,
        borderRadius: isFullscreen ? 0 : 8,
        overflow: "hidden",
        cursor: controlsVisible || !showCustomUI ? "default" : "none",
        minHeight: isFullscreen ? "100vh" : undefined,
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (isPlaying && !showSettings && !showSubtitlesMenu && !isLoading && !isScrubbing)
          setShowControls(false);
      }}
      onContextMenu={(e) => {
        if (!showCustomUI) return;
        e.preventDefault();
        const r = containerRef.current.getBoundingClientRect();
        setContextMenu({
          show: true,
          x: Math.min(e.clientX - r.left, r.width - 200),
          y: Math.min(e.clientY - r.top, r.height - 260),
        });
      }}
    >
      {/* IFRAME */}
      {iframeUrl && (
        <iframe
          ref={iframeRef}
          key={`iframe-${activeServerIndex}-${useNativeControls}`}
          src={iframeUrl}
          style={{
            width: "100%", height: "100%", border: "none", background: "#000",
            pointerEvents: isCineSrc ? "auto" : (showCustomUI ? "none" : "auto"),
            opacity: isLoading && !hasInitiallyLoaded ? 0 : 1,
            transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(0.4,0,0.2,1)",
            filter: brightness !== 1 ? `brightness(${brightness})` : undefined,
            transformOrigin: "center center",
            ...ASPECT_RATIOS[aspectRatioIndex].style,
          }}
          allow="autoplay; fullscreen; picture-in-picture"
          onLoad={() => {
            // For CineSrc: keep loading visible for a bit after iframe loads
            // because the player inside still needs to initialize
            if (isCineSrc) {
              setTimeout(() => setIsLoading(false), 3000);
            } else {
              setIsLoading(false);
            }
          }}
        />
      )}

      {/* Overlays for non-CineSrc */}
      {showCustomUI && !isCineSrc && (
        <div onClick={handleOverlayClick} style={{ position: "absolute", inset: 0, zIndex: 10 }} />
      )}
      {showCustomUI && isCineSrc && (
        <div
          onMouseMove={handleMouseMove}
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            const r = containerRef.current.getBoundingClientRect();
            const pct = (e.clientX - r.left) / r.width;
            if (pct < 0.3) {
              seekRelative(-10);
              setDoubleTapRipple({ side: "left", id: Date.now() });
              setTimeout(() => setDoubleTapRipple(null), 500);
            } else if (pct > 0.7) {
              seekRelative(10);
              setDoubleTapRipple({ side: "right", id: Date.now() });
              setTimeout(() => setDoubleTapRipple(null), 500);
            } else {
              toggleFullscreen();
            }
          }}
          style={{ position: "absolute", inset: 0, zIndex: 9, cursor: controlsVisible ? "default" : "none" }}
        />
      )}

      {/* SUBTITLES */}
      {showCustomUI && subtitleEnabled && hasSubtitles && activeSubtitleCue && (
        <div style={{
          position: "absolute", bottom: controlsVisible ? "80px" : "30px",
          left: 0, right: 0, display: "flex", justifyContent: "center",
          pointerEvents: "none", zIndex: 15,
          transition: "bottom 0.35s cubic-bezier(0.4,0,0.2,1)",
        }}>
          <div style={{
            color: "#fff", padding: "5px 18px",
            fontSize: "clamp(15px, 2.5vw, 26px)", lineHeight: 1.4, fontWeight: 500,
            textShadow: "0 1px 6px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,0.8)",
            textAlign: "center", maxWidth: "85%", whiteSpace: "pre-wrap",
            background: "rgba(0,0,0,0.4)", borderRadius: 4,
          }}>
            {activeSubtitleCue.text}
          </div>
        </div>
      )}

      {/* BOTTOM VIGNETTE */}
      {showCustomUI && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 11, pointerEvents: "none",
          background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 12%, transparent 30%)",
          transition: "opacity 0.4s", opacity: controlsVisible ? 1 : 0,
        }} />
      )}

      {/* ═══ CENTER PLAY/PAUSE ICON ════════════════════════════════ */}
      <AnimatePresence>
        {showCustomUI && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: controlsVisible ? 0.9 : (isPlaying ? 0 : 0.9), scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "absolute", inset: 0, zIndex: 13,
              display: "flex", alignItems: "center", justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <AnimatePresence mode="wait">
              {centerIcon ? (
                <motion.div
                  key={centerIcon.type + centerIconKeyRef.current}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.4 }}
                  transition={{ duration: 0.25, type: "spring", stiffness: 400, damping: 25 }}
                  style={{
                    width: 80, height: 80, borderRadius: "50%",
                    background: "rgba(0,0,0,0.45)", backdropFilter: "blur(20px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0.6, scale: 0.7 }}
                    animate={{ opacity: 0, scale: 2 }}
                    transition={{ duration: 0.5 }}
                    style={{ position: "absolute", inset: -1, borderRadius: "50%", border: `2px solid ${V.accent}` }}
                  />
                  {centerIcon.type === "play"
                    ? <Play size={34} fill="#fff" color="#fff" style={{ marginLeft: 4 }} />
                    : <Pause size={34} fill="#fff" color="#fff" />}
                </motion.div>
              ) : !isPlaying && !controlsVisible ? (
                <motion.div
                  key="big-play"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 0.7, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  style={{
                    width: 72, height: 72, borderRadius: "50%",
                    background: "rgba(0,0,0,0.4)", backdropFilter: "blur(16px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <Play size={30} fill="#fff" color="#fff" style={{ marginLeft: 3 }} />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ CINEMATIC PAUSED OVERLAY ═══════════════════════════════ */}
      <AnimatePresence>
        {showPausedInfo && showCustomUI && !isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute", inset: 0, zIndex: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
              pointerEvents: "none",
            }}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{
                display: "flex", gap: "clamp(16px, 3vw, 32px)",
                alignItems: "center", maxWidth: "min(600px, 85%)", padding: "0 20px",
              }}
            >
              {(movie?.posterUrl || thumbnailUrl) && (
                <div style={{
                  width: "clamp(80px, 14vw, 140px)", aspectRatio: "2/3",
                  borderRadius: 10, overflow: "hidden", flexShrink: 0,
                  boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}>
                  <img
                    src={movie?.posterUrl || thumbnailUrl}
                    alt=""
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Pause size={14} fill={V.accent} color={V.accent} />
                  <span style={{ color: V.accent, fontSize: 11, fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase" }}>Paused</span>
                </div>
                {/* Show actual title logo image if available, otherwise text */}
                {movie?.logoUrl ? (
                  <img
                    src={movie.logoUrl}
                    alt={movie?.title}
                    style={{
                      maxHeight: "clamp(40px, 8vw, 70px)",
                      width: "auto",
                      maxWidth: "min(360px, 70vw)",
                      objectFit: "contain",
                      filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.9))",
                      marginBottom: 6,
                    }}
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'block'); }}
                  />
                ) : null}
                <div style={{
                  color: "#fff", fontWeight: 800,
                  fontSize: "clamp(1.2rem, 3vw, 2rem)", lineHeight: 1.1,
                  marginBottom: 6, letterSpacing: "-0.02em",
                  display: movie?.logoUrl ? 'none' : 'block',
                }}>
                  {movie?.title || movie?.name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  {movie?.releaseYear && <span style={{ color: V.dim, fontSize: 12, fontWeight: 600 }}>{movie.releaseYear}</span>}
                  {movie?.imdbRating > 0 && <span style={{ color: "#FBBF24", fontSize: 12, fontWeight: 700 }}>★ {movie.imdbRating}</span>}
                  {isTvContent && season && <span style={{ color: V.accent, fontSize: 12, fontWeight: 700 }}>S{season} E{episode}</span>}
                  {movie?.duration && <span style={{ color: V.dim, fontSize: 12 }}>{movie.duration}</span>}
                  {movie?.genres?.slice(0, 3).map((g, i) => (
                    <span key={i} style={{ color: V.faint, fontSize: 10, fontWeight: 600, background: "rgba(255,255,255,0.05)", padding: "1px 6px", borderRadius: 4 }}>{g}</span>
                  ))}
                  {movie?.contentRating && <span style={{ color: V.dim, fontSize: 10, fontWeight: 700, border: `1px solid ${V.faint}`, padding: "1px 5px", borderRadius: 3 }}>{movie.contentRating}</span>}
                </div>
                {(movie?.longDescription || movie?.description || movie?.overview) && (
                  <div style={{
                    color: "rgba(255,255,255,0.65)",
                    fontSize: "clamp(0.75rem, 1.3vw, 0.9rem)", lineHeight: 1.6,
                    display: "-webkit-box", WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {movie?.longDescription || movie?.description || movie?.overview}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LOADING STATE */}
      <AnimatePresence>
        {isLoading && !hasInitiallyLoaded && thumbnailUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute", inset: 0, zIndex: 4,
              backgroundImage: `url(${thumbnailUrl})`,
              backgroundSize: "cover", backgroundPosition: "center",
              filter: "blur(40px) brightness(0.15)", transform: "scale(1.2)",
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute", inset: 0, zIndex: 5,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              pointerEvents: "none", gap: 16,
            }}
          >
            <div style={{ position: "relative", width: 48, height: 48 }}>
              <motion.svg
                viewBox="0 0 48 48"
                style={{ width: "100%", height: "100%" }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              >
                <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(232,168,56,0.1)" strokeWidth="2" />
                <circle cx="24" cy="24" r="20" fill="none" stroke={V.accent} strokeWidth="2" strokeLinecap="round" strokeDasharray="40 85.6" />
              </motion.svg>
            </div>
            {!hasInitiallyLoaded && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ textAlign: "center" }}>
                <div style={{ color: "#fff", fontSize: "clamp(1rem, 2vw, 1.3rem)", fontWeight: 700, marginBottom: 4 }}>
                  {movie?.title || movie?.name || "Loading"}
                </div>
                <div style={{ color: V.dim, fontSize: 11, fontWeight: 600, letterSpacing: "1px" }}>
                  {dynamicTips[currentTipIndex]?.text}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ERROR */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
              background: "rgba(239,68,68,0.9)", color: "#fff",
              padding: "6px 16px", borderRadius: 100,
              display: "flex", alignItems: "center", gap: 6,
              zIndex: 60, fontWeight: 600, fontSize: 11,
            }}
          >
            <AlertCircle size={12} /> {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOAST */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -5, x: "-50%" }}
            style={{
              position: "absolute", top: 16, left: "50%",
              background: V.glass, color: V.text,
              padding: "6px 16px", borderRadius: 100,
              backdropFilter: "blur(20px)",
              border: `1px solid ${V.glassBorder}`,
              zIndex: 62, fontWeight: 600, fontSize: 11, pointerEvents: "none",
            }}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ CENTER-TOP HUD — Volume & Aspect Ratio ══════════════════ */}
      <AnimatePresence>
        {(showVolumePopup || showAspectRatioPopup) && (
          <motion.div
            key="hud"
            initial={{ opacity: 0, y: -12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            style={{
              position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)",
              zIndex: 65, pointerEvents: "none",
              background: "rgba(6,6,10,0.88)", backdropFilter: "blur(20px)",
              border: `1px solid ${V.glassBorder}`,
              borderRadius: 12, padding: "8px 16px",
              display: "flex", alignItems: "center", gap: 10,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            {showVolumePopup && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Volume icon */}
                <motion.div
                  key={isMuted || volume === 0 ? "muted" : "active"}
                  initial={{ scale: 0.6, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX size={16} color={V.accent} />
                  ) : volume < 0.5 ? (
                    <Volume2 size={16} color={V.accent} />
                  ) : (
                    <Volume2 size={16} color="#fff" />
                  )}
                </motion.div>
                {/* Volume bar */}
                <div style={{
                  width: 100, height: 4, borderRadius: 2,
                  background: "rgba(255,255,255,0.1)", position: "relative",
                }}>
                  <motion.div
                    animate={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    style={{
                      height: "100%", borderRadius: 2,
                      background: `linear-gradient(90deg, ${V.accent}, #f0c060)`,
                      boxShadow: `0 0 8px ${V.accentGlow}`,
                    }}
                  />
                  {/* Thumb dot */}
                  <div style={{
                    position: "absolute", top: "50%",
                    left: `${(isMuted ? 0 : volume) * 100}%`,
                    transform: "translate(-50%, -50%)",
                    width: 8, height: 8, borderRadius: "50%",
                    background: "#fff",
                    boxShadow: `0 0 4px rgba(0,0,0,0.5), 0 0 0 1.5px ${V.accent}`,
                  }} />
                </div>
                {/* Percentage */}
                <motion.span
                  key={Math.round((isMuted ? 0 : volume) * 100)}
                  initial={{ scale: 1.3, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  style={{
                    color: V.accent, fontSize: 12, fontWeight: 800,
                    fontFamily: "monospace", minWidth: 30, textAlign: "right",
                  }}
                >
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </motion.span>
              </div>
            )}
            {showVolumePopup && showAspectRatioPopup && (
              <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} />
            )}
            {showAspectRatioPopup && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <motion.div
                  initial={{ rotate: -90, scale: 0.5 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                  <Maximize size={14} color="#fff" />
                </motion.div>
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <motion.span
                    key={aspectRatioIndex}
                    initial={{ y: 6, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    style={{ color: "#fff", fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}
                  >
                    {ASPECT_RATIOS[aspectRatioIndex].name}
                  </motion.span>
                  <span style={{ color: V.dim, fontSize: 9, fontWeight: 600 }}>
                    {aspectRatioIndex + 1} / {ASPECT_RATIOS.length}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* SHORTCUTS OVERLAY */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShortcuts(false)}
            style={{
              position: "absolute", inset: 0, zIndex: 70,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.93 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "rgba(12,12,14,0.97)",
                border: `1px solid ${V.glassBorder}`,
                borderRadius: 14, padding: "20px 24px", width: 270,
                color: V.text, boxShadow: "0 40px 80px rgba(0,0,0,0.8)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>Shortcuts</span>
                <button onClick={() => setShowShortcuts(false)} style={{ background: "transparent", border: "none", color: V.faint, cursor: "pointer", display: "flex" }}>
                  <X size={14} />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {KEYBOARD_SHORTCUTS.map(({ key, action }) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: V.dim, fontSize: 11 }}>{action}</span>
                    <span style={{
                      background: "rgba(255,255,255,0.04)", border: `1px solid ${V.glassBorder}`,
                      padding: "2px 8px", borderRadius: 4, fontFamily: "monospace",
                      fontWeight: 700, fontSize: 10, color: V.accent,
                    }}>
                      {key}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIDE SEEK INDICATORS */}
      <div style={{ position: "absolute", inset: 0, zIndex: 12, pointerEvents: "none", display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "30%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AnimatePresence>
            {sideIcon?.type === "backward" && (
              <motion.div
                key="bwd"
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.3 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}
              >
                {/* Outer ripple ring */}
                <motion.div
                  initial={{ opacity: 0.4, scale: 0.6 }}
                  animate={{ opacity: 0, scale: 1.8 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  style={{
                    position: "absolute", width: 64, height: 64, top: -8, left: -8,
                    borderRadius: "50%", border: `2px solid ${V.accent}`,
                    pointerEvents: "none",
                  }}
                />
                {/* Main circle */}
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: "rgba(0,0,0,0.55)", backdropFilter: "blur(20px)",
                  border: `1.5px solid ${V.accentBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 0 24px ${V.accentGlow}, inset 0 0 12px rgba(0,0,0,0.3)`,
                }}>
                  <Rewind size={24} color={V.accent} strokeWidth={2.5} fill="rgba(232,168,56,0.2)" />
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 800, color: V.accent,
                  fontFamily: "monospace", textShadow: "0 0 10px rgba(0,0,0,0.8)",
                  marginTop: 4,
                }}>{sideIcon.text}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "30%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AnimatePresence>
            {sideIcon?.type === "forward" && (
              <motion.div
                key="fwd"
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.3 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}
              >
                {/* Outer ripple ring */}
                <motion.div
                  initial={{ opacity: 0.4, scale: 0.6 }}
                  animate={{ opacity: 0, scale: 1.8 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  style={{
                    position: "absolute", width: 64, height: 64, top: -8, left: -8,
                    borderRadius: "50%", border: `2px solid ${V.accent}`,
                    pointerEvents: "none",
                  }}
                />
                {/* Main circle */}
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: "rgba(0,0,0,0.55)", backdropFilter: "blur(20px)",
                  border: `1.5px solid ${V.accentBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 0 24px ${V.accentGlow}, inset 0 0 12px rgba(0,0,0,0.3)`,
                }}>
                  <FastForward size={24} color={V.accent} strokeWidth={2.5} fill="rgba(232,168,56,0.2)" />
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 800, color: V.accent,
                  fontFamily: "monospace", textShadow: "0 0 10px rgba(0,0,0,0.8)",
                  marginTop: 4,
                }}>{sideIcon.text}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* DOUBLE TAP RIPPLE */}
      <div style={{ position: "absolute", inset: 0, zIndex: 11, pointerEvents: "none" }}>
        <AnimatePresence>
          {doubleTapRipple && (
            <motion.div
              key={doubleTapRipple.id}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                position: "absolute",
                [doubleTapRipple.side]: 0,
                width: "40%", height: "100%",
                background: `radial-gradient(ellipse at ${doubleTapRipple.side} center, rgba(232,168,56,0.08) 0%, transparent 70%)`,
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ═══ BOTTOM CONTROLS (slide up) ══════════════════════════════ */}
      <AnimatePresence>
        {showCustomUI && controlsVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20, pointerEvents: "none" }}
          >
            {/* Skip Intro / Up Next Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "0 16px", marginBottom: 6, pointerEvents: "none" }}>
              <div style={{ pointerEvents: "auto" }}>
                <AnimatePresence>
                  {showSkipIntro && skipIntroTime != null && (
                    <motion.button
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      whileHover={{ scale: 1.06, x: 4 }}
                      whileTap={{ scale: 0.94 }}
                      transition={{ type: "spring", stiffness: 400, damping: 26 }}
                      onClick={(e) => { e.stopPropagation(); sendCommand("seek", [skipIntroTime]); setShowSkipIntro(false); }}
                      style={{
                        background: V.glass, color: "#fff",
                        border: `1px solid ${V.accent}`,
                        padding: "7px 14px", borderRadius: 6, cursor: "pointer",
                        fontWeight: 700, backdropFilter: "blur(16px)",
                        display: "flex", alignItems: "center", gap: 5, fontSize: 11,
                      }}
                    >
                      <FastForward size={12} color={V.accent} fill={V.accent} /> Skip Intro
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, pointerEvents: "auto" }}>
                <AnimatePresence>
                  {showUpNext && hasNextEpisode && (
                    <motion.div
                      initial={{ opacity: 0, x: 14 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ type: "spring", stiffness: 380, damping: 26 }}
                      style={{
                        background: V.glass, border: `1px solid ${V.glassBorder}`,
                        borderRadius: 10, padding: "7px 11px",
                        display: "flex", alignItems: "center", gap: 9,
                        backdropFilter: "blur(20px)",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 8, color: V.faint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>Up Next</div>
                        <div style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>Ep {(episode || 0) + 1}</div>
                      </div>
                      <div style={{ position: "relative", width: 28, height: 28 }}>
                        <svg width="28" height="28" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
                          <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                          <circle cx="14" cy="14" r="11" fill="none" stroke={V.accent} strokeWidth="2"
                            strokeDasharray={`${2 * Math.PI * 11}`}
                            strokeDashoffset={`${2 * Math.PI * 11 * (1 - upNextCountdown / 15)}`}
                            strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.9s linear" }}
                          />
                        </svg>
                        <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff" }}>{upNextCountdown}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); dismissUpNext(); }}
                        style={{
                          background: "rgba(255,255,255,0.05)", border: "none", color: V.dim,
                          cursor: "pointer", width: 20, height: 20, borderRadius: "50%",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <X size={10} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                {hasNextEpisode && (
                  <button onClick={(e) => { e.stopPropagation(); onNextEpisode?.(); }}
                    style={{
                      background: V.accent, color: "#000", border: "none",
                      padding: "6px 12px", borderRadius: 6, cursor: "pointer",
                      fontWeight: 700, display: "flex", alignItems: "center", gap: 4, fontSize: 11,
                    }}
                  >
                    Next <SkipForward size={12} fill="currentColor" />
                  </button>
                )}
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div
              ref={progressBarRef}
              onMouseDown={onProgressMouseDown}
              onMouseMove={handleProgressHover}
              onMouseLeave={() => setHoverTime(null)}
              style={{
                position: "relative", height: 24, display: "flex",
                alignItems: "center", cursor: "pointer",
                padding: "0 0", pointerEvents: "auto",
              }}
            >
              <AnimatePresence>
                {hoverTime != null && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 3 }}
                    transition={{ duration: 0.1 }}
                    style={{
                      position: "absolute", bottom: 18,
                      left: `${hoverX}px`, transform: "translateX(-50%)",
                      pointerEvents: "none",
                    }}
                  >
                    <div style={{
                      background: V.surface, color: V.text,
                      padding: "2px 7px", borderRadius: 4,
                      fontSize: 10, fontWeight: 800, fontFamily: "monospace",
                      border: `1px solid ${V.glassBorder}`,
                    }}>
                      {fmt(hoverTime)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div style={{
                position: "relative", width: "100%",
                height: hoverTime != null || isScrubbing ? 6 : 3,
                background: "rgba(255,255,255,0.08)",
                borderRadius: 3,
                transition: "height 0.25s cubic-bezier(0.4,0,0.2,1)",
              }}>
                {duration > 0 && <div style={{ position: "absolute", inset: 0, width: `${Math.min(bp, 100)}%`, background: "rgba(255,255,255,0.1)", borderRadius: 3, transition: "width 0.3s" }} />}
                {duration > 0 && <div style={{
                  position: "absolute", inset: 0, width: `${Math.min(pp, 100)}%`,
                  background: `linear-gradient(90deg, ${V.accent}, #f0c060)`,
                  borderRadius: 3,
                  boxShadow: `0 0 10px ${V.accentGlow}`,
                }} />}
                {/* Scrubber dot — hidden when at 0 or no duration, grows on hover */}
                {duration > 0 && !(currentTime === 0 && !isPlaying && !isScrubbing) && (
                <div className="void-scrubber" style={{
                  position: "absolute", left: `${Math.max(0, Math.min(pp, 100))}%`, top: "50%",
                  transform: "translate(-50%,-50%)",
                  width: hoverTime != null || isScrubbing ? 14 : 8,
                  height: hoverTime != null || isScrubbing ? 14 : 8,
                  borderRadius: "50%",
                  background: "#fff",
                  boxShadow: hoverTime != null || isScrubbing
                    ? `0 0 12px rgba(0,0,0,0.5), 0 0 0 3px ${V.accent}, 0 0 20px ${V.accentGlow}`
                    : `0 0 6px rgba(0,0,0,0.4), 0 0 0 2px ${V.accent}`,
                  transition: "width 0.2s, height 0.2s, box-shadow 0.2s, left 0.1s",
                  cursor: "grab",
                }} />
                )}
              </div>
            </div>

            {/* TITLE INFO ROW — below progress bar with glass backdrop */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 16px 6px", pointerEvents: "none",
              gap: 12,
              marginTop: 4,
            }}>
              {/* Left: current time / duration */}
              <span style={{
                color: V.dim, fontSize: 11, fontWeight: 600,
                fontFamily: "monospace", letterSpacing: "0.5px",
                flexShrink: 0,
              }}>
                {fmt(currentTime)} / {fmt(duration)}
              </span>
              {/* Center: title + season/episode + year */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                minWidth: 0, flex: 1, justifyContent: "center",
              }}>
                <span style={{
                  color: "#fff", fontSize: "clamp(13px, 1.5vw, 15px)",
                  fontWeight: 700, letterSpacing: "-0.01em",
                  textShadow: "0 1px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.5)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  maxWidth: "min(300px, 42vw)",
                }}>
                  {movie?.title || movie?.name}
                </span>
                {isTvContent && season && (
                  <span style={{
                    color: V.accent, fontSize: "clamp(10px, 1.2vw, 12px)",
                    fontWeight: 800, letterSpacing: "0.5px",
                    background: `linear-gradient(135deg, ${V.accentDim}, rgba(232,168,56,0.08))`,
                    padding: "3px 10px", borderRadius: 5,
                    border: `1px solid ${V.accentBorder}`,
                    whiteSpace: "nowrap", flexShrink: 0,
                    textShadow: `0 0 8px ${V.accentGlow}`,
                  }}>
                    S{season} E{episode}
                  </span>
                )}
                {movie?.releaseYear && (
                  <span style={{
                    color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600,
                    flexShrink: 0, letterSpacing: "0.3px",
                  }}>{movie.releaseYear}</span>
                )}
              </div>
              {/* Right: spacer for symmetry */}
              <div style={{ flexShrink: 0, minWidth: 70 }} />
            </div>

            {/* CONTROL ROW */}
            <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 12px 12px", pointerEvents: "auto" }}>
              {/* Left: Play + Seek + Volume */}
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <motion.button
                  onClick={togglePlay}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    background: V.accent, border: "none", color: "#000",
                    cursor: "pointer", width: 36, height: 36, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 4px 14px ${V.accentGlow}`,
                  }}
                >
                  {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" style={{ marginLeft: 2 }} />}
                </motion.button>
                <motion.button onClick={(e) => { e.stopPropagation(); seekRelative(-10); }}
                  whileHover={{ scale: 1.15, background: "rgba(255,255,255,0.08)" }}
                  whileTap={{ scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  style={{ background: "transparent", border: "none", color: V.dim, cursor: "pointer", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                  title="Rewind 10s"
                >
                  <RotateCcw size={14} />
                </motion.button>
                <motion.button onClick={(e) => { e.stopPropagation(); seekRelative(10); }}
                  whileHover={{ scale: 1.15, background: "rgba(255,255,255,0.08)" }}
                  whileTap={{ scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  style={{ background: "transparent", border: "none", color: V.dim, cursor: "pointer", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                  title="Forward 10s"
                >
                  <RotateCw size={14} />
                </motion.button>
                {/* Volume */}
                <div onMouseEnter={() => setIsVolumeHovered(true)} onMouseLeave={() => setIsVolumeHovered(false)} style={{ display: "flex", alignItems: "center", gap: 0, position: "relative" }}>
                  <motion.button onClick={toggleMute}
                    whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    style={{ background: "transparent", border: "none", color: V.dim, cursor: "pointer", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <AnimatePresence mode="wait">
                      <motion.div key={isMuted || volume === 0 ? "off" : "on"}
                        initial={{ scale: 0.5, opacity: 0, rotate: -30 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.5, opacity: 0, rotate: 30 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      >
                        {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      </motion.div>
                    </AnimatePresence>
                  </motion.button>
                  {/* Custom volume bar */}
                  <motion.div
                    initial={false}
                    animate={{ width: isVolumeHovered ? 60 : 0, opacity: isVolumeHovered ? 1 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    style={{ overflow: "hidden", position: "relative", height: 24, display: "flex", alignItems: "center" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      ref={volumeBarRef}
                      style={{
                        width: 52, height: 4, borderRadius: 2,
                        background: "rgba(255,255,255,0.12)", position: "relative",
                        cursor: "pointer",
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        isDraggingVolumeRef.current = true;
                        const r = e.currentTarget.getBoundingClientRect();
                        const x = Math.max(0, Math.min(e.clientX - r.left, r.width));
                        changeVolume(x / r.width);
                        const mm = (ev) => {
                          if (!isDraggingVolumeRef.current || !volumeBarRef.current) return;
                          const rr = volumeBarRef.current.getBoundingClientRect();
                          const xx = Math.max(0, Math.min(ev.clientX - rr.left, rr.width));
                          changeVolume(xx / rr.width);
                        };
                        const mu = () => {
                          isDraggingVolumeRef.current = false;
                          window.removeEventListener("mousemove", mm);
                          window.removeEventListener("mouseup", mu);
                        };
                        window.addEventListener("mousemove", mm);
                        window.addEventListener("mouseup", mu);
                      }}
                    >
                      {/* Fill */}
                      <div style={{
                        position: "absolute", left: 0, top: 0, bottom: 0,
                        width: `${(isMuted ? 0 : volume) * 100}%`,
                        background: `linear-gradient(90deg, ${V.accent}, #f0c060)`,
                        borderRadius: 2,
                        transition: isDraggingVolumeRef.current ? "none" : "width 0.1s ease",
                        boxShadow: `0 0 6px ${V.accentGlow}`,
                      }} />
                      {/* Thumb dot */}
                      <div style={{
                        position: "absolute", top: "50%",
                        left: `${(isMuted ? 0 : volume) * 100}%`,
                        transform: "translate(-50%, -50%)",
                        width: 10, height: 10, borderRadius: "50%",
                        background: "#fff",
                        boxShadow: `0 0 4px rgba(0,0,0,0.4), 0 0 0 1.5px ${V.accent}`,
                        transition: isDraggingVolumeRef.current ? "none" : "left 0.1s ease",
                      }} />
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Right: Subtitles + Shortcuts + Settings + Fullscreen */}
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <input type="file" accept=".srt,.vtt" ref={subtitleInputRef} onChange={handleSubtitleUpload} style={{ display: "none" }} />
                <motion.button onClick={(e) => { e.stopPropagation(); setShowSubtitlesMenu(!showSubtitlesMenu); setShowSettings(false); }}
                  whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  style={{
                    background: subtitleEnabled || showSubtitlesMenu ? V.accentDim : "transparent",
                    border: subtitleEnabled || showSubtitlesMenu ? `1px solid ${V.accentBorder}` : "none",
                    color: subtitleEnabled || showSubtitlesMenu ? V.accent : V.dim,
                    cursor: "pointer", width: 32, height: 32, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <Captions size={14} />
                  {subtitleEnabled && <div style={{ position: "absolute", top: 3, right: 3, width: 4, height: 4, background: V.accent, borderRadius: "50%" }} />}
                </motion.button>
                <motion.button onClick={(e) => { e.stopPropagation(); setShowShortcuts((p) => !p); }}
                  whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  style={{
                    background: showShortcuts ? V.accentDim : "transparent",
                    border: showShortcuts ? `1px solid ${V.accentBorder}` : "none",
                    color: showShortcuts ? V.accent : V.dim,
                    cursor: "pointer", width: 32, height: 32, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Keyboard size={14} />
                </motion.button>
                <motion.button onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); setShowSubtitlesMenu(false); }}
                  whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  style={{
                    background: showSettings ? V.accentDim : "transparent",
                    border: showSettings ? `1px solid ${V.accentBorder}` : "none",
                    color: showSettings ? V.accent : V.dim,
                    cursor: "pointer", width: 32, height: 32, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <motion.div
                    animate={{ rotate: showSettings ? 90 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Settings size={14} />
                  </motion.div>
                </motion.button>
                <motion.button onClick={toggleFullscreen}
                  whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  style={{ background: "transparent", border: "none", color: V.dim, cursor: "pointer", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ SETTINGS PANEL ══════════════════════════════════════════ */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute", bottom: 52, right: 16, zIndex: 50,
              width: 260, maxHeight: "50vh",
              background: "rgba(10,10,12,0.97)", backdropFilter: "blur(24px)",
              border: `1px solid ${V.glassBorder}`,
              borderRadius: 12, padding: "12px 14px", color: V.text,
              overflowY: "auto",
              boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
            }}
          >

            {/* Speed */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: V.faint, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, marginBottom: 8 }}>Playback Speed</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => (
                  <motion.button key={r} onClick={() => { sendCommand("setPlaybackRate", [r]); setPlaybackRate(r); setShowSettings(false); }}
                    whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    style={{
                      background: playbackRate === r ? V.accentDim : "rgba(255,255,255,0.04)",
                      color: playbackRate === r ? V.accent : V.dim,
                      border: playbackRate === r ? `1px solid ${V.accentBorder}` : `1px solid ${V.glassBorder}`,
                      padding: "5px 10px", borderRadius: 100, cursor: "pointer",
                      fontSize: 11, fontWeight: 700, transition: "all 0.15s",
                    }}
                  >
                    {r}x
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Quality */}
            {qualities?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: V.faint, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, marginBottom: 8 }}>Quality</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {qualities.map((q, i) => (
                    <motion.button key={i} onClick={() => { sendCommand("setQuality", [q.id || i]); setCurrentQuality(q); setShowSettings(false); }}
                      whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      style={{
                        background: (currentQuality?.id === q.id) ? V.accentDim : "rgba(255,255,255,0.04)",
                        color: (currentQuality?.id === q.id) ? V.accent : V.dim,
                        border: (currentQuality?.id === q.id) ? `1px solid ${V.accentBorder}` : `1px solid ${V.glassBorder}`,
                        padding: "5px 10px", borderRadius: 100, cursor: "pointer", fontSize: 11, fontWeight: 700,
                      }}
                    >
                      {q.name || q.height + "p" || i}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Audio */}
            {audioTracks?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: V.faint, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, marginBottom: 8 }}>Audio</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {audioTracks.map((t, i) => (
                    <button key={i} onClick={() => { sendCommand("setAudioTrack", [t.id || i]); setCurrentAudioTrack(t); setShowSettings(false); }}
                      style={{
                        background: (currentAudioTrack?.id === t.id) ? "rgba(232,168,56,0.06)" : "rgba(255,255,255,0.02)",
                        color: (currentAudioTrack?.id === t.id) ? V.accent : V.dim,
                        border: "none", padding: "6px 10px", borderRadius: 7,
                        cursor: "pointer", fontSize: 11, fontWeight: 600, textAlign: "left",
                      }}
                    >
                      {t.name || t.language || `Track ${i}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Aspect Ratio */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: V.faint, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, marginBottom: 8 }}>Aspect Ratio</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {ASPECT_RATIOS.map((ar, i) => (
                  <button key={ar.name} onClick={() => { setAspectRatioIndex(i); setShowSettings(false); setShowAspectRatioPopup(true); if (aspectRatioPopupRef.current) clearTimeout(aspectRatioPopupRef.current); aspectRatioPopupRef.current = setTimeout(() => setShowAspectRatioPopup(false), 1200); }}
                    style={{
                      background: aspectRatioIndex === i ? "rgba(232,168,56,0.06)" : "rgba(255,255,255,0.02)",
                      color: aspectRatioIndex === i ? V.accent : V.dim,
                      border: aspectRatioIndex === i ? `1px solid ${V.accentBorder}` : "none",
                      padding: "6px 10px", borderRadius: 7, cursor: "pointer",
                      fontSize: 11, fontWeight: 600, display: "flex", justifyContent: "space-between",
                    }}
                  >
                    {ar.name} {aspectRatioIndex === i && <Check size={11} strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Automations */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: V.faint, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, marginBottom: 8 }}>Automations</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Auto-Skip Intro", val: autoSkipIntro, set: setAutoSkipIntro, key: "streamly_autoSkip" },
                  ...(movie?.isSeries ? [{ label: "Auto-Play Next", val: autoPlayNext, set: setAutoPlayNext, key: "streamly_autoNext" }] : []),
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{item.label}</span>
                    <div onClick={() => { const v = !item.val; item.set(v); localStorage.setItem(item.key, String(v)); }}
                      style={{
                        width: 32, height: 17,
                        background: item.val ? V.accent : "rgba(255,255,255,0.1)",
                        borderRadius: 100, position: "relative", cursor: "pointer",
                        transition: "background 0.25s",
                      }}
                    >
                      <div style={{
                        width: 13, height: 13, background: "#fff", borderRadius: "50%",
                        position: "absolute", top: 2,
                        left: item.val ? 17 : 2,
                        transition: "left 0.25s cubic-bezier(0.4,0,0.2,1)",
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "10px 0" }} />
            <button onClick={(e) => { e.stopPropagation(); setUseNativeControls(true); setShowSettings(false); }}
              style={{
                width: "100%", background: "rgba(139,92,246,0.08)", color: "#8B5CF6",
                border: "1px solid rgba(139,92,246,0.2)", padding: 9, borderRadius: 8,
                cursor: "pointer", fontSize: 11, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <Captions size={13} /> Native Audio
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ SUBTITLES PANEL ══════════════════════════════════════════ */}
      <AnimatePresence>
        {showSubtitlesMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute", bottom: 52, right: 56, zIndex: 50,
              width: 240, maxHeight: "45vh",
              background: "rgba(10,10,12,0.97)", backdropFilter: "blur(24px)",
              border: `1px solid ${V.glassBorder}`,
              borderRadius: 12, padding: "12px 14px", color: V.text,
              overflowY: "auto",
              boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 10, color: V.faint, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700 }}>Subtitles</span>
              <div onClick={(e) => { e.stopPropagation(); setSubtitleEnabled(!subtitleEnabled); }}
                style={{
                  width: 32, height: 17,
                  background: subtitleEnabled ? V.accent : "rgba(255,255,255,0.1)",
                  borderRadius: 100, position: "relative", cursor: "pointer",
                  transition: "background 0.25s",
                }}
              >
                <div style={{
                  width: 13, height: 13, background: "#fff", borderRadius: "50%",
                  position: "absolute", top: 2,
                  left: subtitleEnabled ? 17 : 2,
                  transition: "left 0.25s cubic-bezier(0.4,0,0.2,1)",
                }} />
              </div>
            </div>
            <div data-scrollable="true" style={{
              background: "rgba(255,255,255,0.02)", padding: 8, borderRadius: 8,
              border: `1px solid ${V.glassBorder}`, maxHeight: 140,
              overflowY: "auto", marginBottom: 10,
            }}>
              {availableSubtitleLangs.length > 0 ? (
                availableSubtitleLangs.map((l, i) => (
                  <button key={i} onClick={() => { handleSubtitleLanguageSelect(l.downloadLink); setShowSubtitlesMenu(false); }}
                    style={{
                      display: "block", width: "100%", background: "transparent",
                      color: "rgba(255,255,255,0.8)", border: "none",
                      padding: "7px 10px", borderRadius: 6, cursor: "pointer",
                      fontSize: 12, fontWeight: 600, textAlign: "left", transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {l.language}
                  </button>
                ))
              ) : (
                <div style={{ fontSize: 11, color: V.faint, textAlign: "center", padding: 10 }}>
                  {isFetchingSubtitles ? "Searching..." : "No subtitles found"}
                </div>
              )}
            </div>
            <button onClick={(e) => { e.stopPropagation(); subtitleInputRef.current?.click(); setShowSubtitlesMenu(false); }}
              style={{
                width: "100%", background: "rgba(255,255,255,0.03)", color: V.text,
                border: `1px dashed ${V.glassBorder}`, padding: 10, borderRadius: 8,
                cursor: "pointer", fontSize: 12, fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <Upload size={12} /> {subtitleFileName || "Upload (.srt)"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTEXT MENU */}
      <AnimatePresence>
        {contextMenu.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.1 }}
            style={{
              position: "absolute", left: contextMenu.x, top: contextMenu.y, zIndex: 100,
              background: "rgba(10,10,12,0.95)", backdropFilter: "blur(16px)",
              border: `1px solid ${V.glassBorder}`, borderRadius: 10,
              padding: "4px 0", minWidth: 180,
              boxShadow: "0 16px 40px rgba(0,0,0,0.6)", pointerEvents: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            {[
              { icon: <Link size={12} />, label: "Copy URL", action: () => { navigator.clipboard.writeText(window.location.href); setContextMenu({ show: false, x: 0, y: 0 }); showToast("Copied"); } },
              { icon: <Repeat size={12} color={isLooping ? V.accent : "#fff"} />, label: isLooping ? "Loop On" : "Loop Off", action: () => { setIsLooping(!isLooping); setContextMenu({ show: false, x: 0, y: 0 }); } },
              { icon: isPlaying ? <Pause size={12} /> : <Play size={12} />, label: isPlaying ? "Pause" : "Play", action: () => { togglePlay(); setContextMenu({ show: false, x: 0, y: 0 }); } },
              { icon: isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />, label: isMuted ? "Unmute" : "Mute", action: () => { toggleMute(); setContextMenu({ show: false, x: 0, y: 0 }); } },
            ].map((item, i) => (
              <div key={i} className="void-hover" onClick={item.action}
                style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: V.text, fontSize: 11, fontWeight: 500 }}
              >
                {item.icon} {item.label}
              </div>
            ))}
            <div style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "3px 0" }} />
            <div className="void-hover" onClick={() => {
              setIsLoading(true); setIframeUrl("");
              setTimeout(() => { setHasInitiallyLoaded(false); contentSignatureRef.current = ""; }, 100);
              setContextMenu({ show: false, x: 0, y: 0 });
              showToast("Reloading...");
            }}
              style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: V.text, fontSize: 11, fontWeight: 500 }}
            >
              <RefreshCw size={12} /> Reload
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomVideoPlayer;
