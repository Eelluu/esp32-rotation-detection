// Basic demo for accelerometer readings from Adafruit MPU6050

#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>


#define A_R 16384.0 // 32768/2
#define G_R 131.0 // 32768/250
 
//Conversion de radianes a grados 180/PI
#define RAD_A_DEG 57.295779
//Angulos
float Acc[2];
float Gy[3];
float Angle[3];

String valores;
const int ledPin = 13;
float angulo_inicial;
long tiempo_prev;
float dt;
bool flanco_on=false;

Adafruit_MPU6050 mpu;

BLEServer *pServer = nullptr;
BLEService *pService = nullptr;

BLECharacteristic *pAngXCharacteristic = nullptr;
BLECharacteristic *pAngYCharacteristic = nullptr;
BLECharacteristic *pAngZCharacteristic = nullptr;
BLECharacteristic *comparisonCharacteristic = nullptr;
BLECharacteristic *resetCharacteristic = nullptr;
bool enableComparison = false;  // Estado del interruptor para comparar ángulos
bool buzzerState = false;
unsigned long lastUpdateTime = 0;
#define SERVICE_UUID        "19b10000-e8f2-537e-4f6c-d104768a1214"
#define SENSOR_CHARACTERISTIC_UUID "19b10001-e8f2-537e-4f6c-d104768a1214"
#define ANGLEX_CHARACTERISTIC_UUID "19b10002-e8f2-537e-4f6c-d104768a1214"
#define ANGLEY_CHARACTERISTIC_UUID "19b10003-e8f2-537e-4f6c-d104768a1214"
#define ANGLEZ_CHARACTERISTIC_UUID "19b10004-e8f2-537e-4f6c-d104768a1214"
#define RESET_CHARACTERISTIC_UUID "19b10005-e8f2-537e-4f6c-d104768a1214"
#define COMPARISON_CHARACTERISTIC_UUID "19b10006-e8f2-537e-4f6c-d104768a1214"
bool deviceConnected = false;
bool oldDeviceConnected = false;
uint32_t value = 0;

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
    }
};
class MyCharacteristicCallbacks : public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic* comparisonCharacteristic) {
        std::string value = comparisonCharacteristic->getValue();
        if (value.length() > 0) {
            Serial.print("Characteristic event, written: ");
            Serial.println(static_cast<int>(value[0])); // Print the integer value

            int receivedValue = static_cast<int>(value[0]);
            if (receivedValue == 1) {
                enableComparison = true;
                Serial.println("Comparación activada");
            } else {
                enableComparison = false;
                Serial.println("Comparación desactivada");
            }
        }
    }
};
class MyCharacteristicCallbacks2 : public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic* resetCharacteristic) {
        std::string value = resetCharacteristic->getValue();
        if (value.length() > 0) {
            Serial.print("Characteristic event, written: ");
            Serial.println(static_cast<int>(value[0])); // Print the integer value

            int receivedValue = static_cast<int>(value[0]);
            if (receivedValue == 1) {
                angulo_inicial=Angle[1];
                Serial.println("reseteado");
              
            } 
        }
    }
};
void setup(void) {
  Serial.begin(115200);
  while (!Serial)
    delay(10); // will pause Zero, Leonardo, etc until serial console opens

  Serial.println("Adafruit MPU6050 test!");

  // Try to initialize!
  if (!mpu.begin()) {
    Serial.println("Failed to find MPU6050 chip");
    while (1) {
      delay(10);
    }
  }
  Serial.println("MPU6050 Found!");

  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  Serial.print("Accelerometer range set to: ");
  switch (mpu.getAccelerometerRange()) {
  case MPU6050_RANGE_2_G:
    Serial.println("+-2G");
    break;
  case MPU6050_RANGE_4_G:
    Serial.println("+-4G");
    break;
  case MPU6050_RANGE_8_G:
    Serial.println("+-8G");
    break;
  case MPU6050_RANGE_16_G:
    Serial.println("+-16G");
    break;
  }
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  Serial.print("Gyro range set to: ");
  switch (mpu.getGyroRange()) {
  case MPU6050_RANGE_250_DEG:
    Serial.println("+- 250 deg/s");
    break;
  case MPU6050_RANGE_500_DEG:
    Serial.println("+- 500 deg/s");
    break;
  case MPU6050_RANGE_1000_DEG:
    Serial.println("+- 1000 deg/s");
    break;
  case MPU6050_RANGE_2000_DEG:
    Serial.println("+- 2000 deg/s");
    break;
  }

  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  Serial.print("Filter bandwidth set to: ");
  switch (mpu.getFilterBandwidth()) {
  case MPU6050_BAND_260_HZ:
    Serial.println("260 Hz");
    break;
  case MPU6050_BAND_184_HZ:
    Serial.println("184 Hz");
    break;
  case MPU6050_BAND_94_HZ:
    Serial.println("94 Hz");
    break;
  case MPU6050_BAND_44_HZ:
    Serial.println("44 Hz");
    break;
  case MPU6050_BAND_21_HZ:
    Serial.println("21 Hz");
    break;
  case MPU6050_BAND_10_HZ:
    Serial.println("10 Hz");
    break;
  case MPU6050_BAND_5_HZ:
    Serial.println("5 Hz");
    break;
  }

  Serial.println("");
  pinMode(ledPin,OUTPUT);
  // Configuración de BLE
    BLEDevice::init("ESP32");

  // Create the BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Create the BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create a BLE Characteristic
  pAngXCharacteristic = pService->createCharacteristic(
                      ANGLEX_CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ   |
                      BLECharacteristic::PROPERTY_WRITE  |
                      BLECharacteristic::PROPERTY_NOTIFY |
                      BLECharacteristic::PROPERTY_INDICATE
                    );
  pAngYCharacteristic = pService->createCharacteristic(
                      ANGLEY_CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ   |
                      BLECharacteristic::PROPERTY_WRITE  |
                      BLECharacteristic::PROPERTY_NOTIFY |
                      BLECharacteristic::PROPERTY_INDICATE
                    );
  pAngZCharacteristic = pService->createCharacteristic(
                      ANGLEZ_CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ   |
                      BLECharacteristic::PROPERTY_WRITE  |
                      BLECharacteristic::PROPERTY_NOTIFY |
                      BLECharacteristic::PROPERTY_INDICATE
                    );
  comparisonCharacteristic = pService->createCharacteristic(
                      COMPARISON_CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_WRITE
                    );
  resetCharacteristic = pService->createCharacteristic(
                      RESET_CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_WRITE
                    );
  // Create the ON button Characteristic
  

  // Register the callback for the ON button characteristic
  comparisonCharacteristic->setCallbacks(new MyCharacteristicCallbacks());
  // https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.descriptor.gatt.client_characteristic_configuration.xml
  // Create a BLE Descriptor
  resetCharacteristic->setCallbacks(new MyCharacteristicCallbacks2());
  pAngXCharacteristic->addDescriptor(new BLE2902());
  pAngYCharacteristic->addDescriptor(new BLE2902());
  pAngZCharacteristic->addDescriptor(new BLE2902());
  comparisonCharacteristic->addDescriptor(new BLE2902());
  resetCharacteristic->addDescriptor(new BLE2902()); 


  // Start the service
  pService->start();

  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(0x0);  // set value to 0x00 to not advertise this parameter
  BLEDevice::startAdvertising();
  Serial.println("Waiting a client connection to notify...");
  delay(100);
}

