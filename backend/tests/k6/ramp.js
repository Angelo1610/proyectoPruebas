import http from 'k6/http';
import { check } from 'k6';

export let options = {
    stages: [
        { duration: '3m', target: 10 },   // subida gradual
        { duration: '3m', target: 50 },  
        { duration: '3m', target: 100 },  // hasta 100 VUs
    ],
    thresholds: {
        'http_req_duration{expected_response:true}': ['p(95)<2000'], // p95 < 2s
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
