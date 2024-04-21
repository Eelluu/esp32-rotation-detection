// DOM Elements

let scene, camera, rendered, cube;

function parentWidth(elem) {
    return elem.parentElement.clientWidth;
  }
  
function parentHeight(elem) {
    return elem.parentElement.clientHeight;
}
const connectButton = document.getElementById('connectBleButton');
const disconnectButton = document.getElementById('disconnectBleButton');
const onButton = document.getElementById('onButton');
const offButton = document.getElementById('offButton');
const resetButton = document.getElementById('resetButton');
const retrievedValue = document.getElementById('valueContainer');
const latestValueSent = document.getElementById('valueSent');
const bleStateContainer = document.getElementById('bleState');
const timestampContainer = document.getElementById('timestamp');

//Define BLE Device Specs
var deviceName ='ESP32';
var bleService = '19b10000-e8f2-537e-4f6c-d104768a1214';
var ledCharacteristic = '19b10002-e8f2-537e-4f6c-d104768a1214';
var sensorCharacteristic= '19b10001-e8f2-537e-4f6c-d104768a1214';

//Global Variables to Handle Bluetooth
var bleServer;
var bleServiceFound;
var sensorCharacteristicFound;

// Connect Button (search for BLE Devices only if BLE is available)
connectButton.addEventListener('click', (event) => {
    if (isWebBluetoothEnabled()){
        connectToDevice();
    }
});

// Disconnect Button
disconnectButton.addEventListener('click', disconnectDevice);

// Write to the ESP32 LED Characteristic
onButton.addEventListener('click', () => writeOnCharacteristic(1));
offButton.addEventListener('click', () => writeOnCharacteristic(0));

// Check if BLE is available in your Browser
function isWebBluetoothEnabled() {
    if (!navigator.bluetooth) {
        console.log('Web Bluetooth API is not available in this browser!');
        bleStateContainer.innerHTML = "Web Bluetooth API is not available in this browser/device!";
        return false
    }
    console.log('Web Bluetooth API supported in this browser.');
    return true
}

// Connect to BLE Device and Enable Notifications
function connectToDevice(){
    console.log('Initializing Bluetooth...');
    navigator.bluetooth.requestDevice({
        filters: [{name: deviceName}],
        optionalServices: [bleService]
    })
    .then(device => {
        console.log('Device Selected:', device.name);
        bleStateContainer.innerHTML = 'Connected to device ' + device.name;
        bleStateContainer.style.color = "#24af37";
        device.addEventListener('gattservicedisconnected', onDisconnected);
        return device.gatt.connect();
    })
    .then(gattServer =>{
        bleServer = gattServer;
        console.log("Connected to GATT Server");
        return bleServer.getPrimaryService(bleService);
    })
    .then(service => {
        bleServiceFound = service;
        console.log("Service discovered:", service.uuid);
        return service.getCharacteristic(sensorCharacteristic);
    })
    .then(characteristic => {
        console.log("Characteristic discovered:", characteristic.uuid);
        sensorCharacteristicFound = characteristic;
        characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicChange);
        characteristic.startNotifications();
        console.log("Notifications Started.");
        return characteristic.readValue();
    })
    .then(value => {
        console.log("Read value: ", value);
        const decodedValue = new TextDecoder().decode(value);
        console.log("Decoded value: ", decodedValue);
        retrievedValue.innerHTML = decodedValue;
    })
    .catch(error => {
        console.log('Error: ', error);
    })
}

function onDisconnected(event){
    console.log('Device Disconnected:', event.target.device.name);
    bleStateContainer.innerHTML = "Device disconnected";
    bleStateContainer.style.color = "#d13a30";

    connectToDevice();
}

function handleCharacteristicChange(event){
    const newValueReceived = new TextDecoder().decode(event.target.value);
    console.log("Characteristic value changed: ", newValueReceived);
    retrievedValue.innerHTML = newValueReceived;
    timestampContainer.innerHTML = getDateTime();
}

function writeOnCharacteristic(value){
    if (bleServer && bleServer.connected) {
        bleServiceFound.getCharacteristic(ledCharacteristic)
        .then(characteristic => {
            console.log("Found the LED characteristic: ", characteristic.uuid);
            const data = new Uint8Array([value]);
            return characteristic.writeValue(data);
        })
        .then(() => {
            latestValueSent.innerHTML = value;
            console.log("Value written to LEDcharacteristic:", value);
        })
        .catch(error => {
            console.error("Error writing to the LED characteristic: ", error);
        });
    } else {
        console.error ("Bluetooth is not connected. Cannot write to characteristic.")
        window.alert("Bluetooth is not connected. Cannot write to characteristic. \n Connect to BLE first!")
    }
}

