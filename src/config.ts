export const config = {
  api: {
    url: process.env.CACHE_OVERFLOW_URL ?? 'https://cache-overflow.onrender.com/api',
    timeout: parseInt(process.env.CACHE_OVERFLOW_TIMEOUT ?? '30000'),
  },
  auth: {
    token: process.env.CACHE_OVERFLOW_TOKEN,
  },
};
