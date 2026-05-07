import { describe, it, expect, beforeEach } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
import { DatePickerEngine } from "./DatePickerEngine";

describe("DatePickerEngine (Headless Logic)", () => {
  let engine: DatePickerEngine;

  beforeEach(() => {
    // Fixed date so all tests produce deterministic, predictable results.
    // May 2026 starts on Friday (ISO weekday 5).
    const testDate = Temporal.PlainDate.from("2026-05-07");
    engine = new DatePickerEngine(testDate);
  });

  /* ── Initial State Tests ──────────────────────── */

  // Verifies the month label is correctly built from the view date.
  it("should initialize with the correct month label", () => {
    const state = engine.getState();
    expect(state.monthLabel).toBe("May 2026");
  });

  // Verifies the engine exposes the correct numeric year and month on startup.
  it("should initialize with the correct view year and month", () => {
    const state = engine.getState();
    expect(state.viewYear).toBe(2026);
    expect(state.viewMonth).toBe(5);
  });

  // Verifies no date is pre-selected and the input display is empty on init.
  it("should have null selected date initially", () => {
    const state = engine.getState();
    expect(state.selectedDate).toBeNull();
    expect(state.displayValue).toBe("");
  });

  // Verifies the weekday row starts on Sunday and ends on Saturday.
  it("should initialize with correct week day headers", () => {
    const state = engine.getState();
    expect(state.weekDayHeaders).toEqual([
      "Su", "Mo", "Tu", "We", "Th", "Fr", "Sa",
    ]);
  });

  /* ── Grid Tests (The Core of the Challenge) ────────── */

  // Verifies the calendar always produces exactly 6 rows of 7 days (42 cells).
  it("should generate a 6x7 grid (42 days total)", () => {
    const { grid } = engine.getState();
    expect(grid).toHaveLength(6);
    grid.forEach((week) => expect(week).toHaveLength(7));
  });

  // Verifies the grid is padded on the left with days from the previous month
  // so the first row always starts on Sunday.
  it("should include leading days from the previous month", () => {
    // May 2026 starts on Friday → grid must go back to Sunday April 26.
    const { grid } = engine.getState();
    const firstDayOfGrid = grid[0][0].date;

    expect(firstDayOfGrid.toString()).toBe("2026-04-26");
    expect(grid[0][0].isCurrentMonth).toBe(false);
  });

  // Verifies the grid is padded on the right with days from the next month
  // so the last row always ends on Saturday.
  it("should include trailing days from the next month", () => {
    // May 2026 ends on Sunday May 31 → grid fills to Saturday June 6.
    const { grid } = engine.getState();
    const lastDayOfGrid = grid[5][6].date;

    expect(lastDayOfGrid.toString()).toBe("2026-06-06");
    expect(grid[5][6].isCurrentMonth).toBe(false);
  });

  // Verifies that only the days belonging to the current month are flagged
  // as isCurrentMonth, and that count matches the actual days in the month.
  it("should correctly identify current month days", () => {
    const { grid } = engine.getState();
    const currentMonthDays = grid.flat().filter((day) => day.isCurrentMonth);

    // May has 31 days.
    expect(currentMonthDays).toHaveLength(31);
    currentMonthDays.forEach((day) => {
      expect(day.date.month).toBe(5);
      expect(day.date.year).toBe(2026);
    });
  });

  // Verifies the engine correctly handles a leap year February (29 days).
  it("should handle months with different lengths (February in leap year)", () => {
    const febDate = Temporal.PlainDate.from("2024-02-01");
    const febEngine = new DatePickerEngine(febDate);
    const { grid } = febEngine.getState();

    const currentMonthDays = grid.flat().filter((day) => day.isCurrentMonth);
    expect(currentMonthDays).toHaveLength(29);
  });

  // Verifies the engine correctly handles a non-leap year February (28 days).
  it("should handle February in non-leap year", () => {
    const febDate = Temporal.PlainDate.from("2025-02-01");
    const febEngine = new DatePickerEngine(febDate);
    const { grid } = febEngine.getState();

    const currentMonthDays = grid.flat().filter((day) => day.isCurrentMonth);
    expect(currentMonthDays).toHaveLength(28);
  });

  /* ── Navigation Tests ──────────────────────────── */

  // Verifies nextMonth() advances the view by exactly one month.
  it("should navigate to the next month correctly", () => {
    engine.nextMonth();
    const state = engine.getState();
    expect(state.monthLabel).toBe("June 2026");
    expect(state.viewMonth).toBe(6);
    expect(state.viewYear).toBe(2026);
  });

  // Verifies prevMonth() goes back exactly one month.
  it("should navigate to the previous month correctly", () => {
    engine.prevMonth();
    const state = engine.getState();
    expect(state.monthLabel).toBe("April 2026");
    expect(state.viewMonth).toBe(4);
    expect(state.viewYear).toBe(2026);
  });

  // Verifies that calling nextMonth() in December rolls over to January
  // of the following year rather than producing an invalid month 13.
  it("should handle year rollover when incrementing months", () => {
    const decDate = Temporal.PlainDate.from("2026-12-01");
    const decEngine = new DatePickerEngine(decDate);

    decEngine.nextMonth();
    const state = decEngine.getState();

    expect(state.monthLabel).toBe("January 2027");
    expect(state.viewYear).toBe(2027);
    expect(state.viewMonth).toBe(1);
  });

  // Verifies that calling prevMonth() in January rolls back to December
  // of the previous year rather than producing an invalid month 0.
  it("should handle year rollback when decrementing months", () => {
    const janDate = Temporal.PlainDate.from("2026-01-01");
    const janEngine = new DatePickerEngine(janDate);

    janEngine.prevMonth();
    const state = janEngine.getState();

    expect(state.monthLabel).toBe("December 2025");
    expect(state.viewYear).toBe(2025);
    expect(state.viewMonth).toBe(12);
  });

  // Verifies nextYear() advances the year by one while keeping the same month.
  it("should navigate to next year correctly", () => {
    engine.nextYear();
    const state = engine.getState();
    expect(state.viewYear).toBe(2027);
    expect(state.viewMonth).toBe(5);
    expect(state.monthLabel).toBe("May 2027");
  });

  // Verifies prevYear() goes back one year while keeping the same month.
  it("should navigate to previous year correctly", () => {
    engine.prevYear();
    const state = engine.getState();
    expect(state.viewYear).toBe(2025);
    expect(state.viewMonth).toBe(5);
    expect(state.monthLabel).toBe("May 2025");
  });

  // Verifies the grid structure remains valid (6×7) after navigation,
  // and that the first cell of the new month is correct.
  it("should maintain grid integrity after navigation", () => {
    engine.nextMonth();
    const { grid } = engine.getState();

    expect(grid).toHaveLength(6);
    expect(grid[0]).toHaveLength(7);

    // June 2026 starts on Monday → the Sunday before is May 31.
    const firstDay = grid[0][0].date;
    expect(firstDay.toString()).toBe("2026-05-31");
  });

  /* ── Selection Tests ────────────────────────────── */

  // Verifies that selecting a date updates selectedDate and formats
  // the display value as MM/DD/YYYY.
  it("should update selection and display value", () => {
    const dateToSelect = Temporal.PlainDate.from("2026-05-20");
    engine.selectDate(dateToSelect);

    const state = engine.getState();
    expect(state.selectedDate?.toString()).toBe("2026-05-20");
    expect(state.displayValue).toBe("05/20/2026");
  });

  // Verifies the correct grid cell is flagged as isSelected after selection.
  it("should mark the selected day in the grid", () => {
    const dateToSelect = Temporal.PlainDate.from("2026-05-15");
    engine.selectDate(dateToSelect);

    const { grid } = engine.getState();
    const day15 = grid
      .flat()
      .find((d) => d.date.day === 15 && d.isCurrentMonth);

    expect(day15?.isSelected).toBe(true);
  });

  // Verifies that selecting a new date deselects the previous one,
  // so only one cell is ever marked as selected at a time.
  it("should unselect previously selected date when new date is selected", () => {
    const firstDate = Temporal.PlainDate.from("2026-05-10");
    const secondDate = Temporal.PlainDate.from("2026-05-20");

    engine.selectDate(firstDate);
    engine.selectDate(secondDate);

    const { grid } = engine.getState();
    const selectedDays = grid.flat().filter((day) => day.isSelected);

    expect(selectedDays).toHaveLength(1);
    expect(selectedDays[0].date.toString()).toBe("2026-05-20");
  });

  // Verifies clearSelection() resets selectedDate to null, empties
  // the display value, and removes the isSelected flag from all grid cells.
  it("should clear selection correctly", () => {
    const dateToSelect = Temporal.PlainDate.from("2026-05-20");
    engine.selectDate(dateToSelect);
    engine.clearSelection();

    const state = engine.getState();
    expect(state.selectedDate).toBeNull();
    expect(state.displayValue).toBe("");

    const { grid } = engine.getState();
    const selectedDays = grid.flat().filter((day) => day.isSelected);
    expect(selectedDays).toHaveLength(0);
  });

  /* ── Go To Today Tests ────────────────────────────── */

  // Verifies goToToday() selects today's date and updates the view
  // to the current month and year.
  it("should go to today and select it", () => {
    const today = Temporal.Now.plainDateISO();
    engine.goToToday();

    const state = engine.getState();
    expect(state.selectedDate?.toString()).toBe(today.toString());
    expect(state.viewYear).toBe(today.year);
    expect(state.viewMonth).toBe(today.month);
  });

  // Verifies that after goToToday(), the grid cell matching today
  // is flagged as both isToday and isSelected.
  it("should update grid after goToToday", () => {
    engine.goToToday();
    const { grid } = engine.getState();

    const today = Temporal.Now.plainDateISO();
    const todayInGrid = grid
      .flat()
      .find(
        (day) =>
          day.date.year === today.year &&
          day.date.month === today.month &&
          day.date.day === today.day,
      );

    expect(todayInGrid?.isToday).toBe(true);
    expect(todayInGrid?.isSelected).toBe(true);
  });

  /* ── Edge Cases & Special Scenarios ────────────────── */

  // Verifies that selecting a date in a different month also syncs
  // the view to that month, so the user sees the selected date.
  it("should handle date selection across different months", () => {
    const nextMonthDate = Temporal.PlainDate.from("2026-06-15");
    engine.selectDate(nextMonthDate);

    const state = engine.getState();
    expect(state.selectedDate?.toString()).toBe("2026-06-15");
    expect(state.viewYear).toBe(2026);
    expect(state.viewMonth).toBe(6);
    expect(state.displayValue).toBe("06/15/2026");
  });

  // Verifies the isToday flag is correct when the test runs during
  // the same month as the fixed test date (conditional to avoid false negatives).
  it("should mark today correctly in the grid", () => {
    const { grid } = engine.getState();
    const today = Temporal.Now.plainDateISO();

    if (today.year === 2026 && today.month === 5) {
      const todayInGrid = grid
        .flat()
        .find(
          (day) =>
            day.date.year === today.year &&
            day.date.month === today.month &&
            day.date.day === today.day,
        );
      expect(todayInGrid?.isToday).toBe(true);
    }
  });

  // Verifies that clicking a trailing day (from next month) selects it
  // and shifts the view forward to that month.
  it("should handle selection of trailing days from next month", () => {
    const juneFirst = Temporal.PlainDate.from("2026-06-01");
    engine.selectDate(juneFirst);

    const state = engine.getState();
    expect(state.selectedDate?.toString()).toBe("2026-06-01");
    expect(state.viewMonth).toBe(6);
  });

  // Verifies that clicking a leading day (from the previous month) selects it
  // and shifts the view back to that month.
  it("should handle selection of leading days from previous month", () => {
    const april30 = Temporal.PlainDate.from("2026-04-30");
    engine.selectDate(april30);

    const state = engine.getState();
    expect(state.selectedDate?.toString()).toBe("2026-04-30");
    expect(state.viewMonth).toBe(4);
  });

  // Verifies the engine stays consistent through a full sequence of
  // next/prev month and next/prev year navigations.
  it("should maintain correct grid when moving through months", () => {
    engine.nextMonth();
    let state = engine.getState();
    expect(state.viewMonth).toBe(6);
    expect(state.monthLabel).toBe("June 2026");

    engine.prevMonth();
    state = engine.getState();
    expect(state.viewMonth).toBe(5);
    expect(state.monthLabel).toBe("May 2026");

    engine.nextYear();
    state = engine.getState();
    expect(state.viewYear).toBe(2027);
    expect(state.monthLabel).toBe("May 2027");

    engine.prevYear();
    state = engine.getState();
    expect(state.viewYear).toBe(2026);
    expect(state.monthLabel).toBe("May 2026");
  });

  // Verifies goToToday() works correctly regardless of what month
  // the engine is currently viewing (December in this case).
  it("should handle December to January transition with goToToday", () => {
    const decDate = Temporal.PlainDate.from("2026-12-15");
    const decEngine = new DatePickerEngine(decDate);
    decEngine.goToToday();

    const today = Temporal.Now.plainDateISO();
    const state = decEngine.getState();

    expect(state.viewYear).toBe(today.year);
    expect(state.viewMonth).toBe(today.month);
  });

  // Verifies single-digit months and days are zero-padded correctly
  // in the display value (e.g. January 5 → "01/05/2026").
  it("should correctly format display value with leading zeros", () => {
    const date = Temporal.PlainDate.from("2026-01-05");
    engine.selectDate(date);
    expect(engine.getState().displayValue).toBe("01/05/2026");

    const date2 = Temporal.PlainDate.from("2026-12-25");
    engine.selectDate(date2);
    expect(engine.getState().displayValue).toBe("12/25/2026");
  });

  // Verifies getState() returns a new object reference each time,
  // confirming the engine does not leak internal mutable state.
  it("should return a fresh state object on each getState call", () => {
    const state1 = engine.getState();
    const state2 = engine.getState();

    expect(state1).not.toBe(state2); // Different object references
    expect(state1).toEqual(state2);  // But identical values
  });

  /* ── Month Boundary Tests ──────────────────────────── */

  // Verifies a 31-day month starting on Saturday still produces a valid
  // 6-week grid, and that the grid starts on the Sunday before.
  it("should handle month with 31 days starting on Saturday", () => {
    // July 2023 starts on Saturday → grid must start Sunday June 25.
    const julyDate = Temporal.PlainDate.from("2023-07-01");
    const julyEngine = new DatePickerEngine(julyDate);
    const { grid } = julyEngine.getState();

    expect(grid).toHaveLength(6);
    expect(grid[0][0].date.toString()).toBe("2023-06-25");
  });

  // Verifies a 30-day month starting on Sunday produces a grid where
  // the first cell is the 1st of the month itself (no leading padding needed).
  it("should handle month with 30 days starting on Sunday", () => {
    // September 2024 starts on Sunday → no leading days needed.
    const sepDate = Temporal.PlainDate.from("2024-09-01");
    const sepEngine = new DatePickerEngine(sepDate);
    const { grid } = sepEngine.getState();

    expect(grid).toHaveLength(6);
    expect(grid[0][0].date.toString()).toBe("2024-09-01");
    expect(grid[0][0].isCurrentMonth).toBe(true);
  });

  // Verifies the engine defaults to today's date when instantiated
  // without an initial date argument, covering the ?? branch in the constructor.
  it("defaults to today when no initial date is provided", () => {
    const e = new DatePickerEngine();
    const today = Temporal.Now.plainDateISO();
    expect(e.getState().viewMonth).toBe(today.month);
    expect(e.getState().viewYear).toBe(today.year);
  });
});