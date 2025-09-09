import mqtt from 'mqtt';
import dayjs from 'dayjs';
import 'dotenv/config';
import { SensorData, Device, ActionHistory } from '../models/index.js';

let client;
export const getMqttClient = () => client;

/** Tìm device theo id hoặc name (ưu tiên id) */
async function findDeviceByIdentity(payload) {
  if (payload.id != null) {
    const byId = await Device.findByPk(payload.id);
    if (byId) return byId;
  }
  if (payload.name) {
    const byName = await Device.findOne({ where: { name: payload.name } });
    if (byName) return byName;
  }
  return null;
}

export function initMqtt(io) {
  const options = {};
  if (process.env.MQTT_USER && process.env.MQTT_PASS) {
    options.username = process.env.MQTT_USER;
    options.password = process.env.MQTT_PASS;
  }
  client = mqtt.connect(process.env.MQTT_URL, options);

  client.on('connect', () => {
    console.log('[MQTT] Connected');
    client.subscribe([
      process.env.MQTT_TOPIC_SENSORS,
      process.env.MQTT_TOPIC_ACK
    ]);
  });

  client.on('message', async (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());

      // 1) Lưu sensor data
      if (topic === process.env.MQTT_TOPIC_SENSORS) {
        const row = await SensorData.create({
          temp:  payload.temp  ?? payload.temperature,
          humid: payload.humid ?? payload.humidity,
          light: payload.light ?? payload.lux,
          measured_at: payload.measured_at ? new Date(payload.measured_at) : new Date()
        });
        io.emit('sensors:new', row);
      }

      // 2) Nhận ACK trạng thái thiết bị để cập nhật usage time
      if (topic === process.env.MQTT_TOPIC_ACK) {
        const now = new Date();
        const dev = await findDeviceByIdentity(payload);
        if (!dev || !payload.status) return;

        // reset usage nếu qua ngày
        const todayStr = dayjs(now).format('YYYY-MM-DD');
        if (dev.usage_date !== todayStr) {
          await dev.update({ usage_seconds_today: 0, usage_date: todayStr });
        }

        // Nếu đang ON và chuyển OFF => cộng dồn thời gian
        if (dev.status === 'ON' && payload.status === 'OFF' && dev.last_state_changed_at) {
          const seconds = Math.max(0, Math.floor((now - new Date(dev.last_state_changed_at)) / 1000));
          await dev.update({ usage_seconds_today: dev.usage_seconds_today + seconds });
        }

        // Cập nhật trạng thái + mốc đổi trạng thái
        await dev.update({
          status: payload.status,               // 'ON' | 'OFF'
          last_state_changed_at: now
        });

        // Ghi lịch sử
        await ActionHistory.create({
          deviceId: dev.id,
          status: payload.status,
          time: now
        });

        io.emit('devices:update', {
          id: dev.id,
          name: dev.name,
          status: dev.status,
          usage_seconds_today: dev.usage_seconds_today,
          usage_date: dev.usage_date
        });
      }
    } catch (e) {
      console.error('[MQTT] message error:', e.message);
    }
  });

  client.on('error', (err) => console.error('[MQTT] error:', err.message));
}

/** Publish lệnh điều khiển thiết bị: { id|name, status } */
export async function publishDeviceCommand({ id, name, status }) {
  const topic = process.env.MQTT_TOPIC_DEVICES;
  const msgObj = {};
  if (id != null) msgObj.id = id;
  if (name) msgObj.name = name;
  msgObj.status = status; // 'ON' | 'OFF'
  const msg = JSON.stringify(msgObj);

  client.publish(topic, msg, { qos: 0, retain: false });
  return { topic, msg };
}
