   import * as esptool from "https://unpkg.com/esptool-js@2.0.0/dist/web/index.js";

    let port;
    let chip;

    const statusText = (msg) => {
      document.getElementById("status").textContent = msg;
      console.log(msg);
    };

    document.getElementById("connect").onclick = async () => {
      try {
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 115200 });

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

      const fileInput = document.getElementById("firmware");
      if (!fileInput.files.length) {
        alert("Please select a firmware .bin file");
        return;
      }

      const firmwareFile = fileInput.files[0];
      const firmwareArrayBuffer = await firmwareFile.arrayBuffer();

      try {
        let flashAddress = 0x1000; // default for ESP32
        const chipName = chip.chipName.toLowerCase();

        if (chipName.includes("esp8266") || chipName.includes("esp8285")) {
          flashAddress = 0x0000; // ESP8266/8285 เริ่มที่ 0x0
        }

        statusText(`🚀 Flashing ${firmwareFile.name} to ${chip.chipName} at 0x${flashAddress.toString(16)}`);
        await chip.flashData(new Uint8Array(firmwareArrayBuffer), flashAddress);
        statusText("✅ Firmware flashed successfully!");
      } catch (e) {
        statusText("❌ Flashing failed: " + e.message);
      }
    };