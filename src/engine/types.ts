import type { Temporal } from '@js-temporal/polyfill'
export interface CalendarDay {
  date: Temporal.PlainDate
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  isDisabled: boolean
}

export type CalendarWeek = CalendarDay[]

export interface CalendarState {
  viewYear: number
  viewMonth: number
  selectedDate: Temporal.PlainDate | null
  displayValue: string
  grid: CalendarWeek[]
  monthLabel: string
  weekDayHeaders: string[]
}

export interface IDatePickerEngine {
  getState(): CalendarState
  nextMonth(): void
  prevMonth(): void
  nextYear(): void
  prevYear(): void
  selectDate(date: Temporal.PlainDate): void
  goToToday(): void
  clearSelection(): void
}