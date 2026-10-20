import { USE_BACKEND } from '../config.js';
import { localAdapter } from './localAdapter.js';

let api = localAdapter;
if (USE_BACKEND) api = (await import('./httpAdapter.js')).httpAdapter;

export { api };
