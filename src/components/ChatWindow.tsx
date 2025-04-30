
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { addMessage, selectMessages } from '@/lib/redux/slices/chatSlice';
import type { AppDispatch } from '@/lib/redux/store';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Define message type if not already defined globally
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: number;
}

export default function ChatWindow() {
  const messages: Message[] = useSelector(selectMessages);
  const dispatch = useDispatch<AppDispatch>();
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage || isLoading) return;

    // Dispatch user message
    dispatch(addMessage({ text: trimmedMessage, sender: 'user' }));
    setNewMessage('');
    setIsLoading(true);

    try {
      // Call the Next.js proxy API route
      const response = await fetch('/api/fastapi-proxy', { // Changed endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send message in the format expected by FastAPI backend
        body: JSON.stringify({ message: trimmedMessage }),
      });

      if (!response.ok) {
        // Try to parse error message from backend
        let errorData;
        try {
            errorData = await response.json();
        } catch (parseError) {
            // If parsing fails, use the status text
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }
         // Use 'error' from proxy or 'detail' from FastAPI if available
        throw new Error(errorData?.error || errorData?.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Adjust based on the actual response structure from FastAPI via the proxy
      // Assuming FastAPI returns { response: "AI message" }
      if (!data.response) {
        throw new Error('AI response format incorrect from backend');
      }

      // Dispatch AI response
      dispatch(addMessage({ text: data.response, sender: 'other' }));

    } catch (error) {
      console.error('Error calling chat proxy API:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get AI response. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      // Optionally, add a system message indicating failure
       dispatch(addMessage({ text: 'Sorry, I could not process your request.', sender: 'other' }));
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport) {
      // Use requestAnimationFrame for smoother scrolling after render
      requestAnimationFrame(() => {
         viewport.scrollTop = viewport.scrollHeight;
      });
    }
  }, [messages]);


  return (
    <div className="flex flex-col h-full bg-card text-card-foreground rounded-lg shadow">
      <h2 className="text-lg font-semibold p-4 border-b border-border text-primary">Chat</h2>
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
         {/*
           This div is the viewport for the ScrollArea.
           It needs `data-radix-scroll-area-viewport=""` for styling/functionality if using Radix directly,
           but ShadCN's ScrollArea handles this. Ensure it has `h-full` to fill the ScrollArea.
         */}
         <div ref={viewportRef} className="h-full space-y-4">
           {messages.map((message) => (
             <div
               key={message.id}
               className={cn(
                 'flex items-start gap-3',
                 message.sender === 'user' ? 'justify-end' : 'justify-start'
               )}
             >
               {message.sender === 'other' && (
                  <Avatar className="h-8 w-8 shrink-0">
                    {/* Placeholder for AI avatar */}
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
               )}
               <div
                 className={cn(
                   'max-w-[75%] rounded-lg p-3 text-sm break-words shadow-sm', // Added shadow-sm
                   message.sender === 'user'
                     ? 'bg-primary text-primary-foreground'
                     : 'bg-muted text-muted-foreground'
                 )}
               >
                 <p>{message.text}</p>
                 <p className="text-xs opacity-70 mt-1 text-right">
                   {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </p>
               </div>
                {message.sender === 'user' && (
                  <Avatar className="h-8 w-8 shrink-0">
                    {/* Using a placeholder/consistent avatar for user */}
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                )}
             </div>
           ))}
           {/* Optional: Show typing indicator while loading */}
           {isLoading && (
             <div className="flex items-start gap-3 justify-start">
               <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback>AI</AvatarFallback>
               </Avatar>
               <div className="max-w-[75%] rounded-lg p-3 text-sm bg-muted text-muted-foreground shadow-sm">
                 <p className="italic flex items-center gap-1">
                    <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
                 </p>
               </div>
             </div>
           )}
         </div>
       </ScrollArea>
      <form onSubmit={handleSendMessage} className="p-4 border-t border-border flex items-center gap-2">
        <Input
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1"
          aria-label="Chat message input"
          disabled={isLoading} // Disable input while loading
        />
        <Button type="submit" size="icon" aria-label="Send message" disabled={isLoading || !newMessage.trim()}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}

