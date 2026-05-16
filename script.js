const STORAGE_KEYS = {
  waitlist: 'fitaiWaitlist',
  analytics: 'fitaiAnalyticsEvents',
};

const goalAdjustments = {
  fatLoss: { multiplier: 0.8, label: 'Controlled fat loss' },
  recomp: { multiplier: 0.95, label: 'Beginner recomposition' },
  leanBulk: { multiplier: 1.08, label: 'Lean bulk' },
  muscleGain: { multiplier: 1.12, label: 'Muscle gain' },
};

function roundToNearest(value, nearest = 5) {
  return Math.round(value / nearest) * nearest;
}

function calculateBmi(weightKg, heightCm) {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function calculateBmr({ gender, weightKg, heightCm, age }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'female' ? base - 161 : base + 5;
}

function calculatePlanPreview(profile) {
  const bmi = calculateBmi(profile.weightKg, profile.heightCm);
  const bmr = calculateBmr(profile);
  const tdee = bmr * profile.activityFactor;
  const goal = goalAdjustments[profile.goal] || goalAdjustments.recomp;
  const targetCalories = tdee * goal.multiplier;
  const proteinMultiplier = profile.goal === 'fatLoss' ? 1.8 : 1.7;
  const protein = profile.weightKg * proteinMultiplier;

  return {
    bmi: Number(bmi.toFixed(1)),
    bmr: roundToNearest(bmr),
    tdee: roundToNearest(tdee),
    targetCalories: roundToNearest(targetCalories, 25),
    protein: roundToNearest(protein),
    angle: goal.label,
  };
}

function buildSamplePlan({ food, budget, goal }, result) {
  const mealByFood = {
    Vegetarian: 'oats with milk, curd, dal, roti, seasonal sabzi, and soya/paneer swaps',
    Eggetarian: 'eggs, roti/rice, dal, curd, fruit, and budget-friendly roasted chana',
    'Non-vegetarian': 'eggs or chicken, rice/roti, dal, curd, salad, and simple home-style curries',
    Vegan: 'soya chunks, tofu, dal, chana, rajma, rice/roti, peanuts, and sprouts',
  };

  const workout = goal === 'fatLoss'
    ? '3–4 strength sessions plus 7k–10k daily steps'
    : '4 progressive strength sessions with weekly overload tracking';

  return `For a ${budget} ${food.toLowerCase()} plan, start around ${result.targetCalories} kcal and ${result.protein}g protein using ${mealByFood[food]}. Training angle: ${workout}.`;
}

function readProfileFromForm(form) {
  const data = new FormData(form);
  return {
    age: Number(data.get('age')),
    gender: data.get('gender'),
    heightCm: Number(data.get('height')),
    weightKg: Number(data.get('weight')),
    activityFactor: Number(data.get('activity')),
    goal: data.get('goal'),
    food: data.get('food'),
    budget: data.get('budget'),
  };
}

function safeParseJson(value, fallback = []) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (_error) {
    return fallback;
  }
}

function getStoredJson(key, fallback = []) {
  if (typeof localStorage === 'undefined') return fallback;
  return safeParseJson(localStorage.getItem(key), fallback);
}

function saveStoredJson(key, value) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

function trackEvent(name, payload = {}) {
  const event = {
    name,
    payload,
    createdAt: new Date().toISOString(),
  };
  const events = getStoredJson(STORAGE_KEYS.analytics);
  events.push(event);
  saveStoredJson(STORAGE_KEYS.analytics, events);
  updateValidationMetrics();
  return event;
}

function summarizeValidationData(waitlist = [], events = []) {
  return {
    calculatorCompletions: events.filter((event) => event.name === 'calculator_completed').length,
    waitlistLeads: waitlist.length,
    starterClicks: events.filter((event) => event.name === 'starter_interest_clicked').length,
  };
}

