<script setup lang="ts">
import {
  ref,
  reactive,
  computed,
  onMounted,
  onUnmounted,
  watch,
  nextTick
} from 'vue';

import { DatePickerEngine } from '../engine/DatePickerEngine';
import { Temporal } from '@js-temporal/polyfill';
import { CalendarDay } from '../engine/types';

interface Props {
  modelValue?: string | null;
  placeholder?: string;
  showClearButton?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: 'Select a date',
  showClearButton: true
});

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
  'select': [date: Temporal.PlainDate | null];
}>();

const engine = new DatePickerEngine();

const isOpen = ref(false);

const inputRef = ref<HTMLInputElement>();
const popoverRef = ref<HTMLDivElement>();

const focusedIndex = ref(-1);

const state = reactive(engine.getState());

const flatGrid = computed(() => state.grid.flat());

const displayValue = computed(() => state.displayValue);

const monthLabel = computed(() => state.monthLabel);

const weekDayHeaders = computed(() => state.weekDayHeaders);

// Flag to prevent race conditions
let isOpening = false;

const updateState = () => {
  Object.assign(state, engine.getState());
};

const syncFocusedIndex = () => {
  const selectedIndex = flatGrid.value.findIndex(
    (day) => day.isSelected
  );

  if (selectedIndex >= 0) {
    focusedIndex.value = selectedIndex;
    return;
  }

  const todayIndex = flatGrid.value.findIndex(
    (day) => day.isToday
  );

  if (todayIndex >= 0) {
    focusedIndex.value = todayIndex;
    return;
  }

  focusedIndex.value = 0;
};

const focusCurrentDay = async () => {
  await nextTick();

  const buttons =
    document.querySelectorAll<HTMLButtonElement>(
      '.date-picker__day'
    );

  const target = buttons[focusedIndex.value];

  if (target) {
    target.focus();
  }
};

const openCalendar = async () => {
  if (isOpening) return;
  isOpening = true;

  isOpen.value = true;

  syncFocusedIndex();

  await focusCurrentDay();

  isOpening = false;
};

const closeCalendar = (shouldBlur: boolean = true) => {
  isOpen.value = false;
  focusedIndex.value = -1;

  // Remove focus from input when closing if specified
  if (shouldBlur && inputRef.value) {
    inputRef.value.blur();
  }
};

const toggleCalendar = async () => {
  if (isOpen.value) {
    closeCalendar(true);
  } else {
    await openCalendar();
  }
};

const handlePrevMonth = async () => {
  engine.prevMonth();
  updateState();
  await focusCurrentDay();
};

const handleNextMonth = async () => {
  engine.nextMonth();
  updateState();
  await focusCurrentDay();
};

const handlePrevYear = async () => {
  engine.prevYear();
  updateState();
  await focusCurrentDay();
};

const handleNextYear = async () => {
  engine.nextYear();
  updateState();
  await focusCurrentDay();
};

const handleDateSelect = (day: CalendarDay) => {
  if (!day.isDisabled) {
    engine.selectDate(day.date);

    updateState();

    emit(
      'update:modelValue',
      engine.getState().displayValue
    );

    emit('select', day.date);

    closeCalendar(true); // Blur input on selection
  }
};

const handleGoToToday = () => {
  engine.goToToday();

  updateState();

  emit(
    'update:modelValue',
    engine.getState().displayValue
  );

  emit('select', engine.getState().selectedDate);

  closeCalendar(true); // Blur input on selection
};

const handleClearSelection = () => {
  engine.clearSelection();

  updateState();

  emit('update:modelValue', null);

  emit('select', null);

  syncFocusedIndex();

  // Don't close calendar, so no need to blur
};

const handleClear = () => {
  handleClearSelection();
};

// Do nothing on focus to prevent double triggers
const handleInputFocus = () => {
  // Intentionally empty - click handler handles toggling
};

// Toggle calendar on click with proper event handling
const handleInputClick = async (event: MouseEvent) => {
  event.stopPropagation(); // Prevent event bubbling

  if (isOpen.value) {
    closeCalendar(true); // Blur input when closing via click
  } else {
    await openCalendar();
  }
};

