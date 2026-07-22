import React, { useState } from 'react';
import { Share2, Moon, Sun, Users, Copy, Check, Calendar, Sparkles } from 'lucide-react';
import { Room } from '../types';

interface HeaderProps {
  room: Room | null;
  participantCount: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenCreateModal: () => void;
  onGoHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  room,
  participantCount,
  darkMode,
  onToggleDarkMode,
  onOpenCreateModal,
  onGoHome,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (!room) return;
    const url = `${window.location.origin}/room/${room.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 dark:bg-black/70 border-b border-neutral-200/80 dark:border-neutral-800/80 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand logo & room title */}
        <div 
          onClick={onGoHome}
          className={`flex items-center space-x-3 ${onGoHome ? 'cursor-pointer group' : ''}`}
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-semibold text-neutral-900 dark:text-white tracking-tight">
                {room ? room.title : 'MeetSync'}
              </h1>
              {room && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  실시간
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {room ? `방장: ${room.hostNickname}` : '모임 일정 맞추기'}
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center space-x-2">
          {room ? (
            <>
              <button
                onClick={handleCopyLink}
                id="header-copy-link-btn"
                className="flex items-center space-x-1.5 text-xs font-medium px-3 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">복사됨!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>초대 링크</span>
                  </>
                )}
              </button>

              <button
                onClick={onOpenCreateModal}
                id="header-create-another-btn"
                className="flex items-center space-x-1 text-xs font-medium px-3 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-all active:scale-95"
                title="새 방 만들기"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span className="hidden md:inline">새 방</span>
              </button>
            </>
          ) : (
            <button
              onClick={onOpenCreateModal}
              id="header-create-room-btn"
              className="flex items-center space-x-1.5 text-xs font-medium px-3.5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>방 만들기</span>
            </button>
          )}

          {/* Dark mode toggle */}
          <button
            onClick={onToggleDarkMode}
            id="header-dark-mode-btn"
            className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-all active:scale-95"
            title="다크/라이트 모드 전환"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
