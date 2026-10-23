import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { Icon, IconName } from '@/components/icons';
import { Button } from '@/components/ui';
import { WHEEL_ROW, Wheel } from '@/components/Wheel';
import {
  addMonths,
  dayKey,
  formatDay,
  formatMonth,
  formatTime,
  LocalParts,
  monthGrid,
  nextWeekday,
  pad2,
  parseLocal,
  partsOf,
  snapMinutes,
  toDate,
  toLocal,
  weekdayHeaders,
} from '@/lib/dates';
import { useI18n } from '@/lib/i18n';
import { font, night, radius, shadow, spacing } from '@/theme';

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const MONTHS_AHEAD = 12;

// Japanese calendars mark Sunday red and Saturday blue; both pass 4.5:1 on white.
const SUN = '#C0392B';
const SAT = '#2F6FA3';

/**
 * Bottom sheet for picking an event's date and time. Two steps behind two
 * tabs: a month calendar (past days greyed out), then a time drum (hours and
 * 5-minute steps). Tapping a day moves straight on to the time. Nothing is
 * saved until 決定 / Done; the value shape is "YYYY-MM-DDTHH:MM".
 *
 * Mount it only while open (`{open && <DateTimeSheet … />}`): every opening
 * then starts from the saved value, on the date step.
 */
