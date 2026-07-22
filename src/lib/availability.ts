import { format, parseISO, addDays, isAfter, isBefore, isEqual, parse } from 'date-fns';
import { Room, Participant, SlotAnalysis, BestTimeRecommendation, WorkShift } from '../types';

/**
 * Generate list of dates between startDate and endDate in YYYY-MM-DD
 */
export function generateDateRange(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  let current = parseISO(startDateStr);
  const end = parseISO(endDateStr);

  while (!isAfter(current, end)) {
    dates.push(format(current, 'yyyy-MM-dd'));
    current = addDays(current, 1);
  }
  return dates;
}

/**
 * Helper to check if a specific time string (HH:mm) falls within a work shift (startTime - endTime)
 */
export function isTimeInShift(timeStr: string, shift: WorkShift): boolean {
  const [h, m] = timeStr.split(':').map(Number);
  const timeVal = h * 60 + m;

  const [sh, sm] = shift.startTime.split(':').map(Number);
  const shiftStartVal = sh * 60 + sm;

  const [eh, em] = shift.endTime.split(':').map(Number);
  const shiftEndVal = eh * 60 + em;

  return timeVal >= shiftStartVal && timeVal < shiftEndVal;
}

/**
 * Generate 30-minute time slots array for a given day (e.g. ["09:00", "09:30", "10:00", ...])
 */
export function generateTimeSlotsForHours(startHour: number, endHour: number): string[] {
  const slots: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    const hh = h.toString().padStart(2, '0');
    slots.push(`${hh}:00`);
    slots.push(`${hh}:30`);
  }
  return slots;
}

/**
 * Analyzes all date & time slots across all participants in a room.
 */
export function analyzeAllSlots(room: Room, participants: Participant[]): SlotAnalysis[] {
  const dates = generateDateRange(room.startDate, room.endDate);
  const times = generateTimeSlotsForHours(room.startHour, room.endHour);
  const analyses: SlotAnalysis[] = [];

  const total = participants.length;

  for (const date of dates) {
    for (const time of times) {
      const slotKey = `${date}T${time}`;

      const availableNicknames: string[] = [];
      const workingParticipants: { nickname: string; shiftTitle: string }[] = [];
      const unavailableNicknames: string[] = [];

      for (const p of participants) {
        // Check if participant has a part-time work shift at this time
        const shiftOnDate = p.workShifts?.find(
          (s) => s.date === date && isTimeInShift(time, s)
        );

        if (shiftOnDate) {
          workingParticipants.push({
            nickname: p.nickname,
            shiftTitle: shiftOnDate.title || '알바',
          });
        } else if (p.availableSlots?.includes(slotKey)) {
          availableNicknames.push(p.nickname);
        } else {
          unavailableNicknames.push(p.nickname);
        }
      }

      analyses.push({
        date,
        time,
        slotKey,
        availableCount: availableNicknames.length,
        workingCount: workingParticipants.length,
        unavailableCount: unavailableNicknames.length,
        totalParticipants: total,
        availableParticipants: availableNicknames,
        workingParticipants,
        unavailableParticipants: unavailableNicknames,
      });
    }
  }

  return analyses;
}

/**
 * Calculate top recommended contiguous meeting time windows
 */
export function calculateBestTimes(
  room: Room,
  participants: Participant[]
): BestTimeRecommendation[] {
  if (participants.length === 0) return [];

  const slotAnalyses = analyzeAllSlots(room, participants);
  const durationMins = room.meetingDurationMinutes || 60;
  const requiredSlotsCount = Math.ceil(durationMins / 30);

  const dates = generateDateRange(room.startDate, room.endDate);
  const recommendations: BestTimeRecommendation[] = [];

  for (const date of dates) {
    const daySlots = slotAnalyses.filter((s) => s.date === date);

    for (let i = 0; i <= daySlots.length - requiredSlotsCount; i++) {
      const windowSlots = daySlots.slice(i, i + requiredSlotsCount);
      const startTime = windowSlots[0].time;
      const lastSlot = windowSlots[windowSlots.length - 1];

      // End time calculation (+30 mins from last slot start time)
      const [lh, lm] = lastSlot.time.split(':').map(Number);
      const endMins = lh * 60 + lm + 30;
      const endH = Math.floor(endMins / 60)
        .toString()
        .padStart(2, '0');
      const endM = (endMins % 60).toString().padStart(2, '0');
      const endTime = `${endH}:${endM}`;

      // Calculate intersection of available nicknames across all slots in this window
      let commonAvailable = windowSlots[0].availableParticipants;
      for (let k = 1; k < windowSlots.length; k++) {
        commonAvailable = commonAvailable.filter((nick) =>
          windowSlots[k].availableParticipants.includes(nick)
        );
      }

      // Collect participants who have part-time work in this window
      const workingSet = new Set<string>();
      windowSlots.forEach((s) => {
        s.workingParticipants.forEach((w) => workingSet.add(w.nickname));
      });
      const workingNicknames = Array.from(workingSet);

      // Collect participants who marked as unavailable
      const unavailableSet = new Set<string>();
      windowSlots.forEach((s) => {
        s.unavailableParticipants.forEach((u) => {
          if (!workingSet.has(u)) {
            unavailableSet.add(u);
          }
        });
      });
      const unavailableNicknames = Array.from(unavailableSet);

      const totalCount = participants.length;
      const availableCount = commonAvailable.length;
      const matchPercentage = totalCount > 0 ? Math.round((availableCount / totalCount) * 100) : 0;

      // Score formula: high weight for available, penalty for work conflict
      const score = availableCount * 10 - workingNicknames.length * 5;

      recommendations.push({
        date,
        startTime,
        endTime,
        availableCount,
        totalCount,
        matchPercentage,
        availableNicknames: commonAvailable,
        workingNicknames,
        unavailableNicknames,
        score,
      });
    }
  }

  // Sort recommendations by highest match percentage and highest score
  return recommendations
    .sort((a, b) => b.matchPercentage - a.matchPercentage || b.score - a.score)
    .slice(0, 8); // Top 8 best windows
}
