import React, { useEffect, useState, useRef, useCallback } from "react";
import { VideoSourceAdapter } from "../api/videoSourceAdapter";
import { movieService } from "../api/movieService";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Settings, AlertCircle, Check, RotateCcw, RotateCw,
  MonitorPlay, Sparkles, SkipForward, FastForward, Rewind,
  Keyboard, X, Upload, Captions, Film, Link, Repeat, RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SubtitleEngine } from "../utils/SubtitleEngine";

const getNumericId = (idString) => {
  if (!idString) return null;
  const match = idString.toString().match(/\d+/);
  return match ? match[0] : null;
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
  { text: "Press 'F' or double-tap the center to toggle fullscreen.", icon: Keyboard },
  { text: "Use the left and right arrow keys to skip 10 seconds.", icon: Keyboard },
  { text: "Press 'M' to quickly mute or unmute the player.", icon: Keyboard },
  { text: "Change the streaming server in the bottom right if buffering.", icon: Settings },
  { text: "Press 'A' to cycle through different aspect ratios.", icon: MonitorPlay },
  { text: "Swipe or double-tap the sides of the screen to seek.", icon: Sparkles },
  { text: "You can adjust subtitle sync in the subtitle settings menu.", icon: Captions },
];

/* ─── Aurora Design System ─────────────────────────────────────── */
const AURORA = {
  bg: "#000",
  glass: "rgba(0,0,0,0.72)",
  glassBorder: "rgba(255,255,255,0.08)",
  accent: "#FF6B00",
  accentGlow: "rgba(255,107,0,0.5)",
  text: "#fff",
  textDim: "rgba(255,255,255,0.6)",
  textFaint: "rgba(255,255,255,0.35)",
  radius: "12px",
  radiusPill: "100px",
};

