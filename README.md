# Headless Date Picker (Vue 3 + Vanilla TS)

A functional Date Picker component built with a "Headless" architecture, where the core logic engine is entirely decoupled from the UI framework. This project demonstrates proficiency in Vanilla TypeScript, modern Web APIs, and architectural separation of concerns.

## 🚀 Architectural Approach: State Management

To ensure the logic is framework-agnostic, I implemented a decoupled state management strategy:

1. **The Logic Engine (Vanilla TS):** A standalone class that acts as the single source of truth. It manages the date grid generation, navigation logic (next/previous month/year), and selection state. It maintains **zero dependencies**, importing no framework-specific utilities or third-party libraries like Moment.js or Day.js.
2. **The UI Wrapper (Vue 3):** A Vue 3 component that serves as a reactive interface for the engine[cite: 14]. It bridges the Vanilla Engine's state with Vue's reactivity system using `ref` and `reactive`.
3.  **Separation of Concerns:** The engine manages "How dates work," while Vue manages "How the user interacts with the screen." This allows the core logic to be ported to any other framework (React, Angular, etc.) without modification[cite: 32].

## 🕒 Observations on the Temporal API

Following the requirement to use modern standards, this project leverages the **Temporal API**:

* **Immutability:** Temporal objects are immutable, solving the long-standing "accidental mutation" bugs found in the legacy `Date` object.
* **PlainDate:** Using `Temporal.PlainDate` is ideal for a date picker as it ignores time zones and specific times, focusing strictly on the calendar date.
* **Arithmetic:** The `.add()` and `.subtract()` methods handle month overflows (e.g., March 31st minus one month) much more predictably than legacy methods.
* **Grid Logic:** Calculating leading and trailing days to fill the 42-day calendar grid became significantly more readable using `dayOfWeek` properties.

## 🛠️ Setup and Execution

### Prerequisites
* **Node.js:** v20.19.0+ or v22.12.0+ (Required for Vite 6)

### Installation
1.  Clone the repository:
    ```bash
    git clone https://github.com/T800-M101/DatePickerChallenge.git
    cd DatePickerChallenge
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Development
Run the local dev server:
```bash
npm run dev


Note: "The Temporal API is a TC39 Stage 3 proposal. The @js-temporal/polyfill is used solely to access the native Temporal spec in environments where it isn't yet built-in — it is not a date utility library. The logic contains zero date manipulation helpers from third parties."

I chose a 6-week (42 day) grid specifically, because 42 days is the minimum number needed to guarantee that any month (including a 31-day month starting on a Saturday) can be displayed fully without the grid changing height, which prevents layout shift.