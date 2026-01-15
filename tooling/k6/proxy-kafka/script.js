import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
    vus: 10,
    duration: '60s',
};

export default function () {
    const url = 'https://reops-event-proxy.nav.no/api/send';

    const payload = {
        type: 'event',
        payload: {
            website: 'fec28edd-89bf-4433-9309-15a90ccbec43',
            hostname: 'felgen.ansatt.nav.no',
            screen: '420x69',
            language: 'en-GB',
            title: 'tittelgreier',
            url: 'felgen.ansatt.nav.no/greier',
            referrer: '12345678910',
        },
    };

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K)',
        },
    };

    const res = http.post(url, JSON.stringify(payload), params);

    check(res, {
        'status is 201': (r) => r.status === 201
    });

    sleep(1);
}
