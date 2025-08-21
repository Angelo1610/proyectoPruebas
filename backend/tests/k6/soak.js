import http from 'k6/http';
import { check } from 'k6';

export let options = {
    stages: [
        { duration: '5m', target: 40 },  // ramp-up
        { duration: '30m', target: 50 }, // carga sostenida 50 VUs
        { duration: '5m', target: 0 },   // ramp-down
    ],
    thresholds: {
        'http_req_duration{expected_response:true}': ['p(95)<1500'], // p95 < 1.5s
        'http_req_failed': ['rate<0.01'],
        'checks': ['rate>0.99'],
    },
};

export default function () {
    let loginRes = http.post('http://localhost:3000/api/usuarios/login', JSON.stringify({
        email: 'riveracarlos@gmail.com',
        password: '123456'
    }), { headers: { 'Content-Type': 'application/json' }});

    check(loginRes, {
        'login successful': (r) => r.status === 200,
        'token received': (r) => r.json('token') !== undefined,
    });

    let token = loginRes.json('token');

    let res = http.get('http://localhost:3000/api/reservas', {
        headers: { Authorization: `Bearer ${token}` },
    });

    check(res, {
        'status is 200': (r) => r.status === 200,
        'expected_response': (r) => r.json().length >= 0,
    });
}
