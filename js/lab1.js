const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const debugModeSelector = document.getElementById("debugMode");
const stepButton = document.getElementById("stepButton");
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
            drawLine(pixels);
            points = [];
        }
    }
});


debugModeSelector.addEventListener("change", (event) => {
    debug = event.target.value === "on";
    stepButton.hidden = !debug;
});

stepButton.addEventListener("click", () => drawStep(pixels));

clearButton.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    points = [];
    pixels = [];
    currentStep = 0;
});

drawModeSelector.addEventListener("change", (event) => {
    drawMode = event.target.value;
});

function antiAliasing(start, end) {
    let x1 = start.x;
    let y1 = start.y;
    let x2 = end.x;
    let y2 = end.y;
    let points = [];

    function swap(a, b) {
        return [b, a];
    }

    let steep = Math.abs(y2 - y1) > Math.abs(x2 - x1);
    if (!steep) {
        if (x1 > x2) {
            [x1, x2] = swap(x1, x2);
            [y1, y2] = swap(y1, y2);
        }

        points.push({ x: x1, y: y1, color: "rgba(0, 0, 0, 1)" });

        let dx = x2 - x1;
        let dy = y2 - y1;
        let gradient = dy / dx;
        let y = y1 + gradient;

        for (let x = x1 + 1; x < x2; x++) {
            let yInt = Math.floor(y);
            let transparency = 1 - (y - yInt);
            points.push({ x: x, y: yInt, color: `rgba(0, 0, 0, ${transparency})` });

            transparency = y - yInt;
            points.push({ x: x, y: yInt + 1, color: `rgba(0, 0, 0, ${transparency})` });

            y += gradient;
        }

        points.push({ x: x2, y: y2, color: "rgba(0, 0, 0, 1)" });
    } else {
        if (y1 > y2) {
            [x1, x2] = swap(x1, x2);
            [y1, y2] = swap(y1, y2);
        }

        points.push({ x: x1, y: y1, color: "rgba(0, 0, 0, 1)" });

        let dx = x2 - x1;
        let dy = y2 - y1;
        let gradient = dx / dy;
        let x = x1 + gradient;

        for (let y = y1 + 1; y < y2; y++) {
            let xInt = Math.floor(x);
            let transparency = 1 - (x - xInt);
            points.push({ x: xInt, y: y, color: `rgba(0, 0, 0, ${transparency})` });

            transparency = x - xInt;
            points.push({ x: xInt + 1, y: y, color: `rgba(0, 0, 0, ${transparency})` });

            x += gradient;
        }

        points.push({ x: x2, y: y2, color: "rgba(0, 0, 0, 1)" });
    }

    return points;
}

function brezenhem(start, end) {
    let x1 = start.x, y1 = start.y;
    let x2 = end.x, y2 = end.y;
    let dx = Math.abs(x2 - x1);
    let dy = Math.abs(y2 - y1);
    let sx = x1 < x2 ? 1 : -1;
    let sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    let pixelArray = [];

    while (true) {
        pixelArray.push({x: x1, y: y1, color: DEFAULT_COLOR});

        if (x1 === x2 && y1 === y2) break;

        let e2 = err * 2;

        if (e2 > -dy) {
            err -= dy;
            x1 += sx;
        }

        if (e2 < dx) {
            err += dx;
            y1 += sy;
        }
    }

    return pixelArray;
}

function differentialAnalyzer(start, end) {
    let x = start.x;
    let y = start.y;
    let dx = end.x - start.x
    let dy = end.y - start.y;
    let length = Math.max(Math.abs(dx), Math.abs(dy));
    let xInc = dx / length;
    let yInc = dy / length;
    let pixelArray = [];

    for (let i = 0; i <= length; i++) {
        pixelArray.push({x: Math.round(x), y: Math.round(y), color: DEFAULT_COLOR});
        x += xInc;
        y += yInc;
    }
    return pixelArray;
}