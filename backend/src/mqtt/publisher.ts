import mqtt, { type IClientOptions, type MqttClient } from 'mqtt';
import { env } from '../config/env.js';
import type { CityWeatherRecord } from '../db/repositories/city-weather.repository.js';

function waitForConnect(client: MqttClient): Promise<void> {
  return new Promise((resolve, reject) => {
    if (client.connected) {
      resolve();
      return;
    }

    const onConnect = () => {
      cleanup();
      resolve();
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const cleanup = () => {
      client.off('connect', onConnect);
      client.off('error', onError);
    };

    client.on('connect', onConnect);
    client.on('error', onError);
  });
}

function publishMessage(client: MqttClient, topic: string, payload: string): Promise<void> {
  return new Promise((resolve, reject) => {
    client.publish(topic, payload, { qos: 1, retain: true }, (error?: Error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

export type WeatherPublisher = {
  connect: () => Promise<void>;
  publishCurrent: (record: CityWeatherRecord) => Promise<void>;
  disconnect: () => Promise<void>;
};

export function createWeatherPublisher(): WeatherPublisher {
  const options: IClientOptions = {
    username: env.MQTT_USERNAME,
    password: env.MQTT_PASSWORD,
    reconnectPeriod: 1000,
    connectTimeout: 10_000,
  };

  const client = mqtt.connect(env.MQTT_URL, options);
  const topicPrefix = env.MQTT_TOPIC_PREFIX;

  client.on('reconnect', () => {
    console.log('[mqtt] reconnecting...');
  });

  client.on('connect', () => {
    console.log('[mqtt] connected');
  });

  client.on('error', (error: Error) => {
    console.error('[mqtt] error', error.message);
  });

  return {
    connect: async () => {
      await waitForConnect(client);
    },
    publishCurrent: async (record) => {
      const topic = `${topicPrefix}/${record.cityKey}/current`;
      const payload = JSON.stringify(record);
      await publishMessage(client, topic, payload);
    },
    disconnect: async () => {
      await new Promise<void>((resolve) => {
        client.end(false, {}, () => {
          resolve();
        });
      });
    },
  };
}
