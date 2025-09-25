'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/src/app/components/button';
import { getMessagesForClient, sendMessageToClient } from '@/src/app/admin/actions';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

type Client = { id: string; full_name: string | null; };
type Message = { id: string; content: string; sender_id: string; created_at: string; };

interface AdminChatInterfaceProps {
    clients: Client[];
    adminId: string;
}

export function AdminChatInterface({ clients, adminId }: AdminChatInterfaceProps) {
    const supabase = createClient();
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    useEffect(() => { scrollToBottom(); }, [messages]);

    // Listen for any new message sent to the admin
    useEffect(() => {
        const channel = supabase
            .channel('admin-chat')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${adminId}` },
                (payload) => {
                    // If the new message belongs to the currently selected chat, add it to the view
                    if (payload.new.sender_id === selectedClientId) {
                        setMessages(current => [...current, payload.new as Message]);
                    }
                }
            ).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [supabase, adminId, selectedClientId]);

    const handleClientSelect = async (clientId: string) => {
        setSelectedClientId(clientId);
        setIsLoading(true);
        const fetchedMessages = await getMessagesForClient(clientId);
        setMessages(fetchedMessages);
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedClientId) return;

        // Optimistic UI update
        const optimisticMessage: Message = { id: crypto.randomUUID(), content: newMessage, sender_id: adminId, created_at: new Date().toISOString() };
        setMessages(current => [...current, optimisticMessage]);

        await sendMessageToClient(selectedClientId, newMessage);
        setNewMessage('');
    };

    return (
        <div className="flex h-[80vh] bg-gray-900/50 rounded-2xl border border-gray-700 overflow-hidden">
            {/* Client List Sidebar */}
            <aside className="w-1/3 border-r border-gray-700 overflow-y-auto">
                <div className="p-4 border-b border-gray-700">
                    <h2 className="font-semibold text-white">Conversations</h2>
                </div>
                <ul>
                    {clients.map(client => (
                        <li key={client.id}>
                            <button
                                onClick={() => handleClientSelect(client.id)}
                                className={`w-full text-left p-4 hover:bg-black/20 ${selectedClientId === client.id ? 'bg-amber-500/10' : ''}`}
                            >
                                {client.full_name || 'Unnamed Client'}
                            </button>
                        </li>
                    ))}
                </ul>
            </aside>

            {/* Main Chat Area */}
            <main className="w-2/3 flex flex-col">
                {selectedClientId ? (
                    <>
                        <div className="flex-grow p-6 overflow-y-auto space-y-4">
                            {isLoading ? <p className="text-center text-gray-400">Loading messages...</p> : messages.map(msg => (
                                <div key={msg.id} className={`flex items-end gap-2 ${msg.sender_id === adminId ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${msg.sender_id === adminId ? 'bg-amber-500 text-black' : 'bg-gray-700 text-white'}`}>
                                        <p className="text-sm">{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700 flex items-center gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="w-full flex-grow rounded-md border-0 bg-white/5 py-2 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-amber-500"
                            />
                            <Button type="submit" size="sm"><PaperAirplaneIcon className="h-5 w-5" /></Button>
                        </form>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <p>Select a client to view the conversation.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
