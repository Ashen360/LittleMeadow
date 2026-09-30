// The in-game calendar and clock. Time advances in 10-minute steps, so the HUD only needs a
// redraw every 10 real seconds. The clock stops at 2:00 AM; it never forces the player to sleep.

import { TIME } from '../data/tuning.js';

export const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function formatTime(minutes) {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m < 10 ? '0' : ''}${m} ${h24 < 12 ? 'am' : 'pm'}`;
}

// "9:30" → 570. Times after midnight can be written as "25:00".
export function parseTime(text) {
  const [h, m] = text.split(':');
  return Number(h) * 60 + Number(m);
}

export class Clock {
  constructor() {
    this.day = 1;               // absolute day number, 1-based
    this.minutes = TIME.dayStart;
    this.acc = 0;
    this.timeLabel = '';
    this.dateLabel = '';
    this.refreshLabels();
  }

  get season() {
    return Math.floor((this.day - 1) / TIME.daysPerSeason) % SEASONS.length;
  }

  get dayOfSeason() {
    return ((this.day - 1) % TIME.daysPerSeason) + 1;
  }

  get weekday() {
    return (this.day - 1) % WEEKDAYS.length;
  }

  get stopped() {
    return this.minutes >= TIME.dayEnd;
  }

  // Returns 'step' when the time moved, 'stopped' on the step that reached 2:00, else null.
  update(dt) {
    if (this.stopped) return null;
    this.acc += dt;
    if (this.acc < TIME.secondsPerStep) return null;
    this.acc -= TIME.secondsPerStep;
    this.minutes = Math.min(TIME.dayEnd, this.minutes + TIME.minutesPerStep);
    this.refreshLabels();
    return this.stopped ? 'stopped' : 'step';
  }

  set(day, minutes) {
    this.day = day;
    this.minutes = minutes;
    this.acc = 0;
    this.refreshLabels();
  }

  newDay() {
    this.set(this.day + 1, TIME.dayStart);
  }

  refreshLabels() {
    this.timeLabel = formatTime(this.minutes);
    this.dateLabel = `${WEEKDAYS[this.weekday]}, ${SEASONS[this.season]} ${this.dayOfSeason}`;
  }

  // 0 by day, rising to 1 at night (drives the evening tint).
  get darkness() {
    const m = this.minutes;
    if (m <= TIME.eveningStart) return 0;
    if (m >= TIME.nightStart) return 1;
    return (m - TIME.eveningStart) / (TIME.nightStart - TIME.eveningStart);
  }
}