const handleInputKeydown = async (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault();

    if (isOpen.value) {
      closeCalendar(false); // Don't blur input on Enter close
    } else {
      await openCalendar();
    }
  }

  if (event.key === 'Escape' && isOpen.value) {
    closeCalendar(false); // Don't blur input on Escape
  }
};

const handleCalendarKeydown = async (
  event: KeyboardEvent
) => {
  let nextIndex = focusedIndex.value;

  switch (event.key) {
    case 'ArrowRight':
      event.preventDefault();
      event.stopPropagation();
      nextIndex++;
      break;

    case 'ArrowLeft':
      event.preventDefault();
      event.stopPropagation();
      nextIndex--;
      break;

    case 'ArrowDown':
      event.preventDefault();
      event.stopPropagation();
      nextIndex += 7;
      break;

    case 'ArrowUp':
      event.preventDefault();
      event.stopPropagation();
      nextIndex -= 7;
      break;

    case 'Enter':
    case ' ':
      event.preventDefault();
      event.stopPropagation();

      const selectedDay =
        flatGrid.value[focusedIndex.value];

      if (selectedDay && !selectedDay.isDisabled) {
        handleDateSelect(selectedDay);
      }

      return;

    case 'Escape':
      closeCalendar(false); // Don't blur input on Escape
      return;

    default:
      return;
  }

  // Prevent invalid indexes
  if (nextIndex < 0) {
    engine.prevMonth();
    updateState();

    await nextTick();

    focusedIndex.value =
      flatGrid.value.length - 1;

    await focusCurrentDay();
    return;
  }

  if (nextIndex >= flatGrid.value.length) {
    engine.nextMonth();
    updateState();

    await nextTick();

    focusedIndex.value = 0;

    await focusCurrentDay();
    return;
  }

  const currentDay =
    flatGrid.value[focusedIndex.value];

  const nextDay =
    flatGrid.value[nextIndex];

  // Auto change month when moving into
  // previous/next month cells
  if (
    nextDay.date.month >
    currentDay.date.month ||
    nextDay.date.year >
    currentDay.date.year
  ) {
    engine.nextMonth();
    updateState();

    await nextTick();
  }

  if (
    nextDay.date.month <
    currentDay.date.month ||
    nextDay.date.year <
    currentDay.date.year
  ) {
    engine.prevMonth();
    updateState();

    await nextTick();
  }

  // Find same date in new grid
  const updatedIndex =
    flatGrid.value.findIndex(
      (day) =>
        Temporal.PlainDate.compare(
          day.date,
          nextDay.date
        ) === 0
    );

  focusedIndex.value =
    updatedIndex >= 0
      ? updatedIndex
      : nextIndex;

  await focusCurrentDay();
};

const handleClickOutside = (
  event: MouseEvent
) => {
  const target = event.target as HTMLElement;

  // Don't close if clicking the calendar button or input
  const isCalendarButton = target.closest('.date-picker__calendar-btn');
  const isInput = target.closest('.date-picker__input');

  if (isCalendarButton || isInput) {
    return;
  }

  if (
    inputRef.value &&
    !inputRef.value.contains(target) &&
    popoverRef.value &&
    !popoverRef.value.contains(target)
  ) {
    closeCalendar(true); // Blur input when clicking outside
  }
};

const handleEscapeKey = () => {
  closeCalendar(false); // Don't blur input on Escape
};

onMounted(() => {
  document.addEventListener(
    'click',
    handleClickOutside
  );

  if (props.modelValue) {
    try {
      const date =
        Temporal.PlainDate.from(
          props.modelValue
        );

      engine.selectDate(date);

      updateState();
    } catch (e) {
      console.error(e);
    }
  }
});

onUnmounted(() => {
  document.removeEventListener(
    'click',
    handleClickOutside
  );
});

watch(
  () => props.modelValue,
  (newValue) => {
    if (
      newValue &&
      newValue !== state.displayValue
    ) {
      try {
        const date =
          Temporal.PlainDate.from(newValue);

        engine.selectDate(date);

        updateState();
      } catch (e) {
        console.error(e);
      }
    }
  }
);
</script>

