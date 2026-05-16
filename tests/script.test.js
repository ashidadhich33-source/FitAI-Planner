const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildSamplePlan,
  buildWaitlistCsv,
  calculateBmi,
  calculateBmr,
  calculatePlanPreview,
  escapeCsv,
  roundToNearest,
  safeParseJson,
  summarizeValidationData,
} = require('../script.js');

test('calculates BMI using metric inputs', () => {
  assert.equal(Number(calculateBmi(76, 173).toFixed(1)), 25.4);
});

test('calculates Mifflin-St Jeor BMR for male and female profiles', () => {
  assert.equal(Math.round(calculateBmr({ gender: 'male', weightKg: 76, heightCm: 173, age: 24 })), 1726);
  assert.equal(Math.round(calculateBmr({ gender: 'female', weightKg: 62, heightCm: 162, age: 29 })), 1327);
});

test('generates a rounded fat-loss plan preview', () => {
  const preview = calculatePlanPreview({
    gender: 'male',
    weightKg: 76,
    heightCm: 173,
    age: 24,
    activityFactor: 1.55,
    goal: 'fatLoss',
  });

  assert.deepEqual(preview, {
    bmi: 25.4,
    bmr: 1725,
    tdee: 2675,
    targetCalories: 2150,
    protein: 135,
    angle: 'Controlled fat loss',
  });
});

test('builds India-aware sample plans by food preference and budget', () => {
  const sample = buildSamplePlan(
    { food: 'Vegetarian', budget: '₹200–₹300/day', goal: 'fatLoss' },
    { targetCalories: 2150, protein: 135 },
  );

  assert.match(sample, /vegetarian plan/);
  assert.match(sample, /2150 kcal/);
  assert.match(sample, /soya\/paneer swaps/);
});

test('summarizes local validation signals', () => {
  const summary = summarizeValidationData(
    [{ name: 'A' }, { name: 'B' }],
    [
      { name: 'page_viewed' },
      { name: 'calculator_completed' },
      { name: 'calculator_completed' },
      { name: 'starter_interest_clicked' },
    ],
  );

  assert.deepEqual(summary, {
    calculatorCompletions: 2,
    waitlistLeads: 2,
    starterClicks: 1,
  });
});

test('exports waitlist leads as escaped CSV', () => {
  assert.equal(escapeCsv('Ravi "RJ"'), '"Ravi ""RJ"""');
  assert.equal(
    buildWaitlistCsv([
      { name: 'Ravi "RJ"', contact: '+919999999999', goal: 'Fat loss', createdAt: '2026-05-16T00:00:00.000Z' },
    ]),
    'name,contact,goal,createdAt\n"Ravi ""RJ""","+919999999999","Fat loss","2026-05-16T00:00:00.000Z"',
  );
});

test('parses broken JSON safely and rounds values', () => {
  assert.deepEqual(safeParseJson('{broken', []), []);
  assert.equal(roundToNearest(2141, 25), 2150);
});
