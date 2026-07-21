import { Platform } from 'react-native';

import type { PawEvent } from '@/types';

/**
 * Add-to-calendar with a reminder, cross-platform.
 *
 * We generate a standard iCalendar (.ics) event with a VALARM. On iOS Safari
 * (our web launch target) opening an .ics pops the native "Add Event" sheet,
 * where the reminder is honoured by the system calendar — so a user who joins
 * a meetup gets a real reminder on their phone. On Android/desktop the same
 * file opens the default calendar app.
 *
 * Native builds (later) can swap this for expo-calendar to write directly to
 * the device calendar without the file step; the ICS path already works today.
 */

export type CalendarEvent = {
  title: string;
  description?: string;
  location?: string;
  /** Event start. */
  start: Date;
  /** Event end; defaults to start + 90 min. */
  end?: Date;
  /** Minutes before start to fire the reminder (default 60). */
  reminderMinutes?: number;
  /** Stable id so re-adding updates rather than duplicates. */
  uid?: string;
};

/** iCalendar UTC stamp: 20260712T093000Z */
function toICSDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeICS(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function buildICS(ev: CalendarEvent): string {
  const end = ev.end ?? new Date(ev.start.getTime() + 90 * 60 * 1000);
  const uid = ev.uid ?? `${toICSDate(ev.start)}-${Math.round(ev.start.getTime())}@pawpair.app`;
  const reminder = ev.reminderMinutes ?? 60;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PawPair//Meetups//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toICSDate(ev.start)}`,
    `DTSTART:${toICSDate(ev.start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${escapeICS(ev.title)}`,
    ev.location ? `LOCATION:${escapeICS(ev.location)}` : '',
    ev.description ? `DESCRIPTION:${escapeICS(ev.description)}` : '',
    'BEGIN:VALARM',
    `TRIGGER:-PT${reminder}M`,
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICS(ev.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return lines.join('\r\n');
}

/**
 * Offer the event to the user's calendar. Returns true if we could open the
 * add-to-calendar flow. Web-first implementation (works on iOS Safari today).
 */
export async function addToCalendar(ev: CalendarEvent): Promise<boolean> {
  const ics = buildICS(ev);
  if (Platform.OS === 'web') {
    try {
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ev.title.replace(/[^\w぀-ヿ一-龯-]+/g, '-').slice(0, 40) || 'pawpair-event'}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      return true;
    } catch {
      return false;
    }
  }
  // Native: expo-calendar isn't bundled yet on web; fall back to a data URL the
  // OS can open. (Swap for expo-calendar in the native build.)
  try {
    const Linking = require('react-native').Linking;
    await Linking.openURL(`data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Add a PawPair meetup to the user's calendar with a 1-hour reminder.
 * No-op if the event has no real start time (older records). Returns whether
 * the add-to-calendar flow could be opened.
 */
export async function remindForEvent(
  event: PawEvent,
  tx: (ja: string, en: string) => string,
): Promise<boolean> {
  if (!event.startsAt) return false;
  return addToCalendar({
    title: `🐾 ${event.title}`,
    description: tx(
      `PawPairのミートアップ・${event.locationName}（${event.area}）`,
      `PawPair meetup · ${event.locationName} (${event.area})`,
    ),
    location: `${event.locationName}, ${event.area}`,
    start: new Date(event.startsAt),
    reminderMinutes: 60,
    uid: `${event.id}@pawpair.app`,
  });
}
