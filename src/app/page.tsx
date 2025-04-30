'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider'; // Import Slider for progress bar
import ChatWindow from '@/components/ChatWindow';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { formatTime } from '@/lib/utils'; // Helper function for time formatting

export default function Home() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1); // Default volume: 100%

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressRef = useRef<HTMLDivElement>(null); // Ref for progress bar container

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setIsPlaying(false);
      setCurrentTime(0); // Reset time on new video
      setDuration(0); // Reset duration
      if (videoRef.current) {
        videoRef.current.src = url; // Set src directly
        videoRef.current.load(); // Load the new source
        videoRef.current.volume = volume; // Maintain volume setting
        videoRef.current.muted = isMuted; // Maintain mute setting
      }
    } else {
      console.error('Invalid file type. Please upload a video.');
      setVideoSrc(null);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(error => console.error("Error playing video:", error));
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setCurrentTime(duration); // Set current time to duration when ended
  };

  const handleProgressChange = (value: number[]) => {
    if (videoRef.current) {
      const newTime = value[0];
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime); // Update state immediately for smoother UI
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      const newVolume = value[0];
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      // Unmute if volume is adjusted while muted
      if (newVolume > 0 && isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      } else if (newVolume === 0 && !isMuted) {
        // Mute if volume is set to 0
        videoRef.current.muted = true;
        setIsMuted(true);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      // If unmuting and volume was 0, set volume to a default (e.g., 0.5)
      if (!videoRef.current.muted && videoRef.current.volume === 0) {
        const defaultUnmuteVolume = 0.5;
        videoRef.current.volume = defaultUnmuteVolume;
        setVolume(defaultUnmuteVolume);
      }
    }
  };

   // Effect to clean up object URL
   useEffect(() => {
    const currentVideoSrc = videoSrc; // Capture src in effect scope
    return () => {
      if (currentVideoSrc) {
        URL.revokeObjectURL(currentVideoSrc);
        console.log("Revoked object URL:", currentVideoSrc);
      }
    };
  }, [videoSrc]); // Dependency on videoSrc

  // Effect to reset video state when src becomes null
  useEffect(() => {
    if (!videoSrc) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      if (videoRef.current) {
        videoRef.current.removeAttribute('src'); // Remove src attribute
        videoRef.current.load(); // Reset the video element state
      }
    }
  }, [videoSrc]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex justify-end p-4 border-b border-border">
        <ThemeSwitcher />
      </header>

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Video Section (Left - 60%) */}
        <div className="w-full lg:w-3/5 p-6 flex flex-col items-center justify-center order-1">
          <Card className="w-full max-w-3xl bg-card text-card-foreground shadow-lg rounded-lg overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-center text-primary">
                Video Player
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 relative group"> {/* Use p-0 to allow video full width/height */}
              {/* Aspect Ratio Container */}
              <div className="aspect-video bg-muted rounded-t-md flex items-center justify-center overflow-hidden relative">
                {videoSrc ? (
                  <video
                    ref={videoRef}
                    // src={videoSrc} // Src is set dynamically in handleFileChange
                    className="w-full h-full object-contain"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={handleVideoEnd}
                    onClick={handlePlayPause} // Play/pause on video click
                    key={videoSrc} // Force re-render on src change
                    playsInline // Important for mobile playback
                    preload="metadata" // Load metadata quickly
                  >
                     Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="text-muted-foreground p-4 text-center">
                    Upload a video to preview
                  </div>
                )}

                {/* Custom Controls Overlay (Visible on hover/focus within the group) */}
                {videoSrc && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
                    {/* Progress Bar */}
                    <div className="flex items-center gap-2 mb-2" ref={progressRef}>
                       <span className="text-xs text-white tabular-nums">{formatTime(currentTime)}</span>
                       <Slider
                         value={[currentTime]}
                         max={duration || 0}
                         step={1}
                         onValueChange={handleProgressChange}
                         className="w-full [&>span:first-child>span]:bg-primary [&>span:first-child]:bg-white/30"
                         aria-label="Video progress"
                       />
                       <span className="text-xs text-white tabular-nums">{formatTime(duration)}</span>
                    </div>

                    {/* Bottom Controls Row */}
                    <div className="flex items-center justify-between">
                       {/* Left Controls (Play/Pause, Volume) */}
                       <div className="flex items-center gap-2">
                         <Button
                            onClick={handlePlayPause}
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 hover:text-white"
                            aria-label={isPlaying ? 'Pause video' : 'Play video'}
                          >
                            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                         </Button>
                         <Button
                            onClick={toggleMute}
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 hover:text-white"
                            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                         >
                            {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                         </Button>
                         <Slider
                            value={[volume]}
                            max={1}
                            step={0.05}
                            onValueChange={handleVolumeChange}
                            className="w-24 [&>span:first-child>span]:bg-white [&>span:first-child]:bg-white/30"
                            aria-label="Volume control"
                         />
                       </div>

                       {/* Right Controls (Placeholder for fullscreen, etc.) */}
                       <div>
                         {/* Add Fullscreen button later if needed */}
                       </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Button Area (Below Video) */}
              <div className="p-4 flex justify-center border-t border-border">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="hidden" // Use className instead of style
                  aria-label="Upload video file"
                />
                <Button onClick={handleUploadClick} variant="outline">
                  <Upload className="mr-2 h-4 w-4" /> Upload Video
                </Button>
                {/* Removed Play/Pause button from here, now part of custom controls */}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Window (Right - 40%) */}
        <div className="w-full lg:w-2/5 border-t lg:border-t-0 lg:border-l border-border bg-card text-card-foreground p-4 flex flex-col max-h-[60vh] lg:max-h-full lg:h-auto order-2">
          <ChatWindow />
        </div>
      </div>
    </div>
  );
}
