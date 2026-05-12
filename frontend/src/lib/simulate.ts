// 軽量シミュレーション（フロント側で即時計算）。

import type { SliderInputs, ScenarioExtraSettings } from './types';
import { annualEducationCost } from './educationCosts';

// シミュレーション期間（年）。退職後の資産推移も見られるよう 40 年で固定。
export const SIMULATION_YEARS = 40;

// 公的年金（厚生労働省「令和4年度厚生年金保険・国民年金事業の概況」より）
export const PENSION_START_AGE = 65;
export const PENSION_MONTHLY_PER_PERSON = 145000;
export const PENSION_ANNUAL_PER_PERSON = PENSION_MONTHLY_PER_PERSON * 12;

export interface YearRow {
  year: number;
  age: number;
  spouse_age: number | null;
  // 収入内訳
  own_salary: number;
  own_pension: number;
  spouse_salary: number;
  spouse_pension: number;
  own_income: number;
  spouse_income: number;
  income: number;
  // 支出内訳
  living_expense: number;
  education_expense: number;
  loan_payment: number;
  loan_interest: number;
  loan_principal: number;
  total_expense: number;
  // フロー
  gross_cashflow: number; // 収入 - 支出 (allocate前)
  actual_savings_contrib: number; // 実際に貯蓄に積み立てた金額
  actual_investment_contrib: number; // 実際に投資に拠出した金額
  residual: number; // 余り（マイナスなら不足を貯蓄から取り崩し）
  cashflow: number; // = gross_cashflow（互換用）
  // ストック
  loan_balance: number;
  savings: number;
  investment: number;
  net_worth: number;
}

export interface SimulationSummary {
  total_loan_payment: number;
  retirement_net_worth: number;
  loan_paid_off_year: number | null;
  total_education_expense: number;
  min_cashflow: number;
  monthly_loan_payment: number;
  total_pension_received: number;
  monthly_alloc_max_year0: number; // 月当たり配分可能額（年0基準、万円）
  purchase_age: number;
}

export interface AllocLimits {
  // year0 の月間配分可能額（万円）。スライダーの上限制御に使用
  monthly_max: number;
}

/**
 * year0 の余剰額（万円/月）を算出。スライダーの上限表示に使う。
 * income は退職年齢以前ならフル、それ以外は0。年金は65歳以降。
 */
