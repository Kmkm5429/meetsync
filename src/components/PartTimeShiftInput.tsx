import React, { useState } from 'react';
import { Briefcase, Plus, Trash2, Calendar, Clock, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Room, Participant, WorkShift } from '../types';
import { generateDateRange } from '../lib/availability';

interface PartTimeShiftInputProps {
  room: Room;
  currentParticipant: Participant | null;
  onUpdateWorkShifts: (shifts: WorkShift[]) => Promise<void>;
}

export const PartTimeShiftInput: React.FC<PartTimeShiftInputProps> = ({
  room,
  currentParticipant,
  onUpdateWorkShifts,
}) => {
  const dates = generateDateRange(room.startDate, room.endDate);

  const [date, setDate] = useState<string>(dates[0] || room.startDate);
  const [startTime, setStartTime] = useState<string>('14:00');
  const [endTime, setEndTime] = useState<string>('20:00');
  const [title, setTitle] = useState<string>('알바');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const shifts = currentParticipant?.workShifts || [];

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentParticipant) return;

    if (startTime >= endTime) {
      setError('시작 시간은 종료 시간보다 빠라야 합니다.');
      return;
    }

    const newShift: WorkShift = {
      id: 'shift-' + Date.now(),
      date,
      startTime,
      endTime,
      title: title.trim() || '알바',
    };

    try {
      setSaving(true);
      setError('');
      const updated = [...shifts, newShift];
      await onUpdateWorkShifts(updated);
      setTitle('알바');
    } catch (err: any) {
      setError(err.message || '알바 일정 추가 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveShift = async (id: string) => {
    if (!currentParticipant) return;
    try {
      setSaving(true);
      const updated = shifts.filter((s) => s.id !== id);
      await onUpdateWorkShifts(updated);
    } catch (err: any) {
      setError('알바 일정 삭제 실패');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900/90 rounded-3xl p-5 border border-neutral-200/80 dark:border-neutral-800/80 shadow-sm space-y-4">
      {/* Section Title */}
      <div className="flex items-center space-x-2.5">
        <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Briefcase className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
            알바 시간
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            알바/근무 일정을 입력하면 추천 모임 시간에서 자동으로 제외됩니다
          </p>
        </div>
      </div>

      {error && (
        <div className="p-2.5 rounded-2xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs flex items-center space-x-2 border border-red-200 dark:border-red-800">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Add Shift Form */}
      <form onSubmit={handleAddShift} className="space-y-3 bg-neutral-50 dark:bg-neutral-800/50 p-3.5 rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Shift Title */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
              알바 / 일정 이름
            </label>
            <input
              type="text"
              id="part-time-shift-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 카페 알바, 편의점 알바"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
              날짜
            </label>
            <select
              value={date}
              id="part-time-shift-date-select"
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs focus:outline-none focus:border-amber-500"
            >
              {dates.map((d) => (
                <option key={d} value={d}>
                  {format(parseISO(d), 'yyyy년 M월 d일 (EEE)', { locale: ko })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Time Inputs */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
              알바 시작 시간
            </label>
            <input
              type="time"
              id="part-time-shift-start-time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
              알바 종료 시간
            </label>
            <input
              type="time"
              id="part-time-shift-end-time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          id="add-part-time-shift-btn"
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-all shadow-sm flex items-center justify-center space-x-1.5 active:scale-98 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>{saving ? '추가 중...' : '알바 일정 추가'}</span>
        </button>
      </form>

      {/* Existing Work Shifts List */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          등록된 알바 일정 ({shifts.length})
        </h4>

        {shifts.length === 0 ? (
          <p className="text-xs text-neutral-400 italic text-center py-2">
            등록된 알바 일정이 없습니다. 알바나 파트타임 근무가 있다면 위에서 등록해 보세요!
          </p>
        ) : (
          <div className="space-y-2 max-h-[220px] overflow-y-auto">
            {shifts.map((s) => (
              <div
                key={s.id}
                className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-neutral-900 dark:text-white">
                      {s.title}
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center space-x-2">
                      <span className="font-medium">
                        {format(parseISO(s.date), 'yyyy년 M월 d일 (EEE)', { locale: ko })}
                      </span>
                      <span>•</span>
                      <span>
                        {s.startTime} - {s.endTime}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveShift(s.id)}
                  id={`remove-shift-btn-${s.id}`}
                  className="p-1.5 rounded-lg hover:bg-amber-500/20 text-neutral-400 hover:text-red-500 transition-colors"
                  title="일정 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
