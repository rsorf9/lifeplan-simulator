// 軽量シミュレーション（フロント側で即時計算）。
// 機密ロジック（税制反映、年金、モンテカルロ等）は Edge Functions 側に分離する想定。

import type { SliderInputs } from './types';

export interface YearRow {
  year: number;
  age: number;
  loan_balance: number;
  loan_payment: number;
  savings: number;
  investment: number;
  net_worth: number;
}

export interface SimulationSummary {
  total_loan_payment: number;
  retirement_net_worth: number;
  loan_paid_off_year: number | null;
}

const CURRENT_AGE = 35; // 後でユーザー設定化できるが、雛形では固定

export function simulate(inputs: SliderInputs): { rows: YearRow[]; summary: SimulationSummary } {
  const housePrice = (inputs.house_price ?? 0) * 10000;
  const downPayment = (inputs.down_payment ?? 0) * 10000;
  const loanPrincipal = Math.max(housePrice - downPayment, 0);
  const annualRate = (inputs.interest_rate ?? 0) / 100;
  const months = (inputs.loan_years ?? 35) * 12;
  const monthlyRate = annualRate / 12;
  const monthlyPayment =
    monthlyRate === 0
      ? loanPrincipal / months
      : (loanPrincipal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  const annualLoanPayment = monthlyPayment * 12;

  let savings = (inputs.current_savings ?? 0) * 10000 - downPayment;
  let investment = 0;
  let loanBalance = loanPrincipal;
  const rate = (inputs.expected_return ?? 0) / 100;
  const monthlySavings = (inputs.monthly_savings ?? 0) * 10000 * 12;
  const monthlyInvest = (inputs.monthly_investment ?? 0) * 10000 * 12;
  const retirementAge = inputs.retirement_age ?? 65;

  const rows: YearRow[] = [];
  let totalLoanPayment = 0;
  let loanPaidOffYear: number | null = null;

  for (let y = 0; y <= retirementAge - CURRENT_AGE; y++) {
    const age = CURRENT_AGE + y;
    // ローン返済
    let yearlyPay = 0;
    if (loanBalance > 0) {
      const pay = Math.min(annualLoanPayment, loanBalance * (1 + annualRate));
      const interest = loanBalance * annualRate;
      const principal = pay - interest;
      loanBalance = Math.max(loanBalance - principal, 0);
      yearlyPay = pay;
      totalLoanPayment += pay;
      if (loanBalance === 0 && loanPaidOffYear === null) loanPaidOffYear = age;
    }
    // 投資成長
    investment = investment * (1 + rate) + monthlyInvest;
    // 貯蓄積立
    savings += monthlySavings - yearlyPay;

    const netWorth = savings + investment - loanBalance + housePrice * 0.7; // 住宅評価額を 7 割で計上
    rows.push({
      year: y,
      age,
      loan_balance: Math.round(loanBalance),
      loan_payment: Math.round(yearlyPay),
      savings: Math.round(savings),
      investment: Math.round(investment),
      net_worth: Math.round(netWorth),
    });
  }

  const last = rows[rows.length - 1];
  return {
    rows,
    summary: {
      total_loan_payment: Math.round(totalLoanPayment),
      retirement_net_worth: last?.net_worth ?? 0,
      loan_paid_off_year: loanPaidOffYear,
    },
  };
}
