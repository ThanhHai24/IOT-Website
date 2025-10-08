#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <BH1750.h>
#include <ArduinoJson.h>

// ==== WiFi & MQTT Config ====
const char* ssid       = "Thanhhai";
const char* password   = "Thanhhai2004@";
const char* mqtt_server= "172.20.10.2";
const char* mqtt_user  = "ThanhHai";
const char* mqtt_pass  = "thanhhai2004";

WiFiClient espClient;
PubSubClient client(espClient);

// ==== DHT11 Config ====
#define DHTPIN 2      // GPIO2 (D4)
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// ==== BH1750 Config ====
BH1750 lightMeter;

// ==== LED/Relay Pins ====
#define LED1 14   // GPIO14 (D5)
#define LED2 12   // GPIO12 (D6)
#define LED3 13   // GPIO13 (D7)

// ==== MQTT Topics ====
// Sensors (ESP -> Server)
const char* sensorsTopic = "esp8266/sensors";          // JSON sensor data
// Commands (Server -> ESP)
const char* devicesTopic = "esp8266/devices";          // {"id":1,"status":"ON"}
// ACK (ESP -> Server)  ✅ đổi sang topic ACK như yêu cầu
const char* devicesAckTopic = "esp8266/devices/ack";   // {"id":1,"status":"ON"}

// ===== WiFi =====
void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Đang kết nối WiFi: "); Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.println("\nWiFi đã kết nối!");
  Serial.print("IP: "); Serial.println(WiFi.localIP());
}

// ===== Helpers: publish ACK =====
void publishAck(int id, int pin, const char* actionBy) {
  const char* status = (digitalRead(pin) == HIGH) ? "ON" : "OFF";

  StaticJsonDocument<128> doc;
  doc["id"] = id;
  doc["status"] = status;
  doc["actionBy"] = actionBy ? actionBy : "System";  // ✅ giữ lại User/System

  char buffer[128];
  size_t n = serializeJson(doc, buffer);

  bool ok = client.publish(devicesAckTopic, buffer, false);
  Serial.print("PUB ACK -> "); Serial.print(devicesAckTopic);
  Serial.print(" : "); Serial.print(buffer);
  Serial.println(ok ? " [OK]" : " [FAIL]");
}

void publishAllAck() {
  publishAck(1, LED1, "System");
  publishAck(2, LED2, "System");
  publishAck(3, LED3, "System");
}

// ===== MQTT callback =====
void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) message += (char)payload[i];
  message.trim();

  Serial.print("MQTT IN ["); Serial.print(topic); Serial.print("] ");
  Serial.println(message);

  if (String(topic) == devicesTopic) {
    StaticJsonDocument<128> doc;
    DeserializationError error = deserializeJson(doc, message);
    if (error) {
      Serial.print("JSON parse failed: ");
      Serial.println(error.c_str());
      return;
    }

    int id = doc["id"] | 0;
    const char* status = doc["status"] | "";
    const char* actionBy = doc["actionBy"] | "System";   // ✅ lấy actionBy từ command
    bool on = (String(status) == "ON");

    switch (id) {
      case 1:
        digitalWrite(LED1, on ? HIGH : LOW);
        Serial.println(on ? "LED1 đã bật" : "LED1 đã tắt");
        publishAck(1, LED1, actionBy);  // ✅ truyền actionBy vào ACK
        break;
      case 2:
        digitalWrite(LED2, on ? HIGH : LOW);
        Serial.println(on ? "LED2 đã bật" : "LED2 đã tắt");
        publishAck(2, LED2, actionBy);
        break;
      case 3:
        digitalWrite(LED3, on ? HIGH : LOW);
        Serial.println(on ? "LED3 đã bật" : "LED3 đã tắt");
        publishAck(3, LED3, actionBy);
        break;
      default:
        Serial.println("ID không hợp lệ (chỉ 1-3)");
        break;
    }
  }
}

// ===== MQTT reconnect =====
void reconnect() {
  while (!client.connected()) {
    Serial.print("Đang kết nối MQTT (auth)...");
    // clientID nên unique; thêm hậu tố nếu cần
    if (client.connect("ESP8266Client", mqtt_user, mqtt_pass)) {
      Serial.println("Đã kết nối!");
      client.subscribe(devicesTopic);

      // Gửi ACK trạng thái hiện tại ngay sau khi kết nối
      publishAllAck();
    } else {
      Serial.print("Thất bại, rc="); Serial.print(client.state());
      Serial.println(" -> Thử lại sau 5s");
      delay(5000);
    }
  }
}

// ===== Setup =====
void setup() {
  Serial.begin(115200);

  pinMode(LED1, OUTPUT);
  pinMode(LED2, OUTPUT);
  pinMode(LED3, OUTPUT);
  // mặc định tắt
  digitalWrite(LED1, LOW);
  digitalWrite(LED2, LOW);
  digitalWrite(LED3, LOW);

  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);

  dht.begin();
  Wire.begin(4, 5); // SDA=GPIO4 (D2), SCL=GPIO5 (D1)
  lightMeter.begin();
}

// ===== Loop =====
void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  // Đọc và publish cảm biến định kỳ
  static unsigned long lastSend = 0;
  const unsigned long interval = 2000; // 2s
  unsigned long now = millis();
  if (now - lastSend >= interval) {
    lastSend = now;

    float h   = dht.readHumidity();
    float t   = dht.readTemperature();
    float lux = lightMeter.readLightLevel();

    if (isnan(h) || isnan(t) || isnan(lux)) {
      Serial.println("Sensor read error");
      return;
    }

    StaticJsonDocument<128> doc;
    doc["temp"]  = t;
    doc["humid"] = h;
    doc["light"] = lux;
    // Nếu muốn gửi timestamp (millis):
    // doc["ts_ms"] = (uint32_t)millis();

    char payload[128];
    serializeJson(doc, payload);

    // Sensors nên có retained để web/BE lấy được last known ngay khi subscribe
    bool ok = client.publish(sensorsTopic, payload, true);
    Serial.print("PUB sensors: "); Serial.print(payload);
    Serial.println(ok ? " [OK]" : " [FAIL]");
  }
}
