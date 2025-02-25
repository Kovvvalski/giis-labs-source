const PIXEL_SIZE = 1;
const DEFAULT_COLOR = "rgba(0, 0, 0, 1)"
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const debugModeSelector = document.getElementById("debugMode");
const stepButton = document.getElementById("stepButton");
const clearButton = document.getElementById("clearButton");
const drawModeSelector = document.getElementById("drawMode")

let points = [];
let currentStep = 0;
let pixels = [];
let debug = false;
let drawMode = "diff";

canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(event.clientX - rect.left);
    const y = Math.floor(event.clientY - rect.top);

    if (points.length < 2) {
        points.push({x, y});
        ctx.fillStyle = "red";
        ctx.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
    }

    if (points.length === 2) {
        if (drawMode === "diff") {
            pixels = differentialAnalyzer(points[0], points[1]);
        } else if (drawMode === "brezenhem") {
            pixels = brezenhem(points[0], points[1]);
        } else if (drawMode === "antialiasing") {
            pixels = antiAliasing(points[0], points[1]);
        }
        currentStep = 0;
        if (!debug) {
            drawLine();
            points = [];
        }
    }
});

function drawLine() {
    pixels.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, PIXEL_SIZE, PIXEL_SIZE);
    });
}

function drawStep() {
    if (currentStep < pixels.length) {
        let p = pixels[currentStep];
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, PIXEL_SIZE, PIXEL_SIZE);
        currentStep++;
    } else {
        points = [];
    }
}

debugModeSelector.addEventListener("change", (event) => {
    debug = event.target.value === "on";
    stepButton.hidden = !debug;
});

stepButton.addEventListener("click", drawStep);

clearButton.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    points = [];
    pixels = [];
    currentStep = 0;
});

drawModeSelector.addEventListener("change", (event) => {
    drawMode = event.target.value;
});