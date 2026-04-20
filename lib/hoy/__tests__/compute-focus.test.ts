// Tests de computeFocus. Ejecutar con: npx tsx lib/hoy/__tests__/compute-focus.test.ts
// (No hay test runner configurado aún — usar tsx como script hasta que se instale vitest)

import { computeFocusSync, type EntregableInput } from "../compute-focus";

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (cond) {
    passed++;
    console.log(`✓ ${msg}`);
  } else {
    failed++;
    console.log(`✗ ${msg}`);
  }
}

function t(id: string, overrides: Partial<EntregableInput>): EntregableInput {
  return {
    id,
    title: id,
    type: "sumativo",
    weight: 10,
    progress: 0,
    days: 10,
    ...overrides,
  } as EntregableInput;
}

// Test 1: urgent manda sobre todo
{
  const res = computeFocusSync([
    t("a", { type: "sumativo", weight: 20, progress: 80, days: 5 }),
    t("b", { type: "formativo", weight: 0, progress: 0, days: 1 }),
  ]);
  assert(res?.focus.id === "b", "Test 1: urgent (days<=2) manda sobre no-urgent");
}

// Test 2: entre urgentes, sumativo gana
{
  const res = computeFocusSync([
    t("a", { type: "formativo", weight: 0, progress: 0, days: 1 }),
    t("b", { type: "sumativo", weight: 5, progress: 50, days: 2 }),
  ]);
  assert(res?.focus.id === "b", "Test 2: entre urgentes, sumativo gana");
}

// Test 3: entre urgentes sumativos, mayor peso gana
{
  const res = computeFocusSync([
    t("a", { type: "sumativo", weight: 10, progress: 0, days: 1 }),
    t("b", { type: "sumativo", weight: 25, progress: 0, days: 2 }),
  ]);
  assert(res?.focus.id === "b", "Test 3: entre urgentes sumativos, mayor peso gana");
}

// Test 4: sumativo siempre antes que formativo (no urgentes)
{
  const res = computeFocusSync([
    t("a", { type: "formativo", weight: 0, progress: 0, days: 5 }),
    t("b", { type: "sumativo", weight: 5, progress: 90, days: 10 }),
  ]);
  assert(res?.focus.id === "b", "Test 4: sumativo antes que formativo (no urgent)");
}

// Test 5: entre sumativos no urgentes, combina peso+urgencia+progreso
{
  const res = computeFocusSync([
    t("a", { type: "sumativo", weight: 10, progress: 80, days: 5 }),
    t("b", { type: "sumativo", weight: 10, progress: 20, days: 5 }),
  ]);
  assert(res?.focus.id === "b", "Test 5: mismo peso+días, menor progreso gana");
}

// Test 6: vencidos (days negativo) son urgent
{
  const res = computeFocusSync([
    t("a", { type: "sumativo", weight: 20, progress: 50, days: 10 }),
    t("b", { type: "formativo", weight: 0, progress: 30, days: -2 }),
  ]);
  assert(res?.focus.id === "b", "Test 6: vencido (days negativo) es urgent");
}

// Test 7: desempate alfabético
{
  const res = computeFocusSync([
    t("a", { type: "sumativo", weight: 10, progress: 40, days: 7 }),
    t("b", { type: "sumativo", weight: 10, progress: 40, days: 7, grouped: true }),
  ]);
  assert(res?.focus.id === "a", "Test 7: iguales scores → alfabético");
}

// Extras
{
  const res = computeFocusSync([]);
  assert(res === null, "Extra: array vacío → null");
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
