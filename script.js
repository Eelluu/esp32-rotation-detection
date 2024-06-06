const SERVICE_UUID = '180C';
const ANGLE_X_UUID = '2A63';
const ANGLE_Y_UUID = '2A64';
const ANGLE_Z_UUID = '2A65';
const COMPARISON_UUID = '2A66';
const RESET_UUID = '2A67';

let angleXChar;
let angleYChar;
let angleZChar;
let comparisonChar;
let resetChar;

const connectButton = document.getElementById('connect-btn');
const resetButton = document.getElementById('reset-btn');
const comparisonSwitch = document.getElementById('comparison-switch');
const anglesDiv = document.getElementById('angles');
const angleXSpan = document.getElementById('angleX');
const angleYSpan = document.getElementById('angleY');
const angleZSpan = document.getElementById('angleZ');

async function connectBLE() {
    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ services: [SERVICE_UUID] }]
        });

        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(SERVICE_UUID);

        angleXChar = await service.getCharacteristic(ANGLE_X_UUID);
        angleYChar = await service.getCharacteristic(ANGLE_Y_UUID);
        angleZChar = await service.getCharacteristic(ANGLE_Z_UUID);
        comparisonChar = await service.getCharacteristic(COMPARISON_UUID);
        resetChar = await service.getCharacteristic(RESET_UUID);

        // Enable notifications
        await angleXChar.startNotifications();
        await angleYChar.startNotifications();
        await angleZChar.startNotifications();

        angleXChar.addEventListener('characteristicvaluechanged', updateAngleX);
        angleYChar.addEventListener('characteristicvaluechanged', updateAngleY);
        angleZChar.addEventListener('characteristicvaluechanged', updateAngleZ);

        anglesDiv.hidden = false;

        console.log('Conexión BLE establecida.');
    } catch (error) {
        console.error('Error al conectar BLE:', error);
    }
}

function updateAngleX(event) {
    const value = event.target.value.getInt32(0, true) / 100;
    angleXSpan.textContent = value.toFixed(2);
}

function updateAngleY(event) {
    const value = event.target.value.getInt32(0, true) / 100;
    angleYSpan.textContent = value.toFixed(2);
}

function updateAngleZ(event) {
    const value = event.target.value.getInt32(0, true) / 100;
    angleZSpan.textContent = value.toFixed(2);
}

async function toggleComparison(event) {
    const value = event.target.checked ? new Uint8Array([1]) : new Uint8Array([0]);
    try {
        await comparisonChar.writeValue(value);
        console.log('Estado del interruptor de comparación cambiado:', value[0]);
    } catch (error) {
        console.error('Error al cambiar el estado de comparación:', error);
    }
}

async function resetAngles() {
    try {
        await resetChar.writeValue(new Uint8Array([1]));
        console.log('Ángulos restablecidos.');
    } catch (error) {
        console.error('Error al restablecer ángulos:', error);
    }
}

connectButton.addEventListener('click', connectBLE);
resetButton.addEventListener('click', resetAngles);
comparisonSwitch.addEventListener('change', toggleComparison);