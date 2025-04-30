'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider'; // Import Slider for progress bar
import ChatWindow from '@/components/ChatWindow';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { formatTime } from '@/lib/utils'; // Helper function for time formatting
import { useToast } from '@/hooks/use-toast'; // Import useToast


export default function Home() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1); // Default volume: 100%
  const [isLoadingVideo, setIsLoadingVideo] = useState(false); // State for video loading


  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressRef = useRef<HTMLDivElement>(null); // Ref for progress bar container
  const { toast } = useToast(); // Initialize toast

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      // Revoke previous object URL if it exists
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
        console.log("Revoked previous object URL:", videoSrc);
      }

      const url = URL.createObjectURL(file);
      console.log("Created new object URL:", url);
      setVideoSrc(url); // Set the new URL first
      setIsLoadingVideo(true); // Start loading indicator
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);

      // Reset video element state explicitly
      if (videoRef.current) {
        videoRef.current.pause(); // Ensure paused state
        videoRef.current.removeAttribute('src'); // Remove old src
        videoRef.current.load(); // Reset element

        // Set new source and load
        videoRef.current.src = url;
        videoRef.current.volume = volume;
        videoRef.current.muted = isMuted;
        videoRef.current.load(); // Important: Load the new source
      }
    } else if (file) {
       toast({
         title: "Invalid File Type",
         description: "Please upload a valid video file.",
         variant: "destructive",
       });
      setVideoSrc(null);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handlePlayPause = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      // Check if video is ready to play
      if (video.readyState >= 2) { // HAVE_CURRENT_DATA or more
        try {
          await video.play();
          setIsPlaying(true);
        } catch (error) {
          console.error("Error playing video:", error);
          // Ignore the specific interruption error, log others
          if ((error as DOMException).name !== 'AbortError') {
             toast({
                title: "Playback Error",
                description: `Could not play video: ${(error as Error).message}`,
                variant: "destructive",
              });
          }
          setIsPlaying(false); // Ensure state is correct if play failed
        }
      } else {
        // Optionally wait for 'canplay' event or show loading
         toast({
           title: "Video Not Ready",
           description: "Please wait for the video to load.",
         });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
       // If it was loading and now has data, stop loading indicator
       if (isLoadingVideo && videoRef.current.readyState >= 2) {
        setIsLoadingVideo(false);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoadingVideo(false); // Stop loading indicator
    }
  };

   // Handle cases where video loading might fail or stall
  const handleWaiting = () => {
    if (isPlaying) { // Only show loading if it was supposed to be playing
        setIsLoadingVideo(true);
    }
  };

  const handleCanPlay = () => {
    setIsLoadingVideo(false);
    // Attempt to resume play if it was interrupted by buffering
    if (isPlaying && videoRef.current?.paused) {
        videoRef.current?.play().catch(error => console.error("Error resuming play:", error));
    }
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video Error:', e.nativeEvent);
    setIsLoadingVideo(false);
    setIsPlaying(false);
    let message = 'An unknown video error occurred.';
    const videoElement = e.target as HTMLVideoElement;
    if (videoElement.error) {
      switch (videoElement.error.code) {
        case videoElement.error.MEDIA_ERR_ABORTED:
          message = 'Video loading was aborted.';
          break;
        case videoElement.error.MEDIA_ERR_NETWORK:
          message = 'A network error caused the video download to fail.';
          break;
        case videoElement.error.MEDIA_ERR_DECODE:
          message = 'The video playback was aborted due to a corruption problem or because the video used features your browser did not support.';
          break;
        case videoElement.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          message = 'The video could not be loaded, either because the server or network failed or because the format is not supported.';
          break;
        default:
          message = `An unknown error occurred (Code: ${videoElement.error.code})`;
      }
    }
     toast({
       title: 'Video Error',
       description: message,
       variant: 'destructive',
     });
     setVideoSrc(null); // Reset video state on error
  };


  const handleVideoEnd = () => {
    setIsPlaying(false);
    if (videoRef.current) {
        setCurrentTime(videoRef.current.duration); // Ensure time shows end
        // Optional: Reset to beginning
        // videoRef.current.currentTime = 0;
        // setCurrentTime(0);
    }
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

   // Effect to clean up object URL on unmount or src change
   useEffect(() => {
    const currentVideoSrc = videoSrc; // Capture src in effect scope
    return () => {
      if (currentVideoSrc && currentVideoSrc.startsWith('blob:')) {
        URL.revokeObjectURL(currentVideoSrc);
        console.log("Revoked object URL on cleanup:", currentVideoSrc);
      }
    };
  }, [videoSrc]); // Dependency on videoSrc

  // Effect to reset video state when src becomes null
  useEffect(() => {
    if (!videoSrc && videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src'); // Remove src attribute
        videoRef.current.load(); // Reset the video element state
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setIsLoadingVideo(false);
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
                  <>
                   <video
                      ref={videoRef}
                      // src is set dynamically in handleFileChange / useEffect
                      className="w-full h-full object-contain"
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onEnded={handleVideoEnd}
                      onError={handleVideoError} // Add error handler
                      onWaiting={handleWaiting} // Handle buffering
                      onCanPlay={handleCanPlay} // Handle when ready after buffering
                      onClick={handlePlayPause} // Play/pause on video click
                      key={videoSrc} // Force re-render on src change might not be needed if src is set manually
                      playsInline // Important for mobile playback
                      preload="metadata" // Load metadata quickly
                    >
                       Your browser does not support the video tag.
                    </video>
                     {isLoadingVideo && (
                       <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                         <Loader2 className="h-10 w-10 text-white animate-spin" />
                       </div>
                     )}
                  </>
                ) : (
                  <div className="text-muted-foreground p-4 text-center">
                    Upload a video to preview
                  </div>
                )}

                {/* Custom Controls Overlay (Visible on hover/focus within the group) */}
                {videoSrc && !isLoadingVideo && ( // Only show controls if video exists and isn't actively loading first frame
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
                    {/* Progress Bar */}
                    <div className="flex items-center gap-2 mb-2" ref={progressRef}>
                       <span className="text-xs text-white tabular-nums w-12 text-center">{formatTime(currentTime)}</span>
                       <Slider
                         value={[currentTime]}
                         max={duration || 0}
                         step={0.1} // More granular step
                         onValueChange={handleProgressChange}
                         className="w-full [&>span:first-child>span]:bg-primary [&>span:first-child]:bg-white/30 cursor-pointer"
                         aria-label="Video progress"
                         disabled={duration === 0} // Disable slider if duration is 0
                       />
                       <span className="text-xs text-white tabular-nums w-12 text-center">{formatTime(duration)}</span>
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
                            disabled={duration === 0} // Disable if no video duration
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
                            value={[isMuted ? 0 : volume]} // Reflect mute state visually
                            max={1}
                            step={0.05}
                            onValueChange={handleVolumeChange}
                            className="w-24 [&>span:first-child>span]:bg-white [&>span:first-child]:bg-white/30 cursor-pointer"
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
                  // Add key based on videoSrc to force reset if needed, though clearing value might be better
                  // key={videoSrc || 'no-file'}
                  // onClick={(e) => (e.currentTarget.value = '')} // Clear value on click
                />
                <Button onClick={handleUploadClick} variant="outline">
                  <Upload className="mr-2 h-4 w-4" /> Upload Video
                </Button>
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