function disconnectDevice() {
    console.log("Disconnect Device.");
    if (bleServer && bleServer.connected) {
        if (sensorCharacteristicFound) {
            sensorCharacteristicFound.stopNotifications()
                .then(() => {
                    console.log("Notifications Stopped");
                    return bleServer.disconnect();
                })
                .then(() => {
                    console.log("Device Disconnected");
                    bleStateContainer.innerHTML = "Device Disconnected";
                    bleStateContainer.style.color = "#d13a30";

                })
                .catch(error => {
                    console.log("An error occurred:", error);
                });
        } else {
            console.log("No characteristic found to disconnect.");
        }
    } else {
        // Throw an error if Bluetooth is not connected
        console.error("Bluetooth is not connected.");
        window.alert("Bluetooth is not connected.")
    }
}

function getDateTime() {
    var currentdate = new Date();
    var day = ("00" + currentdate.getDate()).slice(-2); // Convert day to string and slice
    var month = ("00" + (currentdate.getMonth() + 1)).slice(-2);
    var year = currentdate.getFullYear();
    var hours = ("00" + currentdate.getHours()).slice(-2);
    var minutes = ("00" + currentdate.getMinutes()).slice(-2);
    var seconds = ("00" + currentdate.getSeconds()).slice(-2);

    var datetime = day + "/" + month + "/" + year + " at " + hours + ":" + minutes + ":" + seconds;
    return datetime;
}


function init3D(){
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
  
    camera = new THREE.PerspectiveCamera(75, parentWidth(document.getElementById("3Dcube")) / parentHeight(document.getElementById("3Dcube")), 0.1, 1000);
  
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(parentWidth(document.getElementById("3Dcube")), parentHeight(document.getElementById("3Dcube")));
  
    document.getElementById('3Dcube').appendChild(renderer.domElement);
  
    // Create a geometry
    const geometry = new THREE.BoxGeometry(5, 1, 4);
  
    // Materials of each face
    var cubeMaterials = [
      new THREE.MeshBasicMaterial({color:0x03045e}),
      new THREE.MeshBasicMaterial({color:0x023e8a}),
      new THREE.MeshBasicMaterial({color:0x0077b6}),
      new THREE.MeshBasicMaterial({color:0x03045e}),
      new THREE.MeshBasicMaterial({color:0x023e8a}),
      new THREE.MeshBasicMaterial({color:0x0077b6}),
    ];
  
    const material = new THREE.MeshFaceMaterial(cubeMaterials);
  
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    camera.position.z = 5;
    renderer.render(scene, camera);
  }
  
  // Resize the 3D object when the browser window changes size
function onWindowResize(){
    camera.aspect = parentWidth(document.getElementById("3Dcube")) / parentHeight(document.getElementById("3Dcube"));
    //camera.aspect = window.innerWidth /  window.innerHeight;
    camera.updateProjectionMatrix();
    //renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setSize(parentWidth(document.getElementById("3Dcube")), parentHeight(document.getElementById("3Dcube")));
  
}
  
window.addEventListener('resize', onWindowResize, false);
  
  // Create the 3D representation
init3D();

if (!!window.EventSource) {
  
    source.addEventListener('gyro_readings', function(e) {
      //console.log("gyro_readings", e.data);
      var obj = JSON.parse(e.data);
      document.getElementById("gyroX").innerHTML = obj.gyroX;
      document.getElementById("gyroY").innerHTML = obj.gyroY;
      document.getElementById("gyroZ").innerHTML = obj.gyroZ;
  
      // Change cube rotation after receiving the readinds
      cube.rotation.x = obj.gyroY;
      cube.rotation.z = obj.gyroX;
      cube.rotation.y = obj.gyroZ;
      renderer.render(scene, camera);
    }, false);
  
    source.addEventListener('temperature_reading', function(e) {
      console.log("temperature_reading", e.data);
      document.getElementById("temp").innerHTML = e.data;
    }, false);
  
    source.addEventListener('accelerometer_readings', function(e) {
      console.log("accelerometer_readings", e.data);
      var obj = JSON.parse(e.data);
      document.getElementById("accX").innerHTML = obj.accX;
      document.getElementById("accY").innerHTML = obj.accY;
      document.getElementById("accZ").innerHTML = obj.accZ;
    }, false);
}