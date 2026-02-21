import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, Trash2, Sparkles, Mic, Volume2, VolumeX, MicOff, Shield, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { speakText, stopSpeaking, createSpeechRecognition } from '../utils/voiceUtils';

const ChatInterface = () => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hello! How can I help you today?", id: 1 }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const [isBackendOnline, setIsBackendOnline] = useState(null);


    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [autoRead, setAutoRead] = useState(true);
    const recognitionRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const checkBackend = async () => {
            try {
                const res = await fetch('http://localhost:8000/health');
                if (res.ok) setIsBackendOnline(true);
                else setIsBackendOnline(false);
            } catch (e) {
                console.error("Backend health check failed:", e);
                setIsBackendOnline(false);
            }
        };
        checkBackend();


        recognitionRef.current = createSpeechRecognition({
            onResult: (transcript) => {
                setInput(transcript);
                setIsListening(false);
            },
            onError: () => setIsListening(false),
            onEnd: () => setIsListening(false),
            onStart: () => setIsListening(true)
        });

        return () => stopSpeaking();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e, forcedInput) => {
        if (e) e.preventDefault();
        const finalInput = forcedInput || input;
        if (!finalInput.trim() || isLoading) return;

        const userMessage = { role: 'user', content: finalInput, id: Date.now() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        stopSpeaking();

        const assistantMessageId = Date.now() + 1;
        setMessages(prev => [...prev, { role: 'assistant', content: '', id: assistantMessageId }]);

        try {
            const response = await fetch('http://localhost:8000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: finalInput }),
            });

            if (!response.ok) throw new Error(`Link Failure: ${response.status}`);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                accumulatedContent += chunk;

                setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: accumulatedContent }
                        : msg
                ));

                if (isLoading) setIsLoading(false);
            }

            if (autoRead) {
                setIsSpeaking(true);
                speakText(accumulatedContent, () => setIsSpeaking(false));
            }

        } catch (error) {
            console.error('Core Error:', error);
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMessageId
                    ? { ...msg, content: `CRITICAL ERROR: ${error.message}`, isError: true }
                    : msg
            ));
        } finally {
            setIsLoading(false);
        }
    };

    const toggleListening = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            stopSpeaking();
            recognitionRef.current.start();
        }
    };

    const toggleSpeaking = () => {
        if (isSpeaking) {
            stopSpeaking();
            setIsSpeaking(false);
        }
    };

    const clearChat = () => {
        stopSpeaking();
        setMessages([{ role: 'assistant', content: "Cache purged. New session initiated.", id: Date.now() }]);
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center p-4">
            <div className="mesh-gradient" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl h-[90vh] flex flex-col glass-panel rounded-[3rem] overflow-hidden relative shadow-[0_0_50px_rgba(99,102,241,0.1)]"
            >
                { }
                <div className="p-8 pb-6 flex items-center justify-between border-b border-white/[0.05] bg-white/[0.03] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

                    <div className="flex items-center gap-5">
                        <div className="relative group/bot">
                            <motion.div
                                animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="absolute -inset-2 rounded-full border border-indigo-500/30 border-dashed group-hover/bot:border-purple-500/50 transition-colors"
                            />
                            <motion.div
                                animate={{ rotate: [360, 0], scale: [1, 1.05, 1] }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                className="absolute -inset-1 rounded-full border border-purple-500/20 border-dotted"
                            />
                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 relative overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                                <Bot className="text-white relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" size={28} />
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 opacity-40 group-hover/bot:opacity-60 transition-opacity" />
                                <motion.div
                                    animate={{ y: [-30, 30], opacity: [0, 0.5, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute inset-0 bg-white/20 blur-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent tracking-tight uppercase italic pr-2">Assistly</h1>
                                <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-[10px] text-indigo-400 font-bold border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]">AI</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${isBackendOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-rose-500'}`} />
                                    <span className="text-[10px] text-white/30 font-bold uppercase tracking-tighter">
                                        {isBackendOnline ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                                {isSpeaking && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex gap-2 items-center px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20"
                                    >
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3].map(i => (
                                                <motion.div
                                                    key={i}
                                                    animate={{ height: [4, 10, 4] }}
                                                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                                    className="w-0.5 bg-indigo-400"
                                                />
                                            ))}
                                        </div>
                                        <span className="text-[9px] text-indigo-400 font-bold uppercase">Streaming...</span>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setAutoRead(!autoRead)}
                            className={`p-3 rounded-2xl transition-all border ${autoRead ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-white/5 text-white/10 border-white/5'}`}
                        >
                            {autoRead ? <Volume2 size={20} /> : <VolumeX size={20} />}
                        </button>
                        <button
                            onClick={clearChat}
                            className="p-3 bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/20 rounded-2xl transition-all group/trash"
                        >
                            <Trash2 size={20} className="text-white/20 group-hover/trash:text-rose-400 transition-colors" />
                        </button>
                    </div>
                </div>

                { }
                <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar relative z-10">
                    <AnimatePresence mode="popLayout">
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex gap-5 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`mt-2 flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center border ${msg.role === 'user' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                                        }`}>
                                        {msg.role === 'user' ? <User size={20} /> : <Sparkles size={20} />}
                                    </div>
                                    <div className={`relative px-6 py-5 rounded-[2rem] text-sm leading-relaxed tracking-wide ${msg.role === 'user'
                                        ? 'bubble-user rounded-tr-none'
                                        : `bubble-ai rounded-tl-none ${msg.isError ? 'border-rose-500/30' : ''}`
                                        }`}>
                                        {msg.role === 'assistant' && (
                                            <div className="absolute -top-3 left-6 px-2 py-0.5 bg-[#0f172a] border border-white/10 rounded-md text-[8px] font-mono text-white/30 uppercase">
                                                Response.sys
                                            </div>
                                        )}
                                        <div className={msg.role === 'assistant' ? 'font-light' : 'font-medium italic'}>
                                            {msg.content || (
                                                <div className="flex gap-2 items-center opacity-40">
                                                    <Loader2 className="animate-spin" size={16} />
                                                    <span className="text-xs font-mono uppercase tracking-widest">Processing Data...</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>

                { }
                <div className="p-8 bg-white/[0.02] border-t border-white/[0.05] relative z-20">
                    <form onSubmit={handleSend} className="relative flex gap-4">
                        <div className="relative flex-1 group">
                            <div className="absolute inset-0 bg-indigo-500/5 rounded-3xl blur-xl group-focus-within:bg-indigo-500/10 transition-all pointer-events-none" />
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isLoading}
                                placeholder={isListening ? "LINK ACTIVE: LISTENING..." : "ENTER COMMAND..."}
                                className={`relative z-10 w-full bg-black/40 border border-white/10 text-white placeholder-white/10 text-xs font-mono rounded-3xl py-6 pl-8 pr-20 focus:outline-none focus:border-indigo-500/40 ring-offset-black focus:ring-1 focus:ring-indigo-500/30 transition-all ${isListening ? 'border-indigo-500/60 shadow-[0_0_30px_rgba(99,102,241,0.2)]' : ''}`}
                            />

                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    type="button"
                                    onClick={toggleListening}
                                    className={`p-3 rounded-2xl transition-all ${isListening ? 'bg-indigo-500 text-white' : 'text-white/20 hover:text-white/60 bg-white/5'}`}
                                >
                                    <Mic size={20} className={isListening ? 'animate-pulse' : ''} />
                                </motion.button>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="w-20 h-[72px] bg-indigo-500 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/30 disabled:opacity-20 transition-all border border-indigo-400/20"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                        </motion.button>

                        {isSpeaking && (
                            <motion.button
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                type="button"
                                onClick={toggleSpeaking}
                                className="w-[72px] h-[72px] rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.1)]"
                            >
                                <VolumeX size={28} />
                            </motion.button>
                        )}
                    </form>

                    <div className="mt-6 flex justify-between items-center px-2">
                        <div className="flex gap-1">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/5 border border-white/10" />
                            ))}
                        </div>
                        <div className="flex items-center gap-10">
                            <div className="flex items-center gap-2">
                                <Shield size={12} className="text-emerald-500/40" />
                                <span className="text-[9px] font-mono text-white/20 uppercase tracking-[2px]">Encrypted Link</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap size={12} className="text-amber-500/40" />
                                <span className="text-[9px] font-mono text-white/20 uppercase tracking-[2px]">Real-time Flux</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ChatInterface;