/************************************** TEMPLATE ************************************************/
<template>
  <div class="date-picker" :class="{ 'is-open': isOpen }">
    <!-- Input Field -->
    <div class="date-picker__input-wrapper">
      <input ref="inputRef" type="text" :value="displayValue" :placeholder="placeholder" class="date-picker__input"
        @focus="handleInputFocus" @click="handleInputClick" @keydown="handleInputKeydown" readonly />
      <button type="button" class="date-picker__clear-btn" v-if="displayValue && showClearButton" @click="handleClear"
        aria-label="Clear date">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <button type="button" class="date-picker__calendar-btn" @click.stop="toggleCalendar" aria-label="Open calendar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </button>
    </div>

    <!-- Calendar Popover -->
    <div v-if="isOpen" class="date-picker__popover" ref="popoverRef" @keydown.esc="handleEscapeKey">
      <!-- Header -->
      <div class="date-picker__header">
        <button type="button" class="date-picker__nav-btn" @click="handlePrevYear" aria-label="Previous year">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <button type="button" class="date-picker__nav-btn" @click="handlePrevMonth" aria-label="Previous month">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <div class="date-picker__month-year">
          <span class="date-picker__month">{{ monthLabel.split(' ')[0] }}</span>
          <span class="date-picker__year">{{ monthLabel.split(' ')[1] }}</span>
        </div>

        <button type="button" class="date-picker__nav-btn" @click="handleNextMonth" aria-label="Next month">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        <button type="button" class="date-picker__nav-btn" @click="handleNextYear" aria-label="Next year">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      <!-- Week Day Headers -->
      <div class="date-picker__weekdays">
        <div v-for="(day, index) in weekDayHeaders" :key="index" class="date-picker__weekday">
          {{ day }}
        </div>
      </div>

      <!-- Calendar Grid -->
      <div class="date-picker__grid">
        <button v-for="(day, index) in flatGrid" :key="index" :tabindex="index === focusedIndex ? 0 : -1" :class="[
          'date-picker__day',
          {
            'date-picker__day--focused': index === focusedIndex,
            'date-picker__day--current-month': day.isCurrentMonth,
            'date-picker__day--other-month': !day.isCurrentMonth,
            'date-picker__day--today': day.isToday,
            'date-picker__day--selected': day.isSelected,
            'date-picker__day--disabled': day.isDisabled
          }
        ]" @click="handleDateSelect(day)" @keydown="handleCalendarKeydown" :disabled="day.isDisabled"
          :aria-label="`Select ${day.date.toString()}`" :aria-selected="day.isSelected">
          {{ day.date.day }}
        </button>
      </div>

      <!-- Footer -->
      <div class="date-picker__footer">
        <button type="button" class="date-picker__footer-btn" @click="handleGoToToday">
          Today
        </button>
        <button type="button" class="date-picker__footer-btn" @click="handleClearSelection">
          Clear
        </button>
      </div>
    </div>
  </div>
</template>

/************************************** STYLES ************************************************/
<style scoped>
.date-picker {
  position: relative;
  display: inline-block;
  width: 100%;
  max-width: 240px;
  font-family: var(--date-picker-font-family,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      Roboto,
      sans-serif);
}

