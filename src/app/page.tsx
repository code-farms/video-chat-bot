
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider'; // Import Slider for progress bar
import ChatWindow from '@/components/ChatWindow';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { formatTime, cn } from '@/lib/utils'; // Helper function for time formatting and cn utility
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
    const currentVideoElement = videoRef.current; // Capture ref
    const previousVideoSrc = videoSrc; // Capture previous state for potential revocation

    // --- Reset and cleanup logic ---
    if (currentVideoElement) {
      currentVideoElement.pause(); // Pause whatever is playing
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsLoadingVideo(false); // Ensure loading indicator is off initially for the new file

    // --- Handle New File ---
    if (file && file.type.startsWith('video/')) {
      const newUrl = URL.createObjectURL(file);
      console.log("Created new object URL:", newUrl);
      setVideoSrc(newUrl); // Update state first
      setIsLoadingVideo(true); // Start loading indicator

      // Set source and load on the video element
      if (currentVideoElement) {
        currentVideoElement.src = newUrl;
        currentVideoElement.load(); // Important: load the new source
        currentVideoElement.volume = volume; // Re-apply settings
        currentVideoElement.muted = isMuted;
        // Event listeners will handle 'canplay' etc. to hide loader and enable play
      }

      // Revoke the *previous* object URL *after* setting up the new one
      if (previousVideoSrc && previousVideoSrc.startsWith('blob:')) {
          URL.revokeObjectURL(previousVideoSrc);
          console.log("Revoked previous object URL:", previousVideoSrc);
      }

    } else {
      // --- Handle Invalid File or No File ---
      if (file) { // Invalid file type selected
         toast({
           title: "Invalid File Type",
           description: "Please upload a valid video file.",
           variant: "destructive",
         });
      }

      // Reset video source state and element for invalid or no file
      setVideoSrc(null);
      if (currentVideoElement) {
         // Explicitly remove the src attribute
         currentVideoElement.removeAttribute('src');
         // Optionally reset poster or other attributes if needed
         // currentVideoElement.poster = '';
         currentVideoElement.load(); // Call load() after removing src to reset the element's state
         console.log("Video element reset due to invalid/no file.");
      }

      // Revoke the *previous* object URL if one existed and we're now clearing it
       if (previousVideoSrc && previousVideoSrc.startsWith('blob:')) {
           URL.revokeObjectURL(previousVideoSrc);
           console.log("Revoked previous object URL during reset:", previousVideoSrc);
       }
    }

    // Reset the file input value *at the very end* to allow uploading the same file again
    // This is crucial to ensure the 'change' event fires even if the user selects the same file
    if (event.target) {
       event.target.value = '';
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
      if (video.readyState >= video.HAVE_FUTURE_DATA || video.readyState >= video.HAVE_ENOUGH_DATA) {
        try {
          await video.play();
          setIsPlaying(true);
          setIsLoadingVideo(false); // Ensure loading is off if play succeeds
        } catch (error) {
          console.error("Error playing video:", error);
          // Ignore the specific interruption error (e.g., user clicks play/pause rapidly or loads new source)
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
             setIsLoadingVideo(false);
          }
          setIsPlaying(false); // Ensure state is correct if play failed or was aborted
        }
      } else {
        // If not ready, indicate loading and wait for 'canplay' or 'canplaythrough'
         setIsLoadingVideo(true);
         // Optionally attempt to play again later via 'canplay' handler
         // toast({
         //   title: "Video Loading",
         //   description: "Please wait for the video to load before playing.",
         // });
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
      // setIsLoadingVideo(true); // It might already be true, or we might wait for canplay
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
       setIsLoadingVideo(false);
       if (videoRef.current && duration === 0 && videoRef.current.duration > 0) { // Update duration if not set yet and valid
            setDuration(videoRef.current.duration);
       }
        // Attempt to play if the user intended to play
        if (isPlaying && videoRef.current?.paused) {
            handlePlayPause(); // Re-trigger play logic which checks readyState again
        }
   };


  // Called when an error occurs while fetching or playing the media
  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video Error Event triggered.'); // Log that the handler was called
    const videoElement = e.target as HTMLVideoElement;
    const error = videoElement.error;

    // Log details regardless of whether error object exists
    if (error) {
      console.error('Video Error Code:', error.code);
      console.error('Video Error Message:', error.message || '(No specific message)');
    } else {
      console.error('Video error event occurred, but no error object found on the element.');
    }


    setIsLoadingVideo(false);
    setIsPlaying(false);

    // Ignore aborted errors, as they often happen during source changes or normal pauses
    if (error?.code === MediaError.MEDIA_ERR_ABORTED) {
       console.warn("Video loading/playback aborted. This is often normal (e.g., new file load).");
       // If src is null/empty, it was likely intentional reset, don't show error.
       if(!videoElement.currentSrc){
            console.log("Abort ignored as video source is empty.");
            return;
       }
       // If src exists but aborted, maybe show a less severe message or just log
       // toast({ title: 'Info', description: 'Video playback stopped.', variant: 'default' });
       return;
    }

    let message = 'An unknown video error occurred.';
    if (error) {
      switch (error.code) {
        case MediaError.MEDIA_ERR_NETWORK: // 2
          message = 'A network error occurred while fetching the video. Please check your connection or try uploading again.';
          break;
        case MediaError.MEDIA_ERR_DECODE: // 3
          message = 'The video could not be decoded. The file might be corrupted or in an unsupported format.';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: // 4
          message = 'The video format is not supported by your browser, or the video could not be loaded.';
          break;
        default:
          message = `An unexpected error occurred (Code: ${error.code}). ${error.message || ''}`;
      }
       toast({
         title: 'Video Error',
         description: message,
         variant: 'destructive',
       });
    } else {
        // Fallback if no error object exists but the error event fired
        toast({
             title: 'Video Playback Error',
             description: 'An error occurred while trying to play the video. It might be an unsupported format or a browser issue.',
             variant: 'destructive',
         });
    }

    // --- Robust Reset ---
    // Update state *before* manipulating the DOM element if possible
    setVideoSrc(null);
    setCurrentTime(0);
    setDuration(0);

    // Reset the video element itself
    if(videoRef.current){
       // Remove source and reset
       videoRef.current.removeAttribute('src');
       // Ensure listeners are detached if necessary (though useEffect cleanup should handle this)
       videoRef.current.load(); // Reset the media element
       console.log("Video element reset due to error.");
    }

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

   // Effect for setting up and cleaning up event listeners and object URLs
   useEffect(() => {
    const video = videoRef.current;
    const currentVideoSrc = videoSrc; // Capture src in effect scope for cleanup

    // Define listeners locally to ensure correct references
    const onTimeUpdate = () => handleTimeUpdate();
    const onLoadedMetadata = () => handleLoadedMetadata();
    const onEnded = () => handleVideoEnd();
    const onWaiting = () => handleWaiting();
    const onCanPlay = () => handleCanPlay();
    const onCanPlayThrough = () => handleCanPlayThrough();
    const onError = (e: Event) => handleVideoError(e as unknown as React.SyntheticEvent<HTMLVideoElement, Event>); // Cast needed
    const onPlay = () => setIsLoadingVideo(false); // Hide loading on successful play
    const onPause = () => setIsLoadingVideo(false); // Hide loading on pause

    if (video && currentVideoSrc) {
        // --- Add event listeners ---
        video.addEventListener('timeupdate', onTimeUpdate);
        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('ended', onEnded);
        video.addEventListener('waiting', onWaiting);
        video.addEventListener('canplay', onCanPlay);
        video.addEventListener('canplaythrough', onCanPlayThrough);
        video.addEventListener('error', onError);
        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);

        console.log("Added event listeners for:", currentVideoSrc);
    }

    // --- Cleanup function ---
    return () => {
      // Remove event listeners
      if (video) {
          video.removeEventListener('timeupdate', onTimeUpdate);
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          video.removeEventListener('ended', onEnded);
          video.removeEventListener('waiting', onWaiting);
          video.removeEventListener('canplay', onCanPlay);
          video.removeEventListener('canplaythrough', onCanPlayThrough);
          video.removeEventListener('error', onError);
          video.removeEventListener('play', onPlay);
          video.removeEventListener('pause', onPause);
          console.log("Removed event listeners.");
      }

      // Revoke the object URL *only if it's the one this effect instance was responsible for*
      // This prevents revoking a URL that's still potentially needed by a rapid subsequent state update
      if (currentVideoSrc && currentVideoSrc.startsWith('blob:')) {
        // Consider adding a small delay or checking if the src is still the current state src
        // For simplicity now, we revoke immediately. If issues persist, look into delaying revocation.
        URL.revokeObjectURL(currentVideoSrc);
        console.log("Revoked object URL on cleanup:", currentVideoSrc);
      }
    };
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [videoSrc]); // Only re-run when videoSrc changes

   // Separate effect for state changes that *don't* require listener re-attachment
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
            videoRef.current.volume = volume;
        }
    }, [isMuted, volume]);


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
                    // Event listeners are added/removed in the useEffect hook
                    onClick={handlePlayPause} // Play/pause on video click
                    playsInline // Important for mobile playback
                    preload="metadata" // Suggest browser load metadata quickly
                    // src is set dynamically in handleFileChange and useEffect
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
                  // Resetting value is now handled in onChange handler
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

