import * as esptool from "https://unpkg.com/esptool-js@2.0.0/dist/web/index.js";

let port;
let chip;

const statusText = (msg) => {
  document.getElementById("status").textContent = msg;
  console.log(msg);
};

async function autoDetectPort() {
  const ports = await navigator.serial.getPorts();
  if (ports.length > 0) {
    port = ports[0];
    await port.open({ baudRate: 115200 });
    return true;
  }
  return false;
}

document.getElementById("connect").onclick = async () => {
  try {
    const autoDetected = await autoDetectPort();
    if (!autoDetected) {
      port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
    }

    chip = new esptool.ESPLoader(port, true);
    await chip.initialize();
    await chip.detectChip();

    document.getElementById("chip-info").textContent = "Connected to: " + chip.chipName;
    statusText("✅ Connected to " + chip.chipName);
  } catch (e) {
    statusText("❌ Connection failed: " + e.message);
  }
};

document.getElementById("flash").onclick = async () => {
  if (!chip) {
    alert("Please connect to device first!");
    return;
  }

  const files = {
    bootloader: document.getElementById("bootloader").files[0],
    partition: document.getElementById("partition").files[0],
    app: document.getElementById("app").files[0],
  };

  for (let [name, file] of Object.entries(files)) {
    if (!file) {
      alert(`Please select ${name}.bin`);
      return;
    }
  }

  const firmwareParts = [];
  const chipName = chip.chipName.toLowerCase();

  if (chipName.includes("esp8266") || chipName.includes("esp8285")) {
    firmwareParts.push({ file: files.bootloader, address: 0x0000 });
    firmwareParts.push({ file: files.partition,  address: 0x1000 });
    firmwareParts.push({ file: files.app,        address: 0x2000 });
  } else {
    firmwareParts.push({ file: files.bootloader, address: 0x1000 });
    firmwareParts.push({ file: files.partition,  address: 0x8000 });
    firmwareParts.push({ file: files.app,        address: 0x10000 });
  }

  try {
    for (const part of firmwareParts) {
      const buf = await part.file.arrayBuffer();
      statusText(`🚀 Flashing ${part.file.name} to 0x${part.address.toString(16)}`);
      await chip.flashData(new Uint8Array(buf), part.address);
    }

    statusText("✅ All parts flashed successfully!");
  } catch (e) {
    statusText("❌ Flashing failed: " + e.message);
  }
};
