'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import { Send, AlertTriangle, Shield, ChevronDown, ChevronUp, FileText, Copy, Phone, X, RotateCcw, BookOpen, CheckCircle, ArrowRight, Info, Heart, Sparkles } from 'lucide-react';
import BottomTabBar from '@/components/BottomTabBar';
import OfflineBanner from '@/components/OfflineBanner';
import { loadProfile, type UserProfile } from '@/lib/storage';
import { findLegalResponse, detectEmergencyKeywords, type LegalResponse } from '@/lib/legalData';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  legalData?: LegalResponse;
  timestamp: Date;
  type?: 'calm' | 'legal' | 'complaint' | 'error';
}

const COMPLAINT_TEMPLATE = (profile: UserProfile, situation: string, date: string) =>
`TO,
The Station House Officer,
[Police Station Name],
[City], India

SUBJECT: Complaint under relevant IPC provisions

Respected Sir/Madam,

I, ${profile.name}, aged ${profile.age} years, contact: ${profile.phone}, email: ${profile.email}, do hereby lodge this formal complaint.

INCIDENT DESCRIPTION:
${situation}

Date of Incident: ${date}
Location: [Specify location]

I request you to register this as an FIR and take immediate legal action under applicable IPC provisions.

I am available for further investigation at:
Phone: ${profile.phone}
Email: ${profile.email}

Thanking you,
${profile.name}
Date: ${date}`;