const CustomVideoPlayer = ({
  movie, season, episode, preferredServerIndex = 0, onServerChange,
  hasNextEpisode, onNextEpisode, thumbnailUrl, startTime = 0, onProgressUpdate,
}) => {
  /* ─── State ──────────────────────────────────────────────────── */
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
  const isLoopingRef = useRef(isLooping);
  useEffect(() => { isLoopingRef.current = isLooping; }, [isLooping]);

  const isCineSrc = iframeUrl.includes("cinesrc.st");
  const showCustomUI = isCineSrc && !useNativeControls;

  useEffect(() => {
    if (pausedInfoTimerRef.current) clearTimeout(pausedInfoTimerRef.current);
    if (!isPlaying && !isLoading && showCustomUI && hasInitiallyLoaded) {
      pausedInfoTimerRef.current = setTimeout(() => setShowPausedInfo(true), 2500);
    } else { setShowPausedInfo(false); }
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

  const isTvContent = movie?.isSeries || String(movie?.id || '').startsWith('tmdb-tv-');

  useEffect(() => {
    hasTriggeredNextRef.current = false; upNextShownRef.current = false;
    setShowUpNext(false); setSkipIntroTime(null); setShowSkipIntro(false); setUpNextCountdown(15);
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
    return () => { document.removeEventListener("fullscreenchange", h); document.removeEventListener("webkitfullscreenchange", h); };
  }, []);

  const contentSignatureRef = useRef("");
  const [dynamicTips, setDynamicTips] = useState(LOADING_TIPS);

  useEffect(() => { if (!isLoading && !hasInitiallyLoaded) setHasInitiallyLoaded(true); }, [isLoading, hasInitiallyLoaded]);

  useEffect(() => {
    if (movie?.id) {
      movieService.getSimilarMovies(movie.id, movie.platform || "tmdb").then((data) => {
        if (data && data.length > 0) {
          const recs = data.slice(0, 4).map((m) => ({ text: `You might also like: ${m.title || m.name}`, icon: Film }));
          const s = [...LOADING_TIPS, ...recs];
          for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; }
          setDynamicTips(s);
        }
      }).catch(() => {});
    }
  }, [movie]);

  useEffect(() => {
    if (!hasInitiallyLoaded) {
      const iv = setInterval(() => setCurrentTipIndex((p) => (p + 1) % dynamicTips.length), 3500);
      return () => clearInterval(iv);
    }
  }, [hasInitiallyLoaded, dynamicTips.length]);

  /* ─── URL Generation ─────────────────────────────────────────── */
  useEffect(() => {
    let watchdogTimer;
    const generateUrl = async () => {
      setIsLoading(true); setHasInitiallyLoaded(false);
      let resolvedImdbId = movie.imdbId || movie.imdb_id || movie.external_ids?.imdb_id;
      const targetId = getNumericId(movie.id);
      if (!targetId) { setIsLoading(false); setErrorMessage("Unable to load: no valid content ID found."); return; }
      if (!resolvedImdbId && (activeServerIndex === 2 || activeServerIndex === 3)) {
        try { const extIds = await movieService.getExternalIds(movie.id); if (extIds?.imdb_id) resolvedImdbId = extIds.imdb_id; } catch (e) { console.warn("Failed to fetch fallback IMDB ID", e); }
      }
      const isTv = movie?.isSeries || String(movie?.id || '').startsWith('tmdb-tv-');
      const newSig = `${targetId}-${isTv ? season : "m"}-${isTv ? episode : "m"}`;
      const isNew = contentSignatureRef.current !== newSig;
      contentSignatureRef.current = newSig;
      if (isNew) { setCurrentTime(0); setDuration(0); setBuffered(0); targetSeekTimeRef.current = null; }
      let url = VideoSourceAdapter.getStreamUrl(activeServerIndex, targetId, isTv ? season : null, isTv ? episode : null, resolvedImdbId, movie.title);
      if (activeServerIndex === 0) {
        if (!isNew && currentTime > 0 && targetSeekTimeRef.current === null) url += `&t=${Math.floor(currentTime)}&continueprompt=false`;
        else if (isNew && startTime > 0) url += `&t=${Math.floor(startTime)}&continueprompt=false`;
        if (useNativeControls) url = url.replace("&controls=false", "");
      }
      setIframeUrl(url);
      watchdogTimer = setTimeout(() => {
        setIsLoading((prev) => {
          if (prev) {
            setServerErrorCounts((errs) => {
              const si = activeServerIndexRef.current;
              const nc = (errs[si] || 0) + 1;
              if (nc >= 2) {
                setErrorMessage(`Server ${si + 1} timed out. Trying next...`);
                setTimeout(() => { setErrorMessage(""); const ni = (si + 1) % VideoSourceAdapter.getServers().length; setActiveServerIndex(ni); onServerChange?.(ni); }, 2000);
              } else { setErrorMessage(`Server ${si + 1} timed out. Retrying...`); setTimeout(() => setErrorMessage(""), 3000); }
              return { ...errs, [si]: nc };
            });
            return false;
          }
          return prev;
        });
      }, 12000);
    };
    generateUrl();
    return () => { if (watchdogTimer) clearTimeout(watchdogTimer); };
  }, [activeServerIndex, movie, season, episode, useNativeControls]);

  const sendCommand = useCallback((command, args = []) => {
    if (iframeRef.current?.contentWindow) iframeRef.current.contentWindow.postMessage({ type: "cinesrc:command", command, args }, "https://cinesrc.st");
  }, []);

  const startUpNextCountdown = useCallback(() => {
    if (upNextShownRef.current || !hasNextEpisode) return;
    upNextShownRef.current = true; setShowUpNext(true);
    if (autoPlayNextRef.current) {
      setUpNextCountdown(15); let c = 15;
      upNextIntervalRef.current = setInterval(() => { c -= 1; setUpNextCountdown(c); if (c <= 0) { clearInterval(upNextIntervalRef.current); setShowUpNext(false); if (!hasTriggeredNextRef.current) { hasTriggeredNextRef.current = true; onNextEpisode?.(); } } }, 1000);
    } else { setUpNextCountdown(null); }
  }, [hasNextEpisode, onNextEpisode]);

  const dismissUpNext = useCallback(() => { clearInterval(upNextIntervalRef.current); setShowUpNext(false); }, []);
  useEffect(() => () => clearInterval(upNextIntervalRef.current), []);

  /* ─── CineSrc PostMessage Listener ───────────────────────────── */
  useEffect(() => {
    if (!isCineSrc) return;
    const handleMessage = (event) => {
      if (event.origin !== "https://cinesrc.st") return;
      if (!event.data || typeof event.data !== "object") return;
      let type, data;
      try { ({ type, ...data } = event.data); } catch { return; }
      switch (type) {
        case "cinesrc:ready":
          sendCommand("setVolume", [isMuted ? 0 : volume]);
          sendCommand("setPlaybackRate", [playbackRate]);
          sendCommand("play");
          sendCommand("getCurrentTime"); sendCommand("getDuration"); sendCommand("getVolume");
          sendCommand("getPaused"); sendCommand("getPlaybackRate");
          sendCommand("getAudioTracks"); sendCommand("getTracks"); sendCommand("getAudio");
          sendCommand("getQualities"); sendCommand("getLevels"); sendCommand("getResolutions");
          sendCommand("getQuality"); sendCommand("getCurrentQuality"); sendCommand("getCurrentLevel");
          sendCommand("getCurrentResolution"); sendCommand("getCurrentAudioTrack"); sendCommand("getCurrentTrack");
          break;
        case "cinesrc:response":
          switch (data.command) {
            case "getCurrentTime": if (data.result != null && targetSeekTimeRef.current === null) setCurrentTime(data.result); break;
            case "getDuration": if (data.result) setDuration(data.result); break;
            case "getVolume": if (data.result != null) setVolume(data.result); break;
            case "getPaused": if (data.result != null) setIsPlaying(!data.result); break;
            case "getPlaybackRate": if (data.result != null) setPlaybackRate(data.result); break;
            case "getAudioTracks": case "getTracks": case "getAudio": if (data.result) setAudioTracks(data.result); break;
            case "getQualities": case "getLevels": case "getResolutions": if (data.result) setQualities(data.result); break;
            case "getCurrentQuality": case "getCurrentLevel": case "getCurrentResolution": case "getQuality": if (data.result != null) setCurrentQuality(data.result); break;
            case "getCurrentAudioTrack": case "getCurrentTrack": if (data.result != null) setCurrentAudioTrack(data.result); break;
            default: break;
          } break;
        case "cinesrc:loadedmetadata": if (data.duration) setDuration(data.duration); break;
        case "cinesrc:waiting": setIsLoading(true); break;
        case "cinesrc:seeking": setIsLoading(true); break;
        case "cinesrc:seeked": targetSeekTimeRef.current = null; setIsLoading(false); break;
        case "cinesrc:playing": setIsLoading(false); setIsPlaying(true); break;
        case "cinesrc:progress": if (data.buffered !== undefined) setBuffered(data.buffered); break;
        case "cinesrc:timeupdate":
          if (isLoading) setIsLoading(false);
          if (!isScrubbing && targetSeekTimeRef.current === null) {
            setCurrentTime(data.currentTime);
            onProgressUpdate?.(data.currentTime, data.duration);
            if (hasSubtitlesRef.current) {
              const cue = subtitleEngineRef.current.getActiveCue(data.currentTime);
              setActiveSubtitleCue((prev) => prev?.start === cue?.start && prev?.end === cue?.end && prev?.text === cue?.text ? prev : cue);
            }
          }
          if (data.duration) setDuration(data.duration);
          if (data.buffered !== undefined) setBuffered(data.buffered);
          if (!isScrubbing) setIsLoading(false);
          if (data.duration > 0 && data.currentTime >= data.duration - 30 && hasNextEpisode && !upNextShownRef.current && !isLoopingRef.current) startUpNextCountdown();
          if (data.duration > 0 && data.currentTime >= data.duration - 1 && hasNextEpisode && onNextEpisode && !hasTriggeredNextRef.current && !isLoopingRef.current) { hasTriggeredNextRef.current = true; clearInterval(upNextIntervalRef.current); setShowUpNext(false); onNextEpisode(); }
          break;
        case "cinesrc:ended":
          if (isLoopingRef.current) { sendCommand("seek", [0]); sendCommand("play"); return; }
          if (hasNextEpisode && onNextEpisode && !hasTriggeredNextRef.current) { hasTriggeredNextRef.current = true; clearInterval(upNextIntervalRef.current); setShowUpNext(false); onNextEpisode(); }
          break;
        case "cinesrc:nextepisode":
          if (!data.internalNavigation && onNextEpisode && !hasTriggeredNextRef.current) { hasTriggeredNextRef.current = true; onNextEpisode(); }
          break;
        case "cinesrc:skipintro":
          if (data.time != null) {
            if (autoSkipIntro) { sendCommand("setCurrentTime", [data.time]); showToast("Intro Skipped Automatically"); }
            else { setSkipIntroTime(data.time); setShowSkipIntro(true); clearTimeout(skipIntroTimeoutRef.current); skipIntroTimeoutRef.current = setTimeout(() => setShowSkipIntro(false), 15000); }
          } break;
        case "cinesrc:sourceused":
          if (data.sourceId) { setActiveSourceId(data.sourceId); localStorage.setItem("streamly_lastserver", data.sourceId); setLastServer(data.sourceId); }
          break;
        case "cinesrc:play": setIsLoading(false); setIsPlaying(true); break;
        case "cinesrc:pause": setIsPlaying(false); if (!isScrubbing) setIsLoading(false); break;
        case "cinesrc:ratechange": setPlaybackRate(data.playbackRate); break;
        case "cinesrc:volumechange": if (data.volume !== undefined) setVolume(data.volume); if (data.muted !== undefined) setIsMuted(data.muted); break;
        case "cinesrc:error":
          console.error("CineSrc Error:", data.error); setIsLoading(false);
          const esi = activeServerIndexRef.current;
          setServerErrorCounts((prev) => {
            const nc = (prev[esi] || 0) + 1; const u = { ...prev, [esi]: nc };
            if (nc >= 2) { setErrorMessage(`Server ${esi + 1} failed. Trying next…`); setTimeout(() => { setErrorMessage(""); const ni = (esi + 1) % VideoSourceAdapter.getServers().length; setActiveServerIndex(ni); onServerChange?.(ni); }, 2500); }
            else { setErrorMessage("Stream failed. Retrying…"); setTimeout(() => setErrorMessage(""), 3000); }
            return u;
          }); break;
        default: break;
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isCineSrc, isScrubbing, volume, isMuted, playbackRate, sendCommand, hasNextEpisode, onNextEpisode, activeServerIndex, startUpNextCountdown]);

  /* ─── Actions ─────────────────────────────────────────────────── */
  const triggerCenterIcon = useCallback((type) => {
    centerIconKeyRef.current += 1; setCenterIcon({ type });
    if (centerIconTimeoutRef.current) clearTimeout(centerIconTimeoutRef.current);
    centerIconTimeoutRef.current = setTimeout(() => setCenterIcon(null), 800);
  }, []);

  const triggerSideIcon = useCallback((type, text) => {
    setSideIcon({ type, text });
    if (sideIconTimeoutRef.current) clearTimeout(sideIconTimeoutRef.current);
    sideIconTimeoutRef.current = setTimeout(() => setSideIcon(null), 800);
  }, []);

  const togglePlay = useCallback((e) => {
    if (e) e.stopPropagation();
    if (isPlaying) { sendCommand("pause"); setIsPlaying(false); if (showCustomUI) triggerCenterIcon("pause"); }
    else { sendCommand("play"); setIsPlaying(true); if (showCustomUI) triggerCenterIcon("play"); }
  }, [isPlaying, sendCommand, triggerCenterIcon, showCustomUI]);

  const changeVolume = useCallback((newVol) => {
    const v = Math.max(0, Math.min(newVol, 1)); setVolume(v);
    localStorage.setItem("streamly_volume", v.toString()); sendCommand("setVolume", [v]);
    if (v > 0 && isMuted) { setIsMuted(false); localStorage.setItem("streamly_muted", "false"); }
  }, [isMuted, sendCommand]);

  const toggleMute = useCallback((e) => {
    if (e) e.stopPropagation(); const n = !isMuted; setIsMuted(n);
    localStorage.setItem("streamly_muted", n.toString()); sendCommand("setVolume", [n ? 0 : volume]);
  }, [isMuted, volume, sendCommand]);

  const seekRelative = useCallback((seconds) => {
    const base = targetSeekTimeRef.current !== null ? targetSeekTimeRef.current : currentTime;
    const nt = Math.max(0, Math.min(base + seconds, duration || Infinity));
    targetSeekTimeRef.current = nt; setCurrentTime(nt); sendCommand("seek", [nt]);
    seekAccumulatorRef.current += seconds; const acc = seekAccumulatorRef.current;
    if (acc > 0) triggerSideIcon("forward", `+${acc}s`);
    else if (acc < 0) triggerSideIcon("backward", `${acc}s`);
    if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
    seekTimeoutRef.current = setTimeout(() => { seekAccumulatorRef.current = 0; }, 1000);
  }, [currentTime, duration, sendCommand, triggerSideIcon]);

  const handleSubtitleUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setSubtitleFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result; let parsed = [];
      if (file.name.endsWith(".srt")) parsed = SubtitleEngine.parseSRT(text);
      else if (file.name.endsWith(".vtt")) parsed = SubtitleEngine.parseVTT(text);
      if (parsed.length > 0) { subtitleEngineRef.current.setCues(parsed); setHasSubtitles(true); setSubtitleEnabled(true); showToast("Subtitles loaded"); }
      else showToast("Failed to parse subtitles");
    };
    reader.readAsText(file); e.target.value = null;
  };

  const fetchAvailableSubtitles = useCallback(async (silent = false) => {
    const imdbId = movie.imdbId || movie.imdb_id || movie.external_ids?.imdb_id;
    const fq = movie.title ? `${movie.title} ${movie.releaseYear || ""}`.trim() : "";
    if (!imdbId && !fq) { if (!silent) showToast("No ID or Title found"); return; }
    setIsFetchingSubtitles(true); if (!silent) showToast("Searching for subtitles...");
    try {
      const { SubtitleFetcher } = await import("../api/subtitles");
      const langs = await SubtitleFetcher.searchAvailableSubtitles(imdbId, fq);
      if (langs.length > 0) { setAvailableSubtitleLangs(langs); if (!silent) showToast(`Found subtitles in ${langs.length} languages!`); }
      else if (!silent) showToast("No subtitles found on OpenSubtitles");
    } catch { if (!silent) showToast("Failed to fetch subtitles list"); } finally { setIsFetchingSubtitles(false); }
  }, [movie.imdbId, movie.imdb_id, movie.external_ids, movie.title, movie.releaseYear]);

  useEffect(() => { fetchAvailableSubtitles(true); }, [fetchAvailableSubtitles, season, episode]);

  const handleSubtitleLanguageSelect = async (link) => {
    if (!link) return;
    const langObj = availableSubtitleLangs.find((l) => l.downloadLink === link);
    if (!langObj) return;
    showToast(`Downloading ${langObj.language} subtitles...`); setIsFetchingSubtitles(true);
    try {
      const { SubtitleFetcher } = await import("../api/subtitles");
      const srtText = await SubtitleFetcher.downloadAndDecompress(link);
      if (srtText) { const parsed = SubtitleEngine.parseSRT(srtText);
        if (parsed.length > 0) { subtitleEngineRef.current.setCues(parsed); setHasSubtitles(true); setSubtitleEnabled(true); setSubtitleFileName(`Auto (${langObj.language})`); showToast(`${langObj.language} subtitles loaded!`); }
        else showToast("Subtitle file was empty");
      } else showToast("Failed to download subtitle file");
    } catch { showToast("Error downloading subtitle"); } finally { setIsFetchingSubtitles(false); }
  };

  const toggleFullscreen = useCallback((e) => {
    if (e) e.stopPropagation(); const el = containerRef.current;
    if (!isFullscreen) { el?.requestFullscreen?.() || el?.webkitRequestFullscreen?.(); }
    else { document.exitFullscreen?.() || document.webkitExitFullscreen?.(); }
  }, [isFullscreen]);

  const formatTime = (t) => {
    if (!t || isNaN(t)) return "0:00";
    const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = Math.floor(t % 60);
    if (h > 0) return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const showToast = useCallback((msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg); toastTimeoutRef.current = setTimeout(() => setToastMessage(""), 2000);
  }, []);

  const handleProgressScrub = useCallback((e) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const nt = (x / rect.width) * duration;
    setCurrentTime(nt); targetSeekTimeRef.current = nt; sendCommand("seek", [nt]);
  }, [duration, sendCommand]);

  const handleProgressHover = useCallback((e) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setHoverX(x); setHoverTime((x / rect.width) * duration);
  }, [duration]);

  const onProgressMouseDown = (e) => { e.stopPropagation(); setIsScrubbing(true); handleProgressScrub(e); };

  useEffect(() => {
    if (!isScrubbing) return;
    const mm = (e) => handleProgressScrub(e);
    const mu = () => setIsScrubbing(false);
    window.addEventListener("mousemove", mm); window.addEventListener("mouseup", mu);
    return () => { window.removeEventListener("mousemove", mm); window.removeEventListener("mouseup", mu); };
  }, [isScrubbing, handleProgressScrub]);

  /* ─── Keyboard Controls ──────────────────────────────────────── */
  useEffect(() => {
    if (!isCineSrc) return;
    const h = (e) => {
      if (document.activeElement.tagName.toLowerCase() === "input") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      switch (e.key.toLowerCase()) {
        case " ": case "k": e.preventDefault(); togglePlay(); break;
        case "f": e.preventDefault(); toggleFullscreen(); break;
        case "m": e.preventDefault(); toggleMute(); break;
        case "arrowright": case "l": case ">": case ".": e.preventDefault(); seekRelative(10); break;
        case "arrowleft": case "j": case "<": case ",": e.preventDefault(); seekRelative(-10); break;
        case "arrowup": e.preventDefault(); changeVolume(volume + 0.1); showToast(`Volume: ${Math.round(Math.min(volume + 0.1, 1) * 100)}%`); break;
        case "arrowdown": e.preventDefault(); changeVolume(volume - 0.1); showToast(`Volume: ${Math.round(Math.max(volume - 0.1, 0) * 100)}%`); break;
        case "a": e.preventDefault(); setAspectRatioIndex((p) => { const n = (p + 1) % ASPECT_RATIOS.length; showToast(`Aspect: ${ASPECT_RATIOS[n].name}`); return n; }); break;
        case "?": e.preventDefault(); setShowShortcuts((p) => !p); break;
        case "[": e.preventDefault(); setBrightness((p) => { const n = Math.max(0.1, p - 0.1); showToast(`Brightness: ${Math.round(n * 100)}%`); return n; }); break;
        case "]": e.preventDefault(); setBrightness((p) => { const n = Math.min(1, p + 0.1); showToast(`Brightness: ${Math.round(n * 100)}%`); return n; }); break;
        case "escape": setShowShortcuts(false); setShowSettings(false); setShowSubtitlesMenu(false); break;
        default: break;
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isCineSrc, togglePlay, toggleFullscreen, toggleMute, seekRelative, volume, changeVolume, showToast]);

  useEffect(() => {
    const el = containerRef.current; if (!el || !showCustomUI) return;
    const h = (e) => {
      if (showSettings || showSubtitlesMenu || showShortcuts || e.target.closest('[data-scrollable="true"]')) return;
      e.preventDefault(); const d = e.deltaY < 0 ? 0.05 : -0.05;
      const nv = Math.max(0, Math.min(volume + d, 1)); changeVolume(nv);
      showToast(`Volume: ${Math.round(nv * 100)}%`);
    };
    el.addEventListener("wheel", h, { passive: false });
    return () => el.removeEventListener("wheel", h);
  }, [showCustomUI, volume, changeVolume, showToast, showSettings, showSubtitlesMenu, showShortcuts]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying && !showSettings && !showSubtitlesMenu && !isLoading && !isScrubbing)
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2500);
  };

  const handleOverlayClick = (e) => {
    if (contextMenu.show) { setContextMenu({ show: false, x: 0, y: 0 }); return; }
    if (showSettings) { setShowSettings(false); return; }
    if (showSubtitlesMenu) { setShowSubtitlesMenu(false); return; }
    if (showShortcuts) { setShowShortcuts(false); return; }
    if (isLoading) return;
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current); clickTimeoutRef.current = null;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      if (pct < 0.3) { seekRelative(-10); setDoubleTapRipple({ side: "left", id: Date.now() }); setTimeout(() => setDoubleTapRipple(null), 600); }
      else if (pct > 0.7) { seekRelative(10); setDoubleTapRipple({ side: "right", id: Date.now() }); setTimeout(() => setDoubleTapRipple(null), 600); }
      else toggleFullscreen();
    } else { clickTimeoutRef.current = setTimeout(() => { clickTimeoutRef.current = null; togglePlay(); }, 200); }
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration ? (buffered / duration) * 100 : 0;

  /* ─── Render ──────────────────────────────────────────────────── */
  return (
    <div
      ref={containerRef}
      className="aurora-player"
      style={{
        position: "relative", width: "100%",
        aspectRatio: isFullscreen ? undefined : "16 / 9",
        height: isFullscreen ? "100vh" : "auto",
        maxHeight: isFullscreen ? "100vh" : "calc(100vh - 120px)",
        background: AURORA.bg, borderRadius: isFullscreen ? "0" : "0",
        overflow: "hidden",
        boxShadow: isFullscreen ? "none" : "0 24px 80px rgba(0,0,0,0.95)",
        cursor: showControls || !showCustomUI ? "default" : "none",
        minHeight: isFullscreen ? "100vh" : undefined,
        userSelect: "none", WebkitUserSelect: "none",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { if (isPlaying && !showSettings && !showSubtitlesMenu && !isLoading && !isScrubbing) setShowControls(false); }}
      onContextMenu={(e) => { if (!showCustomUI) return; e.preventDefault(); const r = containerRef.current.getBoundingClientRect(); setContextMenu({ show: true, x: Math.min(e.clientX - r.left, r.width - 220), y: Math.min(e.clientY - r.top, r.height - 280) }); }}
    >
      {/* ── IFRAME ───────────────────────────────────────────────── */}
      {iframeUrl && (
        <iframe
          ref={iframeRef}
          key={`iframe-${activeServerIndex}-${useNativeControls}`}
          src={iframeUrl}
          style={{
            width: "100%", height: "100%", border: "none", background: "#000",
            pointerEvents: isCineSrc ? "auto" : (showCustomUI ? "none" : "auto"),
            opacity: isLoading && !hasInitiallyLoaded ? 0 : 1,
            transition: "opacity 0.4s ease",
            filter: brightness !== 1 ? `brightness(${brightness})` : undefined,
            ...ASPECT_RATIOS[aspectRatioIndex].style,
          }}
          allow="autoplay; fullscreen; picture-in-picture"
          onLoad={() => { if (!isCineSrc) setIsLoading(false); }}
        />
      )}

      {/* ── CLICK OVERLAY ───────────────────────────────────────── */}
      {showCustomUI && !isCineSrc && <div onClick={handleOverlayClick} style={{ position: "absolute", inset: 0, zIndex: 10 }} />}

      {/* ── CINESRC MOUSE OVERLAY ───────────────────────────────── */}
      {showCustomUI && isCineSrc && (
        <div
          onMouseMove={handleMouseMove}
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          onDoubleClick={(e) => {
            e.stopPropagation(); const r = containerRef.current.getBoundingClientRect();
            const pct = (e.clientX - r.left) / r.width;
            if (pct < 0.3) { seekRelative(-10); setDoubleTapRipple({ side: "left", id: Date.now() }); setTimeout(() => setDoubleTapRipple(null), 600); }
            else if (pct > 0.7) { seekRelative(10); setDoubleTapRipple({ side: "right", id: Date.now() }); setTimeout(() => setDoubleTapRipple(null), 600); }
            else toggleFullscreen();
          }}
          style={{ position: "absolute", inset: 0, zIndex: 9, cursor: showControls ? "default" : "none" }}
        />
      )}

      {/* ── SUBTITLE OVERLAY ────────────────────────────────────── */}
      {showCustomUI && subtitleEnabled && hasSubtitles && activeSubtitleCue && (
        <div style={{ position: "absolute", bottom: showControls || !isPlaying || isScrubbing ? "120px" : "50px", left: 0, right: 0, display: "flex", justifyContent: "center", pointerEvents: "none", zIndex: 15, transition: "bottom 0.3s cubic-bezier(0.4,0,0.2,1)" }}>
          <div style={{ color: "#fff", padding: "8px 24px", fontFamily: '"SF Pro Display", -apple-system, sans-serif', fontSize: "clamp(18px, 3vw, 30px)", lineHeight: 1.4, fontWeight: 700, textShadow: "0 2px 12px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.6)", textAlign: "center", maxWidth: "85%", whiteSpace: "pre-wrap", letterSpacing: "0.3px" }}>
            {activeSubtitleCue.text}
          </div>
        </div>
      )}

      {/* ── GRADIENT OVERLAYS ───────────────────────────────────── */}
      {showCustomUI && (
        <>
          <div style={{ position: "absolute", inset: 0, zIndex: 11, pointerEvents: "none", background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 18%, rgba(0,0,0,0.15) 40%, transparent 60%)", transition: "opacity 0.4s", opacity: showControls || !isPlaying || isScrubbing ? 1 : 0 }} />
          <div style={{ position: "absolute", inset: 0, zIndex: 11, pointerEvents: "none", background: "linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 25%)", transition: "opacity 0.4s", opacity: showControls || !isPlaying ? 1 : 0 }} />
        </>
      )}

      {/* ── TOP INFO BAR ────────────────────────────────────────── */}
      {showCustomUI && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 14, pointerEvents: "none", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, transition: "opacity 0.4s", opacity: showControls || !isPlaying ? 1 : 0 }}
        >
          <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontWeight: 800, fontSize: "clamp(0.9rem, 1.6vw, 1.2rem)", color: "#fff", textShadow: "0 2px 16px rgba(0,0,0,0.9)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "55vw", letterSpacing: "-0.02em" }}>
              {movie?.title || movie?.name}
            </span>
            {movie?.isSeries && season && (
              <span style={{ display: "inline-flex", alignItems: "center", background: "rgba(255,107,0,0.2)", color: AURORA.accent, border: "1px solid rgba(255,107,0,0.3)", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 800, flexShrink: 0, letterSpacing: "0.03em" }}>
                S{season}{episode ? ` · E${episode}` : ""}
              </span>
            )}
          </div>
          {duration > 0 && (
            <span style={{ fontSize: 12, color: AURORA.textDim, fontWeight: 700, fontFamily: "monospace", textShadow: "0 1px 8px rgba(0,0,0,0.9)", flexShrink: 0, letterSpacing: "0.5px" }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          )}
        </motion.div>
      )}

      {/* ── INITIAL LOAD BACKGROUND ──────────────────────────────── */}
      <AnimatePresence>
        {isLoading && !hasInitiallyLoaded && thumbnailUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}
            style={{ position: "absolute", inset: 0, zIndex: 4, backgroundImage: `url(${thumbnailUrl})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(60px) brightness(0.25)", transform: "scale(1.2)" }}
          />
        )}
      </AnimatePresence>

      {/* ── CENTER LOADER ───────────────────────────────────────── */}
      <AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            style={{ position: "absolute", inset: 0, zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none", gap: 20 }}
          >
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${AURORA.glassBorder}` }}>
              <motion.svg viewBox="0 0 50 50" style={{ width: 32, height: 32, overflow: "visible" }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,107,0,0.12)" strokeWidth="3" />
                <circle cx="25" cy="25" r="20" fill="none" stroke={AURORA.accent} strokeWidth="3" strokeLinecap="round" strokeDasharray="40 85.6" style={{ filter: `drop-shadow(0 0 6px ${AURORA.accentGlow})` }} />
              </motion.svg>
            </div>
            {!hasInitiallyLoaded && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, maxWidth: 600, width: "90%" }}>
                <div style={{ color: "#fff", fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)", fontWeight: 800, textAlign: "center", letterSpacing: "-0.02em", textShadow: "0 4px 20px rgba(0,0,0,0.8)" }}>
                  {movie?.title || movie?.name || "Loading"}
                </div>
                <div style={{ color: AURORA.accent, fontSize: 12, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase" }}>
                  {movie?.isSeries ? `Season ${season} Episode ${episode}` : "Fetching stream..."}
                </div>
                <div style={{ marginTop: 16, height: 36, position: "relative", width: "100%", display: "flex", justifyContent: "center" }}>
                  <AnimatePresence mode="wait">
                    {dynamicTips[currentTipIndex] && (() => {
                      const TipIcon = dynamicTips[currentTipIndex].icon;
                      return (
                        <motion.div key={currentTipIndex} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
                          style={{ position: "absolute", display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.5)", padding: "8px 16px", borderRadius: AURORA.radiusPill, border: `1px solid ${AURORA.glassBorder}`, backdropFilter: "blur(12px)", whiteSpace: "nowrap" }}
                        >
                          <TipIcon size={13} color={AURORA.accent} />
                          <span style={{ color: AURORA.textDim, fontSize: 12, fontWeight: 600 }}>{dynamicTips[currentTipIndex].text}</span>
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

      {/* ── ERROR BANNER ────────────────────────────────────────── */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}
            style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", background: "rgba(220,38,38,0.9)", color: "#fff", padding: "8px 20px", borderRadius: AURORA.radiusPill, display: "flex", alignItems: "center", gap: 8, zIndex: 60, backdropFilter: "blur(12px)", fontWeight: 700, fontSize: 12, boxShadow: "0 8px 24px rgba(220,38,38,0.4)", whiteSpace: "nowrap" }}
          ><AlertCircle size={14} /> {errorMessage}</motion.div>
        )}
      </AnimatePresence>

      {/* ── TOAST ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: -12, x: "-50%", scale: 0.95 }} animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }} exit={{ opacity: 0, y: -8, x: "-50%", scale: 0.95 }} transition={{ duration: 0.2 }}
            style={{ position: "absolute", top: 24, left: "50%", background: AURORA.glass, color: "#fff", padding: "8px 20px", borderRadius: AURORA.radiusPill, backdropFilter: "blur(20px)", border: `1px solid ${AURORA.glassBorder}`, zIndex: 62, fontWeight: 700, fontSize: 12, pointerEvents: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}
          >{toastMessage}</motion.div>
        )}
      </AnimatePresence>

      {/* ── SHORTCUTS MODAL ─────────────────────────────────────── */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowShortcuts(false)}
            style={{ position: "absolute", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          >
            <motion.div initial={{ scale: 0.92, opacity: 0, y: 14 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 8 }} transition={{ type: "spring", stiffness: 380, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: "rgba(12,12,14,0.96)", border: `1px solid ${AURORA.glassBorder}`, borderRadius: 20, padding: "24px 28px", width: 300, color: "#fff", boxShadow: "0 40px 80px rgba(0,0,0,0.8)", backdropFilter: "blur(30px)" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,107,0,0.12)", border: "1px solid rgba(255,107,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Keyboard size={14} color={AURORA.accent} />
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>Shortcuts</span>
                </div>
                <button onClick={() => setShowShortcuts(false)} style={{ background: "transparent", border: "none", color: AURORA.textFaint, cursor: "pointer", padding: 4, display: "flex" }}><X size={16} /></button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {KEYBOARD_SHORTCUTS.map(({ key, action }) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: AURORA.textDim, fontSize: 12 }}>{action}</span>
                    <span style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${AURORA.glassBorder}`, padding: "2px 10px", borderRadius: 6, fontFamily: "monospace", fontWeight: 700, fontSize: 11, color: AURORA.accent, whiteSpace: "nowrap" }}>{key}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${AURORA.glassBorder}`, textAlign: "center", color: AURORA.textFaint, fontSize: 11 }}>
                Press <span style={{ color: AURORA.textDim, fontFamily: "monospace", fontWeight: 700 }}>?</span> or click anywhere to dismiss
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CENTER PLAY/PAUSE FLASH ─────────────────────────────── */}
      {showCustomUI && (
        <div style={{ position: "absolute", inset: 0, zIndex: 12, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <AnimatePresence>
            {centerIcon && (
              <motion.div key={centerIcon.type + centerIconKeyRef.current}
                initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.4 }}
                transition={{ duration: 0.35, type: "spring", stiffness: 400, damping: 25 }}
                style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${AURORA.glassBorder}`, position: "absolute" }}
              >
                <motion.div initial={{ opacity: 0.8, scale: 0.8 }} animate={{ opacity: 0, scale: 2 }} transition={{ duration: 0.5, ease: "easeOut" }}
                  style={{ position: "absolute", inset: -1, borderRadius: "50%", border: `2px solid ${AURORA.accent}` }}
                />
                {centerIcon.type === "play" ? <Play size={30} fill={AURORA.accent} color={AURORA.accent} style={{ marginLeft: 4 }} /> : <Pause size={30} fill={AURORA.accent} color={AURORA.accent} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── PAUSED INFO ─────────────────────────────────────────── */}
      {showPausedInfo && showCustomUI && (
        <motion.div initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: "absolute", left: 20, bottom: 88, zIndex: 15, display: "flex", gap: 14, alignItems: "center", maxWidth: "min(520px, 86%)", pointerEvents: "none", textAlign: "left" }}
        >
          {(movie?.posterUrl || movie?.backdropUrl || thumbnailUrl) && (
            <div style={{ width: "clamp(72px, 11vw, 110px)", aspectRatio: "2/3", borderRadius: 10, overflow: "hidden", flexShrink: 0, boxShadow: "0 16px 48px rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)" }}>
              <img src={movie?.posterUrl || movie?.backdropUrl || thumbnailUrl} alt={movie?.title || movie?.name} loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, color: AURORA.accent, fontSize: 11, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 6 }}>
              <Pause size={12} fill={AURORA.accent} color={AURORA.accent} /> Paused
              {movie?.isSeries && season && <span style={{ color: AURORA.textDim }}>S{season}{episode ? ` E${episode}` : ""}</span>}
            </div>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: "clamp(1.1rem, 2.4vw, 1.6rem)", lineHeight: 1.12, textShadow: "0 3px 16px rgba(0,0,0,0.9)", marginBottom: 6, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
              {movie?.title || movie?.name}
            </div>
            {movie?.overview && (
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "clamp(0.75rem, 1.3vw, 0.9rem)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}>
                {movie.overview}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── DOUBLE TAP RIPPLE ───────────────────────────────────── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 11, pointerEvents: "none", display: "flex", alignItems: "center" }}>
        <AnimatePresence>
          {doubleTapRipple && (
            <motion.div key={doubleTapRipple.id}
              initial={{ opacity: 0.6, scale: 0.8 }} animate={{ opacity: 0, scale: 1.4 }} transition={{ duration: 0.45, ease: "easeOut" }}
              style={{ position: "absolute", [doubleTapRipple.side]: 0, width: "35%", height: "100%", background: `radial-gradient(ellipse at ${doubleTapRipple.side} center, rgba(255,255,255,0.12) 0%, transparent 70%)` }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── SIDE SEEK INDICATORS ────────────────────────────────── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 12, pointerEvents: "none", display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "30%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AnimatePresence>
            {sideIcon?.type === "backward" && (
              <motion.div key="bwd" initial={{ opacity: 0, scale: 0.6, x: -24 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 1.1, x: -12 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, width: 80, height: 80, borderRadius: "50%", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(16px)", border: `1px solid ${AURORA.glassBorder}` }}
              >
                <Rewind size={28} color={AURORA.accent} strokeWidth={2} fill="rgba(255,107,0,0.2)" />
                <span style={{ fontSize: 11, fontWeight: 800, color: AURORA.accent, fontFamily: "monospace" }}>{sideIcon.text}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "30%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AnimatePresence>
            {sideIcon?.type === "forward" && (
              <motion.div key="fwd" initial={{ opacity: 0, scale: 0.6, x: 24 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 1.1, x: 12 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, width: 80, height: 80, borderRadius: "50%", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(16px)", border: `1px solid ${AURORA.glassBorder}` }}
              >
                <FastForward size={28} color={AURORA.accent} strokeWidth={2} fill="rgba(255,107,0,0.2)" />
                <span style={{ fontSize: 11, fontWeight: 800, color: AURORA.accent, fontFamily: "monospace" }}>{sideIcon.text}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── NATIVE PLAYER EXIT ──────────────────────────────────── */}
      {useNativeControls && (
        <AnimatePresence>
          {showControls && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} style={{ position: "absolute", top: 16, right: 16, zIndex: 50 }}>
              <button onClick={() => setUseNativeControls(false)}
                style={{ background: AURORA.accent, color: "#fff", border: "none", padding: "8px 16px", borderRadius: AURORA.radiusPill, cursor: "pointer", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 6, boxShadow: `0 4px 16px rgba(255,107,0,0.4)` }}
              ><MonitorPlay size={14} /> Exit Native</button>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ── SUBTITLES PANEL ─────────────────────────────────────── */}
      <AnimatePresence>
        {showSubtitlesMenu && (
          <motion.div initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            style={{ position: "absolute", bottom: 84, right: 44, zIndex: 50, background: "rgba(10,10,12,0.94)", backdropFilter: "blur(30px) saturate(160%)", border: `1px solid ${AURORA.glassBorder}`, borderRadius: 18, padding: 16, width: 245, color: "#fff", boxShadow: "0 24px 56px rgba(0,0,0,0.75)", display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: AURORA.textFaint, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700 }}>Subtitles</span>
              <div onClick={(e) => { e.stopPropagation(); setSubtitleEnabled(!subtitleEnabled); }}
                style={{ width: 34, height: 18, background: subtitleEnabled ? AURORA.accent : "rgba(255,255,255,0.12)", borderRadius: AURORA.radiusPill, position: "relative", cursor: "pointer", transition: "background 0.25s" }}
              >
                <div style={{ width: 14, height: 14, background: "#fff", borderRadius: "50%", position: "absolute", top: 2, left: subtitleEnabled ? 18 : 2, transition: "left 0.25s cubic-bezier(0.4,0,0.2,1)", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
              </div>
            </div>
            <div data-scrollable="true" style={{ background: "rgba(255,255,255,0.02)", padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,0.03)", display: "flex", flexDirection: "column", gap: 3, maxHeight: 180, overflowY: "auto" }}>
              {availableSubtitleLangs.length > 0 ? availableSubtitleLangs.map((lang, idx) => (
                <button key={idx} onClick={() => { handleSubtitleLanguageSelect(lang.downloadLink); setShowSubtitlesMenu(false); }}
                  style={{ background: "transparent", color: "rgba(255,255,255,0.8)", border: "none", padding: "7px 10px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, textAlign: "left", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >{lang.language}</button>
              )) : (
                <div style={{ fontSize: 11, color: AURORA.textFaint, textAlign: "center", padding: 8 }}>
                  {isFetchingSubtitles ? "Searching OpenSubtitles..." : "No subtitles found online"}
                </div>
              )}
            </div>
            <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
            <button onClick={(e) => { e.stopPropagation(); subtitleInputRef.current?.click(); setShowSubtitlesMenu(false); }}
              style={{ background: "rgba(255,255,255,0.04)", color: "#fff", border: "1px dashed rgba(255,255,255,0.12)", padding: 10, borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "all 0.15s" }}
            ><Upload size={13} /> {subtitleFileName || "Upload Custom (.srt)"}</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SETTINGS PANEL ──────────────────────────────────────── */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            style={{ position: "absolute", bottom: 84, right: 14, zIndex: 50, background: "rgba(10,10,12,0.94)", backdropFilter: "blur(30px) saturate(160%)", border: `1px solid ${AURORA.glassBorder}`, borderRadius: 18, padding: 16, width: 245, color: "#fff", boxShadow: "0 24px 56px rgba(0,0,0,0.75)", display: "flex", flexDirection: "column", gap: 14, maxHeight: "calc(100vh - 160px)", overflowY: "auto" }}
          >
            {/* Playback Speed */}
            <div style={{ background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.03)" }}>
              <div style={{ fontSize: 10, color: AURORA.textFaint, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, marginBottom: 10 }}>Playback Speed</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <button key={rate} onClick={() => { sendCommand("setPlaybackRate", [rate]); setPlaybackRate(rate); setShowSettings(false); }}
                    style={{ background: playbackRate === rate ? "rgba(255,107,0,0.18)" : "rgba(255,255,255,0.04)", color: playbackRate === rate ? AURORA.accent : "rgba(255,255,255,0.7)", border: playbackRate === rate ? "1px solid rgba(255,107,0,0.3)" : "1px solid rgba(255,255,255,0.06)", padding: "6px 10px", borderRadius: AURORA.radiusPill, cursor: "pointer", fontSize: 12, fontWeight: 800, transition: "all 0.15s" }}
                  >{rate}×</button>
                ))}
              </div>
            </div>
            {/* Quality */}
            {qualities && qualities.length > 0 && (
              <div style={{ background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.03)" }}>
                <div style={{ fontSize: 10, color: AURORA.textFaint, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, marginBottom: 10 }}>Quality</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {qualities.map((q, idx) => (
                    <button key={idx} onClick={() => { sendCommand("setQuality", [q.id || idx]); sendCommand("setLevel", [q.id || idx]); sendCommand("setResolution", [q.id || idx]); setCurrentQuality(q); setShowSettings(false); }}
                      style={{ background: (currentQuality?.id === q.id || currentQuality === q) ? "rgba(255,107,0,0.18)" : "rgba(255,255,255,0.04)", color: (currentQuality?.id === q.id || currentQuality === q) ? AURORA.accent : "rgba(255,255,255,0.7)", border: (currentQuality?.id === q.id || currentQuality === q) ? "1px solid rgba(255,107,0,0.3)" : "1px solid rgba(255,255,255,0.06)", padding: "6px 10px", borderRadius: AURORA.radiusPill, cursor: "pointer", fontSize: 12, fontWeight: 800, transition: "all 0.15s" }}
                    >{q.name || q.height + "p" || q.label || "Quality " + idx}</button>
                  ))}
                </div>
              </div>
            )}
            {/* Audio Tracks */}
            {audioTracks && audioTracks.length > 0 && (
              <div style={{ background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.03)" }}>
                <div style={{ fontSize: 10, color: AURORA.textFaint, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, marginBottom: 10 }}>Audio Track</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {audioTracks.map((t, idx) => (
                    <button key={idx} onClick={() => { sendCommand("setAudioTrack", [t.id || idx]); sendCommand("setAudio", [t.id || idx]); sendCommand("setTrack", [t.id || idx]); setCurrentAudioTrack(t); setShowSettings(false); }}
                      style={{ background: (currentAudioTrack?.id === t.id || currentAudioTrack === t) ? "rgba(255,107,0,0.12)" : "rgba(255,255,255,0.03)", color: (currentAudioTrack?.id === t.id || currentAudioTrack === t) ? AURORA.accent : "rgba(255,255,255,0.6)", border: "1px solid transparent", padding: "7px 10px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, textAlign: "left", transition: "all 0.15s" }}
                    >{t.name || t.label || t.language || "Track " + idx}</button>
                  ))}
                </div>
              </div>
            )}
            {/* Aspect Ratio */}
            <div style={{ background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.03)" }}>
              <div style={{ fontSize: 10, color: AURORA.textFaint, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, marginBottom: 10 }}>Aspect Ratio</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {ASPECT_RATIOS.map((ar, idx) => (
                  <button key={ar.name} onClick={() => { setAspectRatioIndex(idx); showToast(`Aspect: ${ar.name}`); setShowSettings(false); }}
                    style={{ background: aspectRatioIndex === idx ? "rgba(255,107,0,0.12)" : "rgba(255,255,255,0.03)", color: aspectRatioIndex === idx ? AURORA.accent : "rgba(255,255,255,0.6)", border: aspectRatioIndex === idx ? "1px solid rgba(255,107,0,0.3)" : "1px solid transparent", padding: "7px 10px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.15s" }}
                  >{ar.name} {aspectRatioIndex === idx && <Check size={12} strokeWidth={3} />}</button>
                ))}
              </div>
            </div>
            {/* Automations */}
            <div style={{ background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.03)" }}>
              <div style={{ fontSize: 10, color: AURORA.textFaint, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, marginBottom: 10 }}>Automations</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>Auto-Skip Intro</span>
                  <div onClick={() => { const v = !autoSkipIntro; setAutoSkipIntro(v); localStorage.setItem("streamly_autoSkip", v); }}
                    style={{ width: 34, height: 18, background: autoSkipIntro ? AURORA.accent : "rgba(255,255,255,0.12)", borderRadius: AURORA.radiusPill, position: "relative", cursor: "pointer", transition: "background 0.25s" }}
                  ><div style={{ width: 14, height: 14, background: "#fff", borderRadius: "50%", position: "absolute", top: 2, left: autoSkipIntro ? 18 : 2, transition: "left 0.25s cubic-bezier(0.4,0,0.2,1)", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} /></div>
                </div>
                {movie?.isSeries && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>Auto-Play Next</span>
                    <div onClick={() => { const v = !autoPlayNext; setAutoPlayNext(v); localStorage.setItem("streamly_autoNext", v); }}
                      style={{ width: 34, height: 18, background: autoPlayNext ? AURORA.accent : "rgba(255,255,255,0.12)", borderRadius: AURORA.radiusPill, position: "relative", cursor: "pointer", transition: "background 0.25s" }}
                    ><div style={{ width: 14, height: 14, background: "#fff", borderRadius: "50%", position: "absolute", top: 2, left: autoPlayNext ? 18 : 2, transition: "left 0.25s cubic-bezier(0.4,0,0.2,1)", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} /></div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
            <button onClick={(e) => { e.stopPropagation(); setUseNativeControls(true); setShowSettings(false); }}
              style={{ background: "rgba(255,107,0,0.08)", color: AURORA.accent, border: "1px solid rgba(255,107,0,0.18)", padding: 10, borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "all 0.15s" }}
            ><Captions size={14} /> Native Subtitles & Audio</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOTTOM CONTROLS ─────────────────────────────────────── */}
      <AnimatePresence>
        {(showControls || !isPlaying || isScrubbing) && showCustomUI && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20, pointerEvents: "none" }}
          >
            {/* Attachment Row (Skip Intro + Up Next) */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "0 20px", marginBottom: 10, pointerEvents: "none" }}>
              <div style={{ pointerEvents: "auto" }}>
                <AnimatePresence>
                  {showSkipIntro && skipIntroTime != null && (
                    <motion.button initial={{ opacity: 0, x: -16, scale: 0.92 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -12, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 26 }}
                      onClick={(e) => { e.stopPropagation(); sendCommand("seek", [skipIntroTime]); setShowSkipIntro(false); }}
                      style={{ background: "rgba(0,0,0,0.7)", color: "#fff", border: `1.5px solid ${AURORA.accent}`, padding: "9px 18px", borderRadius: 10, cursor: "pointer", fontWeight: 700, backdropFilter: "blur(16px)", display: "flex", alignItems: "center", gap: 7, fontSize: 12, boxShadow: `0 0 16px rgba(255,107,0,0.2), 0 6px 16px rgba(0,0,0,0.4)` }}
                    ><FastForward size={14} color={AURORA.accent} fill={AURORA.accent} /> Skip Intro</motion.button>
                  )}
                </AnimatePresence>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, pointerEvents: "auto" }}>
                <AnimatePresence>
                  {showUpNext && hasNextEpisode && (
                    <motion.div initial={{ opacity: 0, x: 20, scale: 0.93 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 14, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 380, damping: 26 }}
                      style={{ background: "rgba(0,0,0,0.75)", border: `1px solid ${AURORA.glassBorder}`, borderRadius: 14, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, backdropFilter: "blur(20px)", boxShadow: "0 14px 36px rgba(0,0,0,0.6)" }}
                    >
                      <div>
                        <div style={{ fontSize: 9, color: AURORA.textFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 2 }}>Up Next</div>
                        <div style={{ fontSize: 13, color: "#fff", fontWeight: 700 }}>Episode {(episode || 0) + 1}</div>
                      </div>
                      <div style={{ position: "relative", width: 36, height: 36, flexShrink: 0 }}>
                        <svg width="36" height="36" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
                          <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
                          <circle cx="18" cy="18" r="14" fill="none" stroke={AURORA.accent} strokeWidth="2.5" strokeDasharray={`${2 * Math.PI * 14}`} strokeDashoffset={`${2 * Math.PI * 14 * (1 - upNextCountdown / 15)}`} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.9s linear" }} />
                        </svg>
                        <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>{upNextCountdown}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); dismissUpNext(); }}
                        style={{ background: "rgba(255,255,255,0.06)", border: "none", color: AURORA.textDim, cursor: "pointer", width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                      ><X size={12} /></button>
                    </motion.div>
                  )}
                </AnimatePresence>
                {hasNextEpisode && (
                  <button onClick={(e) => { e.stopPropagation(); onNextEpisode?.(); }}
                    style={{ background: AURORA.accent, color: "#fff", border: "none", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, boxShadow: `0 4px 14px rgba(255,107,0,0.4)`, fontSize: 12, transition: "all 0.15s" }}
                  >Next Episode <SkipForward size={14} fill="currentColor" /></button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div ref={progressBarRef} onMouseDown={onProgressMouseDown} onMouseMove={handleProgressHover} onMouseLeave={() => setHoverTime(null)}
              className="aurora-progress"
              style={{ position: "relative", zIndex: 20, height: 24, display: "flex", alignItems: "center", cursor: "pointer", padding: "0 20px", pointerEvents: "auto", marginBottom: 2 }}
            >
              <AnimatePresence>
                {hoverTime != null && (
                  <motion.div initial={{ opacity: 0, y: 4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 3, scale: 0.95 }} transition={{ duration: 0.12 }}
                    style={{ position: "absolute", bottom: 20, left: `${hoverX + 20}px`, transform: "translateX(-50%)", pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center" }}
                  >
                    <div style={{ background: "rgba(8,8,10,0.95)", color: "#fff", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 800, fontFamily: "monospace", whiteSpace: "nowrap", border: `1px solid ${AURORA.glassBorder}`, boxShadow: "0 4px 12px rgba(0,0,0,0.6)", letterSpacing: "0.5px" }}>
                      {formatTime(hoverTime)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div style={{ position: "relative", width: "100%", height: hoverTime != null || isScrubbing ? "6px" : "3px", background: "rgba(255,255,255,0.1)", borderRadius: 3, transition: "height 0.2s cubic-bezier(0.4,0,0.2,1)" }}>
                <div style={{ position: "absolute", inset: 0, width: `${bufferedPercent}%`, background: "rgba(255,255,255,0.12)", borderRadius: 3, transition: "width 0.3s" }} />
                <div style={{ position: "absolute", inset: 0, width: `${progressPercent}%`, background: `linear-gradient(90deg, ${AURORA.accent}, #FF8C33)`, borderRadius: 3, boxShadow: `0 0 10px ${AURORA.accentGlow}` }} />
                <div className="aurora-scrubber" style={{ position: "absolute", left: `${progressPercent}%`, top: "50%", transform: "translate(-50%, -50%)", width: 14, height: 14, borderRadius: "50%", background: "#fff", boxShadow: `0 1px 8px rgba(0,0,0,0.5), 0 0 0 2px ${AURORA.accent}`, transition: "transform 0.15s, box-shadow 0.15s", cursor: "grab" }} />
              </div>
            </div>

            {/* Control Row */}
            <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 14px 14px", pointerEvents: "auto" }}>
              {/* Left Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <motion.button onClick={togglePlay} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  style={{ background: `linear-gradient(135deg, ${AURORA.accent}, #FF8C33)`, border: "none", color: "#fff", cursor: "pointer", width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 18px rgba(255,107,0,0.45)`, flexShrink: 0 }}
                  title={isPlaying ? "Pause (K)" : "Play (K)"}
                >{isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" style={{ marginLeft: 2 }} />}</motion.button>
                <motion.button onClick={(e) => { e.stopPropagation(); seekRelative(-10); }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} title="Rewind 10s (J)"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)", color: AURORA.text, cursor: "pointer", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}
                ><RotateCcw size={16} /></motion.button>
                <motion.button onClick={(e) => { e.stopPropagation(); seekRelative(10); }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} title="Forward 10s (L)"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)", color: AURORA.text, cursor: "pointer", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}
                ><RotateCw size={16} /></motion.button>
                {/* Volume */}
                <div onMouseEnter={() => setIsVolumeHovered(true)} onMouseLeave={() => setIsVolumeHovered(false)}
                  style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.06)", borderRadius: AURORA.radiusPill, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <motion.button onClick={toggleMute} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                    title="Mute (M)"
                  >{isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}</motion.button>
                  <motion.div initial={false} animate={{ width: isVolumeHovered ? 64 : 0, opacity: isVolumeHovered ? 1 : 0, marginRight: isVolumeHovered ? 10 : 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    style={{ display: "flex", alignItems: "center", overflow: "hidden" }}
                  >
                    <input type="range" min="0" max="1" step="0.02" value={isMuted ? 0 : volume}
                      onChange={(e) => { e.stopPropagation(); changeVolume(parseFloat(e.target.value)); }}
                      onClick={(e) => e.stopPropagation()}
                      className="aurora-volume"
                      style={{ width: 64, cursor: "pointer", height: 3, flexShrink: 0 }}
                    />
                  </motion.div>
                </div>
                {/* Time */}
                <div style={{ marginLeft: 8, fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.85)", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                  {formatTime(currentTime)}<span style={{ color: AURORA.textFaint, fontWeight: 400 }}>/</span><span style={{ color: AURORA.textDim }}>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Center Title */}
              <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 6, pointerEvents: "none", whiteSpace: "nowrap", maxWidth: "35%", overflow: "hidden" }}>
                <span style={{ background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.85)", letterSpacing: "1px", border: `1px solid ${AURORA.glassBorder}`, flexShrink: 0 }}>
                  {isTvContent ? `S${season} E${episode}` : "MOVIE"}
                </span>
                <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>{movie.title || movie.name}</span>
                {isTvContent && <span style={{ color: AURORA.accent, fontSize: 12, fontWeight: 800, flexShrink: 0 }}>— Ep {episode}</span>}
                {playbackRate !== 1 && <span style={{ background: "rgba(255,107,0,0.15)", border: "1px solid rgba(255,107,0,0.3)", color: AURORA.accent, fontSize: 9, fontWeight: 900, padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>{playbackRate}×</span>}
              </div>

              {/* Right Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                {activeSourceId && <span style={{ fontSize: 9, color: AURORA.textFaint, fontWeight: 700, padding: "2px 6px", background: "rgba(255,255,255,0.04)", borderRadius: 4, marginRight: 4, whiteSpace: "nowrap" }}>{activeSourceId}</span>}
                <input type="file" accept=".srt,.vtt" ref={subtitleInputRef} onChange={handleSubtitleUpload} style={{ display: "none" }} />
                <motion.button onClick={(e) => { e.stopPropagation(); setShowSubtitlesMenu(!showSubtitlesMenu); setShowSettings(false); }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  style={{ background: subtitleEnabled || showSubtitlesMenu ? "rgba(255,107,0,0.12)" : "rgba(255,255,255,0.06)", border: subtitleEnabled || showSubtitlesMenu ? "1px solid rgba(255,107,0,0.25)" : "1px solid rgba(255,255,255,0.06)", color: subtitleEnabled || showSubtitlesMenu ? AURORA.accent : "rgba(255,255,255,0.85)", cursor: "pointer", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", transition: "all 0.15s" }}
                  title={subtitleFileName ? `Subtitle: ${subtitleFileName}` : "Subtitles"}
                >
                  <Captions size={16} style={{ transition: "transform 0.3s", transform: showSubtitlesMenu ? "scale(1.1)" : "scale(1)" }} />
                  {subtitleEnabled && <div style={{ position: "absolute", top: 4, right: 4, width: 5, height: 5, background: AURORA.accent, borderRadius: "50%" }} />}
                </motion.button>
                <motion.button onClick={(e) => { e.stopPropagation(); setShowShortcuts((p) => !p); }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  style={{ background: showShortcuts ? "rgba(255,107,0,0.12)" : "rgba(255,255,255,0.06)", border: showShortcuts ? "1px solid rgba(255,107,0,0.25)" : "1px solid rgba(255,255,255,0.06)", color: showShortcuts ? AURORA.accent : "rgba(255,255,255,0.85)", cursor: "pointer", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                  title="Shortcuts (?)"
                ><Keyboard size={16} /></motion.button>
                <motion.button onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); setShowSubtitlesMenu(false); }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  style={{ background: showSettings ? "rgba(255,107,0,0.12)" : "rgba(255,255,255,0.06)", border: showSettings ? "1px solid rgba(255,107,0,0.25)" : "1px solid rgba(255,255,255,0.06)", color: showSettings ? AURORA.accent : "rgba(255,255,255,0.85)", cursor: "pointer", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                  title="Settings"
                ><Settings size={16} style={{ transition: "transform 0.3s", transform: showSettings ? "rotate(50deg)" : "rotate(0)" }} /></motion.button>
                <motion.button onClick={toggleFullscreen} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.85)", cursor: "pointer", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                  title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
                >{isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}</motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONTEXT MENU ────────────────────────────────────────── */}
      <AnimatePresence>
        {contextMenu.show && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.12 }}
            style={{ position: "absolute", left: contextMenu.x, top: contextMenu.y, zIndex: 100, background: "rgba(12,12,14,0.92)", backdropFilter: "blur(16px)", border: `1px solid ${AURORA.glassBorder}`, borderRadius: 12, padding: "6px 0", minWidth: 200, boxShadow: "0 16px 40px rgba(0,0,0,0.65)", pointerEvents: "auto" }}
            onClick={(e) => e.stopPropagation()} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            {[
              { icon: <Link size={13} />, label: "Copy video URL", action: () => { navigator.clipboard.writeText(window.location.href); setContextMenu({ show: false, x: 0, y: 0 }); showToast("URL Copied to Clipboard"); } },
              { icon: <Repeat size={13} color={isLooping ? AURORA.accent : "#fff"} />, label: isLooping ? "Loop is On" : "Loop is Off", action: () => { setIsLooping(!isLooping); setContextMenu({ show: false, x: 0, y: 0 }); showToast(isLooping ? "Loop Disabled" : "Loop Enabled"); } },
              { icon: isPlaying ? <Pause size={13} /> : <Play size={13} />, label: isPlaying ? "Pause" : "Play", action: () => { togglePlay(); setContextMenu({ show: false, x: 0, y: 0 }); } },
              { icon: isMuted || volume === 0 ? <VolumeX size={13} /> : <Volume2 size={13} />, label: isMuted || volume === 0 ? "Unmute" : "Mute", action: () => { toggleMute(); setContextMenu({ show: false, x: 0, y: 0 }); } },
            ].map((item, i) => (
              <div key={i} className="ctx-menu-item" onClick={item.action}
                style={{ padding: "9px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", color: "#fff", fontSize: 12, fontWeight: 500 }}
              >{item.icon} {item.label}</div>
            ))}
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "3px 0" }} />
            <div className="ctx-menu-item" onClick={() => {
              setIsLoading(true); setIframeUrl("");
              setTimeout(() => { setHasInitiallyLoaded(false); contentSignatureRef.current = ""; }, 100);
              setContextMenu({ show: false, x: 0, y: 0 }); showToast("Reloading Player...");
            }} style={{ padding: "9px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", color: "#fff", fontSize: 12, fontWeight: 500 }}>
              <RefreshCw size={13} /> Troubleshoot (Reload)
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomVideoPlayer;
