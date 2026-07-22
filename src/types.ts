export interface WorkShift {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h)
  endTime: string; // HH:mm (24h)
  title: string; // e.g. "Barista Shift", "Part-time Job"
}

export interface Participant {
  id: string; // participant doc id or auth uid
  uid: string;
  nickname: string;
  isHost?: boolean;
  availableSlots: string[]; // ISO string prefix or "YYYY-MM-DDTHH:mm"
  workShifts: WorkShift[];
  updatedAt: number;
}

export interface VoteOption {
  id: string;
  label: string;
  votedNicknames: string[];
}

export interface Room {
  id: string;
  title: string;
  description?: string;
  createdByUid: string;
  hostNickname: string;
  createdAt: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startHour: number; // e.g. 9 for 09:00
  endHour: number; // e.g. 22 for 22:00
  meetingDurationMinutes: number; // e.g. 60, 120
  finalizedSlot?: {
    date: string;
    startTime: string;
    endTime: string;
  } | null;
  budget?: string; // 예산 (e.g. "1~2만원")
  notes?: string; // 메모
  foodVotes?: VoteOption[]; // 음식 투표
  locationVotes?: VoteOption[]; // 장소 투표
}

export interface SlotAnalysis {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  slotKey: string; // YYYY-MM-DDTHH:mm
  availableCount: number;
  workingCount: number;
  unavailableCount: number;
  totalParticipants: number;
  availableParticipants: string[]; // nicknames
  workingParticipants: { nickname: string; shiftTitle: string }[];
  unavailableParticipants: string[]; // nicknames
}

export interface BestTimeRecommendation {
  date: string;
  startTime: string;
  endTime: string;
  availableCount: number;
  totalCount: number;
  matchPercentage: number;
  availableNicknames: string[];
  workingNicknames: string[];
  unavailableNicknames: string[];
  score: number;
}
