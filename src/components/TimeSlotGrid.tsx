import React, { useState } from 'react';
import { Clock, Check, X, Sparkles, Briefcase, Sun, Sunset, Moon, CheckSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Room, Participant, WorkShift } from '../types';
import { generateDateRange, generateTimeSlotsForHours, isTimeInShift } from '../lib/availability';

interface TimeSlotGridProps {
  room: Room;
  currentParticipant: Participant | null;
  onUpdateAvailableSlots: (slots: string[]) => Promise<void>;
}

export const TimeSlotGrid: React.FC<TimeSlotGridProps> = ({
  room,
  currentParticipant,
  onUpdateAvailableSlots,
}) => {
  const dates = generateDateRange(room.startDate, room.endDate);
  const [selectedDate, setSelectedDate] = useState<string>(dates[0] || room.startDate);
  const [saving, setSaving] = useState(false);

  const availableSlots = new Set<string>(currentParticipant?.availableSlots || []);
  const workShifts = currentParticipant?.workShifts || [];

  const timeSlots = generateTimeSlotsForHours(room.startHour, room.endHour);

  const toggleSlot = async (slotKey: string) => {
    if (!currentParticipant) return;
    const updated = new Set(availableSlots);
    if (updated.has(slotKey)) {
      updated.delete(slotKey);
    } else {
      updated.add(slotKey);
    }
    setSaving(true);
    await onUpdateAvailableSlots(Array.from(updated));
    setSaving(false);
  };

  const handleQuickSelect = async (type: 'morning' | 'afternoon' | 'evening' | 'all' | 'clear') => {
    if (!currentParticipant) return;
    const updated = new Set(availableSlots);

    timeSlots.forEach((time) => {
      const slotKey = `${selectedDate}T${time}`;

      // Skip if participant is working
      const shiftOnDate = workShifts.find((s) => s.date === selectedDate && isTimeInShift(time, s));
      if (shiftOnDate) return;

      const [hour] = time.split(':').map(Number);

      if (type === 'clear') {
        updated.delete(slotKey);
      } else if (type === 'all') {
        updated.add(slotKey);
      } else if (type === 'morning' && hour >= 6 && hour < 12) {
        updated.add(slotKey);
      } else if (type === 'afternoon' && hour >= 12 && hour < 17) {
        updated.add(slotKey);
      } else if (type === 'evening' && hour >= 17) {
        updated.add(slotKey);
      }
    });

    setSaving(true);
    await onUpdateAvailableSlots(Array.from(updated));
    setSaving(false);
  };

  const formattedDateTitle = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'yyyy년 M월 d일 (EEE)', { locale: ko });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Date selector tabs (Mobile Horizontal Scroll / Pills) */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {dates.map((d) => {
          const isSelected = d === selectedDate;
          const countForDate = Array.from(availableSlots).filter((s) => s.startsWith(d)).length;
          const hasWork = workShifts.some((s) => s.date === d);

          return (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              id={`date-tab-${d}`}
              className={`flex-shrink-0 px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all duration-150 flex flex-col items-center min-w-[80px] border ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              <span className="opacity-80 font-normal">
                {format(parseISO(d), 'EEE', { locale: ko })}
              </span>
              <span className="text-sm font-bold">{format(parseISO(d), 'M월 d일', { locale: ko })}</span>
              {countForDate > 0 && (
                <span className={`text-[10px] mt-0.5 px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-blue-500 text-white' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300'
                }`}>
                  {countForDate}개 가능
                </span>
              )}
              {hasWork && (
                <span className="text-[9px] text-amber-500 mt-0.5 font-medium flex items-center space-x-0.5">
                  <Briefcase className="w-2.5 h-2.5" />
                  <span>알바</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Select Actions for Selected Date */}
      <div className="bg-white dark:bg-neutral-900/90 rounded-3xl p-4 border border-neutral-200/80 dark:border-neutral-800/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center space-x-2">
              <span>{formattedDateTitle(selectedDate)}</span>
              {saving && <span className="text-xs font-normal text-blue-500 animate-pulse">저장 중...</span>}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              모임 가능한 시간대를 터치해 선택하세요
            </p>
          </div>

          <button
            onClick={() => handleQuickSelect('clear')}
            id="clear-day-slots-btn"
            className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            이 날짜 초기화
          </button>
        </div>

        {/* Quick select presets */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          <button
            onClick={() => handleQuickSelect('morning')}
            id="quick-select-morning"
            className="py-1.5 px-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 flex items-center justify-center space-x-1"
          >
            <Sun className="w-3 h-3 text-amber-500" />
            <span>오전</span>
          </button>
          <button
            onClick={() => handleQuickSelect('afternoon')}
            id="quick-select-afternoon"
            className="py-1.5 px-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 flex items-center justify-center space-x-1"
          >
            <Sunset className="w-3 h-3 text-orange-500" />
            <span>오후</span>
          </button>
          <button
            onClick={() => handleQuickSelect('evening')}
            id="quick-select-evening"
            className="py-1.5 px-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 flex items-center justify-center space-x-1"
          >
            <Moon className="w-3 h-3 text-indigo-400" />
            <span>저녁</span>
          </button>
          <button
            onClick={() => handleQuickSelect('all')}
            id="quick-select-all"
            className="py-1.5 px-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-[11px] font-medium text-blue-600 dark:text-blue-300 flex items-center justify-center space-x-1"
          >
            <CheckSquare className="w-3 h-3" />
            <span>전체 선택</span>
          </button>
        </div>

        {/* Time slot grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 max-h-[360px] overflow-y-auto pr-1">
          {timeSlots.map((time) => {
            const slotKey = `${selectedDate}T${time}`;
            const isAvailable = availableSlots.has(slotKey);

            // Check if user has part-time work at this slot
            const shiftOnDate = workShifts.find((s) => s.date === selectedDate && isTimeInShift(time, s));

            if (shiftOnDate) {
              return (
                <div
                  key={time}
                  className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between opacity-80 cursor-not-allowed"
                  title={`알바 일정: ${shiftOnDate.title || '알바'}`}
                >
                  <div className="flex items-center space-x-1.5">
                    <Briefcase className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-semibold">{time}</span>
                  </div>
                  <span className="text-[10px] font-medium truncate max-w-[70px]">
                    {shiftOnDate.title || '알바'}
                  </span>
                </div>
              );
            }

            return (
              <button
                key={time}
                onClick={() => toggleSlot(slotKey)}
                id={`slot-btn-${slotKey}`}
                className={`p-2.5 rounded-2xl border text-xs font-semibold transition-all duration-150 flex items-center justify-between active:scale-96 ${
                  isAvailable
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/30'
                    : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200/80 dark:border-neutral-700/60 text-neutral-700 dark:text-neutral-300 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 opacity-70" />
                  <span>{time}</span>
                </div>
                {isAvailable ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-[10px] font-normal text-neutral-400">불가</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
