import React, { useState } from 'react';
import { Users, Crown, Briefcase, Check, Share2, Sparkles, Clock, Copy } from 'lucide-react';
import { Room, Participant } from '../types';

interface ParticipantsTabProps {
  room: Room;
  participants: Participant[];
  currentParticipant: Participant | null;
}

export const ParticipantsTab: React.FC<ParticipantsTabProps> = ({
  room,
  participants,
  currentParticipant,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = window.location.origin + window.location.pathname + '?room=' + room.id;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Invite card */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-5 text-white shadow-lg shadow-indigo-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <h3 className="text-sm font-bold">초대 링크로 친구 초대하기</h3>
          </div>
          <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-bold backdrop-blur-md">
            방 코드: {room.id}
          </span>
        </div>
        <p className="text-xs text-blue-100">
          링크만 공유하면 로그인이나 회원가입 없이 바로 참가할 수 있습니다!
        </p>

        <button
          onClick={handleCopyLink}
          id="participants-share-link-btn"
          className="w-full py-2.5 px-4 rounded-2xl bg-white text-blue-700 font-bold text-xs hover:bg-blue-50 transition-all flex items-center justify-center space-x-2 shadow-sm active:scale-98"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span>클립보드에 초대 링크가 복사되었습니다!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>초대 링크 복사</span>
            </>
          )}
        </button>
      </div>

      {/* Participants Roster */}
      <div className="bg-white dark:bg-neutral-900/90 rounded-3xl p-5 border border-neutral-200/80 dark:border-neutral-800/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              참가한 친구들 ({participants.length}명)
            </h3>
          </div>
        </div>

        <div className="space-y-2.5">
          {participants.map((p) => {
            const isMe = currentParticipant?.id === p.id || currentParticipant?.uid === p.uid;
            const isHost = p.isHost || p.uid === room.createdByUid;
            const hasSlots = p.availableSlots && p.availableSlots.length > 0;
            const shiftCount = p.workShifts ? p.workShifts.length : 0;

            return (
              <div
                key={p.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  isMe
                    ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60'
                    : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200/80 dark:border-neutral-700/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar circle */}
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center font-bold text-sm text-neutral-800 dark:text-white shadow-inner">
                    {p.nickname.slice(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-neutral-900 dark:text-white">
                        {p.nickname}
                      </span>
                      {isMe && (
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold px-2 py-0.5 rounded-full">
                          나
                        </span>
                      )}
                      {isHost && (
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-extrabold px-2 py-0.5 rounded-full flex items-center space-x-0.5">
                          <Crown className="w-2.5 h-2.5" />
                          <span>방장</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-blue-500" />
                        <span>{hasSlots ? `${p.availableSlots.length}개 시간 가능` : '가능 시간 미입력'}</span>
                      </span>

                      {shiftCount > 0 && (
                        <span className="flex items-center space-x-1 text-amber-600 dark:text-amber-400 font-medium">
                          <Briefcase className="w-3 h-3" />
                          <span>알바 {shiftCount}개</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {hasSlots ? (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      ✓ 입력 완료
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-500">
                      입력 대기
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
