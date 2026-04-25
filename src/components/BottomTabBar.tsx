'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Shield, MessageCircle, Home, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';


export default function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage, translations, supportedLanguages } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);

  const tabs = [
    { id: 'tab-setup', label: translations?.tabs?.setup, icon: Home, path: '/setup-screen' },
    { id: 'tab-hub', label: translations?.tabs?.safetyHub, icon: Shield, path: '/safety-hub' },
    { id: 'tab-chat', label: translations?.tabs?.legalHelp, icon: MessageCircle, path: '/chat-legal-help' },
  ];

  const handleLanguageChange = (code) => {
    setLanguage(code);
    setShowLangMenu(false);
    const lang = supportedLanguages?.find(l => l?.code === code);
    if (lang) toast?.success(`${translations?.language?.changed?.replace('{lang}', lang?.nativeLabel)}`);
  };

  return (
    <>
      {/* Language menu overlay */}
      {showLangMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowLangMenu(false)}
        />
      )}
      {/* Language picker popup */}
      {showLangMenu && (
        <div className="fixed bottom-20 right-4 z-50 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden w-44">
          {supportedLanguages?.map(lang => (
            <button
              key={lang?.code}
              onClick={() => handleLanguageChange(lang?.code)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-slate-50 ${
                language === lang?.code ? 'text-red-600 bg-red-50' : 'text-slate-700'
              }`}
            >
              <span className="text-base">{lang?.flag}</span>
              <span>{lang?.nativeLabel}</span>
              {language === lang?.code && <span className="ml-auto text-red-500 text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-slate-200 bottom-tab-bar z-50">
        <div className="flex items-center justify-around h-16">
          {tabs?.map((tab) => {
            const Icon = tab?.icon;
            const isActive = pathname === tab?.path;
            return (
              <button
                key={tab?.id}
                onClick={() => router?.push(tab?.path)}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-150 active:scale-95 ${
                  isActive ? 'text-red-600' : 'text-slate-400 hover:text-slate-600'
                }`}
                aria-label={`Navigate to ${tab?.label}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-150 ${
                  isActive ? 'bg-red-50' : ''
                }`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && (
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-600 rounded-full" />
                  )}
                </div>
                <span className={`text-[10px] font-semibold tracking-wide ${
                  isActive ? 'text-red-600' : 'text-slate-400'
                }`}>
                  {tab?.label}
                </span>
              </button>
            );
          })}

          {/* Language toggle button */}
          <button
            onClick={() => setShowLangMenu(prev => !prev)}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-150 active:scale-95 ${
              showLangMenu ? 'text-red-600' : 'text-slate-400 hover:text-slate-600'
            }`}
            aria-label="Change language"
          >
            <div className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-150 ${
              showLangMenu ? 'bg-red-50' : ''
            }`}>
              <Globe size={20} strokeWidth={showLangMenu ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-semibold tracking-wide ${
              showLangMenu ? 'text-red-600' : 'text-slate-400'
            }`}>
              {supportedLanguages?.find(l => l?.code === language)?.flag ?? '🌐'}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}