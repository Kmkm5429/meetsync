import React, { useEffect, useState } from 'react';
import {
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  getDoc,
} from 'firebase/firestore';
import { db, ensureAnonymousAuth } from './lib/firebase';
import { Room, Participant, WorkShift } from './types';
import { Header } from './components/Header';
import { CreateRoomModal } from './components/CreateRoomModal';
import { JoinNicknameModal } from './components/JoinNicknameModal';
import { TimeSlotGrid } from './components/TimeSlotGrid';
import { PartTimeShiftInput } from './components/PartTimeShiftInput';
import { BestTimesList } from './components/BestTimesList';
import { ParticipantsTab } from './components/ParticipantsTab';
import { CalendarHeatmap } from './components/CalendarHeatmap';
import {
  Calendar,
  Sparkles,
  Users,
  Briefcase,
  Clock,
  Share2,
  Copy,
  Check,
  ArrowRight,
  Plus,
  LogIn,
  AlertCircle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

type TabType = 'best' | 'availability' | 'shifts' | 'participants' | 'calendar';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem('meetsync_theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  });

  const [authUid, setAuthUid] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>('best');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState<boolean>(false);
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [roomError, setRoomError] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Apply dark mode class to <html> element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('meetsync_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('meetsync_theme', 'light');
    }
  }, [darkMode]);

  // Helper to extract room ID from URL (/room/{roomId} or ?room={roomId})
  const getRoomIdFromURL = (): string | null => {
    const pathname = window.location.pathname;
    const match = pathname.match(/\/room\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
    const params = new URLSearchParams(window.location.search);
    const rId = params.get('room');
    if (rId) {
      return rId.trim().toUpperCase();
    }
    return null;
  };

  // Initial Auth & Room URL parsing
  useEffect(() => {
    async function init() {
      try {
        const user = await ensureAnonymousAuth();
        setAuthUid(user.uid);

        const rId = getRoomIdFromURL();
        if (rId) {
          setRoomId(rId);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      }
    }
    init();

    const handlePopState = () => {
      const rId = getRoomIdFromURL();
      setRoomId(rId);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Subscribe to Room and Participants in Real-time from Firestore
  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setParticipants([]);
      setCurrentParticipant(null);
      return;
    }

    // 1. Listen to Room Doc
    const roomRef = doc(db, 'rooms', roomId);
    const unsubRoom = onSnapshot(
      roomRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setRoom({ id: snapshot.id, ...snapshot.data() } as Room);
          setRoomError('');
        } else {
          setRoomError('방을 찾을 수 없습니다. 방 코드를 확인해 주세요.');
          setRoom(null);
        }
      },
      (error) => {
        console.error('Room snapshot error:', error);
        setRoomError('방 데이터를 불러오는데 실패했습니다.');
      }
    );

    // 2. Listen to Participants Subcollection
    const participantsRef = collection(db, 'rooms', roomId, 'participants');
    const unsubParticipants = onSnapshot(
      participantsRef,
      (snapshot) => {
        const list: Participant[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Participant);
        });
        setParticipants(list);
      },
      (error) => {
        console.error('Participants snapshot error:', error);
      }
    );

    return () => {
      unsubRoom();
      unsubParticipants();
    };
  }, [roomId]);

  // Handle Participant identity mapping
  useEffect(() => {
    if (!authUid || !roomId || participants.length === 0) return;

    // Check if current user is already in participants
    const localPartId = localStorage.getItem(`meetsync_part_id_${roomId}`);
    let found = participants.find((p) => p.id === localPartId || p.uid === authUid);

    if (found) {
      setCurrentParticipant(found);
      setIsJoinModalOpen(false);
    } else if (room) {
      // Need user to enter nickname
      setIsJoinModalOpen(true);
    }
  }, [authUid, roomId, participants, room]);

  // Create Room Action
  const handleCreateRoom = async (data: {
    title: string;
    hostNickname: string;
    startDate: string;
    endDate: string;
    startHour: number;
    endHour: number;
    meetingDurationMinutes: number;
    description?: string;
  }) => {
    try {
      const user = await ensureAnonymousAuth();
      const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();

      const roomData: Room = {
        id: newRoomId,
        title: data.title,
        description: data.description || '',
        createdByUid: user.uid,
        hostNickname: data.hostNickname,
        createdAt: Date.now(),
        startDate: data.startDate,
        endDate: data.endDate,
        startHour: data.startHour,
        endHour: data.endHour,
        meetingDurationMinutes: data.meetingDurationMinutes,
      };

      // 1. Create room doc in Firestore
      await setDoc(doc(db, 'rooms', newRoomId), roomData);

      // 2. Create host participant doc in subcollection
      const participantId = `part_${user.uid.slice(0, 6)}`;
      const hostParticipant: Participant = {
        id: participantId,
        uid: user.uid,
        nickname: data.hostNickname,
        isHost: true,
        availableSlots: [],
        workShifts: [],
        updatedAt: Date.now(),
      };

      await setDoc(
        doc(db, 'rooms', newRoomId, 'participants', participantId),
        hostParticipant
      );

      localStorage.setItem(`meetsync_part_id_${newRoomId}`, participantId);

      // 3. Redirect to /room/{roomId}
      window.history.pushState({}, '', `/room/${newRoomId}`);
      setRoomId(newRoomId);
      setIsCreateModalOpen(false);
    } catch (err: any) {
      console.error('Error creating room in Firestore:', err);
      throw new Error(err.message || '방 생성 중 오류가 발생했습니다.');
    }
  };

  // Join Room Action (Nickname Entry)
  const handleJoinRoom = async (nickname: string) => {
    if (!roomId) return;
    try {
      const user = await ensureAnonymousAuth();

      const participantId = `part_${user.uid.slice(0, 6)}`;
      const newParticipant: Participant = {
        id: participantId,
        uid: user.uid,
        nickname,
        isHost: false,
        availableSlots: [],
        workShifts: [],
        updatedAt: Date.now(),
      };

      await setDoc(
        doc(db, 'rooms', roomId, 'participants', participantId),
        newParticipant
      );

      localStorage.setItem(`meetsync_part_id_${roomId}`, participantId);
      setCurrentParticipant(newParticipant);
      setIsJoinModalOpen(false);
    } catch (err: any) {
      console.error('Error joining room:', err);
      alert('방참가에 실패했습니다: ' + (err.message || '다시 시도해 주세요.'));
    }
  };

  // Join Room via Room Code input on landing page
  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const code = roomCodeInput.trim().toUpperCase();
    if (!code) return;

    window.history.pushState({}, '', `/room/${code}`);
    setRoomId(code);
  };

  const handleGoHome = () => {
    window.history.pushState({}, '', '/');
    setRoomId(null);
    setRoom(null);
    setRoomError('');
  };

  // Update Available Slots in Firestore
  const handleUpdateAvailableSlots = async (slots: string[]) => {
    if (!roomId || !currentParticipant) return;
    const ref = doc(db, 'rooms', roomId, 'participants', currentParticipant.id);
    await updateDoc(ref, {
      availableSlots: slots,
      updatedAt: Date.now(),
    });
  };

  // Update Work Shifts in Firestore
  const handleUpdateWorkShifts = async (shifts: WorkShift[]) => {
    if (!roomId || !currentParticipant) return;
    const ref = doc(db, 'rooms', roomId, 'participants', currentParticipant.id);
    await updateDoc(ref, {
      workShifts: shifts,
      updatedAt: Date.now(),
    });
  };

  // Finalize Meeting Slot (Host Action)
  const handleFinalizeSlot = async (
    date: string,
    startTime: string,
    endTime: string
  ) => {
    if (!roomId) return;
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      finalizedSlot: { date, startTime, endTime },
    });
  };

  const handleCopyLink = () => {
    if (!roomId) return;
    const url = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100 font-sans transition-colors duration-200 pb-12 selection:bg-blue-500 selection:text-white">
      {/* Top Apple Header */}
      <Header
        room={room}
        participantCount={participants.length}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onGoHome={handleGoHome}
      />

      {/* Main Content Area */}
      <main className="max-w-xl md:max-w-2xl mx-auto px-4 pt-4">
        {/* LANDING PAGE (When no room is loaded) */}
        {!room && (
          <div className="py-6 space-y-6 animate-fade-in">
            {/* Hero Card */}
            <div className="bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/20 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto shadow-inner">
                <Calendar className="w-7 h-7 text-white" />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  MeetSync
                </h1>
                <p className="text-xs sm:text-sm text-blue-100 mt-2 max-w-md mx-auto">
                  친구들과 모임 날짜와 최적의 시간을 쉽게 정해 보세요. 알바/근무 시간 자동 제외 및 실시간 동기화를 지원합니다.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  id="landing-create-room-btn"
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white text-blue-700 font-bold text-sm hover:bg-blue-50 transition-all shadow-md active:scale-98 flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>방 만들기</span>
                </button>
              </div>
            </div>

            {/* Join Room by Code input */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 border border-neutral-200/80 dark:border-neutral-800/80 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center space-x-2">
                <LogIn className="w-4 h-4 text-blue-500" />
                <span>방 코드로 기존 방 참가하기</span>
              </h3>

              {roomError && (
                <p className="text-xs text-red-500 flex items-center space-x-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{roomError}</span>
                </p>
              )}

              <form onSubmit={handleJoinByCode} className="flex space-x-2">
                <input
                  type="text"
                  id="landing-room-code-input"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value)}
                  placeholder="예: AB12CD"
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-transparent focus:border-blue-500 focus:outline-none text-sm font-semibold uppercase tracking-wider"
                />
                <button
                  type="submit"
                  id="landing-join-code-btn"
                  className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  참가
                </button>
              </form>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold">회원가입 없음</h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  초대 링크나 방 코드로 닉네임만 입력하면 바로 참가할 수 있습니다.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold">알바 시간 자동 필터링</h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  알바/근무 시간을 등록하면 모임 추천 시간에서 자동으로 제외됩니다.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold">최적의 추천 시간</h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  참가자들의 가능 시간을 분석하여 최적의 모임 시간을 자동으로 계산해 줍니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ROOM ACTIVE VIEW */}
        {room && (
          <div className="space-y-4 animate-fade-in">
            {/* Room Info Banner */}
            <div className="bg-white dark:bg-neutral-900/90 rounded-3xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800/80 shadow-sm flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                    {room.title}
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                    {room.id}
                  </span>
                </div>

                <div className="text-xs text-neutral-500 dark:text-neutral-400 flex flex-wrap items-center gap-2 mt-1">
                  <span>
                    {format(parseISO(room.startDate), 'yyyy년 M월 d일', { locale: ko })} –{' '}
                    {format(parseISO(room.endDate), 'yyyy년 M월 d일', { locale: ko })}
                  </span>
                  <span>•</span>
                  <span>
                    {room.startHour.toString().padStart(2, '0')}:00 -{' '}
                    {room.endHour.toString().padStart(2, '0')}:00
                  </span>
                  <span>•</span>
                  <span>{room.meetingDurationMinutes}분 모임</span>
                </div>

                {room.description && (
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1.5 italic">
                    "{room.description}"
                  </p>
                )}
              </div>

              {/* Share invite link button */}
              <button
                onClick={handleCopyLink}
                id="room-info-copy-link-btn"
                className="p-2.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-all shrink-0 active:scale-95"
                title="초대 링크 복사"
              >
                {copiedLink ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Apple Segmented Control Navigation Tabs */}
            <div className="bg-neutral-200/80 dark:bg-neutral-800/80 p-1 rounded-2xl flex items-center space-x-1 text-xs font-semibold overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab('best')}
                id="tab-btn-best"
                className={`flex-1 min-w-[90px] py-2 rounded-xl transition-all duration-150 flex items-center justify-center space-x-1.5 ${
                  activeTab === 'best'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>추천 시간</span>
              </button>

              <button
                onClick={() => setActiveTab('availability')}
                id="tab-btn-availability"
                className={`flex-1 min-w-[90px] py-2 rounded-xl transition-all duration-150 flex items-center justify-center space-x-1.5 ${
                  activeTab === 'availability'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>내 가능 시간</span>
              </button>

              <button
                onClick={() => setActiveTab('shifts')}
                id="tab-btn-shifts"
                className={`flex-1 min-w-[90px] py-2 rounded-xl transition-all duration-150 flex items-center justify-center space-x-1.5 ${
                  activeTab === 'shifts'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                <span>알바 시간</span>
              </button>

              <button
                onClick={() => setActiveTab('participants')}
                id="tab-btn-participants"
                className={`flex-1 min-w-[90px] py-2 rounded-xl transition-all duration-150 flex items-center justify-center space-x-1.5 ${
                  activeTab === 'participants'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-emerald-500" />
                <span>참가자 ({participants.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('calendar')}
                id="tab-btn-calendar"
                className={`flex-1 min-w-[80px] py-2 rounded-xl transition-all duration-150 flex items-center justify-center space-x-1.5 ${
                  activeTab === 'calendar'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-purple-500" />
                <span>달력</span>
              </button>
            </div>

            {/* TAB CONTENTS */}
            {activeTab === 'best' && (
              <BestTimesList
                room={room}
                participants={participants}
                currentParticipant={currentParticipant}
                onFinalizeSlot={handleFinalizeSlot}
              />
            )}

            {activeTab === 'availability' && (
              <TimeSlotGrid
                room={room}
                currentParticipant={currentParticipant}
                onUpdateAvailableSlots={handleUpdateAvailableSlots}
              />
            )}

            {activeTab === 'shifts' && (
              <PartTimeShiftInput
                room={room}
                currentParticipant={currentParticipant}
                onUpdateWorkShifts={handleUpdateWorkShifts}
              />
            )}

            {activeTab === 'participants' && (
              <ParticipantsTab
                room={room}
                participants={participants}
                currentParticipant={currentParticipant}
              />
            )}

            {activeTab === 'calendar' && (
              <CalendarHeatmap
                room={room}
                participants={participants}
                onSelectDate={() => setActiveTab('availability')}
              />
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateRoom={handleCreateRoom}
      />

      <JoinNicknameModal
        isOpen={isJoinModalOpen}
        roomTitle={room?.title}
        onJoin={handleJoinRoom}
      />
    </div>
  );
}
