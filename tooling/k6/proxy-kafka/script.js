import http from 'k6/http';
import { check } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';

const ttfb = new Trend('ttfb', true);
const errorCount = new Counter('errors');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8082';
const ENDPOINT = __ENV.ENDPOINT || '/api/send';
const SCENARIO = __ENV.SCENARIO || 'stress'; // 'stress' or 'soak'

const screens = ['1920x1080', '1366x768', '390x844', '420x69', '2560x1440'];
const languages = ['en-GB', 'nb-NO', 'nn-NO', 'en-US', 'sv-SE'];
const paths = ['/greier', '/prosjekt', '/dashboard', '/rapport', '/oversikt'];

const basePayload = {
    type: 'event',
    payload: {
        website: '27e38efd-1128-4176-b0d5-ccf3fcbeef05',
        hostname: 'felgen.ansatt.nav.no',
        screen: '420x69',
        language: 'en-GB',
        title: 'tittelgreier',
        url: 'https://felgen.ansatt.nav.no/greier',
        referrer: '12345678910',
    },
};

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

const stressScenario = {
    send_events_stress: {
        executor: 'ramping-arrival-rate',
        startRate: 50,
        timeUnit: '1s',
        preAllocatedVUs: 200,
        maxVUs: 2000,
        stages: [
            { target: 100, duration: '30s' },  // warmup
            { target: 300, duration: '1m' },   // step 1
            { target: 600, duration: '1m' },   // step 2
            { target: 800, duration: '1m' },   // peak
            { target: 0,   duration: '30s' },  // ramp down
        ],
        gracefulStop: '30s',
    },
};

const soakScenario = {
    send_events_soak: {
        executor: 'constant-arrival-rate',
        rate: 50,
        timeUnit: '1s',
        preAllocatedVUs: 100,
        maxVUs: 300,
        duration: '10m',
        gracefulStop: '30s',
    },
};

export const options = {
    scenarios: SCENARIO === 'soak' ? soakScenario : stressScenario,

    thresholds: {
        http_req_failed: ['rate<0.001'],
        http_req_duration: [
            'p(90)<800',
            'p(95)<1200',
            'p(99)<2500',
        ],
        ttfb: ['p(95)<1100'],
        errors: ['count<10'],
    },

    noConnectionReuse: false,
    userAgent: 'Mozilla/5.0 (Linux; Android 10; K)',
};

// Validate that the target is reachable before running the full test
export function setup() {
    const url = `${BASE_URL}${ENDPOINT}`;
    const res = http.post(url, JSON.stringify(basePayload), {
        headers: { 'Content-Type': 'application/json' },
        timeout: '10s',
    });

    const ok = check(res, {
        'setup: target is reachable': (r) => r.status === 201,
    });

    if (!ok) {
        throw new Error(
            `Target not reachable: ${url} returned status=${res.status}. Aborting test.`
        );
    }

    return { startedAt: new Date().toISOString() };
}

export default function () {
    const url = `${BASE_URL}${ENDPOINT}`;
    const path = pick(paths);

    const payload = {
        type: 'event',
        payload: {
            ...basePayload.payload,
            screen: pick(screens),
            language: pick(languages),
            url: `https://felgen.ansatt.nav.no${path}`,
            referrer: `${basePayload.payload.referrer}-${__VU}-${__ITER}-${Date.now()}`,
            title: `${basePayload.payload.title}-${__VU}-${__ITER}`,
        },
    };

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
        tags: {
            endpoint: ENDPOINT,
            type: 'event',
        },
        timeout: '20s',
    };

    const res = http.post(url, JSON.stringify(payload), params);
    ttfb.add(res.timings.waiting, { endpoint: ENDPOINT });

    const ok = check(res, {
        'status is 201': (r) => r.status === 201,
    });

    if (!ok) {
        errorCount.add(1);
        console.warn(
            `Unexpected status=${res.status} body=${String(res.body).slice(0, 300)}`
        );
    }
}

export function handleSummary(data) {
    return {
        stdout: textSummary(data, { indent: ' ', enableColors: true }),
        'summary.json': JSON.stringify(data, null, 2),
    };
}
