<script setup lang="ts">
import { ref } from 'vue';
import DatePicker from './components/DatePicker.vue';
import { Temporal } from '@js-temporal/polyfill';

const selectedDate = ref<string | null>(null);
const handleDateSelect = (date: Temporal.PlainDate | null) => {
  console.log('Date selected:', date?.toString());
};

const features = [
  'Pure TypeScript engine - zero framework dependencies',
  'Temporal API for robust date handling',
  'Full keyboard navigation (Esc to close, Enter to select, arrow keys to navigate the calendar)',
  'Click outside to close',
  'Accessible (ARIA labels, keyboard support)',
  'CSS Custom Properties for theming',
  'Responsive design',
  'Smooth animations',
  'Unit tested logic for zero-bug date arithmetic', 
  'Enterprise-grade deployment on AWS infrastructure' 
];
</script>

/************************************** TEMPLATE ************************************************/
<template>
  <div class="app">
    <div class="demo-container">
      <h1 class="demo-title">
        Professional Date Picker
        <span class="demo-badge">Vue 3 + Temporal API</span>
      </h1>

      <div class="demo-section">
        <h2 class="demo-subtitle">Please pick a date</h2>
        <DatePicker v-model="selectedDate" placeholder="Choose a date" @select="handleDateSelect" />
        <p class="demo-info" v-if="selectedDate">
          Selected: <strong>{{ selectedDate }}</strong>
        </p>
      </div>

      <div class="demo-section">
        <h2 class="demo-subtitle">Features</h2>

        <ul class="demo-features">
          <li v-for="feature in features" :key="feature">
            <span>✅</span>
            {{ feature }}
          </li>
        </ul>
      </div>

    </div>
  </div>
</template>

/************************************** STYLES ************************************************/
<style>
:root {
  /* Date Picker Theme Variables */
  --date-picker-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --date-picker-input-padding: 10px 70px 10px 12px;
  --date-picker-input-font-size: 14px;
  --date-picker-input-border: 1px solid #e0e0e0;
  --date-picker-input-border-radius: 10px;
  --date-picker-input-bg: white;
  --date-picker-input-color: #1a1a1a;
  --date-picker-input-hover-border: #a0a0a0;
  --date-picker-input-focus-border: #667eea;

  --date-picker-icon-color: #999;
  --date-picker-icon-hover-color: #667eea;

  --date-picker-popover-bg: white;
  --date-picker-popover-border-radius: 16px;
  --date-picker-popover-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
  --date-picker-popover-padding: 20px;
  --date-picker-popover-min-width: 300px;

  --date-picker-header-border: 1px solid #f0f0f0;
  --date-picker-nav-color: #666;
  --date-picker-nav-hover-bg: #f5f5f5;
  --date-picker-nav-hover-color: #667eea;
  --date-picker-month-size: 15px;
  --date-picker-month-color: #1a1a1a;
  --date-picker-year-color: #666;

  --date-picker-weekday-size: 12px;
  --date-picker-weekday-color: #999;

  --date-picker-day-size: 13px;
  --date-picker-day-border-radius: 8px;
  --date-picker-day-color: #333;
  --date-picker-day-hover-bg: #f5f5f5;
  --date-picker-day-current-month-color: #1a1a1a;
  --date-picker-day-other-month-color: #ccc;

  --date-picker-today-bg: #f0e6ff;
  --date-picker-today-color: #667eea;

  --date-picker-selected-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --date-picker-selected-color: white;
  --date-picker-selected-hover-bg: #5a67d8;

  --date-picker-footer-border: 1px solid #f0f0f0;
  --date-picker-footer-btn-size: 13px;
  --date-picker-footer-btn-radius: 6px;
  --date-picker-footer-btn-color: #667eea;
  --date-picker-footer-btn-hover-bg: #f5f5f5;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
}

.app {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.demo-container {
  max-width: 900px;
  width: 100%;
  background: white;
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.demo-title {
  font-size: 32px;
  margin-bottom: 8px;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.demo-badge {
  font-size: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 500;
}

.demo-subtitle {
  font-size: 20px;
  margin-bottom: 16px;
  color: #333;
  font-weight: 600;
}

.demo-section {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid #e0e0e0;
}

.demo-section:first-of-type {
  margin-top: 24px;
  border-top: none;
  padding-top: 0;
}

.demo-info {
  margin-top: 12px;
  font-size: 14px;
  color: #666;
}

.demo-info strong {
  color: #667eea;
}

.demo-features {
  list-style: none;
  padding: 0;
}

.demo-features li {
  padding: 8px 0;
  color: #555;
  font-size: 14px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  line-height: 1.5;
  text-align: left; 
}

.demo-features li span {
  flex-shrink: 0;
  line-height: 1.5;
}


.css-vars-demo {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 12px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #667eea;
  line-height: 1.8;
}

.css-vars-demo code {
  display: block;
}

@media (max-width: 768px) {
  .demo-container {
    padding: 24px;
  }

  .demo-title {
    font-size: 24px;
  }
}
</style>
