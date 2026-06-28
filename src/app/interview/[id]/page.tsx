"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import BackgroundBlobs from "@/components/BackgroundBlobs";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  ArrowRight,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  CheckCircle
} from "lucide-react";

interface Question {
  id: string;
  questionText: string;
  score: number | null;
  critique: string | null;
  answerText: string | null;
}

interface Interview {
  id: string;
  role: string;
  level: string;
  status: string;
  language: string;
  questions: Question[];
}

export default function InterviewTerminalPage() {
  const router = useRouter();
  const params = useParams();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Active loop states
  const [activeIdx, setActiveIdx] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [webSpeechSupported, setWebSpeechSupported] = useState(true);
  const [finishing, setFinishing] = useState(false);

  // References to keep track of speech objects
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Check speech support
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const synth = window.speechSynthesis;
      if (!SpeechRecognition || !synth) {
        setWebSpeechSupported(false);
      }
      synthRef.current = synth;
    }

    const fetchInterview = async () => {
      try {
        const res = await fetch(`/api/interview/${interviewId}`);
        const data = await res.json();
        if (res.ok && data.success) {
          const fetchedInterview: Interview = data.interview;
          setInterview(fetchedInterview);
          
          if (fetchedInterview.status === "COMPLETED") {
            router.push(`/interview/${interviewId}/result`);
            return;
          }

          // Find first unanswered question
          const firstUnanswered = fetchedInterview.questions.findIndex(
            (q) => !q.answerText
          );
          if (firstUnanswered !== -1) {
            setActiveIdx(firstUnanswered);
          } else {
            // All answered but not finished
            handleFinishInterview();
          }
        } else {
          setError(data.error || "Failed to load interview session.");
        }
      } catch (e) {
        setError("Error communicating with mock interview service.");
      } finally {
        setLoading(false);
      }
    };

    if (interviewId) {
      fetchInterview();
    }

    return () => {
      // Clean up speech synthesis when component unmounts
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [interviewId]);

  // Handle TTS speaking of question
  const speakQuestion = (text: string) => {
    if (!synthRef.current || voiceMuted || !webSpeechSupported) return;

    // Cancel any active speech
    synthRef.current.cancel();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    
    if (interview?.language) {
      utterance.lang = interview.language;
    }
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsListening(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      // Auto trigger listening after question is finished
      startSpeechRecognition();
    };

    utterance.onerror = (e) => {
      console.error("SpeechSynthesis error:", e);
      setIsSpeaking(false);
    };

    // Configure voice properties
    utterance.rate = 0.95; // Slightly slower, more professional
    utterance.pitch = 1.0;

    synthRef.current.speak(utterance);
  };

  // Trigger speak when active index changes
  useEffect(() => {
    if (interview && interview.questions[activeIdx]) {
      setSpokenTranscript("");
      // Give a small delay before speaking to let user prepare
      const timer = setTimeout(() => {
        speakQuestion(interview.questions[activeIdx].questionText);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [activeIdx, interview, voiceMuted]);

  // Handle Speech-to-Text
  const startSpeechRecognition = () => {
    if (!webSpeechSupported) return;
    
    // Stop any active recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = interview?.language || "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setSpokenTranscript("Listening... Speak your answer now.");
    };

    recognition.onresult = (event: any) => {
      let currentResult = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        currentResult += event.results[i][0].transcript;
      }
      setSpokenTranscript(currentResult);
    };

    recognition.onerror = (e: any) => {
      console.error("Speech recognition error:", e);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      if (synthRef.current) {
        synthRef.current.cancel();
        setIsSpeaking(false);
      }
      startSpeechRecognition();
    }
  };

  const handleSubmitAnswer = async () => {
    if (!interview || submitting) return;
    setSubmitting(true);

    const question = interview.questions[activeIdx];
    
    // Clean up placeholder text if they didn't speak
    const cleanAnswer =
      spokenTranscript === "Listening... Speak your answer now." ||
      spokenTranscript === ""
        ? "No response provided."
        : spokenTranscript;

    // Stop microphone
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);

    try {
      const res = await fetch(`/api/interview/${interviewId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          answerText: cleanAnswer,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Update local interview state with answer
        const updatedQuestions = [...interview.questions];
        updatedQuestions[activeIdx] = {
          ...question,
          answerText: cleanAnswer,
          score: data.score,
          critique: data.critique,
        };
        setInterview({
          ...interview,
          questions: updatedQuestions,
        });

        // Advance to next index or finish
        if (activeIdx < interview.questions.length - 1) {
          setActiveIdx(activeIdx + 1);
        } else {
          handleFinishInterview();
        }
      } else {
        alert(data.error || "Failed to submit answer.");
      }
    } catch (e) {
      alert("Network error. Failed to save response.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishInterview = async () => {
    setFinishing(true);
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    try {
      const res = await fetch(`/api/interview/${interviewId}/finish`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push(`/interview/${interviewId}/result`);
      } else {
        alert(data.error || "Failed to finalize scorecard.");
        setFinishing(false);
      }
    } catch (e) {
      alert("Network error finalizing scorecard.");
      setFinishing(false);
    }
  };

  const handleSkipQuestion = () => {
    setSpokenTranscript("No response provided.");
    handleSubmitAnswer();
  };

  if (loading || finishing) {
    return (
      <div className="flex-center" style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)", flexDirection: "column", gap: "20px" }}>
        <Loader2 size={48} className="animate-spin" style={{ color: "var(--color-secondary)" }} />
        <span style={{ color: "var(--color-text-secondary)", fontSize: "1.1rem" }}>
          {finishing ? "Aggregating metrics & compiling scorecard..." : "Initializing voice terminal..."}
        </span>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="flex-center" style={{ minHeight: "100vh", flexDirection: "column", gap: "20px", padding: "24px" }}>
        <AlertTriangle size={48} style={{ color: "var(--color-error)" }} />
        <div style={{ color: "var(--color-error)", fontSize: "1.2rem", textAlign: "center" }}>{error || "Session not found."}</div>
        <Link href="/dashboard" className="btn btn-primary">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const currentQuestion = interview.questions[activeIdx];
  const questionNumber = activeIdx + 1;
  const totalQuestionsCount = interview.questions.length;

  return (
    <>
      {/* Mini sticky head for mute/unmute control */}
      <header className="header" style={{ height: "60px", background: "rgba(0,0,0,0.2)", border: "none" }}>
        <div className="container header-container" style={{ justifyContent: "space-between" }}>
          <Link href="/dashboard" className="logo" style={{ fontSize: "1.1rem" }}>
            TalkPrep Console
          </Link>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => {
                setVoiceMuted(!voiceMuted);
                if (synthRef.current) {
                  synthRef.current.cancel();
                  setIsSpeaking(false);
                }
              }}
              className="btn btn-secondary"
              style={{ padding: "6px 12px", fontSize: "0.8rem", borderRadius: "var(--radius-sm)" }}
              title={voiceMuted ? "Unmute Voice" : "Mute Voice"}
            >
              {voiceMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              {voiceMuted ? "Voice Muted" : "Voice On"}
            </button>
          </div>
        </div>
      </header>
      
      <BackgroundBlobs />

      <main className="container" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "30px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", alignItems: "center" }}>
          
          {/* Left panel: Visualizer & Active State */}
          <div className="flex-center" style={{ flexDirection: "column", gap: "24px" }}>
            
            {/* Pulsating Voice Circles */}
            <div className="visualizer-container">
              <button
                onClick={toggleListening}
                className={`visualizer-circle ${isSpeaking ? "speaking" : ""} ${isListening ? "listening active" : ""}`}
                disabled={submitting}
              >
                {isSpeaking ? (
                  <Volume2 size={44} style={{ color: "#ffffff" }} />
                ) : isListening ? (
                  <Mic size={44} style={{ color: "#ffffff" }} />
                ) : (
                  <MicOff size={44} style={{ color: "rgba(255,255,255,0.4)" }} />
                )}
              </button>
              
              {/* Animated rings expanding */}
              <div className="wave-ring wave-ring-1"></div>
              <div className="wave-ring wave-ring-2"></div>
              <div className="wave-ring wave-ring-3"></div>
            </div>

            {/* Status Display Text */}
            <div style={{ textAlign: "center" }}>
              <div className="badge badge-free" style={{ fontSize: "0.8rem", padding: "6px 14px", marginBottom: "8px" }}>
                QUESTION {questionNumber} OF {totalQuestionsCount}
              </div>
              <h3 style={{ fontSize: "1.4rem" }}>
                {isSpeaking
                  ? "AI Speaking..."
                  : isListening
                  ? "Listening to response..."
                  : "Microphone Paused"}
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
                {isSpeaking
                  ? "Listen closely to the question details."
                  : isListening
                  ? "Speak clearly. Click circle to pause."
                  : "Click the central circle to enable microphone."}
              </p>
            </div>
          </div>

          {/* Right panel: Console Card */}
          <div className="glass-card" style={{ padding: "36px 30px", display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Question Box */}
            <div>
              <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-secondary)", fontWeight: 600, letterSpacing: "0.05em" }}>
                Technical prompt
              </span>
              <h2 style={{ fontSize: "1.3rem", marginTop: "6px", lineHeight: "1.4" }}>
                {currentQuestion.questionText}
              </h2>
            </div>

            {/* Live Transcript editor */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span className="form-label">Response Transcript</span>
                {isListening && (
                  <span style={{ fontSize: "0.75rem", color: "var(--color-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span className="logo-dot" style={{ width: "6px", height: "6px" }}></span> Recording live
                  </span>
                )}
              </div>

              {/* Textarea for manual corrections */}
              <textarea
                className="form-input"
                style={{
                  width: "100%",
                  minHeight: "120px",
                  resize: "vertical",
                  lineHeight: "1.5",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.95rem",
                }}
                placeholder="Speak into microphone or type your technical answer here..."
                value={spokenTranscript}
                onChange={(e) => setSpokenTranscript(e.target.value)}
                disabled={submitting}
              />
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "6px", display: "block" }}>
                *You can manually edit this text to correct any speech-to-text recognition errors before submitting.
              </span>
            </div>

            {/* Actions Panel */}
            <div style={{ display: "flex", gap: "16px", marginTop: "10px" }}>
              <button
                onClick={handleSkipQuestion}
                className="btn btn-secondary"
                style={{ flex: 1 }}
                disabled={submitting}
              >
                Skip Response
              </button>

              <button
                onClick={handleSubmitAnswer}
                className="btn btn-primary"
                style={{ flex: 2 }}
                disabled={submitting || !spokenTranscript.trim() || spokenTranscript === "Listening... Speak your answer now."}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    Submit Response
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
            
            {!webSpeechSupported && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  background: "rgba(255, 179, 0, 0.1)",
                  border: "1px solid rgba(255, 179, 0, 0.2)",
                  padding: "12px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.75rem",
                  color: "var(--color-warning)",
                }}
              >
                <AlertTriangle size={24} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Speech API not supported!</strong> Text-to-speech and microphone transcription are disabled. 
                  You can still read the prompt and type your answers manually. For full voice loop, use Chrome or Safari.
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
