const port = Number(process.env.GAME_SERVER_PORT || 5555);
const proxy = {
  "/api": `http://127.0.0.1:${port}`,
  "/ws": { target: `ws://127.0.0.1:${port}`, ws: true },
};
export default {
  server: {
    host: "localhost",
    port: Number(process.env.STUDIO_PORT || 7777),
    strictPort: false,
    proxy,
  },
  preview: {
    host: "localhost",
    port: Number(process.env.STUDIO_PORT || 7777),
    strictPort: false,
    proxy,
  },
};
