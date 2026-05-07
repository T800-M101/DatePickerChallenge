# Headless Date Picker (Vue 3 + Vanilla TS)

A production-ready Date Picker component built with a "Headless" architecture, where the core logic engine is completely decoupled from the UI framework. This project demonstrates proficiency in Vanilla TypeScript, modern Web APIs (Temporal), and architectural separation of concerns.

## 🏗️ Live Demo

[Add your StackBlitz or Vercel link here]

## 🎯 Architectural Approach: State Management

To ensure the logic is framework-agnostic, I implemented a decoupled state management strategy:

### 1. The Logic Engine (Vanilla TS)
A standalone `DatePickerEngine` class that acts as the single source of truth:
- **Manages:** Date grid generation, navigation (next/previous month/year), selection state
- **Zero Dependencies:** No framework-specific utilities or third-party date libraries (Moment.js, Day.js)
- **Pure Functions:** All date manipulations are isolated and testable
- **State Immutability:** Returns fresh state objects on each `getState()` call

### 2. The UI Wrapper (Vue 3)
A reactive Vue 3 component that interfaces with the engine:
- **Bridging:** Uses Vue's `ref` and `reactive` to sync engine state
- **Event Handling:** Converts user interactions (clicks, keyboard) into engine method calls
- **Lifecycle Management:** Handles click-outside detection and cleanup

### 3. Separation of Concerns
- **Engine answers:** "What dates should I show and what is selected?"
- **Vue handles:** "How does the user interact with the screen?"
- **Result:** The core logic can be ported to React, Angular, Svelte, or any other framework without modification

## 🕒 Observations on the Temporal API

Following the requirement to use modern standards, this project leverages the **Temporal API** (Stage 3 TC39 proposal):

### Key Benefits Discovered:

| Feature | Legacy Date | Temporal API | Impact |
|---------|------------|--------------|--------|
| **Immutability** | `date.setMonth(5)` mutates | `date.add({ months: 1 })` returns new | ✅ Eliminated accidental mutation bugs |
| **Date Arithmetic** | Manual overflow handling | `.add()`/`.subtract()` handles rolls | ✅ March 31 → April 30 (not May 1) |
| **Grid Logic** | Complex getDay() calculations | `dayOfWeek` property (1-7) | ✅ 50% cleaner code |
| **Time Zone** | Always includes time | `PlainDate` ignores timezones | ✅ Perfect for date pickers |

### Why Temporal for a Date Picker:

1. **PlainDate Precision:** `Temporal.PlainDate` focuses strictly on calendar dates, eliminating timezone confusion
2. **Predictable Month Navigation:** `date.add({ months: 1 })` handles edge cases (Jan 31 → Feb 28/29) correctly
3. **Clean Comparison:** `PlainDate.compare(date1, date2)` replaces verbose legacy comparisons
4. **Native Methods:** `.daysInMonth`, `.dayOfWeek`, `.toString()` reduce boilerplate

### Polyfill Note:
> *"The Temporal API is a TC39 Stage 3 proposal. The `@js-temporal/polyfill` is used solely to access the native Temporal spec in environments where it isn't yet built-in — it is not a date utility library. The logic contains zero date manipulation helpers from third parties."*

## 📐 Design Decisions

### Why 6 Weeks (42 Days)?
I chose a **6-week (42 day) grid** because:
- 42 days is the minimum number needed to guarantee any month (including 31-day months starting on Saturday) can be displayed fully
- Prevents layout shift when navigating between months
- Maintains consistent popover height for better UX

### Why CSS Custom Properties?
All theme values use CSS variables:
- `--date-picker-selected-bg`, `--date-picker-input-border-radius`, etc.
- Enables easy theming without recompiling
- Shows design system readiness

## ♿ Accessibility Features

- **Keyboard Navigation:** Arrow keys to navigate days, Enter/Space to select, Escape to close
- **ARIA Labels:** All interactive elements have descriptive labels
- **Focus Management:** Proper focus trapping and restoration
- **Screen Reader Support:** `aria-selected`, `aria-label` on all dates

## 🛠️ Setup and Execution

### Prerequisites
- **Node.js:** v20.19.0+ or v22.12.0+ (Required for Vite 6)
- **npm:** v9+ or **yarn:** v1.22+

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/T800-M101/DatePickerChallenge.git
   cd DatePickerChallenge
   
2. Install dependencies:
```bash
   npm install
```
3. Start the development server:
```bash
   npm run dev
```
   The app will be available at `http://localhost:5173`

## 🧪 Running Tests

The engine logic is tested with [Vitest](https://vitest.dev/).

```bash
# Run tests once
npm test

# Run in watch mode during development
npm run test:watch

# Run with coverage report
npm run test:coverage
```

Tests are located in `src/engine/DatePickerEngine.test.ts` and cover:
- Grid generation (6×7 structure, leading/trailing days, current month days)
- Month and year navigation including year rollover
- Date selection, display formatting, and clearing
- State shape (monthLabel, weekDayHeaders)