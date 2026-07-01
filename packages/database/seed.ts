import { PrismaClient, LifecycleStatus, PinType, AssetType } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to generate a random 384-dimensional vector as a string for pgvector
function generateRandomVector(): string {
  const vector = Array.from({ length: 384 }, () => (Math.random() * 2 - 1).toFixed(6));
  return `[${vector.join(',')}]`;
}

async function main() {
  console.log('Starting database seeding...');

  // 1. Clean up existing data in reverse order of dependencies
  console.log('Cleaning up existing database records...');
  await prisma.aIMessage.deleteMany();
  await prisma.aIConversation.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.bOM.deleteMany();
  await prisma.projectComponent.deleteMany();
  await prisma.project.deleteMany();
  await prisma.distributorStock.deleteMany();
  await prisma.cadAsset.deleteMany();
  await prisma.pin.deleteMany();
  await prisma.datasheet.deleteMany();
  await prisma.component.deleteMany();
  await prisma.category.deleteMany();
  await prisma.manufacturer.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
  console.log('Database cleanup complete.');

  // 2. Seed Users
  console.log('Seeding Users...');
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@electrohub.com',
      role: 'ADMIN',
      emailVerified: new Date(),
      image: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
      password: '$2b$12$K3eT9.N4H2gKq9tZ2w/8OepB2xW1pA2vI9L8Y7X6c5b4a3f2e1d0c', // bcrypt hash for 'AdminPassword123!'
    },
  });

  const engineerUser = await prisma.user.create({
    data: {
      name: 'Jane Doe',
      email: 'jane.doe@electrohub.com',
      role: 'USER',
      emailVerified: new Date(),
      image: 'https://api.dicebear.com/7.x/bottts/svg?seed=jane',
      password: '$2b$12$K3eT9.N4H2gKq9tZ2w/8OepB2xW1pA2vI9L8Y7X6c5b4a3f2e1d0c', // bcrypt hash for 'EngineerPassword123!'
    },
  });

  // 3. Seed Manufacturers
  console.log('Seeding Manufacturers...');
  const ti = await prisma.manufacturer.create({
    data: {
      name: 'Texas Instruments',
      website: 'https://www.ti.com',
      aliases: ['TI', 'Texas Inst', 'Texas Instruments Inc.'],
    },
  });

  const onSemi = await prisma.manufacturer.create({
    data: {
      name: 'ON Semiconductor',
      website: 'https://www.onsemi.com',
      aliases: ['ON', 'onsemi', 'Fairchild'],
    },
  });

  const espressif = await prisma.manufacturer.create({
    data: {
      name: 'Espressif Systems',
      website: 'https://www.espressif.com',
      aliases: ['Espressif', 'ESPR'],
    },
  });

  const stMicro = await prisma.manufacturer.create({
    data: {
      name: 'STMicroelectronics',
      website: 'https://www.st.com',
      aliases: ['ST', 'STM', 'ST Microelectronics'],
    },
  });

  // 4. Seed Categories (Hierarchical Tree)
  console.log('Seeding Categories...');
  // Root Categories
  const ics = await prisma.category.create({
    data: {
      name: 'Integrated Circuits (ICs)',
      path: 'ics',
    },
  });

  const discretes = await prisma.category.create({
    data: {
      name: 'Discrete Semiconductors',
      path: 'discretes',
    },
  });

  // Sub-categories for ICs
  const pmic = await prisma.category.create({
    data: {
      name: 'Power Management (PMIC)',
      parentId: ics.id,
      path: 'ics.pmic',
    },
  });

  const converters = await prisma.category.create({
    data: {
      name: 'Data Converters',
      parentId: ics.id,
      path: 'ics.converters',
    },
  });

  const rfWireless = await prisma.category.create({
    data: {
      name: 'RF & Wireless',
      parentId: ics.id,
      path: 'ics.rf',
    },
  });

  // Sub-categories for Power Management
  const linearRegs = await prisma.category.create({
    data: {
      name: 'Linear Voltage Regulators',
      parentId: pmic.id,
      path: 'ics.pmic.linear_regulators',
    },
  });

  const timers = await prisma.category.create({
    data: {
      name: 'Timers & Oscillators',
      parentId: pmic.id,
      path: 'ics.pmic.timers',
    },
  });

  // Sub-categories for Data Converters
  const adcs = await prisma.category.create({
    data: {
      name: 'Analog to Digital Converters (ADC)',
      parentId: converters.id,
      path: 'ics.converters.adc',
    },
  });

  // Sub-categories for RF & Wireless
  const wifiBt = await prisma.category.create({
    data: {
      name: 'Wi-Fi & Bluetooth Modules',
      parentId: rfWireless.id,
      path: 'ics.rf.wifi_bt',
    },
  });

  // Sub-categories for Discretes
  const transistors = await prisma.category.create({
    data: {
      name: 'Transistors',
      parentId: discretes.id,
      path: 'discretes.transistors',
    },
  });

  const bjts = await prisma.category.create({
    data: {
      name: 'Bipolar Transistors (BJT)',
      parentId: transistors.id,
      path: 'discretes.transistors.bjt',
    },
  });

  // 5. Seed Components and Associated Data
  console.log('Seeding Components...');

  // Component 1: NE555DR (Timer IC)
  const ne555 = await prisma.component.create({
    data: {
      mpn: 'NE555DR',
      description: 'Precision Timer IC, Single, 100kHz, 4.5V to 16V operating range, SOIC-8 package.',
      manufacturerId: ti.id,
      categoryId: timers.id,
      lifecycle: LifecycleStatus.ACTIVE,
      specs: {
        package: 'SOIC-8',
        frequency_max: 100000, // 100 kHz
        supply_voltage_min: 4.5,
        supply_voltage_max: 16.0,
        output_current_max: 0.2, // 200 mA
        operating_temperature_min: -40,
        operating_temperature_max: 85,
        quiescent_current: 0.003, // 3 mA
      },
    },
  });

  // Component 2: LM7805ACT (5V Linear Regulator)
  const lm7805 = await prisma.component.create({
    data: {
      mpn: 'LM7805ACT',
      description: 'Three-Terminal Positive Voltage Regulator, 5V Output, 1.5A Max, TO-220 Package.',
      manufacturerId: onSemi.id,
      categoryId: linearRegs.id,
      lifecycle: LifecycleStatus.ACTIVE,
      specs: {
        package: 'TO-220',
        output_voltage_fixed: 5.0,
        output_current_max: 1.5,
        input_voltage_min: 7.0,
        input_voltage_max: 25.0,
        dropout_voltage: 2.0,
        operating_temperature_min: 0,
        operating_temperature_max: 125,
      },
    },
  });

  // Component 3: ESP32-WROOM-32E-N4 (Wi-Fi/BT MCU)
  const esp32 = await prisma.component.create({
    data: {
      mpn: 'ESP32-WROOM-32E-N4',
      description: 'Wi-Fi + BT + BLE MCU Module, Espressif ESP32-D0WD-V3 chip, 4MB Flash, SMD PCB Antenna.',
      manufacturerId: espressif.id,
      categoryId: wifiBt.id,
      lifecycle: LifecycleStatus.ACTIVE,
      specs: {
        package: 'SMD-38',
        core_frequency: 240000000, // 240 MHz
        flash_size: 4194304, // 4 MB
        ram_size: 532480, // 520 KB
        supply_voltage_min: 3.0,
        supply_voltage_max: 3.6,
        operating_temperature_min: -40,
        operating_temperature_max: 85,
        wireless_protocols: ['Wi-Fi 802.11 b/g/n', 'Bluetooth 4.2', 'BLE'],
      },
    },
  });

  // Component 4: 2N2222A (NPN Transistor)
  const transistor2n2222 = await prisma.component.create({
    data: {
      mpn: '2N2222A',
      description: 'General Purpose NPN Bipolar Junction Transistor, 40V, 600mA, TO-92 Package.',
      manufacturerId: onSemi.id,
      categoryId: bjts.id,
      lifecycle: LifecycleStatus.ACTIVE,
      specs: {
        package: 'TO-92',
        transistor_type: 'NPN',
        collector_emitter_voltage_max: 40.0,
        collector_current_max: 0.6,
        power_dissipation_max: 0.625,
        dc_current_gain_min: 100,
        dc_current_gain_max: 300,
        transition_frequency: 300000000, // 300 MHz
        operating_temperature_min: -55,
        operating_temperature_max: 150,
      },
    },
  });

  // Component 5: LM317T (Adjustable Linear Regulator)
  const lm317 = await prisma.component.create({
    data: {
      mpn: 'LM317T',
      description: 'Medium Current 1.2V to 37V Adjustable Positive Voltage Regulator, 1.5A Max, TO-220.',
      manufacturerId: stMicro.id,
      categoryId: linearRegs.id,
      lifecycle: LifecycleStatus.ACTIVE,
      specs: {
        package: 'TO-220',
        output_voltage_min: 1.25,
        output_voltage_max: 37.0,
        output_current_max: 1.5,
        input_output_voltage_diff_max: 40.0,
        operating_temperature_min: 0,
        operating_temperature_max: 125,
      },
    },
  });

  // Component 6: ADS1115IDGSR (16-bit ADC)
  const ads1115 = await prisma.component.create({
    data: {
      mpn: 'ADS1115IDGSR',
      description: 'Ultra-Small, Low-Power, 16-Bit Analog-to-Digital Converter (ADC) with Internal Reference and PGA, VSSOP-10.',
      manufacturerId: ti.id,
      categoryId: adcs.id,
      lifecycle: LifecycleStatus.ACTIVE,
      specs: {
        package: 'VSSOP-10',
        resolution_bits: 16,
        sampling_rate_max: 860, // 860 SPS
        channels_count: 4,
        interface: 'I2C',
        supply_voltage_min: 2.0,
        supply_voltage_max: 5.5,
        operating_temperature_min: -40,
        operating_temperature_max: 125,
      },
    },
  });

  // 6. Seed Pins for Components
  console.log('Seeding Pins...');

  // NE555DR Pins (8 pins)
  await prisma.pin.createMany({
    data: [
      { componentId: ne555.id, number: '1', name: 'GND', type: PinType.GROUND, functionalGroup: 'Power', color: '#00FF00', description: 'Ground reference voltage' },
      { componentId: ne555.id, number: '2', name: 'TRIG', type: PinType.INPUT, functionalGroup: 'Control', color: '#FFA500', description: 'Trigger input (starts timer when < 1/3 VCC)' },
      { componentId: ne555.id, number: '3', name: 'OUT', type: PinType.OUTPUT, functionalGroup: 'Signal', color: '#FF0000', description: 'Timer output' },
      { componentId: ne555.id, number: '4', name: 'RESET', type: PinType.INPUT, functionalGroup: 'Control', color: '#FFA500', description: 'Active-low reset input' },
      { componentId: ne555.id, number: '5', name: 'CONT', type: PinType.ANALOG, functionalGroup: 'Analog', color: '#0000FF', description: 'Control voltage input' },
      { componentId: ne555.id, number: '6', name: 'THRES', type: PinType.INPUT, functionalGroup: 'Control', color: '#FFA500', description: 'Threshold input (resets timer when > 2/3 VCC)' },
      { componentId: ne555.id, number: '7', name: 'DISCH', type: PinType.BIDIRECT, functionalGroup: 'Analog', color: '#800080', description: 'Open-collector discharge pin' },
      { componentId: ne555.id, number: '8', name: 'VCC', type: PinType.POWER, functionalGroup: 'Power', color: '#FF0000', description: 'Positive supply voltage' },
    ],
  });

  // LM7805ACT Pins (3 pins)
  await prisma.pin.createMany({
    data: [
      { componentId: lm7805.id, number: '1', name: 'IN', type: PinType.POWER, functionalGroup: 'Power', color: '#FF0000', description: 'Unregulated input voltage' },
      { componentId: lm7805.id, number: '2', name: 'GND', type: PinType.GROUND, functionalGroup: 'Power', color: '#00FF00', description: 'Ground reference' },
      { componentId: lm7805.id, number: '3', name: 'OUT', type: PinType.POWER, functionalGroup: 'Power', color: '#FF0000', description: 'Regulated +5V output' },
    ],
  });

  // 2N2222A Pins (3 pins)
  await prisma.pin.createMany({
    data: [
      { componentId: transistor2n2222.id, number: '1', name: 'E', type: PinType.PASSIVE, functionalGroup: 'BJT', color: '#808080', description: 'Emitter' },
      { componentId: transistor2n2222.id, number: '2', name: 'B', type: PinType.INPUT, functionalGroup: 'BJT', color: '#FFA500', description: 'Base' },
      { componentId: transistor2n2222.id, number: '3', name: 'C', type: PinType.PASSIVE, functionalGroup: 'BJT', color: '#808080', description: 'Collector' },
    ],
  });

  // LM317T Pins (3 pins)
  await prisma.pin.createMany({
    data: [
      { componentId: lm317.id, number: '1', name: 'ADJ', type: PinType.INPUT, functionalGroup: 'Control', color: '#0000FF', description: 'Output voltage adjustment pin' },
      { componentId: lm317.id, number: '2', name: 'OUT', type: PinType.POWER, functionalGroup: 'Power', color: '#FF0000', description: 'Regulated output voltage (connected to tab)' },
      { componentId: lm317.id, number: '3', name: 'IN', type: PinType.POWER, functionalGroup: 'Power', color: '#FF0000', description: 'Unregulated input voltage' },
    ],
  });

  // ADS1115IDGSR Pins (10 pins)
  await prisma.pin.createMany({
    data: [
      { componentId: ads1115.id, number: '1', name: 'ADDR', type: PinType.INPUT, functionalGroup: 'I2C', color: '#FFA500', description: 'I2C address select pin' },
      { componentId: ads1115.id, number: '2', name: 'ALERT/RDY', type: PinType.OUTPUT, functionalGroup: 'Control', color: '#FF0000', description: 'Digital comparator alert or conversion ready' },
      { componentId: ads1115.id, number: '3', name: 'GND', type: PinType.GROUND, functionalGroup: 'Power', color: '#00FF00', description: 'Ground reference' },
      { componentId: ads1115.id, number: '4', name: 'AIN0', type: PinType.ANALOG, functionalGroup: 'Analog Input', color: '#0000FF', description: 'Analog input channel 0' },
      { componentId: ads1115.id, number: '5', name: 'AIN1', type: PinType.ANALOG, functionalGroup: 'Analog Input', color: '#0000FF', description: 'Analog input channel 1' },
      { componentId: ads1115.id, number: '6', name: 'AIN2', type: PinType.ANALOG, functionalGroup: 'Analog Input', color: '#0000FF', description: 'Analog input channel 2' },
      { componentId: ads1115.id, number: '7', name: 'AIN3', type: PinType.ANALOG, functionalGroup: 'Analog Input', color: '#0000FF', description: 'Analog input channel 3' },
      { componentId: ads1115.id, number: '8', name: 'VDD', type: PinType.POWER, functionalGroup: 'Power', color: '#FF0000', description: 'Positive supply voltage (2.0V to 5.5V)' },
      { componentId: ads1115.id, number: '9', name: 'SDA', type: PinType.BIDIRECT, functionalGroup: 'I2C', color: '#800080', description: 'I2C serial data line' },
      { componentId: ads1115.id, number: '10', name: 'SCL', type: PinType.INPUT, functionalGroup: 'I2C', color: '#FFA500', description: 'I2C serial clock line' },
    ],
  });

  // ESP32-WROOM-32E-N4 Pins (38 pins)
  await prisma.pin.createMany({
    data: [
      { componentId: esp32.id, number: '1', name: 'GND', type: PinType.GROUND, functionalGroup: 'Power', color: '#00FF00', description: 'Ground connection' },
      { componentId: esp32.id, number: '2', name: '3V3', type: PinType.POWER, functionalGroup: 'Power', color: '#FF0000', description: '3.3V power supply' },
      { componentId: esp32.id, number: '3', name: 'EN', type: PinType.INPUT, functionalGroup: 'Control', color: '#FFA500', description: 'Enable/Reset pin (active high)' },
      { componentId: esp32.id, number: '4', name: 'SENSOR_VP', type: PinType.ANALOG, functionalGroup: 'Analog Input', color: '#0000FF', description: 'GPIO36, ADC1_CH0, RTC_GPIO0' },
      { componentId: esp32.id, number: '5', name: 'SENSOR_VN', type: PinType.ANALOG, functionalGroup: 'Analog Input', color: '#0000FF', description: 'GPIO39, ADC1_CH3, RTC_GPIO3' },
      { componentId: esp32.id, number: '6', name: 'IO34', type: PinType.INPUT, functionalGroup: 'GPIO', color: '#800080', description: 'GPIO34, ADC1_CH6, RTC_GPIO4 (Input only)' },
      { componentId: esp32.id, number: '7', name: 'IO35', type: PinType.INPUT, functionalGroup: 'GPIO', color: '#800080', description: 'GPIO35, ADC1_CH7, RTC_GPIO5 (Input only)' },
      { componentId: esp32.id, number: '8', name: 'IO32', type: PinType.BIDIRECT, functionalGroup: 'GPIO', color: '#800080', description: 'GPIO32, 32K_XP, ADC1_CH4, RTC_GPIO9' },
      { componentId: esp32.id, number: '9', name: 'IO33', type: PinType.BIDIRECT, functionalGroup: 'GPIO', color: '#800080', description: 'GPIO33, 32K_XN, ADC1_CH5, RTC_GPIO8' },
      { componentId: esp32.id, number: '10', name: 'IO25', type: PinType.BIDIRECT, functionalGroup: 'GPIO', color: '#800080', description: 'GPIO25, DAC_1, ADC2_CH8, RTC_GPIO6' },
      { componentId: esp32.id, number: '11', name: 'IO26', type: PinType.BIDIRECT, functionalGroup: 'GPIO', color: '#800080', description: 'GPIO26, DAC_2, ADC2_CH9, RTC_GPIO7' },
      { componentId: esp32.id, number: '12', name: 'IO27', type: PinType.BIDIRECT, functionalGroup: 'GPIO', color: '#800080', description: 'GPIO27, ADC2_CH7, Touch 7, RTC_GPIO17' },
      { componentId: esp32.id, number: '13', name: 'IO14', type: PinType.BIDIRECT, functionalGroup: 'GPIO/JTAG', color: '#800080', description: 'GPIO14, ADC2_CH6, Touch 6, RTC_GPIO16, TMS' },
      { componentId: esp32.id, number: '14', name: 'IO12', type: PinType.BIDIRECT, functionalGroup: 'GPIO/JTAG', color: '#800080', description: 'GPIO12, ADC2_CH5, Touch 5, RTC_GPIO15, MTDI (Strapping)' },
      { componentId: esp32.id, number: '15', name: 'GND', type: PinType.GROUND, functionalGroup: 'Power', color: '#00FF00', description: 'Ground connection' },
      { componentId: esp32.id, number: '16', name: 'IO13', type: PinType.BIDIRECT, functionalGroup: 'GPIO/JTAG', color: '#800080', description: 'GPIO13, ADC2_CH4, Touch 4, RTC_GPIO14, MTCK' },
      { componentId: esp32.id, number: '17', name: 'SHD/SD2', type: PinType.BIDIRECT, functionalGroup: 'SPI Flash', color: '#808080', description: 'GPIO9, SD_DATA2 (Internal SPI connection)' },
      { componentId: esp32.id, number: '18', name: 'SWP/SD3', type: PinType.BIDIRECT, functionalGroup: 'SPI Flash', color: '#808080', description: 'GPIO10, SD_DATA3 (Internal SPI connection)' },
      { componentId: esp32.id, number: '19', name: 'SCS/CMD', type: PinType.BIDIRECT, functionalGroup: 'SPI Flash', color: '#808080', description: 'GPIO11, SD_CMD (Internal SPI connection)' },
      { componentId: esp32.id, number: '20', name: 'SCK/CLK', type: PinType.BIDIRECT, functionalGroup: 'SPI Flash', color: '#808080', description: 'GPIO6, SD_CLK (Internal SPI connection)' },
      { componentId: esp32.id, number: '21', name: 'SDO/SD0', type: PinType.BIDIRECT, functionalGroup: 'SPI Flash', color: '#808080', description: 'GPIO7, SD_DATA0 (Internal SPI connection)' },
      { componentId: esp32.id, number: '22', name: 'SDI/SD1', type: PinType.BIDIRECT, functionalGroup: 'SPI Flash', color: '#808080', description: 'GPIO8, SD_DATA1 (Internal SPI connection)' },
      { componentId: esp32.id, number: '23', name: 'IO15', type: PinType.BIDIRECT, functionalGroup: 'GPIO/JTAG', color: '#800080', description: 'GPIO15, ADC2_CH3, Touch 3, RTC_GPIO13, MTDO (Strapping)' },
      { componentId: esp32.id, number: '24', name: 'IO2', type: PinType.BIDIRECT, functionalGroup: 'GPIO', color: '#800080', description: 'GPIO2, ADC2_CH2, Touch 2, RTC_GPIO12 (Strapping, Blue LED)' },
      { componentId: esp32.id, number: '25', name: 'IO0', type: PinType.BIDIRECT, functionalGroup: 'GPIO', color: '#800080', description: 'GPIO0, ADC2_CH1, Touch 1, RTC_GPIO11 (Strapping, Boot Mode)' },
      { componentId: esp32.id, number: '26', name: 'IO4', type: PinType.BIDIRECT, functionalGroup: 'GPIO', color: '#800080', description: 'GPIO4, ADC2_CH0, Touch 0, RTC_GPIO10' },
      { componentId: esp32.id, number: '27', name: 'IO16', type: PinType.BIDIRECT, functionalGroup: 'GPIO', color: '#800080', description: 'GPIO16, HS2_DATA0, U2RXD' },
      { componentId: esp32.id, number: '28', name: 'IO17', type: PinType.BIDIRECT, functionalGroup: 'GPIO', color: '#800080', description: 'GPIO17, HS2_DATA1, U2TXD' },
      { componentId: esp32.id, number: '29', name: 'IO5', type: PinType.BIDIRECT, functionalGroup: 'GPIO', color: '#800080', description: 'GPIO5, VSPICS0, HS2_DATA2 (Strapping)' },
      { componentId: esp32.id, number: '30', name: 'IO18', type: PinType.BIDIRECT, functionalGroup: 'GPIO', color: '#800080', description: 'GPIO18, VSPICLK, HS2_DATA3' },
      { componentId: esp32.id, number: '31', name: 'IO19', type: PinType.BIDIRECT, functionalGroup: 'GPIO', color: '#800080', description: 'GPIO19, VSPIQ, U0CTS' },
      { componentId: esp32.id, number: '32', name: 'NC', type: PinType.PASSIVE, functionalGroup: 'NC', color: '#808080', description: 'No Connection' },
      { componentId: esp32.id, number: '33', name: 'IO21', type: PinType.BIDIRECT, functionalGroup: 'GPIO/I2C', color: '#800080', description: 'GPIO21, VSPIHD, SDA' },
      { componentId: esp32.id, number: '34', name: 'RXD0', type: PinType.INPUT, functionalGroup: 'UART', color: '#FFA500', description: 'GPIO3, U0RXD (Program/Debug)' },
      { componentId: esp32.id, number: '35', name: 'TXD0', type: PinType.OUTPUT, functionalGroup: 'UART', color: '#FF0000', description: 'GPIO1, U0TXD (Program/Debug)' },
      { componentId: esp32.id, number: '36', name: 'IO22', type: PinType.BIDIRECT, functionalGroup: 'GPIO/I2C', color: '#800080', description: 'GPIO22, VSPIWP, SCL' },
      { componentId: esp32.id, number: '37', name: 'IO23', type: PinType.BIDIRECT, functionalGroup: 'GPIO', color: '#800080', description: 'GPIO23, VSPID' },
      { componentId: esp32.id, number: '38', name: 'GND', type: PinType.GROUND, functionalGroup: 'Power', color: '#00FF00', description: 'Ground connection' },
    ],
  });

  // 7. Seed Datasheets
  console.log('Seeding Datasheets...');
  const datasheets = [
    { componentId: ne555.id, pdfUrl: 'https://www.ti.com/lit/ds/symlink/ne555.pdf', text: 'NE555 Single Precision Timer. The NE555 monolithic timing circuit is a highly stable controller capable of producing accurate time delays or oscillation. In the time-delay mode of operation, the time is precisely controlled by one external resistor and capacitor.' },
    { componentId: lm7805.id, pdfUrl: 'https://www.onsemi.com/pdf/datasheet/mc7800-d.pdf', text: 'LM7805 Series Positive Voltage Regulators. These voltage regulators are monolithic integrated circuits designed as fixed-voltage regulators for a wide variety of applications including local, on-card regulation.' },
    { componentId: esp32.id, pdfUrl: 'https://www.espressif.com/sites/default/files/documentation/esp32-wroom-32e_esp32-wroom-32ue_datasheet_en.pdf', text: 'ESP32-WROOM-32E Datasheet. ESP32-WROOM-32E is a powerful, generic Wi-Fi+BT+BLE MCU module that targets a wide variety of applications, ranging from low-power sensor networks to the most demanding tasks.' },
    { componentId: transistor2n2222.id, pdfUrl: 'https://www.onsemi.com/pdf/datasheet/2n2222a-d.pdf', text: '2N2222A Bipolar NPN Transistor. This device is designed for general purpose amplifier and switching applications. Collector-Emitter Voltage: 40V. Collector Current: 600mA.' },
    { componentId: lm317.id, pdfUrl: 'https://www.st.com/resource/en/datasheet/lm317.pdf', text: 'LM317 Adjustable Positive Voltage Regulator. The LM317 is a monolithic integrated circuit in TO-220 packages intended for use as positive adjustable voltage regulators. It is designed to supply more than 1.5A of load current with an output voltage adjustable over a 1.2 to 37V range.' },
    { componentId: ads1115.id, pdfUrl: 'https://www.ti.com/lit/ds/symlink/ads1115.pdf', text: 'ADS1115 Ultra-Small, Low-Power, 16-Bit Analog-to-Digital Converter with Internal Reference and Oscillator. The ADS1115 is designed with precision, power, and ease of implementation in mind. The ADS1115 features an onboard reference and oscillator.' },
  ];

  for (const ds of datasheets) {
    const createdDs = await prisma.datasheet.create({
      data: {
        componentId: ds.componentId,
        pdfUrl: ds.pdfUrl,
        extractedText: ds.text,
      },
    });

    // Write vector embedding using pgvector raw SQL to demonstrate proper vector database integration
    const vectorStr = generateRandomVector();
    await prisma.$executeRawUnsafe(
      `UPDATE "Datasheet" SET embedding = $1::vector WHERE id = $2`,
      vectorStr,
      createdDs.id
    );
  }

  // 8. Seed CAD Assets
  console.log('Seeding CAD Assets...');
  const components = [
    { id: ne555.id, pkg: 'soic-8' },
    { id: lm7805.id, pkg: 'to-220' },
    { id: esp32.id, pkg: 'smd-38' },
    { id: transistor2n2222.id, pkg: 'to-92' },
    { id: lm317.id, pkg: 'to-220' },
    { id: ads1115.id, pkg: 'vssop-10' },
  ];

  for (const comp of components) {
    await prisma.cadAsset.createMany({
      data: [
        {
          componentId: comp.id,
          type: AssetType.SYMBOL,
          fileUrl: `https://assets.electrohub.com/symbols/${comp.id}.sym`,
          checksum: `sha256_${Math.random().toString(36).substring(2, 10)}`,
        },
        {
          componentId: comp.id,
          type: AssetType.FOOTPRINT,
          fileUrl: `https://assets.electrohub.com/footprints/${comp.pkg}.pretty`,
          checksum: `sha256_${Math.random().toString(36).substring(2, 10)}`,
        },
        {
          componentId: comp.id,
          type: AssetType.MODEL_3D,
          fileUrl: `https://assets.electrohub.com/models3d/${comp.pkg}.wrl`,
          checksum: `sha256_${Math.random().toString(36).substring(2, 10)}`,
        },
      ],
    });
  }

  // 9. Seed Distributor Stock
  console.log('Seeding Distributor Stock...');
  const distributors = ['DIGIKEY', 'MOUSER', 'LCSC'];
  
  for (const comp of components) {
    for (const dist of distributors) {
      const basePrice = Math.random() * 2 + 0.1;
      await prisma.distributorStock.create({
        data: {
          componentId: comp.id,
          distributor: dist,
          sku: `${dist}-${comp.pkg.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
          stockQty: Math.floor(500 + Math.random() * 50000),
          priceTiers: [
            { qty: 1, price: Number((basePrice).toFixed(3)) },
            { qty: 10, price: Number((basePrice * 0.85).toFixed(3)) },
            { qty: 100, price: Number((basePrice * 0.70).toFixed(3)) },
            { qty: 1000, price: Number((basePrice * 0.55).toFixed(3)) },
          ],
        },
      });
    }
  }

  // 10. Seed Projects & BOMs
  console.log('Seeding Projects & BOMs...');
  const project1 = await prisma.project.create({
    data: {
      name: 'Smart Thermostat Module',
      description: 'An IoT enabled smart thermostat using ESP32, ADS1115, and local power regulation.',
      userId: engineerUser.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Analog Function Generator',
      description: 'A classical wave generator built around the NE555 timer and discrete transistors.',
      userId: engineerUser.id,
    },
  });

  // Link components to Project 1
  await prisma.projectComponent.createMany({
    data: [
      { projectId: project1.id, componentId: esp32.id, quantity: 1, notes: 'Main microcontroller module' },
      { projectId: project1.id, componentId: ads1115.id, quantity: 1, notes: 'Precision ADC for reading NTC thermistors' },
      { projectId: project1.id, componentId: lm7805.id, quantity: 1, notes: '5V regulator for the analog front-end' },
    ],
  });

  // Link components to Project 2
  await prisma.projectComponent.createMany({
    data: [
      { projectId: project2.id, componentId: ne555.id, quantity: 2, notes: 'One for square wave, one for PWM duty cycle control' },
      { projectId: project2.id, componentId: transistor2n2222.id, quantity: 4, notes: 'Output buffering and signal amplification' },
      { projectId: project2.id, componentId: lm317.id, quantity: 1, notes: 'Adjustable rail regulator for tuning signal amplitude' },
    ],
  });

  // Create a BOM for Project 1
  await prisma.bOM.create({
    data: {
      projectId: project1.id,
      fileUrl: 'https://storage.electrohub.com/boms/smart_thermostat_bom.csv',
      summary: {
        totalUniqueParts: 3,
        totalQuantity: 3,
        estimatedCost: {
          LCSC: 4.85,
          DIGIKEY: 6.20,
          MOUSER: 5.95,
        },
        optimalSplittedCost: 4.52,
        notes: 'Optimum cost achieved by sourcing ESP32 from LCSC and ADS1115 from DigiKey.',
      },
    },
  });

  // 11. Seed Favorites
  console.log('Seeding Favorites...');
  await prisma.favorite.createMany({
    data: [
      { userId: engineerUser.id, componentId: esp32.id },
      { userId: engineerUser.id, componentId: ads1115.id },
      { userId: engineerUser.id, componentId: ne555.id },
    ],
  });

  // 12. Seed AI Conversations & Messages
  console.log('Seeding AI Conversations...');
  const conversation = await prisma.aIConversation.create({
    data: {
      userId: engineerUser.id,
      title: 'NE555 Astable Mode Configuration',
    },
  });

  await prisma.aIMessage.createMany({
    data: [
      {
        conversationId: conversation.id,
        role: 'user',
        content: 'How do I configure the NE555DR to generate a 1kHz square wave with a 60% duty cycle?',
      },
      {
        conversationId: conversation.id,
        role: 'assistant',
        content: `To configure the NE555 in astable (oscillating) mode for a 1kHz frequency and a 60% duty cycle, you will need two resistors (R1, R2) and one capacitor (C).

The formulas for the timing are:
1. Charge time (output HIGH): t1 = 0.693 * (R1 + R2) * C
2. Discharge time (output LOW): t2 = 0.693 * R2 * C
3. Total period: T = t1 + t2 = 0.693 * (R1 + 2*R2) * C
4. Frequency: f = 1 / T = 1.44 / ((R1 + 2*R2) * C)
5. Duty Cycle: D = (R1 + R2) / (R1 + 2*R2)

For a 60% duty cycle (D = 0.60):
D = (R1 + R2) / (R1 + 2*R2) = 0.60
=> R1 + R2 = 0.60 * R1 + 1.20 * R2
=> 0.40 * R1 = 0.20 * R2
=> R2 = 2 * R1

For a target frequency of 1kHz (f = 1000 Hz):
Let's choose C = 100nF (1e-7 F).
f = 1.44 / ((R1 + 2*R2) * C)
1000 = 1.44 / ((R1 + 2*(2*R1)) * 1e-7)
1000 = 1.44 / (5 * R1 * 1e-7)
5 * R1 * 1e-7 = 0.00144
R1 = 0.00144 / 5e-7 = 2880 Ohms (2.88 kΩ)

Since R2 = 2 * R1:
R2 = 5760 Ohms (5.76 kΩ)

You can use standard E24 resistor values:
- **R1 = 2.7 kΩ** or **3.0 kΩ**
- **R2 = 5.6 kΩ**
- **C = 100 nF**

This will result in a frequency of approximately **1.03 kHz** and a duty cycle of **59.7%**, which is extremely close to your target.`,
      },
    ],
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
