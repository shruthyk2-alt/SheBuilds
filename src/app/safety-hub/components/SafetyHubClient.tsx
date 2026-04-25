'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import { Shield, Phone, MapPin, Mic, AlertTriangle, Copy, RefreshCw, Eye, EyeOff, MessageCircle, FileText, Heart, ChevronRight, Zap, X, ExternalLink, Users, Settings } from 'lucide-react';
import BottomTabBar from '@/components/BottomTabBar';
import OfflineBanner from '@/components/OfflineBanner';
import { loadProfile, saveProfile, type UserProfile } from '@/lib/storage';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';

interface LocationState {
  lat: number | null;
  lng: number | null;
  loading: boolean;
  error: string | null;
  mapLink: string | null;
}

export default function SafetyHubClient() {
  const router = useRouter();
  const { translations } = useLanguage();
  const tr = translations.hub;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showPhrase, setShowPhrase] = useState(false);
  const [editingPhrase, setEditingPhrase] = useState(false);
  const [phraseInput, setPhraseInput] = useState('');
  const [sosTriggered, setSosTriggered] = useState(false);
  const [showSupportMode, setShowSupportMode] = useState(false);
  const [showComplaint, setShowComplaint] = useState(false);
  const [generatedComplaint, setGeneratedComplaint] = useState('');
  const [location, setLocation] = useState<LocationState>({
    lat: null, lng: null, loading: false, error: null, mapLink: null
  });
  const [safePhraseDetected, setSafePhraseDetected] = useState(false);
  const [phraseTestInput, setPhraseTestInput] = useState('');
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  useEffect(() => {
    const p = loadProfile();
    if (!p || !p.setupComplete) {
      router.push('/setup-screen');
      return;
    }
    setProfile(p);
    setPhraseInput(p.safePhrase);
  }, [router]);

  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  const formatRecordingTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const getLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        err => reject(err),
        { timeout: 8000 }
      );
    });
  };

  const handleSOS = async () => {
    if (!profile) return;
    setSosTriggered(true);
    setLocation(l => ({ ...l, loading: true, error: null }));
    toast.error(tr.toasts.sosActivated, { duration: 4000 });

    let coords = { lat: 28.6139, lng: 77.2090 };
    let mapLink = '';

    try {
      coords = await getLocation();
      mapLink = `https://maps.google.com/?q=${coords.lat},${coords.lng}`;
      setLocation({ lat: coords.lat, lng: coords.lng, loading: false, error: null, mapLink });
    } catch {
      mapLink = `https://maps.google.com/?q=28.6139,77.2090`;
      setLocation({ lat: coords.lat, lng: coords.lng, loading: false, error: 'Using approximate location', mapLink });
      toast.warning(tr.toasts.approxLocation);
    }

    setIsRecording(true);

    if (profile.contacts.length > 0) {
      const message = buildSOSMessage(profile, mapLink);
      profile.contacts.forEach(contact => {
        const phone = contact.phone.replace(/[\s\-()]/g, '');
        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
      });
      toast.success(t(tr.toasts.sosSent, { count: profile.contacts.length }));
    } else {
      toast.warning(tr.toasts.noContacts);
    }
  };

  const buildSOSMessage = (p: UserProfile, mapLink: string): string => {
    return `🚨 EMERGENCY ALERT from SafeTap\n\n` +
      `${p.name} needs immediate help!\n\n` +
      `📍 Location: ${mapLink}\n` +
      `📞 Call them: ${p.phone}\n\n` +
      `This is an automated SOS message sent by SafeTap.\n` +
      `Please respond immediately or call 112.`;
  };

  const cancelSOS = () => {
    setSosTriggered(false);
    setIsRecording(false);
    setRecordingSeconds(0);
    toast.success(tr.toasts.sosCancelled);
  };

  const handleRecordingToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      toast.success(t(tr.toasts.recordingStopped, { time: formatRecordingTime(recordingSeconds) }));
    } else {
      setIsRecording(true);
      toast.success(tr.toasts.recordingStarted);
    }
  };

  const handleSafePhraseUpdate = () => {
    if (!profile || !phraseInput.trim()) return;
    const updated = { ...profile, safePhrase: phraseInput.trim() };
    saveProfile(updated);
    setProfile(updated);
    setEditingPhrase(false);
    toast.success(tr.toasts.phraseSaved);
  };

  const handlePhraseTestChange = (value: string) => {
    setPhraseTestInput(value);
    if (profile && value.toLowerCase().includes(profile.safePhrase.toLowerCase())) {
      setSafePhraseDetected(true);
      toast.error('🔴 Emergency Mode Activated — Safe phrase detected!', { duration: 5000 });
      setIsRecording(true);
      setTimeout(() => handleSOS(), 1500);
    }
  };

  const generateComplaint = () => {
    if (!profile) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const complaint = `TO,
The Station House Officer,
[Police Station Name],
[City], India

SUBJECT: Complaint regarding personal safety threat

Respected Sir/Madam,

I, ${profile.name}, aged ${profile.age} years, residing at [your address], do hereby lodge this complaint.

On ${dateStr}, I experienced a situation that posed a direct threat to my personal safety and well-being. The details of the incident are as follows:

[Describe the incident here — time, location, persons involved, nature of threat]

I request you to kindly register this complaint as an FIR and take immediate action against the concerned person(s) as per applicable provisions under the Indian Penal Code.

My contact details for further communication:
Phone: ${profile.phone}
Email: ${profile.email}

I am available for further questioning at any time.

Thanking you,

${profile.name}
Date: ${dateStr}
Phone: ${profile.phone}`;

    setGeneratedComplaint(complaint);
    setShowComplaint(true);
  };

  const copyComplaint = () => {
    navigator.clipboard.writeText(generatedComplaint).then(() => {
      toast.success(tr.toasts.complaintCopied);
    });
  };

  const legalContacts = [
    { id: 'legal-1091', number: '1091', label: tr.womenHelpline, color: 'bg-red-50 text-red-700 border-red-200' },
    { id: 'legal-112', number: '112', label: tr.emergencyPolice, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { id: 'legal-1516', number: '1516', label: tr.legalAid, color: 'bg-green-50 text-green-700 border-green-200' },
    { id: 'legal-108', number: '108', label: tr.ambulance, color: 'bg-orange-50 text-orange-700 border-orange-200' },
  ];

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500 font-medium">{translations.app.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Toaster position="top-center" richColors />
      <OfflineBanner />

      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-5 pt-10 pb-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{tr.title}</p>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              {t(tr.greeting, { name: profile.name.split(' ')[0] })}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-green-600">{translations.app.protected}</span>
            <button
              onClick={() => router.push('/setup-screen')}
              className="ml-2 w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors active:scale-95"
              aria-label="Go to settings"
            >
              <Settings size={16} className="text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">

        {/* SOS Button */}
        <div className={`relative rounded-3xl overflow-hidden transition-all duration-300 ${
          sosTriggered ? 'bg-red-700' : 'bg-gradient-to-br from-red-600 to-red-800'
        } shadow-xl shadow-red-300`}>
          <div className="p-5">
            {!sosTriggered ? (
              <div className="flex flex-col items-center py-4">
                <p className="text-red-200 text-xs font-semibold uppercase tracking-widest mb-5">Emergency SOS</p>
                <button
                  onClick={handleSOS}
                  className="w-32 h-32 rounded-full bg-white flex flex-col items-center justify-center sos-pulse shadow-2xl hover:scale-105 transition-transform active:scale-95"
                  aria-label="Trigger SOS emergency"
                >
                  <Shield size={36} className="text-red-600 mb-1" strokeWidth={2.5} />
                  <span className="text-red-600 font-black text-lg tracking-tight">SOS</span>
                </button>
                <p className="text-red-200 text-xs font-medium mt-5">{tr.sosSubtitle}</p>
              </div>
            ) : (
              <div className="fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-white rounded-full recording-pulse" />
                    <span className="text-white font-black text-lg">{tr.sosActive}</span>
                  </div>
                  <button
                    onClick={cancelSOS}
                    className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                    aria-label="Cancel SOS"
                  >
                    <X size={16} className="text-white" />
                  </button>
                </div>

                {location.loading && (
                  <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2.5 mb-3">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-white text-sm font-medium">Getting your location...</span>
                  </div>
                )}

                {location.mapLink && (
                  <a
                    href={location.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2.5 mb-3 hover:bg-white/20 transition-colors"
                  >
                    <MapPin size={15} className="text-white shrink-0" />
                    <span className="text-white text-sm font-medium flex-1 truncate">
                      {location.error ? 'Approximate location — Tap to view' : 'Your location shared — Tap to verify'}
                    </span>
                    <ExternalLink size={13} className="text-white/70" />
                  </a>
                )}

                {isRecording && (
                  <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2.5 mb-3">
                    <div className="w-3 h-3 bg-red-300 rounded-full recording-pulse" />
                    <span className="text-white text-sm font-medium">{tr.recordingActive} — {formatRecordingTime(recordingSeconds)}</span>
                  </div>
                )}

                <div className="space-y-2">
                  {profile.contacts.map(contact => {
                    const phone = contact.phone.replace(/[\s\-()]/g, '');
                    const msg = buildSOSMessage(profile, location.mapLink || '');
                    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
                    return (
                      <a
                        key={contact.id}
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-white/10 rounded-xl px-3 py-2.5 hover:bg-white/20 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                          <span className="text-white font-bold text-xs">{contact.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm">{contact.name}</p>
                          <p className="text-red-200 text-xs">{contact.phone}</p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-green-500 rounded-lg px-2.5 py-1.5">
                          <MessageCircle size={12} className="text-white" />
                          <span className="text-white text-xs font-bold">{tr.sendWhatsApp}</span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick tools grid */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleRecordingToggle}
            className={`rounded-2xl p-4 border transition-all active:scale-95 text-left ${
              isRecording ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${isRecording ? 'bg-red-100' : 'bg-slate-100'}`}>
              {isRecording
                ? <Mic size={18} className="text-red-600 recording-pulse" />
                : <Mic size={18} className="text-slate-600" />
              }
            </div>
            <p className={`text-sm font-bold ${isRecording ? 'text-red-700' : 'text-slate-800'}`}>
              {isRecording ? tr.recordingActive : tr.startRecording}
            </p>
            <p className={`text-xs font-medium mt-0.5 ${isRecording ? 'text-red-500' : 'text-slate-400'}`}>
              {isRecording ? formatRecordingTime(recordingSeconds) : 'Capture evidence'}
            </p>
          </button>

          <button
            onClick={() => router.push('/chat-legal-help')}
            className="rounded-2xl p-4 bg-white border border-slate-200 hover:border-slate-300 transition-all active:scale-95 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
              <MessageCircle size={18} className="text-blue-600" />
            </div>
            <p className="text-sm font-bold text-slate-800">{translations.tabs.legalHelp}</p>
            <p className="text-xs font-medium text-slate-400 mt-0.5">IPC / POSH guidance</p>
          </button>

          <button
            onClick={generateComplaint}
            className="rounded-2xl p-4 bg-white border border-slate-200 hover:border-slate-300 transition-all active:scale-95 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mb-3">
              <FileText size={18} className="text-purple-600" />
            </div>
            <p className="text-sm font-bold text-slate-800">{tr.complaint}</p>
            <p className="text-xs font-medium text-slate-400 mt-0.5">Generate FIR draft</p>
          </button>

          <button
            onClick={() => setShowSupportMode(true)}
            className="rounded-2xl p-4 bg-white border border-slate-200 hover:border-slate-300 transition-all active:scale-95 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center mb-3">
              <Heart size={18} className="text-pink-600" />
            </div>
            <p className="text-sm font-bold text-slate-800">{tr.supportMode}</p>
            <p className="text-xs font-medium text-slate-400 mt-0.5">Calm & breathe</p>
          </button>
        </div>

        {/* Safe Phrase */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                <Zap size={16} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{tr.safePhrase}</p>
                <p className="text-xs text-slate-400">Type to trigger emergency silently</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowPhrase(v => !v)}
                className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors active:scale-95"
                aria-label={showPhrase ? tr.hidePhrase : tr.showPhrase}
              >
                {showPhrase ? <EyeOff size={14} className="text-slate-500" /> : <Eye size={14} className="text-slate-500" />}
              </button>
              <button
                onClick={() => setEditingPhrase(v => !v)}
                className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors active:scale-95"
                aria-label="Edit safe phrase"
              >
                <RefreshCw size={14} className="text-slate-500" />
              </button>
            </div>
          </div>

          {editingPhrase ? (
            <div className="space-y-2">
              <input
                type="text"
                value={phraseInput}
                onChange={e => setPhraseInput(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 tracking-wider focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                placeholder="Enter your safe phrase"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSafePhraseUpdate}
                  className="flex-1 py-2 bg-red-600 rounded-xl text-xs font-bold text-white active:scale-95 transition-all"
                >
                  {tr.savePhrase}
                </button>
                <button
                  onClick={() => { setEditingPhrase(false); setPhraseInput(profile.safePhrase); }}
                  className="flex-1 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-700 active:scale-95 transition-all"
                >
                  {tr.cancelEdit}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
              <p className="text-sm font-bold text-red-700 tracking-widest font-tabular">
                {showPhrase ? profile.safePhrase : '•'.repeat(profile.safePhrase.length)}
              </p>
            </div>
          )}

          <div className="mt-3">
            <p className="text-xs text-slate-400 font-medium mb-1.5">{tr.testPhrase}:</p>
            <input
              type="text"
              value={phraseTestInput}
              onChange={e => handlePhraseTestChange(e.target.value)}
              placeholder={tr.testPlaceholder}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            />
            {safePhraseDetected && (
              <div className="flex items-center gap-1.5 mt-1.5 fade-in">
                <div className="w-2 h-2 bg-red-500 rounded-full recording-pulse" />
                <p className="text-xs font-bold text-red-600">{tr.safePhraseDetected}</p>
              </div>
            )}
          </div>
        </div>

        {/* Emergency Contacts */}
        {profile.contacts.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} className="text-slate-600" />
              <p className="text-sm font-bold text-slate-800">{tr.contacts}</p>
              <span className="ml-auto text-xs font-semibold text-slate-400">{profile.contacts.length} saved</span>
            </div>
            <div className="space-y-2.5">
              {profile.contacts.map(contact => {
                const phone = contact.phone.replace(/[\s\-()]/g, '');
                return (
                  <div key={contact.id} className="flex items-center gap-3 py-1">
                    <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-red-600">{contact.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{contact.name}</p>
                      <p className="text-xs text-slate-400 font-medium">{contact.phone}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${contact.phone}`}
                        className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center hover:bg-green-100 transition-colors active:scale-95"
                        aria-label={`Call ${contact.name}`}
                      >
                        <Phone size={14} className="text-green-600" />
                      </a>
                      <a
                        href={`https://wa.me/${phone}?text=${encodeURIComponent('Hi, are you safe?')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center hover:bg-green-100 transition-colors active:scale-95"
                        aria-label={`WhatsApp ${contact.name}`}
                      >
                        <MessageCircle size={14} className="text-green-600" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legal Contacts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Phone size={16} className="text-slate-600" />
            <p className="text-sm font-bold text-slate-800">{tr.legalContacts}</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {legalContacts.map(contact => (
              <a
                key={contact.id}
                href={`tel:${contact.number}`}
                className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border ${contact.color} hover:opacity-80 transition-opacity active:scale-95`}
              >
                <Phone size={15} strokeWidth={2.5} />
                <div>
                  <p className="text-base font-black font-tabular leading-tight">{contact.number}</p>
                  <p className="text-[10px] font-semibold leading-tight opacity-80">{contact.label}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* No contacts warning */}
        {profile.contacts.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800">{tr.noContacts}</p>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">{tr.addContacts}</p>
              <button
                onClick={() => router.push('/setup-screen')}
                className="mt-2 flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors"
              >
                Add contacts <ChevronRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Support Mode Modal */}
      {showSupportMode && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 fade-in" onClick={() => setShowSupportMode(false)}>
          <div className="w-full max-w-[430px] bg-white rounded-t-3xl p-6 pb-10 slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6" />
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4">
                <Heart size={28} className="text-pink-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">You Are Safe</h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Take a slow, deep breath. You are not alone. Help is available right now.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {[
                { emoji: '💙', text: 'You are brave for reaching out for help.' },
                { emoji: '🌿', text: 'Breathe in for 4 counts, hold for 4, out for 4.' },
                { emoji: '📍', text: 'Move to a public space if you feel unsafe.' },
                { emoji: '📞', text: 'Call 1091 — trained counselors are available 24/7.' },
                { emoji: '🤝', text: 'You deserve to be safe. This is not your fault.' },
              ].map((item, i) => (
                <div key={`support-${i}`} className="flex items-start gap-3 bg-pink-50 rounded-xl p-3">
                  <span className="text-lg">{item.emoji}</span>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <a
                href="tel:1091"
                className="flex items-center justify-center gap-2 py-3.5 bg-red-600 rounded-xl text-sm font-bold text-white active:scale-95 transition-all"
              >
                <Phone size={16} />
                Call 1091
              </a>
              <button
                onClick={() => setShowSupportMode(false)}
                className="py-3.5 bg-slate-100 rounded-xl text-sm font-bold text-slate-700 active:scale-95 transition-all"
              >
                I am okay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Modal */}
      {showComplaint && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 fade-in" onClick={() => setShowComplaint(false)}>
          <div className="w-full max-w-[430px] bg-white rounded-t-3xl p-5 pb-10 slide-up max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">{tr.complaintTitle}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyComplaint}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-50 rounded-xl text-xs font-bold text-red-600 active:scale-95 transition-all"
                >
                  <Copy size={13} />
                  {tr.copyComplaint}
                </button>
                <button
                  onClick={() => setShowComplaint(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center active:scale-95 transition-all"
                >
                  <X size={15} className="text-slate-600" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <pre className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap font-mono">
                  {generatedComplaint}
                </pre>
              </div>
            </div>
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-700 font-medium leading-relaxed">
                Fill in the bracketed sections before submitting. This is a template — consult a lawyer for legal accuracy.
              </p>
            </div>
          </div>
        </div>
      )}

      <BottomTabBar />
    </div>
  );
}