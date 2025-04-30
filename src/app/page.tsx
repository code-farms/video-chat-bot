
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
  const { toast } = useToast(); // Initialize toast

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    // --- Reset and cleanup logic ---
    // Pause and reset current video if one is playing/loaded
    if (videoRef.current) {
        videoRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    // Revoke previous object URL if it exists *before* creating a new one
    if (videoSrc && videoSrc.startsWith('blob:')) {
        URL.revokeObjectURL(videoSrc);
        console.log("Revoked previous object URL:", videoSrc);
        setVideoSrc(null); // Clear the state *after* revocation
    }
    // --- End Reset ---

    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      console.log("Created new object URL:", url);
      setVideoSrc(url); // Set the new URL for the state
      setIsLoadingVideo(true); // Start loading indicator

      // Ensure video element is ready for the new source
      if (videoRef.current) {
        videoRef.current.src = url; // Set the src attribute directly
        videoRef.current.load(); // Load the new source
        videoRef.current.volume = volume;
        videoRef.current.muted = isMuted;
        // We'll attempt to play (if desired) or handle state in event listeners like 'canplay'
      }
    } else if (file) {
       toast({
         title: "Invalid File Type",
         description: "Please upload a valid video file.",
         variant: "destructive",
       });
       setVideoSrc(null); // Explicitly set to null if file is invalid
       if (videoRef.current) {
           videoRef.current.removeAttribute('src');
           videoRef.current.load(); // Reset element
       }
    } else {
        // No file selected, ensure cleanup if a video was previously loaded
        setVideoSrc(null);
        if (videoRef.current) {
           videoRef.current.removeAttribute('src');
           videoRef.current.load(); // Reset element
        }
    }

     // Reset the file input value to allow uploading the same file again
     if (fileInputRef.current) {
        fileInputRef.current.value = '';
     }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handlePlayPause = async () => {
    const video = videoRef.current;
    if (!video || !videoSrc) return; // Don't do anything if no video loaded

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      // Check if video is ready enough to play
      if (video.readyState >= video.HAVE_FUTURE_DATA) {
        try {
          await video.play();
          setIsPlaying(true);
          setIsLoadingVideo(false); // Ensure loading is off if play succeeds
        } catch (error) {
          console.error("Error playing video:", error);
          // Ignore the specific interruption error (e.g., user clicks play/pause rapidly)
          if ((error as DOMException).name !== 'AbortError') {
             toast({
                title: "Playback Error",
                description: `Could not play video: ${(error as Error).message}. Try uploading again.`,
                variant: "destructive",
              });
             // Reset video state on critical playback error
             setVideoSrc(null);
             if(videoRef.current){
                videoRef.current.removeAttribute('src');
                videoRef.current.load();
             }
          }
          setIsPlaying(false); // Ensure state is correct if play failed or was aborted
        }
      } else {
        // If not ready, indicate loading and wait for 'canplay' or 'canplaythrough'
         setIsLoadingVideo(true);
         toast({
           title: "Video Loading",
           description: "Please wait for the video to load before playing.",
         });
      }
    }
  };

  // Called frequently as the video plays
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      // Stop loading indicator if it was shown due to buffering and playback resumes
      if (isLoadingVideo && !videoRef.current.paused && videoRef.current.readyState >= videoRef.current.HAVE_FUTURE_DATA) {
          setIsLoadingVideo(false);
      }
    }
  };

  // Called when the video's metadata (duration, dimensions) is loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      // Metadata loaded doesn't mean it's ready to play smoothly yet
      // Keep isLoadingVideo potentially true until 'canplay' or 'canplaythrough'
    }
  };

  // Called when playback stops because the next frame is not available (buffering)
  const handleWaiting = () => {
    // Show loading indicator only if we intend for it to be playing
    if (isPlaying) {
        setIsLoadingVideo(true);
    }
  };

  // Called when the browser estimates it can play through the media without stopping
  const handleCanPlayThrough = () => {
    setIsLoadingVideo(false); // Buffering likely finished
    // If it was supposed to be playing, try playing now
    if (isPlaying && videoRef.current?.paused) {
        videoRef.current?.play().catch(error => {
            // Handle potential error on resume (though less likely here)
             console.error("Error resuming play after canplaythrough:", error);
             if ((error as DOMException).name !== 'AbortError') {
                setIsPlaying(false); // Update state if play fails
             }
        });
    }
  };

   // Called when the browser can play the media, but estimates that not enough data has been loaded
   const handleCanPlay = () => {
       // Often a good point to consider the video 'loaded enough' to hide initial spinner
       // but might still buffer later, hence handleCanPlayThrough is more robust for 'ready' state
       setIsLoadingVideo(false);
       if (videoRef.current && duration === 0) { // Update duration if not set yet
            setDuration(videoRef.current.duration);
       }
   };


  // Called when an error occurs while fetching or playing the media
  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video Error Event:', e);
    setIsLoadingVideo(false);
    setIsPlaying(false);
    let message = 'An unknown video error occurred.';
    const videoElement = e.target as HTMLVideoElement;
    if (videoElement.error) {
      console.error('Video Error Code:', videoElement.error.code);
      console.error('Video Error Message:', videoElement.error.message);
      switch (videoElement.error.code) {
        case MediaError.MEDIA_ERR_ABORTED: // 1
          message = 'Video loading was aborted by the user or script.';
           // This might happen normally if src changes, maybe don't show toast unless debugging
           console.warn("Video load aborted.");
           return; // Often not a user-facing error that needs a toast
        case MediaError.MEDIA_ERR_NETWORK: // 2
          message = 'A network error caused the video download to fail part-way.';
          break;
        case MediaError.MEDIA_ERR_DECODE: // 3
          message = 'The video playback was aborted due to a corruption problem or because the video used features your browser did not support.';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: // 4
          message = 'The video could not be loaded, either because the server or network failed or because the format is not supported.';
          break;
        default:
          message = `An unknown error occurred (Code: ${videoElement.error.code}). ${videoElement.error.message || ''}`;
      }
    }
     toast({
       title: 'Video Error',
       description: message,
       variant: 'destructive',
     });
     // Reset video state completely on error
     setVideoSrc(null);
      if(videoRef.current){
        videoRef.current.removeAttribute('src');
        videoRef.current.load(); // Reset element
     }
     setCurrentTime(0);
     setDuration(0);
  };


  // Called when the video reaches its end
  const handleVideoEnd = () => {
    setIsPlaying(false);
    // Optionally reset currentTime to 0 or keep it at the end
    if (videoRef.current) {
        // Set to duration to ensure slider shows full
        setCurrentTime(videoRef.current.duration);
        // Or reset to beginning:
        // videoRef.current.currentTime = 0;
        // setCurrentTime(0);
    }
  };

  // Called when the user interacts with the progress slider
  const handleProgressChange = (value: number[]) => {
    if (videoRef.current && !isLoadingVideo) { // Prevent seeking while initially loading
      const newTime = value[0];
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime); // Update state immediately for smoother UI
    }
  };

  // Called when the user interacts with the volume slider
  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      const newVolume = value[0];
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      // Manage mute state based on volume
      if (newVolume > 0 && isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      } else if (newVolume === 0 && !isMuted) {
        videoRef.current.muted = true;
        setIsMuted(true);
      }
    }
  };

  // Called when the user clicks the mute/unmute button
  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      // If unmuting and volume was 0, set volume to a default (e.g., 0.5)
      if (!newMuted && videoRef.current.volume === 0) {
        const defaultUnmuteVolume = 0.5;
        videoRef.current.volume = defaultUnmuteVolume;
        setVolume(defaultUnmuteVolume);
      }
    }
  };

   // Effect for cleaning up the object URL when the component unmounts or videoSrc changes
   useEffect(() => {
    const currentVideoSrc = videoSrc; // Capture src in effect scope for cleanup

    // Add error listener when videoSrc is set
    const video = videoRef.current;
     if (video && currentVideoSrc) {
       video.addEventListener('error', handleVideoError);
     }

    return () => {
      // Revoke the object URL if it's a blob URL
      if (currentVideoSrc && currentVideoSrc.startsWith('blob:')) {
        URL.revokeObjectURL(currentVideoSrc);
        console.log("Revoked object URL on cleanup:", currentVideoSrc);
      }
      // Remove error listener on cleanup
      if (video) {
          video.removeEventListener('error', handleVideoError);
      }
    };
  }, [videoSrc]); // Re-run this effect when videoSrc changes


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
            <CardContent className="p-0 relative group"> {/* group for hover controls */}
              {/* Aspect Ratio Container */}
              <div className="aspect-video bg-muted rounded-t-md flex items-center justify-center overflow-hidden relative">
                {/* Video Element */}
                <video
                    ref={videoRef}
                    className="w-full h-full object-contain" // Use contain to see whole video
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={handleVideoEnd}
                    // onError is handled by the effect listener
                    onWaiting={handleWaiting}
                    onCanPlay={handleCanPlay} // Use canplay to remove initial spinner
                    onCanPlayThrough={handleCanPlayThrough} // Use canplaythrough for buffering indication
                    onClick={handlePlayPause} // Play/pause on video click
                    playsInline // Important for mobile playback
                    preload="metadata" // Suggest browser load metadata quickly
                    // src is set dynamically in handleFileChange / useEffect
                  >
                     Your browser does not support the video tag.
                  </video>

                {/* Loading Indicator */}
                {isLoadingVideo && (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 backdrop-blur-sm">
                     <Loader2 className="h-10 w-10 text-white animate-spin" />
                   </div>
                 )}

                {/* Fallback Text when no video */}
                {!videoSrc && !isLoadingVideo && (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground p-4 text-center">
                    Upload a video to preview
                  </div>
                )}

                {/* Custom Controls Overlay (Visible on hover/focus within the group) */}
                {videoSrc && ( // Show controls only if there is a video source
                  <div
                    className={cn(
                      "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 transition-opacity duration-300 z-20",
                      // Show controls if playing, paused, loading, or if the group is hovered/focused
                      (isPlaying || !videoRef.current?.paused || isLoadingVideo) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
                    )}
                    >
                    {/* Progress Bar */}
                     <div className="flex items-center gap-2 mb-2">
                       <span className="text-xs text-white tabular-nums w-12 text-center">{formatTime(currentTime)}</span>
                       <Slider
                         value={[currentTime]}
                         max={duration || 0}
                         step={0.1} // More granular step
                         onValueChange={handleProgressChange}
                         className="w-full [&>span:first-child>span]:bg-primary [&>span:first-child]:bg-white/30 cursor-pointer"
                         aria-label="Video progress"
                         disabled={duration === 0 || isLoadingVideo} // Disable slider if no duration or loading
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
                            disabled={!videoSrc || isLoadingVideo} // Disable if no video or loading
                          >
                            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                         </Button>
                         <Button
                            onClick={toggleMute}
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 hover:text-white"
                            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                            disabled={!videoSrc} // Disable if no video
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
                            disabled={!videoSrc} // Disable if no video
                         />
                       </div>

                       {/* Right Controls (Placeholder) */}
                       <div>
                         {/* Future: Add Fullscreen button, settings, etc. */}
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
                  className="hidden"
                  aria-label="Upload video file"
                  // Key is not needed if value is reset in handler
                  // onClick={(e) => (e.currentTarget.value = '')} // Alternative way to reset
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

