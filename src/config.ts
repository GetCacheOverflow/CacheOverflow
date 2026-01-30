export const config = {
  api: {
    url: process.env.CACHE_OVERFLOW_API_URL ?? 'https://api.cache-overflow.dev',
    timeout: parseInt(process.env.CACHE_OVERFLOW_TIMEOUT ?? '30000'),
  },
  auth: {
    token: process.env.CACHE_OVERFLOW_TOKEN,
  },
};
