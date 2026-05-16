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

function handleCalculatorSubmit(event) {
  event.preventDefault();
  const profile = readProfileFromForm(event.currentTarget);
  const result = calculatePlanPreview(profile);
  renderResults(profile, result);
}

function handleWaitlistSubmit(event) {
  event.preventDefault();
  const entry = {
    name: document.getElementById('waitlist-name').value.trim(),
    contact: document.getElementById('waitlist-contact').value.trim(),
    goal: document.getElementById('waitlist-goal').value,
    createdAt: new Date().toISOString(),
  };

  const existing = JSON.parse(localStorage.getItem('fitaiWaitlist') || '[]');
  existing.push(entry);
  localStorage.setItem('fitaiWaitlist', JSON.stringify(existing));

  event.currentTarget.reset();
  setText('waitlist-message', `Saved locally. Beta interest count on this device: ${existing.length}.`);
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
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', init);
}

if (typeof module !== 'undefined') {
  module.exports = {
    buildSamplePlan,
    calculateBmi,
    calculateBmr,
    calculatePlanPreview,
    roundToNearest,
  };
}
