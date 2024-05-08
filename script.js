// DOM Elements

const connectButton = document.getElementById('connectBleButton');
const disconnectButton = document.getElementById('disconnectBleButton');
const onButton = document.getElementById('onButton');
const offButton = document.getElementById('offButton');
const resetButton = document.getElementById('resetButton');
const retrievedValueX = document.getElementById('gyroX');
const retrievedValueY = document.getElementById('gyroY');
const retrievedValueZ = document.getElementById('gyroZ');
const latestValueSent = document.getElementById('valueSent');
const bleStateContainer = document.getElementById('bleState');
const timestampContainer = document.getElementById('timestamp');

//Define BLE Device Specs
var deviceName ='ESP32';
var bleService = '3f99a446-02a8-4846-a64a-8d468982be74';
var ledCharacteristic = '19b10002-e8f2-537e-4f6c-d104768a1214';
var sensorCharacteristicX= '038ff370-2844-44ab-8956-4779a0f4870d';
var sensorCharacteristicY= 'c597038d-566b-428c-ac5c-8ce53d987bf9';
var sensorCharacteristicZ= '90c365c5-4a27-4fc4-941c-15d58c1b4154';

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
        return service.getCharacteristic(sensorCharacteristicX);
    })
    .then(characteristicX => {
        console.log("Characteristic discovered:", characteristicX.uuid);
        sensorCharacteristicFoundX = characteristicX;
        characteristicX.addEventListener('characteristicxvaluechanged', handleCharacteristicChangeX);
        characteristicX.startNotifications();
        console.log("Notifications Started.");
        return characteristicX.readValue();
    })
    .then(valueX => {
        console.log("Read value: ", valueX);
        const decodedValueX = new TextDecoder().decode(valueX);
        console.log("Decoded value: ", decodedValueX);
        retrievedValueX.innerHTML = decodedValueX;
    })
    .then(service => {
        bleServiceFound = service;
        console.log("Service discovered:", service.uuid);
        return service.getCharacteristic(sensorCharacteristicY);
    })
    .then(characteristicY => {
        console.log("Characteristic discovered:", characteristicY.uuid);
        sensorCharacteristicFoundY = characteristicY;
        characteristicY.addEventListener('characteristicyvaluechanged', handleCharacteristicChangeY);
        characteristicY.startNotifications();
        console.log("Notifications Started.");
        return characteristicY.readValue();
    })
    .then(valueY => {
        console.log("Read value: ", valueY);
        const decodedValueY = new TextDecoder().decode(valueY);
        console.log("Decoded value: ", decodedValueY);
        retrievedValueY.innerHTML = decodedValueY;
    })
    .then(service => {
        bleServiceFound = service;
        console.log("Service discovered:", service.uuid);
        return service.getCharacteristic(sensorCharacteristicZ);
    })
    .then(characteristicZ => {
        console.log("Characteristic discovered:", characteristicZ.uuid);
        sensorCharacteristicFoundZ = characteristicZ;
        characteristicZ.addEventListener('characteristiczvaluechanged', handleCharacteristicChangeZ);
        characteristicZ.startNotifications();
        console.log("Notifications Started.");
        return characteristicZ.readValue();
    })
    .then(valueZ => {
        console.log("Read value: ", valueZ);
        const decodedValueZ = new TextDecoder().decode(valueZ);
        console.log("Decoded value: ", decodedValueZ);
        retrievedValueZ.innerHTML = decodedValueZ;
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

function handleCharacteristicChangeX(event){
    const newValueReceivedX = new TextDecoder().decode(event.target.valueX);
    console.log("Characteristic value changed: ", newValueReceivedX);
    retrievedValueX.innerHTML = newValueReceivedX;
}
function handleCharacteristicChangeY(event){
    const newValueReceivedY = new TextDecoder().decode(event.target.valueY);
    console.log("Characteristic value changed: ", newValueReceivedY);
    retrievedValueY.innerHTML = newValueReceivedY;
}
function handleCharacteristicChangeZ(event){
    const newValueReceivedZ = new TextDecoder().decode(event.target.valueZ);
    console.log("Characteristic value changed: ", newValueReceivedZ);
    retrievedValueZ.innerHTML = newValueReceivedZ;
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
        if (sensorCharacteristicFoundX & sensorCharacteristicFoundY & sensorCharacteristicFoundZ) {
            sensorCharacteristicFound.stopNotifications()
                .then(() => {
                    console.log("Notifications Stopped");
                    return bleServer.disconnect();
                })
                .then(() => {
                    console.log("Device Disconnected");
                    bleStateContainer.innerHTML = "Dispositivo Desconectado";
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