import { createApp } from './app.mjs';

const PORT = Number(process.env.PORT || 8787);
const app = createApp();

app.listen(PORT, () => {
  console.log(`[lighting-server] http://localhost:${PORT}`);
});
