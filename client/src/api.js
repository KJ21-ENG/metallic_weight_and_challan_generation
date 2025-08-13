import axios from 'axios';
export const api = axios.create({ baseURL: 'http://localhost:4000/api' });
export async function getOptions(type) {
    const res = await api.get(`/master/${type}`);
    return res.data;
}
