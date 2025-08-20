import axios from 'axios';
function resolveApiBase() {
    try {
        const params = new URLSearchParams(window.location.search);
        const apiBase = params.get('apiBase');
        if (apiBase)
            return `${apiBase.replace(/\/$/, '')}/api`;
    }
    catch { }
    return 'http://localhost:4000/api';
}
export const api = axios.create({ baseURL: resolveApiBase() });
export async function getOptions(type) {
    const res = await api.get(`/master/${type}`);
    return res.data;
}
