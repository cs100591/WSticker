import React, { createContext, useContext } from 'react';

export interface ChatbotContextType {
    openChatbot: () => void;
    closeChatbot: () => void;
    isChatbotOpen: boolean;
}

export const ChatbotContext = createContext<ChatbotContextType>({
    openChatbot: () => { },
    closeChatbot: () => { },
    isChatbotOpen: false,
});

export const useChatbot = () => useContext(ChatbotContext);
