import http from 'k6/http';
import { check, fail, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const ttfb = new Trend('ttfb', true);

const BASE_URL = __ENV.BASE_URL || 'https://reops-event-proxy.intern.dev.nav.no';
const ENDPOINT = __ENV.ENDPOINT || '/api/send';

const basePayload = {
    type: 'event',
    payload: {
        website: 'e3baefc1-c576-4f62-a7c2-9db2dcd13dca',
        hostname: 'felgen.ansatt.nav.no',
        screen: '420x69',
        language: 'en-GB',
        title: 'tittelgreier',
        url: 'https://felgen.ansatt.nav.no/greier',
        referrer: '12345678910',
    },
};

export const options = {
    scenarios: {
        send_events: {
            executor: 'ramping-arrival-rate',
            startRate: 50,
            timeUnit: '1s',
            preAllocatedVUs: 200, // initial pool; increase if you see "insufficient VUs"
            maxVUs: 2000,

            stages: [
                { target: 100, duration: '30s' },  // warmup
                { target: 300, duration: '1m' },   // step 1
                { target: 600, duration: '1m' },   // step 2
                { target: 800, duration: '1m' },   // peak (adjust to your goal)
                { target: 0,   duration: '30s' },  // ramp down
            ],
            gracefulStop: '30s',
        },
    },

    thresholds: {
        http_req_failed: ['rate<0.001'],
        http_req_duration: [
            'p(90)<800',
            'p(95)<1200',
            'p(99)<2500',
        ],
        ttfb: ['p(95)<1100'],
    },

    noConnectionReuse: false,
    userAgent: 'Mozilla/5.0 (Linux; Android 10; K)',
};

export default function () {
    const url = `${BASE_URL}${ENDPOINT}`;
    const payload = JSON.parse(JSON.stringify(basePayload));
    payload.payload.referrer = `${basePayload.payload.referrer}-${__VU}-${__ITER}-${Date.now()}`;
    payload.payload.title = `${basePayload.payload.title}-${__VU}-${__ITER}`;

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
        console.error(
            `Unexpected status=${res.status} body=${String(res.body).slice(0, 300)}`
        );
        fail(`Non-201 response: ${res.status}`);
    }
}