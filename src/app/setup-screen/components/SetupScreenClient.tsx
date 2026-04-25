'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast, Toaster } from 'sonner';
import {
  User, Phone, Mail, Calendar, Shield, Plus, Trash2,
  ChevronRight, ChevronLeft, CheckCircle, Eye, EyeOff,
  RefreshCw, Copy, AlertCircle
} from 'lucide-react';

import { saveProfile, loadProfile, generateSafePhrase, type UserProfile } from '@/lib/storage';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';

interface FormData {
  name: string;
  age: string;
  phone: string;
  email: string;
  contacts: { id: string; name: string; phone: string }[];
  safePhrase: string;
}

const TOTAL_STEPS = 3;

export default function SetupScreenClient() {
  const router = useRouter();
  const { translations } = useLanguage();
  const tr = translations.setup;

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPhrase, setShowPhrase] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      age: '',
      phone: '',
      email: '',
      contacts: [{ id: 'contact-1', name: '', phone: '' }],
      safePhrase: generateSafePhrase(),
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'contacts' });

  useEffect(() => {
    const profile = loadProfile();
    if (profile && profile.setupComplete) {
      setValue('name', profile.name);
      setValue('age', profile.age);
      setValue('phone', profile.phone);
      setValue('email', profile.email);
      setValue('safePhrase', profile.safePhrase);
      if (profile.contacts.length > 0) {
        setValue('contacts', profile.contacts);
      }
    }
  }, [setValue]);

  const watchedName = watch('name');
  const watchedPhrase = watch('safePhrase');

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    if (step === 1) fieldsToValidate = ['name', 'age', 'phone', 'email'];
    if (step === 2) fieldsToValidate = ['contacts'];
    const valid = await trigger(fieldsToValidate);
    if (valid) setStep(s => Math.min(s + 1, TOTAL_STEPS));
  };

  const handlePrevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleRegeneratePhrase = () => {
    const newPhrase = generateSafePhrase();
    setValue('safePhrase', newPhrase);
    toast.success(tr.toasts.phraseGenerated);
  };

  const handleCopyPhrase = () => {
    navigator.clipboard.writeText(watchedPhrase).then(() => {
      toast.success(tr.toasts.phraseCopied);
    }).catch(() => {
      toast.error(tr.toasts.phraseCopyFail);
    });
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    const profile: UserProfile = {
      name: data.name.trim(),
      age: data.age,
      phone: data.phone,
      email: data.email,
      contacts: data.contacts.filter(c => c.name.trim() && c.phone.trim()),
      safePhrase: data.safePhrase,
      setupComplete: true,
      createdAt: new Date().toISOString(),
    };
    // Backend integration point: POST /api/users/profile
    saveProfile(profile);
    toast.success(t(tr.toasts.welcome, { name: profile.name }));
    setTimeout(() => router.push('/safety-hub'), 1000);
    setIsSubmitting(false);
  };

  const stepLabels = tr.steps as string[];

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-slate-50 flex flex-col">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="px-5 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl safe-tap-gradient flex items-center justify-center shadow-lg shadow-red-200">
            <Shield size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">{tr.title}</h1>
            <p className="text-xs text-slate-500 font-medium">{tr.tagline}</p>
          </div>
        </div>

        {/* Step progress */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-3">
            {stepLabels.map((label, i) => {
              const stepNum = i + 1;
              const isDone = step > stepNum;
              const isCurrent = step === stepNum;
              return (
                <div key={`step-label-${stepNum}`} className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                    isDone
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-red-600 text-white shadow-md shadow-red-200'
                      : 'bg-slate-200 text-slate-400'
                  }`}>
                    {isDone ? <CheckCircle size={16} /> : stepNum}
                  </div>
                  <span className={`text-[10px] font-semibold ${isCurrent ? 'text-red-600' : isDone ? 'text-green-600' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-5">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="slide-up space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                  {watchedName ? t(tr.greeting, { name: watchedName.split(' ')[0] }) : tr.defaultTitle}
                </h2>
                <p className="text-sm text-slate-500 mt-1">{tr.subtitle}</p>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="block text-sm font-semibold text-slate-700">
                  {tr.fullName} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="name"
                    type="text"
                    placeholder={tr.fullNamePlaceholder}
                    autoComplete="name"
                    className={`w-full pl-10 pr-4 py-3.5 bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 ${
                      errors.name ? 'border-red-400 bg-red-50' : 'border-slate-200'
                    }`}
                    {...register('name', {
                      required: tr.errors.nameRequired,
                      minLength: { value: 2, message: tr.errors.nameMin },
                    })}
                  />
                </div>
                {errors.name && (
                  <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                    <AlertCircle size={12} /> {errors.name.message}
                  </p>
                )}
              </div>

              {/* Age */}
              <div className="space-y-1.5">
                <label htmlFor="age" className="block text-sm font-semibold text-slate-700">
                  {tr.age} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="age"
                    type="number"
                    min="10"
                    max="100"
                    placeholder={tr.agePlaceholder}
                    className={`w-full pl-10 pr-4 py-3.5 bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 ${
                      errors.age ? 'border-red-400 bg-red-50' : 'border-slate-200'
                    }`}
                    {...register('age', {
                      required: tr.errors.ageRequired,
                      min: { value: 10, message: tr.errors.ageMin },
                      max: { value: 100, message: tr.errors.ageMax },
                    })}
                  />
                </div>
                {errors.age && (
                  <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                    <AlertCircle size={12} /> {errors.age.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label htmlFor="phone" className="block text-sm font-semibold text-slate-700">
                  {tr.mobile} <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-slate-400">{tr.mobileHint}</p>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="phone"
                    type="tel"
                    placeholder={tr.mobilePlaceholder}
                    autoComplete="tel"
                    className={`w-full pl-10 pr-4 py-3.5 bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 ${
                      errors.phone ? 'border-red-400 bg-red-50' : 'border-slate-200'
                    }`}
                    {...register('phone', {
                      required: tr.errors.phoneRequired,
                      pattern: {
                        value: /^[+]?[\d\s\-()]{8,15}$/,
                        message: tr.errors.phonePattern,
                      },
                    })}
                  />
                </div>
                {errors.phone && (
                  <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                    <AlertCircle size={12} /> {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                  {tr.email} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    placeholder={tr.emailPlaceholder}
                    autoComplete="email"
                    className={`w-full pl-10 pr-4 py-3.5 bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 ${
                      errors.email ? 'border-red-400 bg-red-50' : 'border-slate-200'
                    }`}
                    {...register('email', {
                      required: tr.errors.emailRequired,
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: tr.errors.emailPattern,
                      },
                    })}
                  />
                </div>
                {errors.email && (
                  <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                    <AlertCircle size={12} /> {errors.email.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Emergency Contacts */}
          {step === 2 && (
            <div className="slide-up space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 leading-tight">{tr.emergencyContacts}</h2>
                <p className="text-sm text-slate-500 mt-1">{tr.emergencySubtitle}</p>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-red-600">{index + 1}</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-700">Contact {index + 1}</span>
                      </div>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors active:scale-95"
                          aria-label={`Remove contact ${index + 1}`}
                        >
                          <Trash2 size={13} className="text-red-500" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor={`contact-name-${index}`} className="block text-xs font-semibold text-slate-600">
                        {tr.contactName} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          id={`contact-name-${index}`}
                          type="text"
                          placeholder={tr.contactNamePlaceholder}
                          className={`w-full pl-8 pr-3 py-3 bg-slate-50 border rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 ${
                            errors.contacts?.[index]?.name ? 'border-red-400 bg-red-50' : 'border-slate-200'
                          }`}
                          {...register(`contacts.${index}.name`, {
                            required: index === 0 ? 'Contact name is required' : false,
                          })}
                        />
                      </div>
                      {errors.contacts?.[index]?.name && (
                        <p className="flex items-center gap-1 text-xs text-red-600 font-medium">
                          <AlertCircle size={11} /> {errors.contacts[index]?.name?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor={`contact-phone-${index}`} className="block text-xs font-semibold text-slate-600">
                        {tr.contactPhone} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          id={`contact-phone-${index}`}
                          type="tel"
                          placeholder={tr.contactPhonePlaceholder}
                          className={`w-full pl-8 pr-3 py-3 bg-slate-50 border rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 ${
                            errors.contacts?.[index]?.phone ? 'border-red-400 bg-red-50' : 'border-slate-200'
                          }`}
                          {...register(`contacts.${index}.phone`, {
                            required: index === 0 ? 'Phone number is required' : false,
                            pattern: index === 0 ? {
                              value: /^[+]?[\d\s\-()]{8,15}$/,
                              message: 'Enter a valid number',
                            } : undefined,
                          })}
                        />
                      </div>
                      {errors.contacts?.[index]?.phone && (
                        <p className="flex items-center gap-1 text-xs text-red-600 font-medium">
                          <AlertCircle size={11} /> {errors.contacts[index]?.phone?.message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {fields.length < 3 && (
                <button
                  type="button"
                  onClick={() => append({ id: `contact-${fields.length + 1}`, name: '', phone: '' })}
                  className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-red-200 rounded-2xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors active:scale-95"
                >
                  <Plus size={16} />
                  {tr.addContact}
                </button>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                <AlertCircle size={15} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                  Your contacts will receive WhatsApp messages with your location when you trigger SOS. Make sure they have WhatsApp installed.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Safe Phrase */}
          {step === 3 && (
            <div className="slide-up space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 leading-tight">{tr.safePhrase}</h2>
                <p className="text-sm text-slate-500 mt-1">{tr.safePhraseSubtitle}</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Your phrase</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyPhrase}
                      className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors active:scale-95"
                      aria-label={tr.copy}
                    >
                      <Copy size={14} className="text-slate-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPhrase(v => !v)}
                      className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors active:scale-95"
                      aria-label={showPhrase ? 'Hide phrase' : 'Show phrase'}
                    >
                      {showPhrase ? <EyeOff size={14} className="text-slate-600" /> : <Eye size={14} className="text-slate-600" />}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type={showPhrase ? 'text' : 'password'}
                    className="w-full px-4 py-4 bg-red-50 border-2 border-red-200 rounded-xl text-lg font-bold text-red-700 tracking-widest focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 safe-phrase-glow transition-all"
                    {...register('safePhrase', {
                      required: 'Safe phrase is required',
                      minLength: { value: 5, message: 'Phrase must be at least 5 characters' },
                    })}
                  />
                </div>
                {errors.safePhrase && (
                  <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                    <AlertCircle size={12} /> {errors.safePhrase.message}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleRegeneratePhrase}
                  className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
                >
                  <RefreshCw size={14} />
                  {tr.regenerate}
                </button>
              </div>

              <div className="bg-slate-900 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-white uppercase tracking-wider">How it works</p>
                <div className="space-y-2">
                  {[
                    { icon: '🔑', text: 'Memorize your safe phrase' },
                    { icon: '⌨️', text: 'Type it in any chat or input field' },
                    { icon: '🔴', text: 'Emergency mode activates silently' },
                    { icon: '📲', text: 'Your contacts get your location instantly' },
                  ].map((item, i) => (
                    <div key={`phrase-step-${i}`} className="flex items-center gap-3">
                      <span className="text-base">{item.icon}</span>
                      <span className="text-xs font-medium text-slate-300">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-2">
                <p className="text-sm font-bold text-green-800 flex items-center gap-2">
                  <CheckCircle size={16} /> Almost done!
                </p>
                <p className="text-xs text-green-700 leading-relaxed">
                  Your SafeTap profile is ready. You can always update your information from the Setup tab.
                </p>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-8 mb-32">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex items-center gap-2 px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
              >
                <ChevronLeft size={16} />
                {tr.back}
              </button>
            )}

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 safe-tap-gradient rounded-xl text-sm font-bold text-white shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300 transition-all active:scale-95"
              >
                {tr.next}
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 safe-tap-gradient rounded-xl text-sm font-bold text-white shadow-lg shadow-red-200 hover:shadow-xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {tr.completing}
                  </>
                ) : (
                  <>
                    <Shield size={16} />
                    {tr.complete}
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Bottom tab bar placeholder */}
      <div className="h-16" />
    </div>
  );
}