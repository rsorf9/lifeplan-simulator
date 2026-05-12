// 軽量シミュレーション（フロント側で即時計算）。
// 機密ロジック（税制反映、年金、モンテカルロ等）は Edge Functions 側に分離する想定。

import type { SliderInputs, ScenarioExtraSettings } from './types';
import { annualEducationCost } from './educationCosts';

// シミュレーション期間（年）。退職後の資産推移も見られるよう 40 年で固定。
export const SIMULATION_YEARS = 40;

// 公的年金（受給開始年齢と平均月額）
// 厚生労働省「令和4年度厚生年金保険・国民年金事業の概況」より、
// 老齢厚生年金（第1号厚生年金被保険者）の平均月額 約 14.5 万円 を採用。
export const PENSION_START_AGE = 65;
export const PENSION_MONTHLY_PER_PERSON = 145000; // 円/月
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
  cashflow: number;
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
}

export function simulate(
  inputs: SliderInputs,
  extra: ScenarioExtraSettings = {}
): { rows: YearRow[]; summary: SimulationSummary } {
  const currentAge = inputs.current_age ?? 35;
  const retirementAge = inputs.retirement_age ?? 65;
  const hasSpouse = !!extra.has_spouse;
  const spouseAge = inputs.spouse_age ?? currentAge;
  const spouseRetirementAge = inputs.spouse_retirement_age ?? retirementAge;

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

  const ownAnnualIncome = (inputs.annual_income ?? 0) * 10000;
  const spouseAnnualIncome = hasSpouse ? (inputs.spouse_income ?? 0) * 10000 : 0;

  const monthlyLivingExpense = (inputs.monthly_expense ?? 0) * 10000;
  const annualLivingSpecial = (inputs.annual_expense ?? 0) * 10000;
  const annualLivingExpense = monthlyLivingExpense * 12 + annualLivingSpecial;

  let savings = (inputs.current_savings ?? 0) * 10000 - downPayment;
  let investment = 0;
  let loanBalance = loanPrincipal;
  const investRate = (inputs.expected_return ?? 0) / 100;
  const savingsRate = (inputs.savings_return ?? 0) / 100;
  const monthlySavingsContribution = (inputs.monthly_savings ?? 0) * 10000 * 12;
  const monthlyInvestmentContribution =
    (inputs.monthly_investment ?? 0) * 10000 * 12;

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
    const sAge = hasSpouse ? spouseAge + y : null;

    // 給与（退職年齢まで）
    const ownSalary = age <= retirementAge ? ownAnnualIncome : 0;
    const spSalary =
      hasSpouse && sAge !== null && sAge <= spouseRetirementAge
        ? spouseAnnualIncome
        : 0;

    // 公的年金（PENSION_START_AGE 以降）
    const ownPension =
      age >= PENSION_START_AGE ? PENSION_ANNUAL_PER_PERSON : 0;
    const spPension =
      hasSpouse && sAge !== null && sAge >= PENSION_START_AGE
        ? PENSION_ANNUAL_PER_PERSON
        : 0;

    const ownIncome = ownSalary + ownPension;
    const spIncome = spSalary + spPension;
    const yearIncome = ownIncome + spIncome;
    totalPensionReceived += ownPension + spPension;

    let yearlyLoanPay = 0;
    let yearlyInterest = 0;
    let yearlyPrincipal = 0;
    if (loanBalance > 0) {
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

    const educationExpense = children.reduce(
      (sum, c) => sum + annualEducationCost(c.age + y, c.path),
      0
    );
    totalEducationExpense += educationExpense;

    const totalExpense = yearlyLoanPay + annualLivingExpense + educationExpense;
    const cashflow = yearIncome - totalExpense;
    minCashflow = Math.min(minCashflow, cashflow);

    investment = investment * (1 + investRate) + monthlyInvestmentContribution;
    savings =
      savings * (1 + savingsRate) +
      monthlySavingsContribution +
      cashflow;

    const netWorth = savings + investment - loanBalance + housePrice * 0.7;
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
      cashflow: Math.round(cashflow),
      loan_balance: Math.round(loanBalance),
      savings: Math.round(savings),
      investment: Math.round(investment),
      net_worth: Math.round(netWorth),
    });
  }

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
    },
  };
}