export function computeAllocLimits(
  inputs: SliderInputs,
  extra: ScenarioExtraSettings = {}
): AllocLimits {
  const currentAge = inputs.current_age ?? 35;
  const retirementAge = inputs.retirement_age ?? 65;
  const hasSpouse = !!extra.has_spouse;
  const spouseAgeNow = inputs.spouse_age ?? currentAge;
  const spouseRetirementAge = inputs.spouse_retirement_age ?? retirementAge;

  // year0 = 現在の収入
  const ownSalary = currentAge <= retirementAge ? inputs.annual_income ?? 0 : 0;
  const spSalary =
    hasSpouse && spouseAgeNow <= spouseRetirementAge
      ? inputs.spouse_income ?? 0
      : 0;
  const ownPen = currentAge >= PENSION_START_AGE ? PENSION_ANNUAL_PER_PERSON / 10000 : 0;
  const spPen =
    hasSpouse && spouseAgeNow >= PENSION_START_AGE
      ? PENSION_ANNUAL_PER_PERSON / 10000
      : 0;
  const income = ownSalary + spSalary + ownPen + spPen; // 万円

  // year0 の支出
  const living = (inputs.monthly_expense ?? 0) * 12 + (inputs.annual_expense ?? 0); // 万円
  const children = extra.children ?? [];
  const eduYen = children.reduce(
    (s, c) => s + annualEducationCost(c.age, c.path),
    0
  );
  const education = eduYen / 10000; // 万円

  // year0 のローン返済（住宅購入年齢が year0 を含む or 過去なら発生）
  const purchaseAge = inputs.house_purchase_age ?? currentAge;
  const housePrice = (inputs.house_price ?? 0) * 10000;
  const downPayment = (inputs.down_payment ?? 0) * 10000;
  const loanPrincipal = Math.max(housePrice - downPayment, 0);
  const annualRate = (inputs.interest_rate ?? 0) / 100;
  const months = (inputs.loan_years ?? 35) * 12;
  const monthlyRate = annualRate / 12;
  const monthlyPayment =
    loanPrincipal === 0
      ? 0
      : monthlyRate === 0
      ? loanPrincipal / months
      : (loanPrincipal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  const annualLoan = currentAge >= purchaseAge ? (monthlyPayment * 12) / 10000 : 0;

  const gross = income - living - education - annualLoan;
  return { monthly_max: Math.max(0, gross / 12) };
}

export function simulate(
  inputs: SliderInputs,
  extra: ScenarioExtraSettings = {}
): { rows: YearRow[]; summary: SimulationSummary } {
  const currentAge = inputs.current_age ?? 35;
  const retirementAge = inputs.retirement_age ?? 65;
  const hasSpouse = !!extra.has_spouse;
  const spouseAgeStart = inputs.spouse_age ?? currentAge;
  const spouseRetirementAge = inputs.spouse_retirement_age ?? retirementAge;

  // 住宅
  const purchaseAge = inputs.house_purchase_age ?? currentAge;
  const purchaseYear = Math.max(0, purchaseAge - currentAge);
  const housePrice = (inputs.house_price ?? 0) * 10000;
  const downPayment = (inputs.down_payment ?? 0) * 10000;
  const loanPrincipal = Math.max(housePrice - downPayment, 0);
  const annualRate = (inputs.interest_rate ?? 0) / 100;
  const months = (inputs.loan_years ?? 35) * 12;
  const monthlyRate = annualRate / 12;
  const monthlyPayment =
    loanPrincipal === 0
      ? 0
      : monthlyRate === 0
      ? loanPrincipal / months
      : (loanPrincipal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  const annualLoanPayment = monthlyPayment * 12;

  // 収入
  const ownAnnualIncome = (inputs.annual_income ?? 0) * 10000;
  const spouseAnnualIncome = hasSpouse ? (inputs.spouse_income ?? 0) * 10000 : 0;

  // 支出
  const monthlyLivingExpense = (inputs.monthly_expense ?? 0) * 10000;
  const annualLivingSpecial = (inputs.annual_expense ?? 0) * 10000;
  const annualLivingExpense = monthlyLivingExpense * 12 + annualLivingSpecial;

  // 投入希望（年額）
  const inputSavingsAnnual = (inputs.monthly_savings ?? 0) * 10000 * 12;
  const inputInvestmentAnnual = (inputs.monthly_investment ?? 0) * 10000 * 12;

  // ストック
  let savings = (inputs.current_savings ?? 0) * 10000;
  let investment = 0;
  let loanBalance = 0;
  let hasPurchased = purchaseYear === 0 ? false : false; // ループ内で処理
  const investRate = (inputs.expected_return ?? 0) / 100;
  const savingsRate = (inputs.savings_return ?? 0) / 100;

  // 子供
  const children = extra.children ?? [];

  const rows: YearRow[] = [];
  let totalLoanPayment = 0;
  let totalEducationExpense = 0;
  let totalPensionReceived = 0;
  let loanPaidOffYear: number | null = null;
  let minCashflow = Number.POSITIVE_INFINITY;
  let retirementNetWorth = 0;

  for (let y = 0; y <= SIMULATION_YEARS; y++) {
    const age = currentAge + y;
    const sAge = hasSpouse ? spouseAgeStart + y : null;

    // 住宅購入イベント（年初に処理）
    if (!hasPurchased && y === purchaseYear) {
      savings -= downPayment;
      loanBalance = loanPrincipal;
      hasPurchased = true;
    }

    // 収入
    const ownSalary = age <= retirementAge ? ownAnnualIncome : 0;
    const spSalary =
      hasSpouse && sAge !== null && sAge <= spouseRetirementAge
        ? spouseAnnualIncome
        : 0;
    const ownPension = age >= PENSION_START_AGE ? PENSION_ANNUAL_PER_PERSON : 0;
    const spPension =
      hasSpouse && sAge !== null && sAge >= PENSION_START_AGE
        ? PENSION_ANNUAL_PER_PERSON
        : 0;
    const ownIncome = ownSalary + ownPension;
    const spIncome = spSalary + spPension;
    const yearIncome = ownIncome + spIncome;
    totalPensionReceived += ownPension + spPension;

    // ローン返済（購入済みかつ残高>0）
    let yearlyLoanPay = 0;
    let yearlyInterest = 0;
    let yearlyPrincipal = 0;
    if (hasPurchased && loanBalance > 0) {
      const interest = loanBalance * annualRate;
      const principalCapacity = Math.max(annualLoanPayment - interest, 0);
      const principal = Math.min(principalCapacity, loanBalance);
      yearlyLoanPay = principal + interest;
      yearlyInterest = interest;
      yearlyPrincipal = principal;
      loanBalance = Math.max(loanBalance - principal, 0);
      totalLoanPayment += yearlyLoanPay;
      if (loanBalance === 0 && loanPaidOffYear === null) loanPaidOffYear = age;
    }

    // 教育費
    const educationExpense = children.reduce(
      (sum, c) => sum + annualEducationCost(c.age + y, c.path),
      0
    );
    totalEducationExpense += educationExpense;

    const totalExpense = yearlyLoanPay + annualLivingExpense + educationExpense;
    const grossCashflow = yearIncome - totalExpense;
    minCashflow = Math.min(minCashflow, grossCashflow);

    // 貯蓄・投資の配分（差額の範囲内に自動制限）
    let actualSavingsContrib = 0;
    let actualInvestmentContrib = 0;
    let residual = grossCashflow;
    if (grossCashflow > 0) {
      actualSavingsContrib = Math.min(inputSavingsAnnual, grossCashflow);
      const remaining = grossCashflow - actualSavingsContrib;
      actualInvestmentContrib = Math.min(inputInvestmentAnnual, remaining);
      residual = remaining - actualInvestmentContrib;
    }
    // grossCashflow <= 0 のときは contrib=0, residual=grossCashflow（マイナスを貯蓄から取り崩し）

    // ストック更新
    // 投資：年初残高に運用益＋拠出
    investment = investment * (1 + investRate) + actualInvestmentContrib;
    // 預貯金：年初残高に運用益＋拠出＋未配分残（または不足分の取り崩し）
    savings = savings * (1 + savingsRate) + actualSavingsContrib + residual;

    const houseValueInNW = hasPurchased ? housePrice * 0.7 : 0;
    const netWorth = savings + investment - loanBalance + houseValueInNW;
    if (age === retirementAge) retirementNetWorth = netWorth;

    rows.push({
      year: y,
      age,
      spouse_age: sAge,
      own_salary: Math.round(ownSalary),
      own_pension: Math.round(ownPension),
      spouse_salary: Math.round(spSalary),
      spouse_pension: Math.round(spPension),
      own_income: Math.round(ownIncome),
      spouse_income: Math.round(spIncome),
      income: Math.round(yearIncome),
      living_expense: Math.round(annualLivingExpense),
      education_expense: Math.round(educationExpense),
      loan_payment: Math.round(yearlyLoanPay),
      loan_interest: Math.round(yearlyInterest),
      loan_principal: Math.round(yearlyPrincipal),
      total_expense: Math.round(totalExpense),
      gross_cashflow: Math.round(grossCashflow),
      actual_savings_contrib: Math.round(actualSavingsContrib),
      actual_investment_contrib: Math.round(actualInvestmentContrib),
      residual: Math.round(residual),
      cashflow: Math.round(grossCashflow),
      loan_balance: Math.round(loanBalance),
      savings: Math.round(savings),
      investment: Math.round(investment),
      net_worth: Math.round(netWorth),
    });
  }

  const limits = computeAllocLimits(inputs, extra);

  return {
    rows,
    summary: {
      total_loan_payment: Math.round(totalLoanPayment),
      retirement_net_worth: Math.round(retirementNetWorth),
      loan_paid_off_year: loanPaidOffYear,
      total_education_expense: Math.round(totalEducationExpense),
      min_cashflow:
        minCashflow === Number.POSITIVE_INFINITY ? 0 : Math.round(minCashflow),
      monthly_loan_payment: Math.round(monthlyPayment),
      total_pension_received: Math.round(totalPensionReceived),
      monthly_alloc_max_year0: limits.monthly_max,
      purchase_age: purchaseAge,
    },
  };
}
