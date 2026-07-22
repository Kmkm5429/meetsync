import React, { useState } from 'react';
import { X, Calendar, Clock, User, Sparkles, AlertCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (data: {
    title: string;
    hostNickname: string;
    startDate: string;
    endDate: string;
    startHour: number;
    endHour: number;
    meetingDurationMinutes: number;
    description?: string;
  }) => Promise<void>;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
}) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const defaultEnd = format(addDays(new Date(), 6), 'yyyy-MM-dd');

  const [title, setTitle] = useState('');
  const [hostNickname, setHostNickname] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [startHour, setStartHour] = useState(9); // 09:00
  const [endHour, setEndHour] = useState(22); // 22:00
  const [duration, setDuration] = useState(60); // 60 mins
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('방 제목을 입력해 주세요.');
      return;
    }
    if (!hostNickname.trim()) {
      setError('닉네임을 입력해 주세요.');
      return;
    }
    if (startDate > endDate) {
      setError('시작 날짜는 종료 날짜보다 빠를 수 없습니다.');
      return;
    }
    if (startHour >= endHour) {
      setError('시작 시간은 종료 시간보다 빠라야 합니다.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onCreateRoom({
        title: title.trim(),
        hostNickname: hostNickname.trim(),
        startDate,
        endDate,
        startHour,
        endHour,
        meetingDurationMinutes: duration,
        description: description.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || '방 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        id="create-room-modal"
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden text-neutral-900 dark:text-neutral-100 max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">MeetSync 방 만들기</h2>
          </div>
          <button
            onClick={onClose}
            id="create-room-close-btn"
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs flex items-center space-x-2 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Room Title */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
              방 제목 / 모임 목적
            </label>
            <input
              type="text"
              id="create-room-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 주말 카페 모임, 팀 회의"
              className="w-full px-4 py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-transparent focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none text-sm transition-all"
            />
          </div>

          {/* Host Nickname */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
              내 닉네임
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
              <input
                type="text"
                id="create-room-nickname-input"
                value={hostNickname}
                onChange={(e) => setHostNickname(e.target.value)}
                placeholder="예: 홍길동, 김철수"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-transparent focus:border-blue-500 focus:outline-none text-sm transition-all"
              />
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                시작 날짜
              </label>
              <input
                type="date"
                id="create-room-start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 text-sm focus:outline-none border border-transparent focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                종료 날짜
              </label>
              <input
                type="date"
                id="create-room-end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 text-sm focus:outline-none border border-transparent focus:border-blue-500"
              />
            </div>
          </div>

          {/* Time Bounds */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                모임 시작 가능 시간
              </label>
              <select
                value={startHour}
                id="create-room-start-hour"
                onChange={(e) => setStartHour(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 text-sm focus:outline-none border border-transparent focus:border-blue-500"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                모임 종료 가능 시간
              </label>
              <select
                value={endHour}
                id="create-room-end-hour"
                onChange={(e) => setEndHour(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 text-sm focus:outline-none border border-transparent focus:border-blue-500"
              >
                {Array.from({ length: 25 }).map((_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Meeting Duration */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
              목표 모임 시간
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[30, 60, 90, 120].map((mins) => (
                <button
                  type="button"
                  key={mins}
                  onClick={() => setDuration(mins)}
                  className={`py-2 text-xs font-medium rounded-2xl border transition-all ${
                    duration === mins
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-neutral-100 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {mins >= 60 ? `${mins / 60}시간` : `${mins}분`}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
              친구들에게 전할 메모 (선택 사항)
            </label>
            <input
              type="text"
              id="create-room-description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 알바 시간 꼭 입력해주세요! 보드게임 가져오기"
              className="w-full px-4 py-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-transparent focus:border-blue-500 focus:outline-none text-sm transition-all"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              id="create-room-submit-btn"
              className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-md shadow-blue-500/20 active:scale-98 disabled:opacity-50"
            >
              {loading ? '방 만드는 중...' : '방 만들기 & 링크 공유'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
