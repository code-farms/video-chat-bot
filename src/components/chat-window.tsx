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

export default function ChatWindow() {
  const messages = useSelector(selectMessages);
  const dispatch = useDispatch<AppDispatch>();
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      // Dispatch action to add the new message (assuming sender is 'user')
      dispatch(addMessage({ text: newMessage, sender: 'user' }));
      setNewMessage(''); // Clear input field
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
        // Use scrollHeight to scroll to the bottom
        // Need to access the underlying DOM element for scrollHeight
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
             viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);


  return (
    <div className="flex flex-col h-full bg-card text-card-foreground rounded-lg shadow">
      <h2 className="text-lg font-semibold p-4 border-b border-border text-primary">Chat</h2>
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex items-start gap-3',
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.sender !== 'user' && (
                 <Avatar className="h-8 w-8">
                   <AvatarImage src="https://picsum.photos/32/32" alt="Other User" />
                   <AvatarFallback>O</AvatarFallback>
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
                 <Avatar className="h-8 w-8">
                   {/* You can add a user avatar source here if available */}
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