export function DateTimeSheet({
  value,
  min,
  onDone,
  onClose,
}: {
  value: string;
  min?: string;
  onDone: (value: string) => void;
  onClose: () => void;
}) {
  const { lang, tx } = useI18n();
  const [draft, setDraft] = useState<LocalParts>(() => initialDraft(value));
  const [view, setView] = useState(() => ({ y: draft.y, m: draft.m }));
  const [step, setStep] = useState<'date' | 'time'>('date');

  // Slide the sheet up (the backdrop just fades, like ActionSheet).
  const reduceMotion = useReducedMotion();
  const rise = useSharedValue(reduceMotion ? 0 : 1);
  useEffect(() => {
    rise.set(withTiming(0, { duration: reduceMotion ? 0 : 280, easing: Easing.out(Easing.cubic) }));
  }, [reduceMotion, rise]);
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: rise.get() * 60 }], opacity: 1 - rise.get() }));

  const minParts = (min && parseLocal(min)) || null;
  const minDay = minParts ? dayKey(minParts.y, minParts.m, minParts.d) : -Infinity;
  const isPast = !!minParts && toDate(draft) < toDate(minParts);
  const firstView = minParts ? { y: minParts.y, m: minParts.m } : null;
  const lastView = addMonths(firstView?.y ?? draft.y, firstView?.m ?? draft.m, MONTHS_AHEAD);
  const canPrev = !firstView || view.y * 12 + view.m > firstView.y * 12 + firstView.m;
  const canNext = view.y * 12 + view.m < lastView.y * 12 + lastView.m;

  const pickDay = (y: number, m: number, d: number, advance: boolean) => {
    setDraft((p) => ({ ...p, y, m, d }));
    setView({ y, m });
    if (advance) setStep('time');
  };

  const today = new Date();
  const quickDays: { key: string; label: string; date: Date }[] = [
    { key: 'today', label: tx('今日', 'Today'), date: today },
    { key: 'tomorrow', label: tx('明日', 'Tomorrow'), date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1) },
    { key: 'sat', label: tx('土曜日', 'Saturday'), date: nextWeekday(today, 6) },
    { key: 'sun', label: tx('日曜日', 'Sunday'), date: nextWeekday(today, 0) },
  ];
  const quickTimes = [
    { key: 'morning', label: tx('朝 9:00', '9 AM'), hh: 9 },
    { key: 'noon', label: tx('昼 12:00', 'Noon'), hh: 12 },
    { key: 'evening', label: tx('夕方 17:00', '5 PM'), hh: 17 },
  ];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={tx('閉じる', 'Close')}>
        <Animated.View style={[styles.sheetWrap, sheetStyle]}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()} accessibilityViewIsModal>
            <View style={styles.grabber} />
            <View style={styles.titleRow}>
              <Text style={styles.title} accessibilityRole="header">
                {tx('日時を選ぶ', 'Pick a date & time')}
              </Text>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={tx('閉じる', 'Close')}
                hitSlop={8}
                style={styles.close}
              >
                <Icon name="x" color={night.muted} size={18} />
              </Pressable>
            </View>

            {/* The two halves of the answer double as the step tabs. */}
            <View style={styles.tabs} accessibilityRole="tablist">
              <StepTab
                icon="calendar"
                label={formatDay(lang, draft.y, draft.m, draft.d)}
                hint={tx('日付', 'Date')}
                active={step === 'date'}
                onPress={() => setStep('date')}
                grow={1.45}
              />
              <StepTab
                icon="clock"
                label={formatTime(lang, draft.hh, draft.mm)}
                hint={tx('時間', 'Time')}
                active={step === 'time'}
                onPress={() => setStep('time')}
              />
            </View>

            {step === 'date' ? (
              <View style={styles.panel}>
                <View style={styles.quickRow}>
                  {quickDays.map((q) => {
                    const p = partsOf(q.date);
                    const on = p.y === draft.y && p.m === draft.m && p.d === draft.d;
                    return (
                      <QuickChip key={q.key} label={q.label} selected={on} onPress={() => pickDay(p.y, p.m, p.d, true)} />
                    );
                  })}
                </View>

                <View style={styles.monthRow}>
                  <MonthArrow
                    icon="chevronLeft"
                    label={tx('前の月', 'Previous month')}
                    disabled={!canPrev}
                    onPress={() => setView((v) => addMonths(v.y, v.m, -1))}
                  />
                  <Text style={styles.month} accessibilityLiveRegion="polite">
                    {formatMonth(lang, view.y, view.m)}
                  </Text>
                  <MonthArrow
                    icon="chevronRight"
                    label={tx('次の月', 'Next month')}
                    disabled={!canNext}
                    onPress={() => setView((v) => addMonths(v.y, v.m, 1))}
                  />
                </View>

                <View style={styles.grid}>
                  {weekdayHeaders(lang).map((w, i) => (
                    <Text
                      key={w + i}
                      style={[styles.dow, i === 0 && { color: SUN }, i === 6 && { color: SAT }]}
                      importantForAccessibility="no"
                    >
                      {w}
                    </Text>
                  ))}
                  {monthGrid(view.y, view.m).map((d, i) => {
                    if (d == null) return <View key={`blank-${i}`} style={styles.cell} />;
                    const key = dayKey(view.y, view.m, d);
                    const disabled = key < minDay;
                    const selected = draft.y === view.y && draft.m === view.m && draft.d === d;
                    const isToday = key === dayKey(today.getFullYear(), today.getMonth(), today.getDate());
                    const col = i % 7;
                    return (
                      <View key={key} style={styles.cell}>
                        <Pressable
                          onPress={() => pickDay(view.y, view.m, d, true)}
                          disabled={disabled}
                          accessibilityRole="button"
                          accessibilityLabel={formatDay(lang, view.y, view.m, d)}
                          accessibilityState={{ selected, disabled }}
                          style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                            styles.day,
                            isToday && styles.dayToday,
                            (hovered || pressed) && !disabled && !selected && styles.dayHover,
                            selected && styles.daySelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              col === 0 && { color: SUN },
                              col === 6 && { color: SAT },
                              disabled && styles.dayTextDisabled,
                              selected && styles.dayTextSelected,
                            ]}
                          >
                            {d}
                          </Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View style={styles.panel}>
                <View style={styles.quickRow}>
                  {quickTimes.map((q) => (
                    <QuickChip
                      key={q.key}
                      label={q.label}
                      selected={draft.hh === q.hh && draft.mm === 0}
                      onPress={() => setDraft((p) => ({ ...p, hh: q.hh, mm: 0 }))}
                    />
                  ))}
                </View>
                <View style={styles.wheels}>
                  <Wheel
                    values={HOURS}
                    index={draft.hh}
                    onChange={(i) => setDraft((p) => ({ ...p, hh: HOURS[i] }))}
                    format={(h) => pad2(h)}
                    label={tx('時', 'Hour')}
                  />
                  <Text style={styles.colon}>:</Text>
                  <Wheel
                    values={MINUTES}
                    index={MINUTES.indexOf(draft.mm)}
                    onChange={(i) => setDraft((p) => ({ ...p, mm: MINUTES[i] }))}
                    format={(m) => pad2(m)}
                    label={tx('分', 'Minute')}
                  />
                </View>
              </View>
            )}

            {isPast && (
              <Text style={styles.error} accessibilityLiveRegion="polite">
                {tx('過ぎた時間は選べません', 'That time has already passed')}
              </Text>
            )}
            <Button
              label={step === 'date' ? tx('次へ：時間を選ぶ', 'Next: pick a time') : tx('この日時に決定', 'Set date & time')}
              disabled={step === 'time' && isPast}
              onPress={() => (step === 'date' ? setStep('time') : onDone(toLocal(draft)))}
            />
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

/** Saved value → its parts (minutes snapped to the drum); empty → tomorrow 10:00. */
function initialDraft(value: string): LocalParts {
  const p = parseLocal(value);
  if (p) return { ...p, mm: snapMinutes(p.mm) };
  const t = new Date();
  return { ...partsOf(new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1)), hh: 10, mm: 0 };
}

function StepTab({
  icon,
  label,
  hint,
  active,
  onPress,
  grow = 1,
}: {
  icon: IconName;
  label: string;
  hint: string;
  active: boolean;
  onPress: () => void;
  /** Share of the row; the date label is about twice as long as the time. */
  grow?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={`${hint}: ${label}`}
      accessibilityState={{ selected: active }}
      style={[styles.tab, { flex: grow }, active && styles.tabActive]}
    >
      <Icon name={icon} color={active ? night.coralDeep : night.muted} size={16} />
      <View style={{ flexShrink: 1 }}>
        <Text style={styles.tabHint}>{hint}</Text>
        <Text style={[styles.tabLabel, active && { color: night.text }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function QuickChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.quick, selected && styles.quickOn, pressed && { opacity: 0.8 }]}
    >
      <Text style={[styles.quickText, selected && styles.quickTextOn]}>{label}</Text>
    </Pressable>
  );
}

function MonthArrow({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: IconName;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={6}
      style={({ pressed }) => [styles.arrow, disabled && { opacity: 0.3 }, pressed && { opacity: 0.6 }]}
    >
      <Icon name={icon} color={night.text} size={18} strokeWidth={2.5} />
    </Pressable>
  );
}

const CELL = 42;

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(23,21,19,0.5)', justifyContent: 'flex-end' },
  sheetWrap: { width: '100%', maxWidth: 520, alignSelf: 'center' },
  sheet: {
    backgroundColor: night.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    ...shadow.card,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: night.border },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: font.heading, fontWeight: '900', color: night.text },
  close: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: night.surfaceHi,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: night.border,
    backgroundColor: night.input,
  },
  tabActive: { borderColor: night.coral, backgroundColor: night.coralSoft },
  tabHint: { fontSize: font.tiny, fontWeight: '700', color: night.muted },
  tabLabel: { fontSize: font.body, fontWeight: '800', color: night.muted },

  // Same height for both steps, so the sheet doesn't jump between them.
  panel: { gap: spacing.sm, minHeight: CELL * 7 + 64 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quick: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: night.border,
    backgroundColor: night.surface,
  },
  quickOn: { backgroundColor: night.coral, borderColor: night.coral },
  quickText: { fontSize: font.small, fontWeight: '700', color: night.muted },
  quickTextOn: { color: '#fff' },

  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  month: { fontSize: font.body, fontWeight: '900', color: night.text },
  arrow: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: night.surfaceHi,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dow: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: font.tiny,
    fontWeight: '800',
    color: night.muted,
    paddingBottom: spacing.xs,
  },
  cell: { width: `${100 / 7}%`, height: CELL, alignItems: 'center', justifyContent: 'center' },
  day: { width: CELL - 4, height: CELL - 4, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  dayToday: { borderWidth: 1.5, borderColor: night.coral },
  dayHover: { backgroundColor: night.surfaceHi },
  daySelected: { backgroundColor: night.coral, borderColor: night.coral, ...shadow.soft },
  dayText: { fontSize: font.body, fontWeight: '700', color: night.text },
  dayTextDisabled: { color: night.faint, opacity: 0.45, textDecorationLine: 'line-through' },
  dayTextSelected: { color: '#fff', fontWeight: '900' },

  wheels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    height: WHEEL_ROW * 5,
  },
  colon: { fontSize: font.title, fontWeight: '900', color: night.text, marginBottom: 4 },
  error: { fontSize: font.small, fontWeight: '700', color: night.danger, textAlign: 'center' },
});
