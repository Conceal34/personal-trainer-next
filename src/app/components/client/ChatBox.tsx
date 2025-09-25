'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/src/app/components/button'; // Corrected Path
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { sendMessage } from '@/src/app/dashboard/client/actions'; // Import the Server Action

type Message = { id: string; content: string; sender_id: string; created_at: string; };

interface ChatBoxProps {
    initialMessages: Message[];
    userId: string;
}

export function ChatBox({ initialMessages, userId }: ChatBoxProps) {
    const supabase = createClient();
    const [messages, setMessages] = useState(initialMessages);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    useEffect(() => { scrollToBottom(); }, [messages]);

    // Listen for new messages in real-time
    useEffect(() => {
        const channel = supabase
            .channel('realtime-messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` },
                (payload) => { setMessages((current) => [...current, payload.new as Message]); }
            )
            .subscribe((status) => {
                setIsConnected(status === 'SUBSCRIBED');
            });
        return () => { supabase.removeChannel(channel); };
    }, [supabase, userId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || isSending) return;

        setIsSending(true);

        // Optimistic UI: Update the UI instantly
        const optimisticMessage: Message = {
            id: crypto.randomUUID(),
            content: newMessage,
            sender_id: userId,
            created_at: new Date().toISOString(),
        };
        setMessages(current => [...current, optimisticMessage]);

        const messageToSend = newMessage;
        setNewMessage('');

        // Call the secure server action
        await sendMessage(messageToSend);

        setIsSending(false);
    };

    return (
        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700 flex flex-col h-[60vh]">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-amber-400">Chat with Your Trainer</h3>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs text-gray-400">{isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto pr-4 space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.sender_id === userId ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${msg.sender_id === userId ? 'bg-amber-500 text-black' : 'bg-gray-700 text-white'}`}>
                            <p className="text-sm">{msg.content}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 px-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-gray-700 flex items-center gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isSending || !isConnected}
                    className="w-full flex-grow rounded-md border-0 bg-white/5 py-2 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                />
                <Button type="submit" size="sm" disabled={isSending || !isConnected || newMessage.trim() === ''}>
                    {isSending ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> : <PaperAirplaneIcon className="h-5 w-5" />}
                </Button>
            </form>
        </div>
    );
}