
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Send, Loader2 } from 'lucide-react'; // Import Loader2 for loading state
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { addMessage, selectMessages } from '@/lib/redux/slices/chatSlice';
import type { AppDispatch } from '@/lib/redux/store';
import { cn } from '@/lib/utils';
import { chatWithAI } from '@/ai/flows/chat-flow'; // Import the Genkit flow
import { useToast } from '@/hooks/use-toast'; // Import useToast for error handling

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
  const [isLoading, setIsLoading] = useState(false); // State for loading indicator
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast(); // Initialize toast hook

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage || isLoading) return; // Prevent sending empty messages or during loading

    // Dispatch user message
    dispatch(addMessage({ text: trimmedMessage, sender: 'user' }));
    setNewMessage(''); // Clear input field immediately
    setIsLoading(true); // Set loading state

    try {
      // Call the Genkit flow
      const aiResponse = await chatWithAI({ userMessage: trimmedMessage });
      // Dispatch AI response
      dispatch(addMessage({ text: aiResponse.aiResponse, sender: 'other' }));
    } catch (error) {
      console.error('Error calling AI chat flow:', error);
      // Show error toast to the user
      toast({
        title: 'Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive',
      });
      // Optionally, add a system message indicating failure
       dispatch(addMessage({ text: 'Sorry, I could not process your request.', sender: 'other' }));
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);


  return (
    <div className="flex flex-col h-full bg-card text-card-foreground rounded-lg shadow">
      <h2 className="text-lg font-semibold p-4 border-b border-border text-primary">Chat</h2>
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
         <div ref={viewportRef} className="h-full space-y-4" data-radix-scroll-area-viewport="">
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
                    <AvatarImage src={`/ai-avatar.png`} alt="AI Assistant" /> {/* Consistent AI Avatar */}
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
               )}
               <div
                 className={cn(
                   'max-w-[75%] rounded-lg p-3 text-sm break-words', // Added break-words
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
                     <AvatarImage src={`https://i.pravatar.cc/32?u=user`} alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                )}
             </div>
           ))}
           {/* Optional: Show typing indicator while loading */}
           {isLoading && (
             <div className="flex items-start gap-3 justify-start">
               <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={`/ai-avatar.png`} alt="AI Assistant" />
                  <AvatarFallback>AI</AvatarFallback>
               </Avatar>
               <div className="max-w-[75%] rounded-lg p-3 text-sm bg-muted text-muted-foreground">
                 <p className="italic flex items-center gap-1">
                    <Loader2 className="h-4 w-4 animate-spin" /> Typing...
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
