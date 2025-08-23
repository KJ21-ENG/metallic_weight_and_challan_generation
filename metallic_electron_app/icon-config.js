// Icon configuration for Bohra Jari Challan System
// This file helps manage icons across different platforms

const path = require('path');

const iconConfig = {
  // Main application icon
  main: path.join(__dirname, 'Bohra_Jari_Logo.png'),
  
  // Platform-specific icon paths (you can add these later if needed)
  windows: {
    icon: path.join(__dirname, 'Bohra_Jari_Logo.png'),
    // For Windows, you might want to create .ico files with multiple sizes
    // icon: path.join(__dirname, 'icons', 'windows', 'icon.ico')
  },
  
  mac: {
    icon: path.join(__dirname, 'Bohra_Jari_Logo.png'),
    // For macOS, you might want to create .icns files
    // icon: path.join(__dirname, 'icons', 'mac', 'icon.icns')
  },
  
  linux: {
    icon: path.join(__dirname, 'Bohra_Jari_Logo.png'),
    // For Linux, you might want to create .png files in different sizes
    // icon: path.join(__dirname, 'icons', 'linux', 'icon.png')
  }
};

module.exports = iconConfig;
