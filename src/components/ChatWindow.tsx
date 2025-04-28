'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { addMessage, selectMessages } from '@/lib/redux/slices/chatSlice'; // Import Redux actions and selectors
import type { AppDispatch } from '@/lib/redux/store'; // Import AppDispatch type
import { cn } from '@/lib/utils'; // Import cn utility

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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  // Use a more specific ref type for the viewport if possible, or keep as any
  const viewportRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      // Dispatch action to add the new message
      dispatch(addMessage({ text: newMessage, sender: 'user' }));
      setNewMessage(''); // Clear input field

      // Simulate receiving a response after a short delay (for demonstration)
      setTimeout(() => {
        dispatch(addMessage({ text: `Echo: ${newMessage}`, sender: 'other' }));
      }, 500);
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
      {/* Use ScrollArea's viewport prop for direct ref */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
         <div ref={viewportRef} className="h-full space-y-4" data-radix-scroll-area-viewport=""> {/* Assign ref to the viewport div */}
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
                    <AvatarImage src={`https://i.pravatar.cc/32?u=${message.sender}`} alt="Other User" />
                    <AvatarFallback>{message.sender.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
               )}
               <div
                 className={cn(
                   'max-w-[75%] rounded-lg p-3 text-sm',
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
                    {/* Placeholder for user avatar */}
                     <AvatarImage src={`https://i.pravatar.cc/32?u=user`} alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                )}
             </div>
           ))}
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
        />
        <Button type="submit" size="icon" aria-label="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
