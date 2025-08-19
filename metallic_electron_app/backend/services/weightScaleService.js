const { SerialPort } = require('serialport');
const EventEmitter = require('events');
const os = require('os');
const fs = require('fs');

class WeightScaleService extends EventEmitter {
  constructor() {
    super();
    this.port = null;
    this.buffer = '';
    this.isConnected = false;

    this.defaultPort = os.platform() === 'win32' ? 'COM3' : '/dev/tty.usbserial-140';
    this.defaultBaudRate = 2400;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 3;

    console.log(`Weight scale service initialized with default port: ${this.defaultPort}`);
  }

  async initialize(options = {}) {
    try {
      const portPath = options.port || this.defaultPort;
      const baudRate = options.baudRate || this.defaultBaudRate;

      await this.disconnect();

      console.log(`Attempting to connect to weight scale on ${portPath} at ${baudRate} baud...`);

      this.port = new SerialPort({
        path: portPath,
        baudRate: baudRate,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        autoOpen: false
      });

      return new Promise((resolve, reject) => {
        this.port.open((err) => {
          if (err) {
            console.error('Failed to open serial port:', err);
            this.isConnected = false;
            reject(err);
            return;
          }

          console.log('Connected to weight scale');
          this.isConnected = true;

          this.port.on('data', (data) => {
            this.handleData(data);
          });

          this.port.on('error', (err) => {
            console.error('Serial port error:', err);
            this.emit('error', err);
          });

          this.port.on('close', () => {
            console.log('Serial port closed');
            this.isConnected = false;
            this.emit('disconnected');
          });

          resolve(true);
        });
      });
    } catch (error) {
      console.error('Error initializing weight scale:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async autoDetectAndConnect() {
    console.log('Attempting to auto-detect weight scale...');
    try {
      const ports = await SerialPort.list();
      console.log('Available ports:', ports);

      if (ports.length === 0) throw new Error('No serial ports found');

      this.connectionAttempts = 0;
      const commonPorts = [];
      const platform = os.platform();

      if (platform === 'darwin') {
        commonPorts.push('/dev/tty.usbserial', '/dev/tty.usbmodem', '/dev/tty.SLAB_USBtoUART', '/dev/cu.usbserial');
        ports.forEach(port => {
          if (port.path.includes('usb') && !commonPorts.includes(port.path)) commonPorts.push(port.path);
        });
      } else if (platform === 'win32') {
        for (let i = 1; i <= 10; i++) commonPorts.push(`COM${i}`);
      }

      console.log('Trying common ports first:', commonPorts);

      for (const portPath of commonPorts) {
        if (!ports.some(p => p.path && p.path.startsWith(portPath))) continue;

        try {
          await this.disconnect();

          this.port = new SerialPort({ path: portPath, baudRate: this.defaultBaudRate, dataBits: 8, parity: 'none', stopBits: 1, autoOpen: false });
          const connected = await this.tryConnect(portPath);
          if (connected) return true;
        } catch (portError) { continue; }
      }

      for (const portInfo of ports) {
        if (commonPorts.includes(portInfo.path)) continue;
        if (!this.isLikelyScalePort(portInfo)) continue;

        try {
          await this.disconnect();
          this.port = new SerialPort({ path: portInfo.path, baudRate: this.defaultBaudRate, dataBits: 8, parity: 'none', stopBits: 1, autoOpen: false });
          const connected = await this.tryConnect(portInfo.path);
          if (connected) return true;
        } catch (portError) { continue; }
      }

      throw new Error('Could not detect and connect to the weight scale on any port');
    } catch (error) {
      console.error('Auto-detection failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  isLikelyScalePort(portInfo) {
    const platform = os.platform();
    if (platform === 'win32') return portInfo.path.startsWith('COM');
    else if (platform === 'darwin') return (portInfo.path.includes('usbserial') || portInfo.path.includes('usbmodem') || portInfo.path.includes('Bluetooth-Incoming-Port'));
    return (portInfo.path.includes('ttyUSB') || portInfo.path.includes('ttyACM'));
  }

  async tryConnect(portPath) {
    this.connectionAttempts++;
    try {
      await fs.promises.access(portPath, fs.constants.R_OK | fs.constants.W_OK).catch(() => { });
    } catch (err) { }

    return new Promise((resolve, reject) => {
      this.port.open((err) => {
        if (err) { reject(err); return; }
        console.log(`Port ${portPath} opened successfully, waiting for data...`);

        const dataTimeout = setTimeout(() => {
          if (this.port && this.port.isOpen) this.port.close();
          this.isConnected = false;
          reject(new Error('No weight data detected from this port'));
        }, 5000);

        const onData = (data) => {
          const dataStr = data.toString('utf8');
          console.log(`Data received from ${portPath}:`, dataStr);
          this.buffer += dataStr;

          const hasNumericData = /\d+/.test(this.buffer);
          const hasOpenBracket = this.buffer.includes('[');
          const hasCloseBracket = this.buffer.includes(']');

          if ((hasOpenBracket && hasCloseBracket) || (hasNumericData && this.buffer.length > 3)) {
            clearTimeout(dataTimeout);
            this.port.removeListener('data', onData);
            this.port.on('data', (d) => this.handleData(d));
            this.port.on('error', (err) => this.emit('error', err));
            this.port.on('close', () => { this.isConnected = false; this.emit('disconnected'); });
            this.isConnected = true;
            resolve(true);
          }
        };

        this.port.on('data', onData);

        const onError = (err) => { clearTimeout(dataTimeout); this.port.removeListener('data', onData); reject(err); };
        const onClose = () => { clearTimeout(dataTimeout); this.port.removeListener('data', onData); reject(new Error('Port closed unexpectedly')); };

        this.port.on('error', onError);
        this.port.on('close', onClose);
      });
    });
  }

  handleData(data) {
    this.buffer += data.toString('utf8');
    const { weights, remainingBuffer } = this.processBuffer(this.buffer);
    this.buffer = remainingBuffer;
    if (weights.length > 0) this.emit('weight', weights[weights.length - 1]);
  }

  processBuffer(buffer) {
    const weights = [];
    let remainingBuffer = buffer;
    while (true) {
      const startIdx = remainingBuffer.indexOf('[');
      if (startIdx === -1) break;
      const endIdx = remainingBuffer.indexOf(']', startIdx);
      if (endIdx === -1) break;
      const reading = remainingBuffer.substring(startIdx + 1, endIdx);
      remainingBuffer = remainingBuffer.substring(endIdx + 1);

      if (/^\d{5}$/.test(reading)) {
        const weight = parseInt(reading, 10) / 100;
        weights.push(weight);
      } else if (/^\d+\.\d+$/.test(reading)) {
        const weight = parseFloat(reading);
        weights.push(weight);
      } else if (/^\d+$/.test(reading)) {
        const weightOption1 = parseInt(reading, 10) / 100;
        const weight = weightOption1;
        weights.push(weight);
      }
    }
    return { weights, remainingBuffer };
  }

  async captureWeight() {
    if (!this.isConnected) throw new Error('Weight scale not connected');
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { this.removeListener('weight', onWeight); reject(new Error('Timeout waiting for weight reading')); }, 5000);
      const onWeight = (weight) => { clearTimeout(timeout); this.removeListener('weight', onWeight); resolve(weight); };
      this.once('weight', onWeight);
    });
  }

  async disconnect() {
    if (!this.port) { this.isConnected = false; return true; }
    if (!this.port.isOpen) { this.isConnected = false; this.port = null; return true; }
    return new Promise((resolve) => {
      const closeTimeout = setTimeout(() => { this.isConnected = false; this.port = null; resolve(true); }, 2000);
      this.port.close((err) => { clearTimeout(closeTimeout); this.isConnected = false; this.buffer = ''; try { this.port.removeAllListeners(); } catch {} this.port = null; resolve(true); });
    });
  }

  async getAvailablePorts() { return SerialPort.list(); }
}

const weightScaleService = new WeightScaleService();
module.exports = weightScaleService;