function escapeCsv(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function buildWaitlistCsv(waitlist) {
  const headers = ['name', 'contact', 'goal', 'createdAt'];
  const rows = waitlist.map((entry) => headers.map((header) => escapeCsv(entry[header])).join(','));
  return [headers.join(','), ...rows].join('\n');
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function renderResults(profile, result) {
  setText('bmi-result', result.bmi);
  setText('bmr-result', `${result.bmr} kcal`);
  setText('tdee-result', `${result.tdee} kcal`);
  setText('calorie-result', `${result.targetCalories} kcal`);
  setText('protein-result', `${result.protein}g`);
  setText('angle-result', result.angle);
  setText('sample-plan', buildSamplePlan(profile, result));
}

function updateValidationMetrics() {
  if (typeof document === 'undefined') return;
  const summary = summarizeValidationData(
    getStoredJson(STORAGE_KEYS.waitlist),
    getStoredJson(STORAGE_KEYS.analytics),
  );

  setText('metric-calculator', summary.calculatorCompletions);
  setText('metric-waitlist', summary.waitlistLeads);
  setText('metric-starter', summary.starterClicks);
}

function handleCalculatorSubmit(event) {
  event.preventDefault();
  const profile = readProfileFromForm(event.currentTarget);
  const result = calculatePlanPreview(profile);
  renderResults(profile, result);
  trackEvent('calculator_completed', {
    goal: profile.goal,
    food: profile.food,
    budget: profile.budget,
    targetCalories: result.targetCalories,
    protein: result.protein,
  });
}

function handleWaitlistSubmit(event) {
  event.preventDefault();
  const entry = {
    name: document.getElementById('waitlist-name').value.trim(),
    contact: document.getElementById('waitlist-contact').value.trim(),
    goal: document.getElementById('waitlist-goal').value,
    createdAt: new Date().toISOString(),
  };

  const existing = getStoredJson(STORAGE_KEYS.waitlist);
  existing.push(entry);
  saveStoredJson(STORAGE_KEYS.waitlist, existing);
  trackEvent('waitlist_joined', { goal: entry.goal });

  event.currentTarget.reset();
  setText('waitlist-message', `Saved locally. Beta interest count on this device: ${existing.length}.`);
}

function handleStarterInterestClick(event) {
  const planName = event.currentTarget?.dataset?.plan || 'starter';
  trackEvent('starter_interest_clicked', { planName });
}

function exportWaitlistCsv() {
  const waitlist = getStoredJson(STORAGE_KEYS.waitlist);
  const csv = buildWaitlistCsv(waitlist);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'fitai-phase-0-waitlist.csv';
  link.click();
  URL.revokeObjectURL(url);
  trackEvent('waitlist_exported', { count: waitlist.length });
}

function init() {
  const calculatorForm = document.getElementById('fitness-form');
  if (calculatorForm) {
    calculatorForm.addEventListener('submit', handleCalculatorSubmit);
    const profile = readProfileFromForm(calculatorForm);
    renderResults(profile, calculatePlanPreview(profile));
  }

  const waitlistForm = document.getElementById('waitlist-form');
  if (waitlistForm) {
    waitlistForm.addEventListener('submit', handleWaitlistSubmit);
  }

  document.querySelectorAll('[data-track-plan]').forEach((element) => {
    element.addEventListener('click', handleStarterInterestClick);
  });

  const exportButton = document.getElementById('export-waitlist');
  if (exportButton) {
    exportButton.addEventListener('click', exportWaitlistCsv);
  }

  updateValidationMetrics();
  trackEvent('page_viewed', { path: window.location.pathname });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', init);
}

if (typeof module !== 'undefined') {
  module.exports = {
    STORAGE_KEYS,
    buildSamplePlan,
    buildWaitlistCsv,
    calculateBmi,
    calculateBmr,
    calculatePlanPreview,
    escapeCsv,
    roundToNearest,
    safeParseJson,
    summarizeValidationData,
  };
}
