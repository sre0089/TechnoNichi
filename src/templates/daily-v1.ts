// Logical millimetres, estimated from the private reference; never CSS millimetres.
export const dailyTemplate = {
  id: 'daily-a5',
  version: 1,
  width: 148,
  height: 210,
  grid: { x: 10, y: 27.4, pitch: 3.7, width: 132, height: 159.1 },
  header: { x: 10, y: 8, width: 48, height: 14.8 },
  checklist: { x: 63, y: 8, pitch: 3.7, count: 5 },
  timelineX: 14,
  scheduleX: 24,
  dividerX: 18.3,
  timeline: [
    { label: '6', minute: 360, dayOffset: 0, y: 33.3 },
    { label: '9', minute: 540, dayOffset: 0, y: 44.4 },
    { label: '12', minute: 720, dayOffset: 0, y: 55.5 },
    { label: '15', minute: 900, dayOffset: 0, y: 66.6 },
    { label: '18', minute: 1080, dayOffset: 0, y: 77.7 },
    { label: '21', minute: 1260, dayOffset: 0, y: 88.8 },
    { label: '0', minute: 0, dayOffset: 1, y: 99.9 },
    { label: '3', minute: 180, dayOffset: 1, y: 111 },
  ],
  typography: { inkFont: 'Kalam', inkSize: 3.4, lineHeight: 3.7 },
  footer: { y: 190, height: 14 },
  tokens: {
    paper: '#f7f2e7',
    ink: '#514560',
    accent: '#897293',
    grid: 'rgba(99, 82, 71, 0.105)',
  },
} as const;

export const spreadTemplate = {
  miniatureCalendar: {
    owner: 'right-page',
    x: 112,
    y: 190,
    width: 27,
    height: 16,
  },
  monthMarker: { y: 139, width: 7.8, height: 10.8 },
} as const;

export function timeToY(minute: number, dayOffset: number): number {
  const absolute = minute + dayOffset * 1440;
  const anchors = dailyTemplate.timeline;
  const first = anchors[0];
  const last = anchors[anchors.length - 1];
  if (absolute < first.minute || absolute > last.minute + 1440)
    throw new Error('Time outside this daily timetable');
  for (let i = 1; i < anchors.length; i += 1) {
    const left = anchors[i - 1];
    const right = anchors[i];
    const leftMinute = left.minute + left.dayOffset * 1440;
    const rightMinute = right.minute + right.dayOffset * 1440;
    if (absolute <= rightMinute) {
      return (
        left.y +
        ((absolute - leftMinute) / (rightMinute - leftMinute)) *
          (right.y - left.y)
      );
    }
  }
  return last.y;
}

export function yToTime(y: number): { minute: number; dayOffset: number } {
  const first = dailyTemplate.timeline[0];
  const absolute = Math.max(
    360,
    Math.min(1620, Math.round((360 + ((y - first.y) / 3.7) * 60) / 15) * 15),
  );
  return { minute: absolute % 1440, dayOffset: Math.floor(absolute / 1440) };
}

export function screenToDocument(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): { x: number; y: number } {
  return {
    x: ((clientX - rect.left) / rect.width) * 148,
    y: ((clientY - rect.top) / rect.height) * 210,
  };
}

export function snapNote(x: number, y: number): { x: number; y: number } {
  const { grid } = dailyTemplate;
  return {
    x: Math.max(
      24.8,
      Math.min(
        76.6,
        grid.x + Math.round((x - grid.x) / grid.pitch) * grid.pitch,
      ),
    ),
    y: Math.max(
      grid.y,
      Math.min(
        171.7,
        grid.y + Math.round((y - grid.y) / grid.pitch) * grid.pitch,
      ),
    ),
  };
}

export function timeLabel(minute: number, dayOffset: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}${dayOffset ? ' +1' : ''}`;
}
