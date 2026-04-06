// Vercel serverless function
let app;

export default async function handler(req, res) {
  if (!app) {
    const module = await import('../server/index.mjs');
    app = module.default;
  }
  return app(req, res);
}
