import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  MessageSquare, 
  User, 
  Clock, 
  ChevronLeft,
  Search,
  Check,
  CheckCheck,
  MoreVertical,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { messengerApi } from '../../services/messengerApi';
import type { ChatThread } from '../../services/messengerApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '../../utils/cn';

interface MessengerProps {
  driverId: string;
  initialThreadId?: string;
  initialRecipientId?: string;
}

export const DriverMessenger: React.FC<MessengerProps> = ({ 
  driverId, 
  initialThreadId, 
  initialRecipientId 
}) => {
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch threads
  const { data: threads, isLoading: loadingThreads } = useQuery({
    queryKey: ['messenger-threads', driverId],
    queryFn: () => messengerApi.getThreads(),
  });

  // Auto-select thread if initialId or initialRecipient provided
  useEffect(() => {
    if (threads && threads.length > 0) {
      if (initialThreadId) {
        const thread = threads.find(t => t.id === initialThreadId);
        if (thread) setSelectedThread(thread);
      } else if (initialRecipientId) {
        const thread = threads.find(t => t.participantId === initialRecipientId);
        if (thread) setSelectedThread(thread);
      }
    }
  }, [threads, initialThreadId, initialRecipientId]);

  // Fetch messages for selected thread
  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ['messenger-messages', selectedThread?.id],
    queryFn: () => messengerApi.getMessages(selectedThread!.id),
    enabled: !!selectedThread,
    refetchInterval: 5000, // Poll every 5s for new messages
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (content: string) => 
      messengerApi.sendMessage(selectedThread!.participantId, content, {
        tripId: selectedThread?.tripId,
        loadId: selectedThread?.loadId
      }),
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['messenger-messages', selectedThread?.id] });
      queryClient.invalidateQueries({ queryKey: ['messenger-threads', driverId] });
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendMutation.isPending) return;
    sendMutation.mutate(newMessage.trim());
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const filteredThreads = threads?.filter(thread => 
    thread.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.tripId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-[700px] bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden glassmorphism-effect animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Thread List Sidebar */}
      <div className={cn(
        "w-full md:w-80 flex flex-col border-r border-slate-50 transition-all",
        selectedThread ? "hidden md:flex" : "flex"
      )}>
        <div className="p-6 border-b border-slate-50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-[#0f172a] uppercase tracking-tight">Messages</h2>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#345E85] border border-blue-100">
              <MessageSquare size={18} />
            </div>
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#345E85]/10 focus:border-[#345E85] transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loadingThreads ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse" />)}
            </div>
          ) : filteredThreads?.length === 0 ? (
            <div className="p-8 text-center text-slate-400 italic">
              <p className="text-xs font-bold uppercase tracking-widest">No conversations found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredThreads?.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThread(thread)}
                  className={cn(
                    "w-full p-6 text-left transition-all hover:bg-slate-50/50 flex items-start gap-4 group",
                    selectedThread?.id === thread.id ? "bg-blue-50/30 border-r-4 border-[#345E85]" : ""
                  )}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-[#345E85] font-black uppercase tracking-tight group-hover:scale-105 transition-transform">
                      {thread.participantName.charAt(0)}
                    </div>
                    {thread.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                        {thread.unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-black text-[#0f172a] text-sm truncate uppercase tracking-tight leading-none pt-1">
                        {thread.participantName}
                      </h4>
                      {thread.lastMessage && (
                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap pt-1">
                          {formatTime(thread.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Briefcase size={10} />
                      {thread.participantRole} {thread.tripId ? `• ${thread.tripId}` : ''}
                    </p>
                    {thread.lastMessage && (
                      <p className="text-xs text-slate-500 truncate font-medium italic">
                        {thread.lastMessage.content}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col transition-all bg-slate-50/20",
        !selectedThread ? "hidden md:flex" : "flex"
      )}>
        {selectedThread ? (
          <>
            {/* Chat Header */}
            <div className="px-8 py-6 bg-white border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedThread(null)}
                  className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="w-12 h-12 rounded-2xl bg-[#345E85] text-white flex items-center justify-center font-black uppercase tracking-tight text-xl">
                  {selectedThread.participantName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#0f172a] uppercase tracking-tight leading-none">
                    {selectedThread.participantName}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5">
                     <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Online Now</span>
                     </div>
                     <span className="w-px h-3 bg-slate-200" />
                     <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                       {selectedThread.participantRole} {selectedThread.tripId ? `• ID: ${selectedThread.tripId}` : ''}
                     </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="w-10 h-10 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors flex items-center justify-center">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50/30 via-transparent to-transparent">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-4 border-[#345E85] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages?.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-12">
                   <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-[#345E85] mb-6 border border-blue-100">
                      <MessageSquare size={24} />
                   </div>
                   <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-widest mb-2">No messages yet</h3>
                   <p className="text-xs text-slate-400 font-medium italic">Send a message to start the conversation with the shipper.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Date Separator */}
                  <div className="flex items-center gap-4 py-4">
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] whitespace-nowrap">Encryption Active • Secure Tunnel</span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>

                  {messages?.map((msg) => {
                    const isMe = msg.senderRole === 'DRIVER';
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className={cn(
                          "flex group",
                          isMe ? "justify-end" : "justify-start"
                        )}
                      >
                        <div className={cn(
                          "max-w-[80%] flex items-end gap-3",
                          isMe ? "flex-row-reverse" : "flex-row"
                        )}>
                          {!isMe && (
                             <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm border border-slate-50 flex-shrink-0">
                                {msg.senderName.charAt(0)}
                             </div>
                          )}
                          <div className="space-y-1.5">
                             <div className={cn(
                                "px-6 py-4 rounded-[2rem] text-sm shadow-xl shadow-slate-200/20 relative overflow-hidden",
                                isMe 
                                  ? "bg-gradient-to-br from-[#345E85] to-blue-800 text-white rounded-tr-none" 
                                  : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                             )}>
                                <p className="font-medium leading-relaxed italic">{msg.content}</p>
                                <div className={cn(
                                   "flex items-center gap-2 mt-2",
                                   isMe ? "justify-end text-blue-100/50" : "justify-start text-slate-400"
                                )}>
                                   <span className="text-[9px] font-black uppercase tracking-widest">{formatTime(msg.timestamp)}</span>
                                   {isMe && (
                                      msg.isRead ? <CheckCheck size={12} className="text-emerald-300" /> : <Check size={12} />
                                   )}
                                </div>
                             </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-8 bg-white border-t border-slate-50">
               <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-[2rem] p-2 focus-within:ring-4 focus-within:ring-[#345E85]/5 focus-within:border-[#345E85] transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-500 cursor-pointer transition-colors shadow-sm ml-2">
                     <AlertCircle size={20} />
                  </div>
                  <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-3 pr-2">
                    <input 
                      type="text"
                      placeholder="Type a secure message..."
                      className="flex-1 bg-transparent border-none outline-none text-sm font-bold placeholder:text-slate-300 py-3"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button 
                      type="submit"
                      disabled={!newMessage.trim() || sendMutation.isPending}
                      className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#345E85] to-blue-800 text-white flex items-center justify-center shadow-lg shadow-blue-900/10 hover:scale-105 active:scale-95 disabled:grayscale disabled:opacity-50 transition-all group"
                    >
                      <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </button>
                  </form>
               </div>
               <div className="flex items-center justify-between mt-4 px-4">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle size={10} className="text-blue-500" /> Policy: Follow safety protocols in messages
                  </span>
                  <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                    <span>Protocol v2.1</span>
                  </div>
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center bg-slate-50/30">
            <div className="relative mb-12">
               <div className="absolute inset-0 bg-blue-500 rounded-full blur-[100px] opacity-10 animate-pulse" />
               <div className="w-32 h-32 bg-white rounded-[3rem] shadow-2xl flex items-center justify-center text-[#345E85] relative z-10 border border-slate-50">
                 <MessageSquare size={48} strokeWidth={1.5} />
               </div>
            </div>
            <h2 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight mb-4">Select a Channel</h2>
            <p className="text-slate-500 font-medium italic max-w-sm">
              Communicate directly with Shippers, Fleet Managers, and Support Hubs through our encrypted messaging terminal.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-12 w-full max-w-md">
               <div className="p-6 bg-white rounded-3xl border border-slate-100 text-left group hover:border-blue-100 transition-all shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#345E85] mb-4 group-hover:scale-110 transition-transform">
                     <User size={18} />
                  </div>
                  <h4 className="text-xs font-black text-[#0f172a] uppercase tracking-wider mb-1">Direct Shipper</h4>
                  <p className="text-[10px] text-slate-400 font-medium italic">Cargo verified chat</p>
               </div>
               <div className="p-6 bg-white rounded-3xl border border-slate-100 text-left group hover:border-blue-100 transition-all shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 mb-4 group-hover:scale-110 transition-transform">
                     <Clock size={18} />
                  </div>
                  <h4 className="text-xs font-black text-[#0f172a] uppercase tracking-wider mb-1">Dispatch Hub</h4>
                  <p className="text-[10px] text-slate-400 font-medium italic">Operational support</p>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