.date-picker__input-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.date-picker__input {
  padding: var(--date-picker-input-padding,
      10px 70px 10px 12px);
  font-size: var(--date-picker-input-font-size,
      14px);
  font-family: inherit;
  border: var(--date-picker-input-border,
      1px solid #e0e0e0);
  border-radius: var(--date-picker-input-border-radius,
      8px);
  background: var(--date-picker-input-bg,
      white);
  color: var(--date-picker-input-color,
      #333);
  transition: all 0.2s ease;
  width: var(--date-picker-input-width,
      240px);
  cursor: pointer;
}

.date-picker__input:hover {
  border-color: var(--date-picker-input-hover-border,
      #bdbdbd);
}

.date-picker__input:focus {
  outline: none;
  border-color: var(--date-picker-input-focus-border,
      #667eea);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.date-picker__clear-btn,
.date-picker__calendar-btn {
  position: absolute;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--date-picker-icon-color,
      #999);
  transition: color 0.2s;
}

.date-picker__clear-btn {
  right: 34px;
}

.date-picker__calendar-btn {
  right: 10px;
}

.date-picker__clear-btn:hover,
.date-picker__calendar-btn:hover {
  color: var(--date-picker-icon-hover-color,
      #667eea);
}

.date-picker__popover {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);

  background: var(--date-picker-popover-bg,
      white);

  border-radius: var(--date-picker-popover-border-radius,
      12px);

  box-shadow: var(--date-picker-popover-shadow,
      0 10px 40px rgba(0, 0, 0, 0.08));

  padding: var(--date-picker-popover-padding,
      16px);

  width: min(var(--date-picker-popover-min-width,
        280px),
      calc(100vw - 24px));

  box-sizing: border-box;
  overflow: hidden;
  z-index: 1000;

  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform:
      translateX(-50%) translateY(-10px);
  }

  to {
    opacity: 1;
    transform:
      translateX(-50%) translateY(0);
  }
}


.date-picker__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: var(--date-picker-header-border,
      1px solid #f0f0f0);
}

.date-picker__nav-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--date-picker-btn-border-radius,
      6px);
  color: var(--date-picker-nav-color,
      #666);
  transition: all 0.2s;
}

.date-picker__nav-btn:hover {
  background: var(--date-picker-nav-hover-bg,
      #f5f5f5);
  color: var(--date-picker-nav-hover-color,
      #667eea);
}

.date-picker__month-year {
  font-weight: 600;
  font-size: var(--date-picker-month-size,
      15px);
  color: var(--date-picker-month-color,
      #333);
}

.date-picker__month {
  margin-right: 4px;
}

.date-picker__year {
  color: var(--date-picker-year-color,
      #666);
}

.date-picker__weekdays {
  display: grid;
  grid-template-columns:
    repeat(7,
      minmax(0, 1fr));
  gap: 4px;
  margin-bottom: 12px;
}

.date-picker__weekday {
  text-align: center;
  font-size: var(--date-picker-weekday-size,
      12px);
  font-weight: 600;
  color: var(--date-picker-weekday-color,
      #999);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.date-picker__grid {
  display: grid;
  grid-template-columns:
    repeat(7,
      minmax(0, 1fr));
  gap: 2px;
  margin-bottom: 16px;
}

.date-picker__day {
  aspect-ratio: 1;
  min-width: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  background: none;
  border: none;
  cursor: pointer;

  font-size: var(--date-picker-day-size,
      13px);

  font-family: inherit;

  border-radius: var(--date-picker-day-border-radius,
      50%);

  transition: all 0.2s;

  color: var(--date-picker-day-color,
      #333);
}

.date-picker__day:hover:not( :disabled) {
  background: var(--date-picker-day-hover-bg,
      #f5f5f5);
}

.date-picker__day--current-month {
  color: var(--date-picker-day-current-month-color,
      #333);
}

.date-picker__day--other-month {
  color: var(--date-picker-day-other-month-color,
      #ccc);
}

.date-picker__day--today {
  background: var(--date-picker-today-bg,
      #f0e6ff);
  color: var(--date-picker-today-color,
      #667eea);
  font-weight: 600;
}

.date-picker__day--selected {
  background: var(--date-picker-selected-bg,
      #667eea);
  color: var(--date-picker-selected-color,
      white);
}

.date-picker__day--selected:hover {
  background: var(--date-picker-selected-hover-bg,
      #5a67d8);
}

.date-picker__day--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.date-picker__footer {
  display: flex;
  justify-content: space-between;
  padding-top: 12px;
  border-top: var(--date-picker-footer-border,
      1px solid #f0f0f0);
}

.date-picker__footer-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 12px;
  font-size: var(--date-picker-footer-btn-size,
      13px);
  font-family: inherit;
  border-radius: var(--date-picker-footer-btn-radius,
      6px);
  color: var(--date-picker-footer-btn-color,
      #667eea);
  transition: all 0.2s;
}

.date-picker__footer-btn:hover {
  background: var(--date-picker-footer-btn-hover-bg,
      #f5f5f5);
}

.date-picker__day:focus {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

.date-picker__day--focused {
  outline: 2px solid #667eea;
}

.date-picker__calendar-btn:focus,
.date-picker__calendar-btn:focus-visible,
.date-picker__calendar-btn:active {
  outline: none;
  box-shadow: none;
}

/* MOBILE ONLY */
@media (max-width: 480px) {
  .date-picker__popover {
    width: calc(100vw - 24px);
    max-width: 300px;
  }
}
</style>