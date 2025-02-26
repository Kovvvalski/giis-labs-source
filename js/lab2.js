let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let currentStep = 0;
let points = [];
let startX = null, startY = null;

const curveTypeSelect = document.getElementById("curveType");
const debugModeSelect = document.getElementById("debugMode");
const stepButton = document.getElementById("stepButton");

const inputContainer = document.createElement("div");
inputContainer.classList.add("form-group");
document.querySelector(".container").insertBefore(inputContainer, canvas);

canvas.addEventListener("click", (event) => {
    let rect = canvas.getBoundingClientRect();
    startX = Math.round(event.clientX - rect.left);
    startY = Math.round(event.clientY - rect.top);
    generateCurve();
});

clearButton.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    points = [];
    startX = null;
    startY = null;
    currentStep = 0;
});

stepButton.addEventListener("click", () => {
    drawStep(points);
});

curveTypeSelect.addEventListener("change", updateInputs);

function updateInputs() {
    inputContainer.innerHTML = "";
    let curveType = curveTypeSelect.value;

    let inputs = [];

    if (curveType === "ellipse") {
        inputs = [
            {id: "a", label: "Большая полуось (a)", value: 100},
            {id: "b", label: "Малая полуось (b)", value: 60}
        ];
    } else if (curveType === "parabola") {
        inputs = [
            {id: "p", label: "Параметр (p)", value: 30},
            {id: "maxY", label: "Максимальный Y", value: 150}
        ];
    } else if (curveType === "hyperbola") {
        inputs = [
            {id: "a", label: "Параметр a", value: 60},
            {id: "b", label: "Параметр b", value: 40},
            {id: "maxX", label: "Максимальный X", value: 150}
        ];
    }

    inputs.forEach(input => {
        let div = document.createElement("div");
        div.classList.add("form-group");
        div.innerHTML = `
            <label for="${input.id}">${input.label}</label>
            <input type="number" id="${input.id}" class="form-control w-50" value="${input.value}">
        `;
        inputContainer.appendChild(div);
    });
}

function generateCurve() {
    if (startX === null || startY === null) return;

    let curveType = curveTypeSelect.value;
    let debugMode = debugModeSelect.value === "on";

    let params = {};
    document.querySelectorAll(".form-group input").forEach(input => {
        params[input.id] = Number(input.value);
    });

    if (curveType === "ellipse") {
        points = ellipseCurve(startX, startY, params.a, params.b);
    } else if (curveType === "parabola") {
        points = parabolaCurve(startX, startY, params.p, params.maxY);
    } else if (curveType === "hyperbola") {
        points = hyperbolaCurve(startX, startY, params.a, params.b, params.maxX);
    }

    if (debugMode) {
        currentStep = 0;
        stepButton.hidden = false;
    } else {
        drawLine(points);
        stepButton.hidden = true;
    }
}

function ellipseCurve(x0, y0, a, b) {
    let points = [];
    let x = 0, y = b;
    let delta = a * a + b * b - 2 * a * a * b;

    while (y >= 0) {
        points.push({x: x0 + x, y: y0 + y, color: DEFAULT_COLOR});
        points.push({x: x0 + x, y: y0 - y, color: DEFAULT_COLOR});
        points.push({x: x0 - x, y: y0 - y, color: DEFAULT_COLOR});
        points.push({x: x0 - x, y: y0 + y, color: DEFAULT_COLOR});

        if (delta < 0) {
            let D = 2 * (delta + a * a * y) - 1;
            if (D <= 0) {
                x++;
                delta += b * b * (2 * x + 1);
                continue;
            }
        }

        if (delta > 0) {
            let D = 2 * (delta - b * b * x) - 1;
            if (D > 0) {
                y--;
                delta += a * a * (1 - 2 * y);
                continue;
            }
        }

        x++;
        y--;
        delta += b * b * (2 * x + 1) + a * a * (1 - 2 * y);
    }

    return points;
}


function parabolaCurve(x0, y0, p, maxY) {
    let points = [];
    let x = 0, y = 0;

    let Sd = (1 / p) * (x + 1) ** 2 - (y + 1);
    let Sv = (1 / p) * x ** 2 - (y + 1);
    let Sh = (1 / p) * (x + 1) ** 2 - y;

    points.push({ x: x0 + x, y: y0 + y, color: DEFAULT_COLOR });

    while (Math.abs(y) < maxY) {
        if (Math.abs(Sh) <= Math.abs(Sv)) {
            if (Math.abs(Sd) < Math.abs(Sh)) y++;
            x++;
        } else {
            if (Math.abs(Sd) < Math.abs(Sv)) x++;
            y++;
        }

        points.push({ x: x0 + x, y: y0 + y, color: DEFAULT_COLOR });
        points.push({ x: x0 - x, y: y0 + y, color: DEFAULT_COLOR });

        Sd = (1 / p) * (x + 1) ** 2 - (y + 1);
        Sv = (1 / p) * x ** 2 - (y + 1);
        Sh = (1 / p) * (x + 1) ** 2 - y;
    }
    return points;
}


function hyperbolaCurve(x0, y0, a, b, maxX) {
    let points = [];
    let x = Math.abs(a), y = 0;
    let Sd = 1 - (x + 1) ** 2 / a ** 2 + (y + 1) ** 2 / b ** 2;
    let Sv = 1 - x ** 2 / a ** 2 + (y + 1) ** 2 / b ** 2;
    let Sh = 1 - (x + 1) ** 2 / a ** 2 + y ** 2 / b ** 2;

    while (x < maxX + a) {
        if (Math.abs(Sh) <= Math.abs(Sv)) {
            if (Math.abs(Sd) < Math.abs(Sh)) y++;
            x++;
        } else {
            if (Math.abs(Sv) > Math.abs(Sd)) x++;
            y++;
        }
        points.push({x: x0 + x, y: y0 + y, color: DEFAULT_COLOR});
        points.push({x: x0 + x, y: y0 - y, color: DEFAULT_COLOR});

        Sd = 1 - (x + 1) ** 2 / a ** 2 + (y + 1) ** 2 / b ** 2;
        Sv = 1 - x ** 2 / a ** 2 + (y + 1) ** 2 / b ** 2;
        Sh = 1 - (x + 1) ** 2 / a ** 2 + y ** 2 / b ** 2;
    }
    return points;
}

updateInputs();
