import 'dotenv/config';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import { syncModels, Device } from './models/index.js';
import { initMqtt } from './services/mqttService.js';

const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*' } });

(async () => {
  await syncModels();

  // seed 3 thiết bị nếu chưa có (theo name)
  const defaults = [{ name: 'LIGHT BULB' }, { name: 'FAN' }, { name: 'AIR CONDITIONER' }];
  for (const d of defaults) {
    const found = await Device.findOne({ where: { name: d.name } });
    if (!found) await Device.create(d);
  }

  initMqtt(io);

  const port = process.env.PORT || 3000;
  server.listen(port, () => console.log(`Server running http://localhost:${port}`));
})();
