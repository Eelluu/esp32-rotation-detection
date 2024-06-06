Éste es un proyecto que utiliza un esp32, un sensor MPU6050, y un zumbador.
El sensor debe ir conectado a los dos pines de I2C, para los pines de SDA y SDL, y luego debe ir conectado a una salida de 3.3v o 5v y GND.
El zumbador está asignado por defecto al GPIO 13, pero se puede cambiar tanto el pin, como el zumbador por un LED o un motor vibrador y así que no sea tan molesta la visualización.

Una vez montado, el esp32 se conecta por BLE a un dispositivo, ya sea móvil u ordenador, y envía la información del sensor y desde la página web, se puede controlar el pin, para activar o desactivar la salida del zumbador.

Para Android, Chrome viene por defecto con funcionalidad BLE, pero para iOS, es necesario descargar un navegador extra, ya que Safari no permite a día de escribir ésto, conectar con dispositivos BLE. Bluefy es la opción más sencilla: https://apps.apple.com/es/app/bluefy-web-ble-browser/id1492822055. En Windows, Opera no me ha permitido conectarme a través de BLE, pero Edge y Chromium sí.


Basado en la implementación web-ble de Random Nerd Tutorials: https://randomnerdtutorials.com/esp32-web-bluetooth/