export default function ChatLegalHelpClient() {
  const router = useRouter();
  const { translations } = useLanguage();
  const tr = translations.chat;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmergencyBanner, setShowEmergencyBanner] = useState(false);
  const [expandedLegal, setExpandedLegal] = useState<string | null>(null);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [lastUserMessage, setLastUserMessage] = useState('');
  const [messageCount, setMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = loadProfile();
    if (!p || !p.setupComplete) {
      router.push('/setup-screen');
      return;
    }
    setProfile(p);

    const firstName = p.name.split(' ')[0];
    const welcomeMsg: Message = {
      id: 'msg-welcome',
      role: 'assistant',
      content: t(tr.welcomeMessage, { name: firstName }),
      timestamp: new Date(),
      type: 'calm',
    };
    setMessages([welcomeMsg]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, translations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (detectEmergencyKeywords(value)) {
      setShowEmergencyBanner(true);
    } else {
      setShowEmergencyBanner(false);
    }

    if (profile && value.toLowerCase().includes(profile.safePhrase.toLowerCase())) {
      toast.error(tr.toasts.emergencyDetected, { duration: 5000 });
      router.push('/safety-hub');
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isTyping || !profile) return;
    const userText = inputValue.trim();
    setLastUserMessage(userText);
    setInputValue('');
    setShowEmergencyBanner(false);
    setMessageCount(prev => prev + 1);

    const userMsg: Message = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    await new Promise(r => setTimeout(r, 1400));

    const calmResponses = tr.calmResponses as string[];
    const groundingPrompts = tr.groundingPrompts as string[];

    const calmIndex = messageCount % calmResponses.length;
    const calmMsg: Message = {
      id: `msg-calm-${Date.now()}`,
      role: 'assistant',
      content: calmResponses[calmIndex],
      timestamp: new Date(),
      type: 'calm',
    };

    setMessages(prev => [...prev, calmMsg]);

    if (messageCount % 3 === 2) {
      await new Promise(r => setTimeout(r, 600));
      const groundingMsg: Message = {
        id: `msg-grounding-${Date.now()}`,
        role: 'assistant',
        content: groundingPrompts[messageCount % groundingPrompts.length],
        timestamp: new Date(),
        type: 'calm',
      };
      setMessages(prev => [...prev, groundingMsg]);
    }

    await new Promise(r => setTimeout(r, 900));

    const legalData = findLegalResponse(userText);
    const legalMsg: Message = {
      id: `msg-legal-${Date.now()}`,
      role: 'assistant',
      content: legalData.description,
      legalData,
      timestamp: new Date(),
      type: 'legal',
    };

    setMessages(prev => [...prev, legalMsg]);
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    if (!profile) return;
    const firstName = profile.name.split(' ')[0];
    const welcomeMsg: Message = {
      id: `msg-welcome-${Date.now()}`,
      role: 'assistant',
      content: t(tr.clearWelcome, { name: firstName }),
      timestamp: new Date(),
      type: 'calm',
    };
    setMessages([welcomeMsg]);
    setShowEmergencyBanner(false);
    setMessageCount(0);
    toast.success(tr.toasts.chatCleared);
  };

  const generateComplaint = () => {
    if (!profile) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const situation = lastUserMessage || '[Describe the incident here]';
    const complaint = COMPLAINT_TEMPLATE(profile, situation, dateStr);
    setComplaintText(complaint);
    setShowComplaintModal(true);
  };

  const copyComplaint = () => {
    navigator.clipboard.writeText(complaintText).then(() => {
      toast.success(tr.toasts.complaintCopied);
    });
  };

  const severityConfig = {
    critical: { color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', label: 'Critical' },
    high: { color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500', label: 'High' },
    medium: { color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'Medium' },
    low: { color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500', label: 'Low' },
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-rose-400 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500 font-medium">{translations.app.settingUp}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-50/40 flex flex-col">
      <Toaster position="top-center" richColors />
      <OfflineBanner />

      {/* Header */}
      <div className="bg-white border-b border-rose-100 px-5 pt-10 pb-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center">
              <Heart size={18} className="text-rose-500" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">{tr.title}</h1>
              <p className="text-xs text-rose-400 font-medium">{tr.subtitle} 🌸</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={generateComplaint}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 rounded-xl text-xs font-bold text-purple-600 hover:bg-purple-100 transition-colors active:scale-95"
            >
              <FileText size={13} />
              {tr.generateComplaint}
            </button>
            <button
              onClick={clearChat}
              className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors active:scale-95"
              aria-label="Clear chat"
            >
              <RotateCcw size={14} className="text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Banner */}
      {showEmergencyBanner && (
        <div className="emergency-banner px-4 py-3 flex items-center justify-between fade-in sticky top-[73px] z-20">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-white shrink-0" />
            <p className="text-xs font-bold text-white">{tr.emergencyBanner}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="tel:112"
              className="px-2.5 py-1 bg-white rounded-lg text-xs font-black text-red-700 active:scale-95 transition-all"
            >
              Call 112
            </a>
            <button
              onClick={() => setShowEmergencyBanner(false)}
              className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"
            >
              <X size={12} className="text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Suggested prompts */}
      {messages.length <= 1 && (
        <div className="px-5 pt-4 pb-2 fade-in">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">How are you feeling?</p>
          <div className="flex flex-wrap gap-2">
            {(tr.quickPrompts as string[]).map(prompt => (
              <button
                key={`prompt-${prompt.slice(0, 10)}`}
                onClick={() => { handleInputChange(prompt); inputRef.current?.focus(); }}
                className="px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs font-semibold text-slate-700 hover:border-rose-400 hover:text-rose-600 transition-all active:scale-95"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-5 py-4 pb-6 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`chat-bubble-in ${message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}
          >
            {message.role === 'user' ? (
              <div className="max-w-[80%]">
                <div className="bg-rose-500 rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
                  <p className="text-sm text-white font-medium leading-relaxed">{message.content}</p>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-1 text-right">{formatTime(message.timestamp)}</p>
              </div>
            ) : (
              <div className="max-w-[90%] space-y-2">
                {message.type === 'calm' && (
                  <div className="bg-white border border-rose-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center">
                        <Heart size={11} className="text-rose-500" />
                      </div>
                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">SafeTap Support</span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">{message.content}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-2">{formatTime(message.timestamp)}</p>
                  </div>
                )}

                {message.type === 'legal' && message.legalData && (
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm overflow-hidden">
                    <div className="px-4 pt-4 pb-3 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-white">
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center">
                          <Sparkles size={10} className="text-violet-500" />
                        </div>
                        <span className="text-xs font-bold text-violet-500 uppercase tracking-wider">Legal Analysis</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                            <BookOpen size={13} className="text-blue-600" />
                          </div>
                          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">{tr.legalSection}</span>
                        </div>
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${severityConfig[message.legalData.severity].color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${severityConfig[message.legalData.severity].dot}`} />
                          {severityConfig[message.legalData.severity].label}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{message.legalData.category}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed mt-1">{message.content}</p>
                    </div>

                    <div className="px-4 py-3 border-b border-slate-100">
                      <button
                        onClick={() => setExpandedLegal(expandedLegal === `${message.id}-laws` ? null : `${message.id}-laws`)}
                        className="w-full flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Shield size={14} className="text-slate-600" />
                          <span className="text-xs font-bold text-slate-700">{tr.law}</span>
                          <span className="text-xs font-semibold text-slate-400">({message.legalData.lawCitations.length})</span>
                        </div>
                        {expandedLegal === `${message.id}-laws` ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                      </button>
                      {expandedLegal === `${message.id}-laws` && (
                        <div className="mt-2.5 space-y-2 fade-in">
                          {message.legalData.lawCitations.map((citation, ci) => (
                            <div key={`citation-${message.id}-${ci}`} className="flex items-start gap-2 bg-blue-50 rounded-xl p-2.5">
                              <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-[9px] font-black text-blue-700">{ci + 1}</span>
                              </div>
                              <p className="text-xs font-semibold text-blue-800 leading-relaxed">{citation}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="px-4 py-3 border-b border-slate-100">
                      <button
                        onClick={() => setExpandedLegal(expandedLegal === `${message.id}-steps` ? null : `${message.id}-steps`)}
                        className="w-full flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle size={14} className="text-slate-600" />
                          <span className="text-xs font-bold text-slate-700">{tr.steps}</span>
                        </div>
                        {expandedLegal === `${message.id}-steps` ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                      </button>
                      {expandedLegal === `${message.id}-steps` && (
                        <div className="mt-2.5 space-y-2 fade-in">
                          {message.legalData.steps.map((step, si) => (
                            <div key={`step-${message.id}-${si}`} className="flex items-start gap-2.5">
                              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-[9px] font-black text-green-700">{si + 1}</span>
                              </div>
                              <p className="text-xs font-medium text-slate-700 leading-relaxed">{step}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="px-4 py-3 border-b border-slate-100">
                      <button
                        onClick={() => setExpandedLegal(expandedLegal === `${message.id}-actions` ? null : `${message.id}-actions`)}
                        className="w-full flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2">
                          <ArrowRight size={14} className="text-slate-600" />
                          <span className="text-xs font-bold text-slate-700">{tr.nextActions}</span>
                        </div>
                        {expandedLegal === `${message.id}-actions` ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                      </button>
                      {expandedLegal === `${message.id}-actions` && (
                        <div className="mt-2.5 space-y-2 fade-in">
                          {message.legalData.nextActions.map((action, ai) => (
                            <div key={`action-${message.id}-${ai}`} className="flex items-start gap-2 bg-orange-50 rounded-xl p-2.5">
                              <ArrowRight size={12} className="text-orange-600 mt-0.5 shrink-0" />
                              <p className="text-xs font-semibold text-orange-800 leading-relaxed">{action}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="px-4 py-3">
                      <p className="text-xs font-bold text-slate-600 mb-2.5 flex items-center gap-1.5">
                        <Phone size={13} /> Support Helplines
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {message.legalData.helplines.map((helpline, hi) => {
                          const number = helpline.split(' ')[0];
                          return (
                            <a
                              key={`helpline-${message.id}-${hi}`}
                              href={`tel:${number}`}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors active:scale-95"
                            >
                              <Phone size={11} />
                              {helpline}
                            </a>
                          );
                        })}
                      </div>
                    </div>

                    <div className="px-4 pb-4">
                      <button
                        onClick={generateComplaint}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 rounded-xl text-xs font-bold text-white hover:bg-slate-800 transition-colors active:scale-95"
                      >
                        <FileText size={14} />
                        {tr.generateComplaint}
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 font-medium px-4 pb-3">{formatTime(message.timestamp)}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start chat-bubble-in">
            <div className="bg-white border border-rose-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <div
                    key={`typing-dot-${i}`}
                    className="w-2 h-2 bg-rose-300 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
                <span className="text-xs text-slate-400 font-medium ml-1">{tr.typing}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-rose-100 px-4 py-3 sticky bottom-16 z-20">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-rose-50/60 border border-rose-200 rounded-2xl px-4 py-3 focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-400/20 transition-all">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={tr.inputPlaceholder}
              rows={1}
              className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder-rose-300 resize-none focus:outline-none leading-relaxed"
              style={{ maxHeight: '120px', overflowY: 'auto' }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="w-11 h-11 rounded-2xl bg-rose-500 flex items-center justify-center shadow-md shadow-rose-200 hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            aria-label={tr.send}
          >
            {isTyping ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={16} className="text-white" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 mt-2.5">
          <a href="tel:112" className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-xl text-xs font-bold text-red-600 active:scale-95 transition-all">
            <Phone size={12} />112
          </a>
          <a href="tel:1091" className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-xl text-xs font-bold text-red-600 active:scale-95 transition-all">
            <Phone size={12} />1091
          </a>
          <button
            onClick={() => router.push('/safety-hub')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 rounded-xl text-xs font-bold text-rose-600 active:scale-95 transition-all ml-auto"
          >
            <Shield size={12} />
            {tr.goToSOS}
          </button>
        </div>
      </div>

      {/* Complaint Modal */}
      {showComplaintModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 fade-in" onClick={() => setShowComplaintModal(false)}>
          <div className="w-full max-w-[430px] bg-white rounded-t-3xl p-5 pb-10 slide-up max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{tr.complaintTitle}</h2>
                <p className="text-xs text-slate-400">Fill in the bracketed sections before use</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyComplaint}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 rounded-xl text-xs font-bold text-rose-600 active:scale-95 transition-all"
                >
                  <Copy size={13} />
                  {tr.copyComplaint}
                </button>
                <button
                  onClick={() => setShowComplaintModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center active:scale-95"
                >
                  <X size={15} className="text-slate-600" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <pre className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'inherit' }}>
                  {complaintText}
                </pre>
              </div>
            </div>
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <Info size={14} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 font-medium leading-relaxed">
                This is a template. Consult a lawyer or visit your nearest police station. You have the legal right to file an FIR.
              </p>
            </div>
          </div>
        </div>
      )}

      <BottomTabBar />
    </div>
  );
}