// VIN Generator for testing
export function generateUniqueVIN() {
  // Generate a random VIN with proper format
  const chars = '0123456789ABCDEFGHJKLMNPRSTUVWXYZ'; // Excluding I, O, Q
  let vin = '';
  
  // First 3 characters (WMI - World Manufacturer Identifier)
  vin += '1HG'; // Honda example
  
  // Next 6 characters (VDS - Vehicle Descriptor Section)
  for (let i = 0; i < 6; i++) {
    vin += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // Next 8 characters (VIS - Vehicle Identifier Section)
  for (let i = 0; i < 8; i++) {
    vin += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return vin;
}

// Generate multiple unique VINs
export function generateMultipleVINs(count = 5) {
  const vins = [];
  for (let i = 0; i < count; i++) {
    vins.push(generateUniqueVIN());
  }
  return vins;
}

// Test function
export function testVINGeneration() {
  console.log('🚗 Generated VINs for testing:');
  const vins = generateMultipleVINs(3);
  vins.forEach((vin, index) => {
    console.log(`${index + 1}. ${vin}`);
  });
  return vins;
}

// Plate number generator
export function generateUniquePlateNumber() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let plate = '';
  
  // Generate 3 letters
  for (let i = 0; i < 3; i++) {
    plate += letters[Math.floor(Math.random() * letters.length)];
  }
  
  // Generate 4 numbers
  for (let i = 0; i < 4; i++) {
    plate += numbers[Math.floor(Math.random() * numbers.length)];
  }
  
  return plate;
}

// Generate multiple plate numbers
export function generateMultiplePlateNumbers(count = 5) {
  const plates = [];
  for (let i = 0; i < count; i++) {
    plates.push(generateUniquePlateNumber());
  }
  return plates;
}

// Test function for plate numbers
export function testPlateGeneration() {
  console.log('🚗 Generated Plate Numbers for testing:');
  const plates = generateMultiplePlateNumbers(3);
  plates.forEach((plate, index) => {
    console.log(`${index + 1}. ${plate}`);
  });
  return plates;
}

// Export for use in components
window.generateUniqueVIN = generateUniqueVIN;
window.generateMultipleVINs = generateMultipleVINs;
window.testVINGeneration = testVINGeneration;
window.generateUniquePlateNumber = generateUniquePlateNumber;
window.generateMultiplePlateNumbers = generateMultiplePlateNumbers;
window.testPlateGeneration = testPlateGeneration;

// Add to global scope for easy testing
console.log('🚗 VIN & Plate Generator loaded! Try:');
console.log('- generateUniqueVIN() - Generate a single VIN');
console.log('- generateUniquePlateNumber() - Generate a single plate number');
console.log('- generateMultipleVINs(5) - Generate 5 VINs');
console.log('- generateMultiplePlateNumbers(5) - Generate 5 plate numbers');
console.log('- testVINGeneration() - Test VIN generation');
console.log('- testPlateGeneration() - Test plate generation'); 