import React, { useState } from 'react';
import { Sparkles, CheckCircle2, AlertCircle, Clock, Calendar, Users, Briefcase, Check, Award, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Room, Participant, BestTimeRecommendation } from '../types';
import { calculateBestTimes } from '../lib/availability';

interface BestTimesListProps {
  room: Room;
  participants: Participant[];
  currentParticipant: Participant | null;
  onFinalizeSlot?: (date: string, startTime: string, endTime: string) => Promise<void>;
}

export const BestTimesList: React.FC<BestTimesListProps> = ({
  room,
  participants,
  currentParticipant,
  onFinalizeSlot,
}) => {
  const recommendations = calculateBestTimes(room, participants);
  const [finalizing, setFinalizing] = useState<string | null>(null);

  const isHost = currentParticipant?.isHost || room.createdByUid === currentParticipant?.uid;

  const handleFinalize = async (rec: BestTimeRecommendation) => {
    if (!onFinalizeSlot) return;
    try {
      setFinalizing(`${rec.date}_${rec.startTime}`);
      await onFinalizeSlot(rec.date, rec.startTime, rec.endTime);
    } catch (e) {
      console.error(e);
    } finally {
      setFinalizing(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Finalized Slot Banner if room has a confirmed slot */}
      {room.finalizedSlot && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-blue-500/15 border border-emerald-500/30 text-neutral-900 dark:text-white space-y-2">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              약속 시간 확정됨!
            </h3>
          </div>
          <div className="text-base font-extrabold flex items-center space-x-2">
            <span>{format(parseISO(room.finalizedSlot.date), 'yyyy년 M월 d일 (EEE)', { locale: ko })}</span>
          </div>
          <div className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span>
              {room.finalizedSlot.startTime} – {room.finalizedSlot.endTime}
            </span>
          </div>
        </div>
      )}

      {/* Main Recommendations Header */}
      <div className="bg-white dark:bg-neutral-900/90 rounded-3xl p-5 border border-neutral-200/80 dark:border-neutral-800/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                추천 시간
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                참가자 {participants.length}명의 가능 시간과 알바 일정을 자동 분석한 최적 시간대입니다
              </p>
            </div>
          </div>
        </div>

        {participants.length === 0 ? (
          <p className="text-xs text-neutral-400 italic text-center py-6">
            참가자들이 방에 참가하여 가능 시간을 입력하기를 기다리는 중입니다...
          </p>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto opacity-80" />
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              연속된 모임 가능 시간을 찾을 수 없습니다
            </p>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              내 가능 시간 탭에서 더 많은 시간대를 선택하거나 알바 일정을 조정해 보세요.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec, index) => {
              const recKey = `${rec.date}_${rec.startTime}`;
              const isSelected =
                room.finalizedSlot?.date === rec.date &&
                room.finalizedSlot?.startTime === rec.startTime;

              return (
                <div
                  key={recKey}
                  className={`p-4 rounded-2xl border transition-all duration-200 space-y-3 ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                      : index === 0
                      ? 'bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-purple-500/10 border-blue-500/30'
                      : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200/80 dark:border-neutral-700/60'
                  }`}
                >
                  {/* Top line: Date, Time & Match Badge */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        {index === 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-sm">
                            1순위 추천
                          </span>
                        )}
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                          {format(parseISO(rec.date), 'yyyy년 M월 d일 (EEE)', { locale: ko })}
                        </h4>
                      </div>
                      <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 flex items-center space-x-1.5 mt-1">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span>
                          {rec.startTime} – {rec.endTime}
                        </span>
                      </div>
                    </div>

                    {/* Match percentage pill */}
                    <div className="text-right">
                      <div
                        className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-extrabold ${
                          rec.matchPercentage === 100
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : rec.matchPercentage >= 70
                            ? 'bg-blue-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        <span>{rec.matchPercentage}% 일치</span>
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">
                        {rec.totalCount}명 중 {rec.availableCount}명 가능
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        rec.matchPercentage === 100
                          ? 'bg-emerald-500'
                          : rec.matchPercentage >= 70
                          ? 'bg-blue-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${rec.matchPercentage}%` }}
                    />
                  </div>

                  {/* Participants breakdown */}
                  <div className="space-y-1.5 text-xs">
                    {/* Available badges */}
                    {rec.availableNicknames.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          가능:
                        </span>
                        {rec.availableNicknames.map((nick) => (
                          <span
                            key={nick}
                            className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-medium text-[11px] border border-emerald-500/20"
                          >
                            ✓ {nick}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Working badges */}
                    {rec.workingNicknames.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                          알바 중:
                        </span>
                        {rec.workingNicknames.map((nick) => (
                          <span
                            key={nick}
                            className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium text-[11px] border border-amber-500/20 flex items-center space-x-1"
                          >
                            <Briefcase className="w-3 h-3" />
                            <span>{nick}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Unavailable badges */}
                    {rec.unavailableNicknames.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          불가능:
                        </span>
                        {rec.unavailableNicknames.map((nick) => (
                          <span
                            key={nick}
                            className="px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 font-medium text-[11px]"
                          >
                            ✕ {nick}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Host action: Finalize Slot */}
                  {isHost && (
                    <div className="pt-1 border-t border-neutral-200/50 dark:border-neutral-700/50 flex justify-end">
                      <button
                        onClick={() => handleFinalize(rec)}
                        disabled={finalizing === recKey || isSelected}
                        id={`finalize-btn-${recKey}`}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 active:scale-95 ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>확정된 약속 시간</span>
                          </>
                        ) : (
                          <>
                            <Award className="w-3.5 h-3.5" />
                            <span>
                              {finalizing === recKey ? '확정 중...' : '이 시간으로 확정'}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
