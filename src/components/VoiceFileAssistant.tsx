/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Mic, MicOff, UploadCloud, Sparkles, Loader2, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VoiceFileAssistantProps {
  type: 'expense' | 'savings' | 'budget' | 'bill';
  token: string;
  allowFile?: boolean;
  onParsed: (data: any) => void;
}

export default function VoiceFileAssistant({ type, token, allowFile = true, onParsed }: VoiceFileAssistantProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Handle Voice Speech Recording
  const startRecording = () => {
    setError(null);
    setSuccessMsg(null);
    setTranscript('');

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please try typing or upload a text file.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = async (event: any) => {
        const resultText = event.results[0][0].transcript;
        setTranscript(resultText);
        await parseTextWithAI(resultText);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone permission denied. Please allow microphone access in your browser settings.');
        } else {
          setError(`Voice capture issue: ${event.error}`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error(err);
      setError('Failed to initiate microphone capture.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  // 2. Parse Text with AI
  const parseTextWithAI = async (text: string) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch('/api/parse-nlp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type, text })
      });

      if (!response.ok) {
        throw new Error('Server parsing failed');
      }

      const data = await response.json();
      onParsed(data);
      setSuccessMsg(`Successfully parsed voice command: "${text.length > 50 ? text.slice(0, 50) + '...' : text}"`);
    } catch (err: any) {
      console.error(err);
      setError('AI parser was unable to identify details. Please retry or fill manually.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle File Selection and Drag & Drop
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const isImage = file.type.startsWith('image/');
      const isText = file.type === 'text/plain' || file.name.endsWith('.txt');

      if (!isImage && !isText) {
        throw new Error('Unsupported file format. Please upload an image or a .txt document.');
      }

      if (isText) {
        // Read text file client-side
        const reader = new FileReader();
        reader.onload = async (event) => {
          const content = event.target?.result as string;
          if (!content || content.trim().length === 0) {
            setError('The text file is empty.');
            setLoading(false);
            return;
          }
          await parseTextWithAI(content);
        };
        reader.readAsText(file);
      } else if (isImage) {
        // Read image as base64
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64Image = event.target?.result as string;
          await parseImageWithAI(base64Image, file.name);
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to read file.');
      setLoading(false);
    }
  };

  const parseImageWithAI = async (base64Image: string, fileName: string) => {
    try {
      const response = await fetch('/api/parse-nlp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type, image: base64Image })
      });

      if (!response.ok) {
        throw new Error('Server image analysis failed');
      }

      const data = await response.json();
      onParsed(data);
      setSuccessMsg(`Successfully processed document "${fileName}"! Details pre-filled.`);
    } catch (err: any) {
      console.error(err);
      setError('AI image analysis failed. Please verify the receipt/document is clear.');
    } finally {
      setLoading(false);
    }
  };

  // Drag & drop handlers
  const [dragActive, setDragActive] = useState(false);
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-700">AI Quick-Log Entry</span>
        </div>
        <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">
          {type === 'expense' ? 'Expenses' : type === 'savings' ? 'Savings Vault' : type === 'budget' ? 'Budget Limits' : 'Bills & reminders'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Voice Capture Control */}
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={loading}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border border-dashed transition cursor-pointer ${
            isRecording 
              ? 'bg-red-50/70 border-red-300 text-red-600 animate-pulse' 
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          {isRecording ? (
            <>
              <MicOff className="h-5 w-5 mb-1.5 text-red-500" />
              <span className="text-[11px] font-bold">Listening... (Click to Stop)</span>
              <div className="flex gap-1 mt-1 justify-center items-center h-2">
                <span className="h-1.5 w-1 bg-red-400 rounded animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2.5 w-1 bg-red-500 rounded animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1 bg-red-400 rounded animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </>
          ) : (
            <>
              <Mic className="h-5 w-5 mb-1 text-purple-500" />
              <span className="text-[11px] font-bold text-slate-700">Speak Entry</span>
              <span className="text-[9px] text-slate-400 mt-0.5 text-center">"Spent 450 for lunch"</span>
            </>
          )}
        </button>

        {/* File / Document Upload Area (Only shown if allowFile is true) */}
        {allowFile ? (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border border-dashed transition cursor-pointer text-center ${
              dragActive 
                ? 'bg-purple-50/50 border-purple-400 text-purple-600' 
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <UploadCloud className="h-5 w-5 mb-1 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-700">Upload Receipt / .txt</span>
            <span className="text-[9px] text-slate-400 mt-0.5">Drag & drop image or text file</span>
          </div>
        ) : (
          <div className="bg-slate-100/50 border border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] text-slate-400 font-medium">Voice-only Mode</span>
            <span className="text-[9px] text-slate-400 mt-1 max-w-[150px] leading-snug">File upload is not applicable for simple bill alerts.</span>
          </div>
        )}
      </div>

      {/* Progress & Feedback Indicators */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-[11px] text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg font-medium"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            FinPilot AI is reading your inputs and extracting details...
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 text-[11px] text-red-600 bg-red-50 px-3 py-2 rounded-lg font-medium"
          >
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {successMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 text-[11px] text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg font-medium border border-emerald-100"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
