"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Mic, MicOff, Sparkles, ArrowLeft, Keyboard } from "lucide-react";
import { AIFace } from "./AIFace";

interface AIFaceVoiceModeProps {
  onClose: () => void;
  /** Send spoken text through Neuriy chat (ElloFive) and return the assistant reply. */
  onSendMessage: (text: string) => Promise<string | null | void> | string | null | void;
}

function stripForSpeech(text: string): string {
  return String(text || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[_>~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const AIFaceVoiceMode: React.FC<AIFaceVoiceModeProps> = ({
  onClose,
  onSendMessage,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastResponse, setLastResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [typed, setTyped] = useState("");

  const recognitionRef = useRef<any>(null);
  const interimBaseRef = useRef("");
  const transcriptRef = useRef("");
  const busyRef = useRef(false);
  const restartListeningRef = useRef(false);

  const speakReply = useCallback((reply: string, onDone?: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onDone?.();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(stripForSpeech(reply));
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onerror = () => {
      setIsSpeaking(false);
      onDone?.();
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      onDone?.();
    };
    window.speechSynthesis.speak(utterance);
  }, []);

  const handleFinalizeSpeech = useCallback(
    async (spokenText: string) => {
      const cleaned = spokenText.trim();
      if (!cleaned || busyRef.current) return;

      busyRef.current = true;
      setIsThinking(true);
      setIsListening(false);
      setError(null);
      recognitionRef.current?.stop();

      let reply = "";
      try {
        const result = await onSendMessage(cleaned);
        reply =
          typeof result === "string" && result.trim()
            ? result.trim()
            : "Neuriy heard you. Check the chat for the ElloFive reply.";
      } catch {
        reply = "Neuriy could not reach ElloFive just now. Please try again.";
        setError(reply);
      }

      setLastResponse(reply);
      setTranscript("");
      setIsThinking(false);

      speakReply(reply, () => {
        busyRef.current = false;
        if (restartListeningRef.current && recognitionRef.current) {
          try {
            interimBaseRef.current = "";
            recognitionRef.current.start();
            setIsListening(true);
          } catch {
            setIsListening(false);
          }
        }
      });
    },
    [onSendMessage, speakReply]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setSpeechSupported(false);
      setShowTextFallback(true);
      setError("Voice mic needs Chrome or Safari. You can still type to Neuriy below.");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      let finalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalChunk += piece;
        else interim += piece;
      }
      if (finalChunk) {
        interimBaseRef.current = `${interimBaseRef.current} ${finalChunk}`.trim();
      }
      const next = `${interimBaseRef.current} ${interim}`.trim();
      transcriptRef.current = next;
      setTranscript(next);
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        setError("Microphone permission blocked. Allow mic access, or type below.");
        setShowTextFallback(true);
        restartListeningRef.current = false;
      } else if (event.error === "no-speech") {
        setError("No speech heard — tap the mic and try again.");
      } else if (event.error !== "aborted") {
        setError(`Voice error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      const finalText =
        interimBaseRef.current.trim() || transcriptRef.current.trim();
      if (finalText && !busyRef.current) {
        void handleFinalizeSpeech(finalText);
      }
    };

    recognitionRef.current = recognition;
    restartListeningRef.current = true;
    try {
      recognition.start();
    } catch {
      setSpeechSupported(false);
      setShowTextFallback(true);
    }

    return () => {
      restartListeningRef.current = false;
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      setShowTextFallback(true);
      setError("Voice mic is not available in this browser. Type to Neuriy below.");
      return;
    }

    if (isListening) {
      restartListeningRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    if (isSpeaking && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      busyRef.current = false;
    }

    interimBaseRef.current = "";
    setTranscript("");
    setError(null);
    restartListeningRef.current = true;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      setError("Could not start the microphone. Try again or type below.");
      setShowTextFallback(true);
    }
  };

  const submitTyped = async () => {
    const value = typed.trim();
    if (!value || busyRef.current) return;
    setTyped("");
    setTranscript(value);
    await handleFinalizeSpeech(value);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#ededed] dark:bg-[#121214] flex flex-col items-center justify-between p-6 animate-fade-in">
      <div className="w-full max-w-2xl flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-semibold shadow-xs hover:opacity-90 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Voice Mode</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Neuriy · ElloFive voice</span>
        </div>
      </div>

      <div className="my-auto flex flex-col items-center text-center space-y-8">
        <AIFace isListening={isListening} isSpeaking={isSpeaking} size="lg" />

        <div className="space-y-2 max-w-md">
          <p className="text-sm font-semibold tracking-wide uppercase text-neutral-400">
            {isThinking
              ? "ElloFive is thinking..."
              : isSpeaking
                ? "Neuriy is speaking..."
                : isListening
                  ? "Listening... Speak anytime"
                  : speechSupported
                    ? "Tap Mic to speak"
                    : "Type to talk with Neuriy"}
          </p>

          {transcript && (
            <p className="text-lg font-medium text-neutral-800 dark:text-neutral-100 italic animate-fade-in">
              &ldquo;{transcript}&rdquo;
            </p>
          )}

          {lastResponse && !transcript && (
            <p className="text-base text-neutral-600 dark:text-neutral-300 animate-fade-in">
              &ldquo;{lastResponse}&rdquo;
            </p>
          )}

          {error && (
            <p className="text-sm text-amber-700 dark:text-amber-300 animate-fade-in">{error}</p>
          )}
        </div>
      </div>

      <div className="w-full max-w-md flex flex-col items-center gap-4 mb-4">
        {(showTextFallback || !speechSupported) && (
          <div className="w-full flex items-center gap-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-2 shadow-sm">
            <Keyboard className="w-4 h-4 text-neutral-400 ml-2 shrink-0" />
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void submitTyped();
                }
              }}
              placeholder="Type to Neuriy (ElloFive)…"
              className="flex-1 bg-transparent outline-none text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 py-2"
              disabled={isThinking || isSpeaking}
            />
            <button
              type="button"
              onClick={() => void submitTyped()}
              disabled={!typed.trim() || isThinking || isSpeaking}
              className="px-3 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold disabled:opacity-40"
            >
              Send
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={toggleMic}
            disabled={isThinking}
            title={isListening ? "Stop listening" : "Start microphone"}
            className={`p-4 rounded-full shadow-lg transition-all transform active:scale-95 disabled:opacity-50 ${
              isListening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
            }`}
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <button
            type="button"
            onClick={() => setShowTextFallback((v) => !v)}
            title="Type instead of speaking"
            className="p-4 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
          >
            <Keyboard className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-4 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
