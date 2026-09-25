/**
 * Shared helpers for Docker/npm HTTP API contract checks.
 */

import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  authLoginTokens,
  envelopeStatus,
  unwrapApiData,
  unwrapError,
} from './unwrap-api-data';

export type StepResult = {
  step: number;
  name: string;
  method: string;
  path: string;
  ok: boolean;
  status?: number;
  request?: unknown;
  response?: unknown;
  checks?: Record<string, boolean>;
  error?: string;
  durationMs?: number;
};

export type EndpointCheck = {
  method: string;
  path: string;
  auth: boolean;
  covered: boolean;
};

export type CheckReport = {
  name: string;
  startedAt: string;
  finishedAt: string;
  success: boolean;
  baseUrl: string;
  runId: string;
  steps: StepResult[];
  endpointsChecklist: EndpointCheck[];
};

export type ApiFn = (
  stepNum: number,
  name: string,
  method: string,
  path: string,
  opts?: {
    token?: string;
    body?: unknown;
    formData?: FormData;
    headers?: Record<string, string>;
    expectStatus?: number;
    checks?: (httpStatus: number, body: unknown) => Record<string, boolean>;
    checklistPath?: string;
  },
) => Promise<{ ok: boolean; status: number; body: unknown }>;

export function createApiCheckHarness(opts: {
  name: string;
  baseUrl: string;
  outputFile: string;
  runId: string;
  endpoints: EndpointCheck[];
}) {
  const report: CheckReport = {
    name: opts.name,
    startedAt: new Date().toISOString(),
    finishedAt: '',
    success: false,
    baseUrl: opts.baseUrl,
    runId: opts.runId,
    steps: [],
    endpointsChecklist: opts.endpoints.map((e) => ({ ...e })),
  };

  function markCovered(method: string, path: string): void {
    const entry = report.endpointsChecklist.find(
      (item) => item.method === method && item.path === path,
    );
    if (entry) {
      entry.covered = true;
    }
  }

  function logStep(step: StepResult): void {
    report.steps.push(step);
    const mark = step.ok ? 'OK' : 'FAIL';
    console.log(`[${mark}] ${step.step}. ${step.name} (${step.status ?? '-'})`);
  }

  function envelopeOk(
    httpStatus: number,
    body: unknown,
    expected: number,
  ): Record<string, boolean> {
    const data = unwrapApiData(body);
    return {
      httpStatus: httpStatus === expected,
      envelopeStatus: envelopeStatus(body) === expected,
      hasData: data !== null && data !== undefined,
    };
  }

  function errorOk(
    httpStatus: number,
    body: unknown,
    expected: number,
    errorCode: string,
  ): Record<string, boolean> {
    const error = unwrapError(body);
    return {
      ...envelopeOk(httpStatus, body, expected),
      errorCode: error.errorCode === errorCode,
      hasMessage: Boolean(error.message),
    };
  }

  const api: ApiFn = async (stepNum, name, method, path, callOpts = {}) => {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(callOpts.headers ?? {}),
    };
    if (callOpts.token) {
      headers.Authorization = `Bearer ${callOpts.token}`;
    }
    let body: BodyInit | undefined;
    if (callOpts.formData) {
      body = callOpts.formData;
    } else if (callOpts.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(callOpts.body);
    }

    const started = Date.now();
    const res = await fetch(`${opts.baseUrl}${path}`, {
      method,
      headers,
      body,
    });
    let parsed: unknown = null;
    try {
      parsed = await res.json();
    } catch {
      parsed = null;
    }

    const expectStatus = callOpts.expectStatus ?? 200;
    const checks = callOpts.checks
      ? callOpts.checks(res.status, parsed)
      : envelopeOk(res.status, parsed, expectStatus);
    const ok = Object.values(checks).every(Boolean);
    logStep({
      step: stepNum,
      name,
      method,
      path,
      ok,
      status: res.status,
      request: callOpts.formData ? '[multipart]' : callOpts.body,
      response: parsed,
      checks,
      error: ok ? undefined : `expected ${expectStatus}, got ${res.status}`,
      durationMs: Date.now() - started,
    });
    if (ok && callOpts.checklistPath) {
      markCovered(method, callOpts.checklistPath);
    }
    return { ok, status: res.status, body: parsed };
  };

  function saveReport(): string {
    report.finishedAt = new Date().toISOString();
    report.success = report.steps.every((step) => step.ok);
    mkdirSync(join(opts.outputFile, '..'), { recursive: true });
    writeFileSync(opts.outputFile, JSON.stringify(report, null, 2));
    return opts.outputFile;
  }

  function finish(): never {
    const path = saveReport();
    const failed = report.steps.filter((s) => !s.ok).length;
    const total = report.steps.length;
    const uncovered = report.endpointsChecklist.filter((e) => !e.covered);
    if (uncovered.length > 0) {
      console.log(
        `\nUncovered endpoints: ${uncovered
          .map((e) => `${e.method} ${e.path}`)
          .join(', ')}`,
      );
    }
    console.log(
      `\n${report.success ? 'PASS' : 'FAIL'} — ${total - failed}/${total} steps`,
    );
    console.log(`Report: ${path}`);
    process.exit(report.success && uncovered.length === 0 ? 0 : 1);
  }

  return {
    report,
    api,
    markCovered,
    logStep,
    envelopeOk,
    errorOk,
    saveReport,
    finish,
  };
}

