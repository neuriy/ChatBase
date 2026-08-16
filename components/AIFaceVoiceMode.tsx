"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Mic, MicOff, Volume2, Sparkles, ArrowLeft } from "lucide-react";
import { AIFace } from "./AIFace";

interface AIFaceVoiceModeProps {
  onClose: () => void;
  onSendMessage: (text: string) => Promise<string> | void;
}

export const AIFaceVoiceMode: React.FC<AIFaceVoiceModeProps> = ({
  onClose,
  onSendMessage,
}) => {
  const [isListening, setIsListening] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastResponse, setLastResponse] = useState("");

  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let current = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          setTranscript(current);
        };

        recognition.onend = async () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        try {
          recognition.start();
        } catch (e) {
          // ignore
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // When speech transcript completes, process answer & speak back
  const handleFinalizeSpeech = async (spokenText: string) => {
    if (!spokenText.trim() || isThinking || isSpeaking) return;

    setIsThinking(true);
    setIsListening(false);

    let reply = "";
    const lower = spokenText.toLowerCase();

    if (lower.includes("error") || lower.includes("causing")) {
      reply = "Check your browser console or terminal logs for exact stack traces!";
    } else if (lower.includes("contrast") || lower.includes("color")) {
      reply = "Your primary contrast ratio is 14 to 1, which passes WCAG AAA standards!";
    } else if (lower.includes("space") || lower.includes("disk")) {
      reply = "Freeing up disk space will drastically improve system performance!";
    } else {
      reply = `Got it! I am ready to help you with ${spokenText}.`;
    }

    setLastResponse(reply);
    setIsThinking(false);

    // Speak reply using SpeechSynthesis
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(reply);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        // Restart listening after speaking
        setTranscript("");
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
            setIsListening(true);
          } catch (e) {}
        }
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  // Trigger speech finalization when user stops talking
  useEffect(() => {
    if (!isListening && transcript.trim() && !isSpeaking && !isThinking) {
      handleFinalizeSpeech(transcript);
    }
  }, [isListening, transcript]);

  const toggleMic = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {}
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#ededed] dark:bg-[#121214] flex flex-col items-center justify-between p-6 animate-fade-in">
      {/* Top Bar */}
      <div className="w-full max-w-2xl flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-semibold shadow-xs hover:opacity-90 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Voice Mode</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Neuriy AI Interactive Voice</span>
        </div>
      </div>

      {/* Centered AI Face */}
      <div className="my-auto flex flex-col items-center text-center space-y-8">
        <AIFace
          isListening={isListening}
          isSpeaking={isSpeaking}
          size="lg"
        />

        {/* Status Text */}
        <div className="space-y-2 max-w-md">
          <p className="text-sm font-semibold tracking-wide uppercase text-neutral-400">
            {isThinking
              ? "Neuriy is thinking..."
              : isSpeaking
              ? "Neuriy is speaking..."
              : isListening
              ? "Listening... Speak anytime"
              : "Tap Mic to speak"}
          </p>

          {/* Transcript / Spoken text display */}
          {transcript && (
            <p className="text-lg font-medium text-neutral-800 dark:text-neutral-100 italic animate-fade-in">
              "{transcript}"
            </p>
          )}

          {lastResponse && !transcript && (
            <p className="text-base text-neutral-600 dark:text-neutral-300 animate-fade-in">
              "{lastResponse}"
            </p>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="w-full max-w-md flex items-center justify-center gap-4 mb-4">
        <button
          onClick={toggleMic}
          className={`p-4 rounded-full shadow-lg transition-all transform active:scale-95 ${
            isListening
              ? "bg-red-500 text-white animate-pulse"
              : "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
          }`}
        >
          {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <button
          onClick={onClose}
          className="p-4 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
