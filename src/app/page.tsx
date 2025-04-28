'use client';

import React, { useState, useRef } from 'react';
import { Upload, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ChatWindow from '@/components/chat-window'; // Import the ChatWindow component

export default function Home() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setIsPlaying(false); // Reset playing state on new video upload
    } else {
      // Handle invalid file type if needed
      console.error("Invalid file type. Please upload a video.");
      setVideoSrc(null); // Clear video source if invalid
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false); // Set playing state to false when video ends
  };


  return (
    <div className="flex h-screen bg-background">
      {/* Chat Window */}
      <div className="w-1/3 lg:w-1/4 border-r border-border bg-card text-card-foreground p-4 flex flex-col h-full">
         <ChatWindow />
      </div>

      {/* Video Section */}
      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        <Card className="w-full max-w-3xl bg-card text-card-foreground shadow-lg rounded-lg overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-center text-primary">Video Player</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="aspect-video bg-muted rounded-md mb-4 flex items-center justify-center overflow-hidden">
              {videoSrc ? (
                <video
                  ref={videoRef}
                  src={videoSrc}
                  className="w-full h-full object-contain"
                  controls={false} // Disable default controls
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={handleVideoEnd}
                />
              ) : (
                <div className="text-muted-foreground">
                  Upload a video to preview
                </div>
              )}
            </div>
            <div className="flex justify-center space-x-4">
               <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                style={{ display: 'none' }} // Hide the default file input
                aria-label="Upload video file"
              />
              <Button onClick={handleUploadClick} variant="outline">
                <Upload className="mr-2 h-4 w-4" /> Upload Video
              </Button>
              {videoSrc && (
                <Button onClick={handlePlayPause} variant="default">
                  {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
