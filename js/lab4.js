const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let object3D;
let rotation = [0, 0, 0];
let scale = 100;
let _focus = 5;

function multiplyMatrixVector(matrix, vector) {
    let result = new Array(4).fill(0);
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            result[i] += matrix[i][j] * vector[j];
        }
    }
    return result;
}

function rotationMatrix(rx, ry, rz) {
    let cos = Math.cos, sin = Math.sin;
    let radX = rx * Math.PI / 180, radY = ry * Math.PI / 180, radZ = rz * Math.PI / 180;

    let Rx = [[1, 0, 0, 0], [0, cos(radX), -sin(radX), 0], [0, sin(radX), cos(radX), 0], [0, 0, 0, 1]];
    let Ry = [[cos(radY), 0, sin(radY), 0], [0, 1, 0, 0], [-sin(radY), 0, cos(radY), 0], [0, 0, 0, 1]];
    let Rz = [[cos(radZ), -sin(radZ), 0, 0], [sin(radZ), cos(radZ), 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];

    return multiplyMatrices(multiplyMatrices(Rx, Ry), Rz);
}

function multiplyMatrices(A, B) {
    let result = Array(A.length).fill(0).map(() => Array(B[0].length).fill(0));
    for (let i = 0; i < A.length; i++) {
        for (let j = 0; j < B[0].length; j++) {
            for (let k = 0; k < B.length; k++) {
                result[i][j] += A[i][k] * B[k][j];
            }
        }
    }
    return result;
}

function project3D(point) {
    let matrix = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, -1 / _focus, 1]];
    let transformed = multiplyMatrixVector(matrix, [...point, 1]);
    return [
        (transformed[0] / transformed[3]) * scale + canvas.width / 2,
        (transformed[1] / transformed[3]) * scale + canvas.height / 2
    ];
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let R = rotationMatrix(rotation[0], rotation[1], rotation[2]);
    let transformedCoords = object3D.coords.map(coord => multiplyMatrixVector(R, [...coord, 1]));

    let projected = transformedCoords.map(project3D);
    ctx.strokeStyle = "#0F0";
    ctx.beginPath();
    object3D.edges.forEach(([a, b]) => {
        ctx.moveTo(...projected[a]);
        ctx.lineTo(...projected[b]);
    });
    ctx.stroke();
}

function loadObject() {
    try {
        object3D = JSON.parse(document.getElementById("objectData").value);
        draw();
    } catch (e) {
        alert("Ошибка загрузки объекта: " + e.message);
    }
}

window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") rotation[1] -= 5;
    if (e.key === "ArrowRight") rotation[1] += 5;
    if (e.key === "ArrowUp") rotation[0] -= 5;
    if (e.key === "ArrowDown") rotation[0] += 5;
    if (e.key === "q") rotation[2] -= 5;
    if (e.key === "e") rotation[2] += 5;
    if (e.key === "+") scale *= 1.1;
    if (e.key === "-") scale /= 1.1;
    if (e.key === "w") _focus += 0.5;
    if (e.key === "s") _focus -= 0.5;
    draw();
});

loadObject();