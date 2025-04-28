import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store'; // Import RootState type

// Define a type for the message object
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'other'; // Example sender types
  timestamp: number;
}

// Define the state shape for the chat slice
interface ChatState {
  messages: Message[];
}

// Define the initial state using that type
const initialState: ChatState = {
  messages: [],
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Action to add a new message
    addMessage: (state, action: PayloadAction<Omit<Message, 'id' | 'timestamp'>>) => {
      const newMessage: Message = {
        ...action.payload,
        id: new Date().toISOString() + Math.random(), // Simple unique ID generation
        timestamp: Date.now(),
      };
      state.messages.push(newMessage);
    },
    // Add other chat-related actions here if needed (e.g., deleteMessage, editMessage)
  },
});

// Export the action creators
export const { addMessage } = chatSlice.actions;

// Selector to get messages from the state
export const selectMessages = (state: RootState) => state.chat.messages;

// Export the reducer
export default chatSlice.reducer;
