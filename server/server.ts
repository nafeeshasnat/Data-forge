import app from './app';
import { PORT } from './config';

app.listen(PORT, () => {
  console.log(`[Server] Server listening on port ${PORT}`);
});
