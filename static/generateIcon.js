const fs = require('fs');
const { createCanvas } = require('canvas');

// Create a canvas with the desired dimensions
const canvas = createCanvas(72, 72);
const ctx = canvas.getContext('2d');

// Draw the house icon
function drawIcon() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw a house shape with the new color palette
    ctx.fillStyle = '#282e4b'; // Base color
    ctx.beginPath();
    ctx.moveTo(canvas.width/2, canvas.height/6);  // Top point
    ctx.lineTo(5*canvas.width/6, canvas.height/2); // Bottom right
    ctx.lineTo(2*canvas.width/3, canvas.height/2); // Bottom right corner
    ctx.lineTo(2*canvas.width/3, 5*canvas.height/6); // Bottom right wall
    ctx.lineTo(canvas.width/3, 5*canvas.height/6);  // Bottom left wall
    ctx.lineTo(canvas.width/3, canvas.height/2);  // Bottom left corner
    ctx.lineTo(canvas.width/6, canvas.height/2);  // Bottom left
    ctx.closePath();
    ctx.fill();
    
    // Draw door
    ctx.fillStyle = '#c8a773'; // Accent color
    ctx.fillRect(canvas.width/2 - 8, canvas.height/2 + 5, 16, 24);
    
    // Draw windows
    ctx.fillStyle = '#242c3c'; // Secondary color
    // Left window
    ctx.fillRect(canvas.width/3 - 8, canvas.height/2 - 15, 12, 12);
    // Right window
    ctx.fillRect(2*canvas.width/3 - 4, canvas.height/2 - 15, 12, 12);
    
    // Add a subtle roof highlight
    ctx.strokeStyle = '#c8a773';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width/2, canvas.height/6); // Top point
    ctx.lineTo(5*canvas.width/6, canvas.height/2); // Bottom right
    ctx.stroke();
}

// Draw the icon
drawIcon();

// Save the canvas to a PNG file
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./static/images/ICON.png', buffer);

console.log('Icon generated and saved to ./static/images/ICON.png'); 