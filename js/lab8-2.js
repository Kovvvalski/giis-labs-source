const canvas = document.getElementById('canvas3d');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// Куб
const cube = {
    size: 100,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0.5, y: -0.5, z: 0.5 }
};

// Глобальные переменные
let showHiddenFaces = true;
let isDragging = false;
let lastMousePos = { x: 0, y: 0 };

// Добавим кнопку скрытия граней
const toggleBtn = document.querySelector('#toggleHiddenFaces');
toggleBtn.textContent = 'Скрыть невидимые грани';
toggleBtn.addEventListener('click', () => {
    showHiddenFaces = !showHiddenFaces;
    toggleBtn.textContent = showHiddenFaces ? 'Скрыть невидимые грани' : 'Показать все грани';
    drawCube();
});

// Обработка мыши
canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMousePos = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener('mouseup', () => {
    isDragging = false;
});
canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;

    cube.rotation.y += dx * 0.01;
    cube.rotation.x += dy * 0.01;

    lastMousePos = { x: e.clientX, y: e.clientY };
    drawCube();
});

function rotatePoint(point, rotation) {
    let { x, y, z } = point;

    // Вращение X
    const cosX = Math.cos(rotation.x), sinX = Math.sin(rotation.x);
    let y1 = y * cosX - z * sinX;
    let z1 = y * sinX + z * cosX;

    y = y1;
    z = z1;

    // Вращение Y
    const cosY = Math.cos(rotation.y), sinY = Math.sin(rotation.y);
    let x1 = x * cosY + z * sinY;
    let z2 = -x * sinY + z * cosY;

    x = x1;
    z = z2;

    // Вращение Z
    const cosZ = Math.cos(rotation.z), sinZ = Math.sin(rotation.z);
    let x2 = x * cosZ - y * sinZ;
    let y2 = x * sinZ + y * cosZ;

    x = x2;
    y = y2;

    return { x, y, z };
}

function drawCube() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const size = cube.size / 2;
    const vertices = [
        { x: -size, y: -size, z: -size },
        { x: size, y: -size, z: -size },
        { x: size, y: size, z: -size },
        { x: -size, y: size, z: -size },
        { x: -size, y: -size, z: size },
        { x: size, y: -size, z: size },
        { x: size, y: size, z: size },
        { x: -size, y: size, z: size }
    ];

    const rotated = vertices.map(v => rotatePoint(v, cube.rotation));

    const projected = rotated.map(v => ({
        x: canvas.width / 2 + v.x,
        y: canvas.height / 2 - v.y,
        z: v.z
    }));

    const faces = [
        { vertices: [0, 1, 2, 3], normal: { x: 0, y: 0, z: -1 }, color: 'rgba(100,149,237,0.8)' }, // front
        { vertices: [4, 5, 6, 7], normal: { x: 0, y: 0, z: 1 }, color: 'rgba(65,105,225,0.4)' }, // back
        { vertices: [1, 5, 6, 2], normal: { x: 1, y: 0, z: 0 }, color: 'rgba(65,105,225,0.8)' }, // right
        { vertices: [0, 4, 7, 3], normal: { x: -1, y: 0, z: 0 }, color: 'rgba(70,130,180,0.6)' }, // left
        { vertices: [3, 2, 6, 7], normal: { x: 0, y: 1, z: 0 }, color: 'rgba(30,144,255,0.8)' }, // top
        { vertices: [0, 1, 5, 4], normal: { x: 0, y: -1, z: 0 }, color: 'rgba(100,149,237,0.6)' } // bottom
    ];

    for (let face of faces) {
        const n = rotatePoint(face.normal, cube.rotation);
        const viewVector = { x: 0, y: 0, z: -1 }; // Смотрим вдоль -Z

        const dot = n.x * viewVector.x + n.y * viewVector.y + n.z * viewVector.z;
        const visible = dot < 0;

        if (showHiddenFaces || visible) {
            ctx.fillStyle = face.color;
            ctx.beginPath();
            const p0 = projected[face.vertices[0]];
            ctx.moveTo(p0.x, p0.y);
            for (let i = 1; i < 4; i++) {
                const p = projected[face.vertices[i]];
                ctx.lineTo(p.x, p.y);
            }
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    // Оси
    drawAxis();
}

function drawAxis() {
    const origin = { x: 0, y: 0, z: 0 };
    const xAxis = { x: 100, y: 0, z: 0 };
    const yAxis = { x: 0, y: 100, z: 0 };
    const zAxis = { x: 0, y: 0, z: 100 };

    const points = [xAxis, yAxis, zAxis].map(p => rotatePoint(p, cube.rotation));
    const projected = [origin, ...points].map(p => ({
        x: canvas.width / 2 + p.x,
        y: canvas.height / 2 - p.y
    }));

    ctx.lineWidth = 2;

    // X — красный
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(projected[0].x, projected[0].y);
    ctx.lineTo(projected[1].x, projected[1].y);
    ctx.stroke();

    // Y — зелёный
    ctx.strokeStyle = 'green';
    ctx.beginPath();
    ctx.moveTo(projected[0].x, projected[0].y);
    ctx.lineTo(projected[2].x, projected[2].y);
    ctx.stroke();

    // Z — синий
    ctx.strokeStyle = 'blue';
    ctx.beginPath();
    ctx.moveTo(projected[0].x, projected[0].y);
    ctx.lineTo(projected[3].x, projected[3].y);
    ctx.stroke();
}

// Первая отрисовка
drawCube();
