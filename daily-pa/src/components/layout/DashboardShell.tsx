'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { AIChatbot } from '@/components/chat/AIChatbot';
import { AIAssistantFAB } from '@/components/chat/AIAssistantFAB';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [showChatbot, setShowChatbot] = useState(false);

  return (
    <div className="min-h-screen gradient-mesh">
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <main className="md:pl-72 pb-24 md:pb-0 min-h-screen">
        {children}
      </main>
      
      {/* Mobile Bottom Navigation with Chatbot button */}
      <MobileNav 
        onChatbotClick={() => setShowChatbot(!showChatbot)}
        isChatbotOpen={showChatbot}
      />

      {/* Desktop FAB - hidden on mobile since we have bottom nav */}
      <AIAssistantFAB 
        onClick={() => setShowChatbot(!showChatbot)} 
        isOpen={showChatbot} 
      />

      {/* AI Chatbot Modal */}
      <AIChatbot 
        isOpen={showChatbot} 
        onClose={() => setShowChatbot(false)} 
      />
    </div>
  );
}