export function uniquePhone(slot: number): string {
  const n = (Number(String(Date.now()).slice(-8)) + slot * 17) % 100000000;
  return `09${String(n).padStart(9, '0')}`;
}

export async function signupWholesaleBuyer(opts: {
  api: ApiFn;
  step: { n: number };
  otp: string;
  phoneSlot: number;
  label?: string;
}): Promise<string> {
  const label = opts.label ?? 'Buyer';
  const phone = uniquePhone(opts.phoneSlot);
  const prefix = 'auth.wholesale-buyer';

  await opts.api(++opts.step.n, `${prefix}.step1`, 'POST', '/auth/signup/step1', {
    body: { firstName: label, lastName: 'Check', phone },
    checks: (status, body) => {
      const data = unwrapApiData<{ otpSent?: boolean }>(body);
      return {
        httpStatus: status === 200,
        envelopeStatus: envelopeStatus(body) === 200,
        otpSent: data?.otpSent === true,
      };
    },
  });

  await opts.api(++opts.step.n, `${prefix}.otp`, 'POST', '/auth/otp/verify', {
    body: { phone, code: opts.otp },
    checks: (status, body) => {
      const data = unwrapApiData<{ needsStep2?: boolean }>(body);
      return {
        httpStatus: status === 200,
        needsStep2: data?.needsStep2 === true,
      };
    },
  });

  const step2 = await opts.api(
    ++opts.step.n,
    `${prefix}.step2`,
    'POST',
    '/auth/signup/step2',
    {
      body: {
        phone,
        channel: 'WHOLESALE',
        accountType: 'BUYER',
        activityType: 'STORE',
        guildType: 'FOOD',
      },
      checks: (status, body) => {
        const tokens = authLoginTokens(body);
        return {
          httpStatus: status === 200,
          hasToken: Boolean(tokens.accessToken),
        };
      },
    },
  );

  const token = authLoginTokens(step2.body).accessToken;
  if (!token) {
    throw new Error('Wholesale buyer token missing');
  }
  return token;
}

/** Shipping address body matching Figma receiver fields (required). */
export function sampleAddressBody(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    label: 'آدرس ارسال',
    line1: 'خیابان ۱۷ شهریور',
    line2: 'کوچه ۲',
    city: 'یزد',
    province: 'یزد',
    postalCode: '1234567890',
    recipientFullName: 'حسین حیدری',
    recipientPhone: '09121234567',
    nationalId: '0012345678',
    houseNumber: '1',
    isDefault: true,
    ...overrides,
  };
}

export async function loginWithOtp(opts: {
  api: ApiFn;
  step: { n: number };
  phone: string;
  otp: string;
  label?: string;
}): Promise<string> {
  const label = opts.label ?? opts.phone;
  await opts.api(
    ++opts.step.n,
    `auth.otp-request.${label}`,
    'POST',
    '/auth/otp/request',
    {
      body: { phone: opts.phone },
      checks: (status, body) => {
        const data = unwrapApiData<{ otpSent?: boolean }>(body);
        return {
          httpStatus: status === 200,
          otpSent: data?.otpSent === true,
        };
      },
    },
  );
  const verified = await opts.api(
    ++opts.step.n,
    `auth.otp-verify.${label}`,
    'POST',
    '/auth/otp/verify',
    {
      body: { phone: opts.phone, code: opts.otp },
      checks: (status, body) => {
        const tokens = authLoginTokens(body);
        return {
          httpStatus: status === 200,
          hasToken: Boolean(tokens.accessToken),
        };
      },
    },
  );
  const token = authLoginTokens(verified.body).accessToken;
  if (!token) {
    throw new Error(`Token missing for ${opts.phone}`);
  }
  return token;
}
