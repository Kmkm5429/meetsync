import React from 'react';
import { Calendar, Users, Briefcase, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Room, Participant } from '../types';
import { generateDateRange, analyzeAllSlots } from '../lib/availability';

interface CalendarHeatmapProps {
  room: Room;
  participants: Participant[];
  onSelectDate: (date: string) => void;
}

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  room,
  participants,
  onSelectDate,
}) => {
  const dates = generateDateRange(room.startDate, room.endDate);
  const slotAnalyses = analyzeAllSlots(room, participants);

  return (
    <div className="bg-white dark:bg-neutral-900/90 rounded-3xl p-5 border border-neutral-200/80 dark:border-neutral-800/80 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              모임 달력 현황
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {format(parseISO(room.startDate), 'yyyy년 M월 d일', { locale: ko })} – {format(parseISO(room.endDate), 'yyyy년 M월 d일', { locale: ko })}
            </p>
          </div>
        </div>
      </div>

      {/* Grid of days */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {dates.map((d) => {
          const daySlots = slotAnalyses.filter((s) => s.date === d);
          const totalSlots = daySlots.length;

          let maxAvailableInSlot = 0;
          let workShiftCountOnDay = 0;

          daySlots.forEach((s) => {
            if (s.availableCount > maxAvailableInSlot) {
              maxAvailableInSlot = s.availableCount;
            }
            workShiftCountOnDay += s.workingCount;
          });

          const totalParticipants = participants.length;
          const peakPercentage =
            totalParticipants > 0 ? Math.round((maxAvailableInSlot / totalParticipants) * 100) : 0;

          return (
            <button
              key={d}
              onClick={() => onSelectDate(d)}
              id={`calendar-overview-date-${d}`}
              className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/60 text-left transition-all duration-150 flex items-center justify-between group"
            >
              <div className="space-y-1">
                <div className="text-sm font-bold text-neutral-900 dark:text-white flex items-center space-x-2">
                  <span>{format(parseISO(d), 'yyyy년 M월 d일 (EEE)', { locale: ko })}</span>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>최대 {peakPercentage}% 가능</span>
                  </span>

                  {workShiftCountOnDay > 0 && (
                    <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center space-x-1">
                      <Briefcase className="w-3 h-3" />
                      <span>알바 있음</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    peakPercentage >= 80
                      ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                      : peakPercentage >= 50
                      ? 'bg-blue-500'
                      : peakPercentage > 0
                      ? 'bg-amber-500'
                      : 'bg-neutral-300 dark:bg-neutral-600'
                  }`}
                />
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