void loop() {
  if (deviceConnected) {
  /* Get new sensor events with the readings */
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  Acc[1] = atan(-1*(a.acceleration.x/A_R)/sqrt(pow((a.acceleration.y/A_R),2) + pow((a.acceleration.z/A_R),2)))*RAD_A_DEG;
  Acc[0] = atan((a.acceleration.y/A_R)/sqrt(pow((a.acceleration.x/A_R),2) + pow((a.acceleration.z/A_R),2)))*RAD_A_DEG;
 
  
   //Calculo del angulo del Giroscopio
   Gy[0] = g.gyro.x/G_R;
   Gy[1] = g.gyro.y/G_R;
   Gy[2] = g.gyro.z/G_R;

   dt = (millis() - tiempo_prev) / 1000.0;
   tiempo_prev = millis();
 
   //Aplicar el Filtro Complementario
   Angle[0] = 0.98 *(Angle[0]+Gy[0]*dt) + 0.02*Acc[0];
   Angle[1] = 0.98 *(Angle[1]+Gy[1]*dt) + 0.02*Acc[1];

   //Integración respecto del tiempo paras calcular el YAW
   Angle[2] = Angle[2]+Gy[2]*dt;
 
   //Mostrar los valores por consola
   valores = "90, " +String(Angle[0]) + "," + String(Angle[1]) + "," + String(Angle[2]) + ", -90";
   Serial.println(valores);
   pAngXCharacteristic->setValue(String(Angle[0]).c_str());
   pAngXCharacteristic->notify();
   pAngYCharacteristic->setValue(String(Angle[1]).c_str());
   pAngYCharacteristic->notify();
   pAngZCharacteristic->setValue(String(Angle[2]).c_str());
   pAngZCharacteristic->notify();
   
  if (enableComparison==1){
   if( !flanco_on && enableComparison){
      angulo_inicial=Angle[1];
    }
    Serial.println("Encendido");
    Serial.println(angulo_inicial);
      if (Angle[1]>angulo_inicial+30 | Angle[1]<angulo_inicial-30 ){ //AJUSTAR LOS ANGULOS PROBANDO LAS POSICIONES
        digitalWrite(ledPin,HIGH);
      }
      else{
        digitalWrite(ledPin,LOW);
       };
  }
  else{
     Serial.println("Apagado");
     digitalWrite(ledPin,LOW);
  }
  flanco_on=enableComparison;
   delay(1);
  }
  if (!deviceConnected && oldDeviceConnected) {
        Serial.println("Device disconnected.");
        delay(500); // give the bluetooth stack the chance to get things ready
        pServer->startAdvertising(); // restart advertising
        Serial.println("Start advertising");
        oldDeviceConnected = deviceConnected;
    }
    // connecting
    if (deviceConnected && !oldDeviceConnected) {
        // do stuff here on connecting
        oldDeviceConnected = deviceConnected;
        Serial.println("Device Connected");
    }
}