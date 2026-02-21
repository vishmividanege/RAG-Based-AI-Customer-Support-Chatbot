// Web Speech API wrapper for STT and TTS

/**
 * Text-to-Speech (TTS)
 */
export const speakText = (text, onEnd) => {
    if (!('speechSynthesis' in window)) {
        console.error("Speech synthesis not supported");
        return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Preferred voice selection
    const voices = window.speechSynthesis.getVoices();
    // Try to find a high-quality female voice
    const preferredVoice = voices.find(v =>
        (v.name.includes('Google') || v.name.includes('Natural')) &&
        (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Google US English'))
    ) || voices[0];

    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    if (onEnd) utterance.onend = onEnd;

    window.speechSynthesis.speak(utterance);
    return utterance;
};

export const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
};

/**
 * Speech-to-Text (STT)
 */
export const createSpeechRecognition = ({ onResult, onError, onEnd, onStart }) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.error("Speech recognition not supported");
        return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        if (onStart) onStart();
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (onResult) onResult(transcript);
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
            alert("Microphone access denied. Please enable it in browser settings.");
        }
        if (onError) onError(event.error);
    };

    recognition.onend = () => {
        if (onEnd) onEnd();
    };

    return recognition;
};
