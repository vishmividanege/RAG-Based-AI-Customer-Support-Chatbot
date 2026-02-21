import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, Trash2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ChatInterface = () => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hello! I'm your AI Customer Support assistant. How can I help you today?", id: 1 }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const [isBackendOnline, setIsBackendOnline] = useState(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const checkBackend = async () => {
            try {
                const res = await fetch('http://127.0.0.1:8000/health');
                if (res.ok) setIsBackendOnline(true);
                else setIsBackendOnline(false);
            } catch (e) {
                console.error("Backend health check failed:", e);
                setIsBackendOnline(false);
            }
        };
        checkBackend();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input, id: Date.now() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const assistantMessageId = Date.now() + 1;
        // Add a placeholder message for the assistant
        setMessages(prev => [...prev, { role: 'assistant', content: '', id: assistantMessageId }]);

        try {
            const response = await fetch('http://127.0.0.1:8000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: input }),
            });

            if (!response.ok) {
                let errorDetails = `Status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorDetails += ` - ${JSON.stringify(errorData)}`;
                } catch (e) {
                    errorDetails += ` - (Could not parse error body)`;
                }
                throw new Error(`Server Response Error (${errorDetails})`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                accumulatedContent += chunk;

                // Update the last message in real-time
                setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: accumulatedContent }
                        : msg
                ));

                // Keep loading indicator off once we start receiving text
                if (isLoading) setIsLoading(false);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMessageId
                    ? { ...msg, content: `Error: ${error.message}`, isError: true }
                    : msg
            ));
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([{ role: 'assistant', content: "Chat cleared. How else can I help you?", id: Date.now() }]);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl h-[80vh] flex flex-col glass rounded-3xl overflow-hidden shadow-2xl relative"
        >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-500/20 p-2 rounded-xl">
                        <Bot className="text-indigo-400" size={24} />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-white tracking-tight">AI Support Assistant</h1>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isBackendOnline === true ? 'bg-emerald-500 animate-pulse' : isBackendOnline === false ? 'bg-red-500' : 'bg-gray-500'}`} />
                            <span className="text-xs text-white/50 font-medium">
                                {isBackendOnline === true ? 'Online & Ready' : isBackendOnline === false ? 'Connection Error' : 'Checking connection...'}
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={clearChat}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white/80"
                    title="Clear Chat"
                >
                    <Trash2 size={20} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${msg.role === 'user' ? 'bg-purple-500/20' : 'bg-indigo-500/20'
                                    }`}>
                                    {msg.role === 'user' ? <User size={16} className="text-purple-400" /> : <Sparkles size={16} className="text-indigo-400" />}
                                </div>
                                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-tr-none'
                                    : `${msg.isError ? 'bg-red-500/10 border-red-500/20 text-red-200' : 'bg-white/5 text-white/90'} rounded-tl-none border border-white/10`
                                    }`}>
                                    {msg.content || (msg.role === 'assistant' && !msg.isError ? <span className="opacity-50 animate-pulse">|</span> : msg.content)}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isLoading && messages[messages.length - 1].content === '' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                    >
                        <div className="flex gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none items-center">
                            <Loader2 className="animate-spin text-indigo-400" size={18} />
                            <span className="text-sm text-white/50 font-medium tracking-wide">AI is preparing response...</span>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-6 bg-white/5 border-t border-white/10">
                <div className="relative group">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                        placeholder="Ask me anything..."
                        className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm rounded-2xl py-4 pl-5 pr-14 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all group-hover:border-white/20"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:hover:bg-indigo-500 text-white rounded-xl transition-all flex items-center justify-center shadow-lg shadow-indigo-500/20"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                    </button>
                </div>
                <p className="mt-3 text-center text-[10px] text-white/20 uppercase tracking-widest font-bold">
                    Powered by Streaming RAG & Mistral-7B
                </p>
            </form>
        </motion.div>
    );
};

export default ChatInterface;
