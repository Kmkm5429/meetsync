import React, { useState } from 'react';
import { User, LogIn, Calendar, Sparkles } from 'lucide-react';

interface JoinNicknameModalProps {
  isOpen: boolean;
  roomTitle?: string;
  onJoin: (nickname: string) => Promise<void>;
}

export const JoinNicknameModal: React.FC<JoinNicknameModalProps> = ({
  isOpen,
  roomTitle,
  onJoin,
}) => {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('닉네임을 입력해 주세요.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onJoin(nickname.trim());
    } catch (err: any) {
      setError(err.message || '방 참가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div
        id="join-nickname-modal"
        className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 text-neutral-900 dark:text-neutral-100"
      >
        <div className="text-center space-y-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">MeetSync 방 참가하기</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {roomTitle ? `"${roomTitle}" 방에 초대되었습니다` : '참가할 닉네임을 입력해 주세요'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-xs text-red-500 text-center font-medium">{error}</p>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
              내 닉네임
            </label>
            <input
              type="text"
              id="join-nickname-input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="예: 김철수, 이영희"
              autoFocus
              className="w-full px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-transparent focus:border-blue-500 focus:outline-none text-sm font-medium transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            id="join-nickname-submit-btn"
            className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-md shadow-blue-500/20 active:scale-98 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? '참가 중...' : '방 참가하기'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
