const PIXEL_HIG = 3;
const PIXEL_WID = 3;
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const debugMode = document.getElementById("debugMode");
const stepButton = document.getElementById("stepButton");
const clearButton = document.getElementById("clearButton");
let points = [], currentStep = 0, pixels = [], debug = false;

canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(event.clientX - rect.left);
    const y = Math.floor(event.clientY - rect.top);

    if (points.length < 2) {
        points.push({x, y});
        ctx.fillStyle = "red";
        ctx.fillRect(x, y, PIXEL_WID, PIXEL_HIG);
    }

    if (points.length === 2) {
        pixels = differentialAnalyzer(points[0], points[1]);
        currentStep = 0;
        if (debug) {
            stepButton.disabled = false;
        } else {
            drawLine();
            points = [];
        }
    }
});

function drawLine() {
    pixels.forEach(p => {
        ctx.fillStyle = "blue";
        ctx.fillRect(p.x, p.y, PIXEL_WID, PIXEL_HIG);
    });
}

function drawStep() {
    if (currentStep < pixels.length) {
        ctx.fillStyle = "blue";
        let p = pixels[currentStep];
        ctx.fillRect(p.x, p.y, PIXEL_WID, PIXEL_HIG);
        currentStep++;
    } else {
        stepButton.disabled = true;
        points = [];
    }
}

debugMode.addEventListener("change", (event) => {
    debug = event.target.value === "on";
    stepButton.hidden = !debug;
});

stepButton.addEventListener("click", drawStep);

clearButton.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    points = [];
    pixels = [];
    currentStep = 0;
    stepButton.disabled = true;
});