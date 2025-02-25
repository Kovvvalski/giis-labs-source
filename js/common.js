const DEFAULT_COLOR = "rgba(0, 0, 0, 1)"
const PIXEL_SIZE = 1;
const clearButton = document.getElementById("clearButton");


function drawLine(pixels) {
    pixels.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, PIXEL_SIZE, PIXEL_SIZE);
    });
}

function drawStep(pixels) {
    if (currentStep < pixels.length) {
        let p = pixels[currentStep];
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, PIXEL_SIZE, PIXEL_SIZE);
        currentStep++;
    } else {
        points = [];
    }
}
