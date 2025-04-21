(function() {
    // Инициализация canvas
    const canvas = document.getElementById('canvas5');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;

    // Состояние приложения
    const state = {
        isDrawing: false,
        startX: 0,
        startY: 0,
        mode: 'line', // 'line', 'polygon', 'point'
        algorithm: 'cda', // 'cda', 'bresenham', 'wu'
        debugMode: false,
        currentStep: 0,
        interval: null,
        lines: [],
        polygons: [],
        currentPolygon: null,
        points: []
    };

    // Класс для линии
    class Line {
        constructor(x1, y1, x2, y2) {
            this.x1 = x1;
            this.y1 = y1;
            this.x2 = x2;
            this.y2 = y2;
        }
    }

    // Класс для полигона
    class Polygon {
        constructor() {
            this.vertices = [];
            this.closed = false;
            this.convex = null;
            this.normals = [];
        }

        addVertex(x, y) {
            this.vertices.push({x, y});
        }

        close() {
            if (this.vertices.length > 2) {
                this.closed = true;
                return true;
            }
            return false;
        }

        draw(ctx) {
            if (this.vertices.length < 1) return;

            // Рисуем стороны полигона выбранным алгоритмом
            for (let i = 0; i < this.vertices.length; i++) {
                const start = this.vertices[i];
                const end = this.vertices[(i + 1) % this.vertices.length];
                drawLine(start.x, start.y, end.x, end.y);

                // Если есть нормали, рисуем их
                if (this.normals.length > i) {
                    const normal = this.normals[i];
                    const midX = (start.x + end.x) / 2;
                    const midY = (start.y + end.y) / 2;

                    // Длина нормали
                    const length = 20;

                    // Рисуем нормаль
                    ctx.strokeStyle = 'red';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(midX, midY);
                    ctx.lineTo(midX + normal.x * length, midY + normal.y * length);
                    ctx.stroke();

                    // Рисуем стрелочку на конце нормали
                    const arrowSize = 5;
                    const endX = midX + normal.x * length;
                    const endY = midY + normal.y * length;

                    // Перпендикулярный вектор для стрелочки
                    const perpX = -normal.y;
                    const perpY = normal.x;

                    ctx.beginPath();
                    ctx.moveTo(endX, endY);
                    ctx.lineTo(endX - normal.x * arrowSize + perpX * arrowSize/2,
                        endY - normal.y * arrowSize + perpY * arrowSize/2);
                    ctx.lineTo(endX - normal.x * arrowSize - perpX * arrowSize/2,
                        endY - normal.y * arrowSize - perpY * arrowSize/2);
                    ctx.closePath();
                    ctx.fillStyle = 'red';
                    ctx.fill();
                }
            }

            // Отрисовка вершин
            ctx.fillStyle = 'blue';
            for (const vertex of this.vertices) {
                ctx.beginPath();
                ctx.arc(vertex.x, vertex.y, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            // Отображаем информацию о выпуклости
            if (this.closed && this.convex !== null) {
                const center = this.getCenter();
                ctx.fillStyle = this.convex ? 'green' : 'orange';
                ctx.font = '14px Arial';
                ctx.fillText(this.convex ? 'Выпуклый' : 'Невыпуклый', center.x - 30, center.y);
            }
        }

        getCenter() {
            let x = 0, y = 0;
            for (const vertex of this.vertices) {
                x += vertex.x;
                y += vertex.y;
            }
            return {
                x: x / this.vertices.length,
                y: y / this.vertices.length
            };
        }
    }

    // Функция рисования линии
    function drawLine(startX, startY, endX, endY) {
        if (state.algorithm === 'cda') {
            const dx = endX - startX;
            const dy = endY - startY;
            const steps = Math.max(Math.abs(dx), Math.abs(dy));
            const xIncrement = dx / steps;
            const yIncrement = dy / steps;

            let currentX = startX;
            let currentY = startY;

            if (state.debugMode) {
                clearInterval(state.interval);
                state.currentStep = 0;

                state.interval = setInterval(() => {
                    if (state.currentStep <= steps) {
                        ctx.fillRect(Math.round(currentX), Math.round(currentY), 1, 1);
                        currentX += xIncrement;
                        currentY += yIncrement;
                        state.currentStep++;
                    } else {
                        clearInterval(state.interval);
                    }
                }, 100);
            } else {
                for (let i = 0; i <= steps; i++) {
                    ctx.fillRect(Math.round(currentX), Math.round(currentY), 1, 1);
                    currentX += xIncrement;
                    currentY += yIncrement;
                }
            }
            return;
        }

        if (state.algorithm === 'bresenham') {
            let x1 = startX, y1 = startY;
            const dx = Math.abs(endX - x1);
            const dy = Math.abs(endY - y1);
            const sx = x1 < endX ? 1 : -1;
            const sy = y1 < endY ? 1 : -1;
            let err = dx - dy;

            if (state.debugMode) {
                clearInterval(state.interval);

                state.interval = setInterval(() => {
                    if (x1 !== endX || y1 !== endY) {
                        ctx.fillRect(x1, y1, 1, 1);
                        const err2 = err * 2;

                        if (err2 > -dy) {
                            err -= dy;
                            x1 += sx;
                        }
                        if (err2 < dx) {
                            err += dx;
                            y1 += sy;
                        }
                    } else {
                        ctx.fillRect(endX, endY, 1, 1);
                        clearInterval(state.interval);
                    }
                }, 100);
            } else {
                while (x1 !== endX || y1 !== endY) {
                    ctx.fillRect(x1, y1, 1, 1);
                    const err2 = err * 2;

                    if (err2 > -dy) {
                        err -= dy;
                        x1 += sx;
                    }
                    if (err2 < dx) {
                        err += dx;
                        y1 += sy;
                    }
                }
                ctx.fillRect(endX, endY, 1, 1);
            }
            return;
        }

        if (state.algorithm === 'wu') {
            let x1 = startX, y1 = startY;
            let x2 = endX, y2 = endY;
            const dx = x2 - x1;
            const dy = y2 - y1;

            if (Math.abs(dx) > Math.abs(dy)) {
                if (x2 < x1) {
                    [x1, x2] = [x2, x1];
                    [y1, y2] = [y2, y1];
                }

                const gradient = dy / dx;
                let y = y1;

                if (state.debugMode) {
                    clearInterval(state.interval);
                    state.currentStep = 0;

                    state.interval = setInterval(() => {
                        if (state.currentStep <= x2 - x1) {
                            const x = x1 + state.currentStep;
                            drawWuPixel(x, Math.floor(y), 1 - (y - Math.floor(y)));
                            drawWuPixel(x, Math.floor(y) + 1, y - Math.floor(y));
                            y += gradient;
                            state.currentStep++;
                        } else {
                            clearInterval(state.interval);
                        }
                    }, 100);
                } else {
                    for (let x = x1; x <= x2; x++) {
                        drawWuPixel(x, Math.floor(y), 1 - (y - Math.floor(y)));
                        drawWuPixel(x, Math.floor(y) + 1, y - Math.floor(y));
                        y += gradient;
                    }
                }
            } else {
                if (y2 < y1) {
                    [x1, x2] = [x2, x1];
                    [y1, y2] = [y2, y1];
                }

                const gradient = dx / dy;
                let x = x1;

                if (state.debugMode) {
                    clearInterval(state.interval);
                    state.currentStep = 0;

                    state.interval = setInterval(() => {
                        if (state.currentStep <= y2 - y1) {
                            const y = y1 + state.currentStep;
                            drawWuPixel(Math.floor(x), y, 1 - (x - Math.floor(x)));
                            drawWuPixel(Math.floor(x) + 1, y, x - Math.floor(x));
                            x += gradient;
                            state.currentStep++;
                        } else {
                            clearInterval(state.interval);
                        }
                    }, 100);
                } else {
                    for (let y = y1; y <= y2; y++) {
                        drawWuPixel(Math.floor(x), y, 1 - (x - Math.floor(x)));
                        drawWuPixel(Math.floor(x) + 1, y, x - Math.floor(x));
                        x += gradient;
                    }
                }
            }
            return;
        }
    }

    // Вспомогательная функция для алгоритма Ву
    function drawWuPixel(x, y, brightness) {
        const alpha = Math.floor(brightness * 255);
        ctx.fillStyle = `rgba(0, 0, 0, ${brightness})`;
        ctx.fillRect(x, y, 1, 1);
    }

    // Очистка холста
    function clearCanvas() {
        state.lines = [];
        state.polygons = [];
        state.currentPolygon = null;
        state.points = [];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        updateInfo("Холст очищен");
    }

    // Установка алгоритма рисования линии
    function setAlgorithm(alg) {
        state.algorithm = alg;
        updateInfo(`Алгоритм изменен на: ${alg.toUpperCase()}`);
    }

    // Установка режима работы
    function setMode(mode) {
        state.mode = mode;
        updateInfo(`Режим изменен на: ${mode}`);

        if (mode === 'polygon' && !state.currentPolygon) {
            state.currentPolygon = new Polygon();
        } else if (mode !== 'polygon' && state.currentPolygon) {
            if (state.currentPolygon.vertices.length > 0) {
                state.polygons.push(state.currentPolygon);
            }
            state.currentPolygon = null;
        }
    }

    // Переключение режима отладки
    function toggleDebugMode() {
        state.debugMode = !state.debugMode;
        updateInfo(`Режим отладки: ${state.debugMode ? 'ВКЛ' : 'ВЫКЛ'}`);
    }

    // Завершение полигона
    function finishPolygon() {
        if (state.currentPolygon && state.currentPolygon.close()) {
            state.polygons.push(state.currentPolygon);
            state.currentPolygon = new Polygon();
            redrawCanvas();
            updateInfo("Полигон замкнут");
        } else {
            updateInfo("Недостаточно вершин для замыкания полигона");
        }
    }

    // Проверка выпуклости полигона
    function checkConvexity() {
        if (state.polygons.length === 0 && (!state.currentPolygon || state.currentPolygon.vertices.length < 3)) {
            updateInfo("Нет полигонов для проверки");
            return;
        }

        const polygonsToCheck = state.currentPolygon && state.currentPolygon.vertices.length >= 3 ?
            [...state.polygons, state.currentPolygon] : state.polygons;

        polygonsToCheck.forEach(polygon => {
            if (polygon.vertices.length < 3) return;

            let hasNegative = false;
            let hasPositive = false;
            const n = polygon.vertices.length;
            let isConvex = true;

            for (let i = 0; i < n; i++) {
                const a = polygon.vertices[i];
                const b = polygon.vertices[(i + 1) % n];
                const c = polygon.vertices[(i + 2) % n];

                // Вычисляем векторное произведение
                const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);

                if (cross < 0) hasNegative = true;
                else if (cross > 0) hasPositive = true;

                if (hasNegative && hasPositive) {
                    isConvex = false;
                    break;
                }
            }

            polygon.convex = isConvex;

            // Выводим результат проверки
            if (polygon === state.currentPolygon || polygonsToCheck.length === 1) {
                updateInfo(`Полигон ${isConvex ? 'выпуклый' : 'невыпуклый'}`);
            }
        });

        redrawCanvas();
    }

    // Вычисление внутренних нормалей
    function calculateNormals() {
        if (state.polygons.length === 0 && (!state.currentPolygon || state.currentPolygon.vertices.length < 3)) {
            updateInfo("Нет полигонов для вычисления нормалей");
            return;
        }

        const polygonsToProcess = state.currentPolygon && state.currentPolygon.vertices.length >= 3 ?
            [...state.polygons, state.currentPolygon] : state.polygons;

        polygonsToProcess.forEach(polygon => {
            if (polygon.vertices.length < 3) return;

            polygon.normals = [];
            const n = polygon.vertices.length;

            for (let i = 0; i < n; i++) {
                const a = polygon.vertices[i];
                const b = polygon.vertices[(i + 1) % n];

                // Вектор ребра
                const edgeX = b.x - a.x;
                const edgeY = b.y - a.y;

                // Нормаль (перпендикуляр к ребру, направленный внутрь)
                let normalX = -edgeY;
                let normalY = edgeX;

                // Проверяем направление нормали
                const c = polygon.vertices[(i + 2) % n];
                const testX = (a.x + b.x) / 2 + normalX;
                const testY = (a.y + b.y) / 2 + normalY;

                if (!isPointInPolygon(testX, testY, polygon.vertices)) {
                    normalX = edgeY;
                    normalY = -edgeX;
                }

                // Нормализуем вектор
                const length = Math.sqrt(normalX * normalX + normalY * normalY);
                if (length > 0) {
                    normalX /= length;
                    normalY /= length;
                }

                polygon.normals.push({x: normalX, y: normalY});
            }
        });

        redrawCanvas();
        updateInfo("Нормали вычислены");
    }

    // Проверка принадлежности точки полигону
    function isPointInPolygon(x, y, vertices) {
        if (vertices.length < 3) return false;

        let inside = false;
        const n = vertices.length;

        for (let i = 0, j = n - 1; i < n; j = i++) {
            const xi = vertices[i].x, yi = vertices[i].y;
            const xj = vertices[j].x, yj = vertices[j].y;

            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

            if (intersect) inside = !inside;
        }

        return inside;
    }

    // Построение выпуклой оболочки
    function buildConvexHull() {
        if (state.points.length < 3) {
            updateInfo("Недостаточно точек для построения выпуклой оболочки (минимум 3)");
            return;
        }

        const algorithm = document.getElementById('hullAlgorithm').value;
        let hull = [];

        if (algorithm === 'graham') {
            hull = grahamScan([...state.points]);
        } else {
            hull = jarvisMarch([...state.points]);
        }

        // Создаем новый полигон из выпуклой оболочки
        const hullPolygon = new Polygon();
        hull.forEach(p => hullPolygon.addVertex(p.x, p.y));
        hullPolygon.close();
        hullPolygon.convex = true;

        state.polygons.push(hullPolygon);
        redrawCanvas();
        updateInfo(`Выпуклая оболочка построена (${algorithm === 'graham' ? 'Грэхем' : 'Джарвис'})`);
    }

    // Алгоритм Грэхема
    function grahamScan(points) {
        if (points.length < 3) return points;

        // Находим точку с минимальной y-координатой (и минимальной x, если есть совпадения)
        let pivot = points[0];
        for (const p of points) {
            if (p.y < pivot.y || (p.y === pivot.y && p.x < pivot.x)) {
                pivot = p;
            }
        }

        // Сортируем точки по полярному углу относительно pivot
        points.sort((a, b) => {
            const angleA = Math.atan2(a.y - pivot.y, a.x - pivot.x);
            const angleB = Math.atan2(b.y - pivot.y, b.x - pivot.x);

            if (angleA < angleB) return -1;
            if (angleA > angleB) return 1;

            // Если углы одинаковые, выбираем ближайшую
            const distA = (a.x - pivot.x) ** 2 + (a.y - pivot.y) ** 2;
            const distB = (b.x - pivot.x) ** 2 + (b.y - pivot.y) ** 2;
            return distA - distB;
        });

        // Удаляем точки с одинаковым углом (оставляем самую дальнюю)
        const uniqueAngles = [points[0]];
        for (let i = 1; i < points.length; i++) {
            const last = uniqueAngles[uniqueAngles.length - 1];
            const angleLast = Math.atan2(last.y - pivot.y, last.x - pivot.x);
            const angleCurrent = Math.atan2(points[i].y - pivot.y, points[i].x - pivot.x);

            if (angleCurrent !== angleLast) {
                uniqueAngles.push(points[i]);
            }
        }

        if (uniqueAngles.length < 3) return uniqueAngles;

        // Строим оболочку
        const stack = [uniqueAngles[0], uniqueAngles[1], uniqueAngles[2]];

        for (let i = 3; i < uniqueAngles.length; i++) {
            while (stack.length >= 2) {
                const a = stack[stack.length - 2];
                const b = stack[stack.length - 1];
                const c = uniqueAngles[i];

                const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);

                if (cross <= 0) {
                    stack.pop();
                } else {
                    break;
                }
            }
            stack.push(uniqueAngles[i]);
        }

        return stack;
    }

    // Алгоритм Джарвиса
    function jarvisMarch(points) {
        if (points.length < 3) return points;

        const hull = [];

        // Находим самую левую точку
        let leftmost = 0;
        for (let i = 1; i < points.length; i++) {
            if (points[i].x < points[leftmost].x ||
                (points[i].x === points[leftmost].x && points[i].y < points[leftmost].y)) {
                leftmost = i;
            }
        }

        let p = leftmost;
        do {
            hull.push(points[p]);

            let q = (p + 1) % points.length;
            for (let i = 0; i < points.length; i++) {
                if (i === p || i === q) continue;

                const cross = (points[q].x - points[p].x) * (points[i].y - points[q].y) -
                    (points[q].y - points[p].y) * (points[i].x - points[q].x);

                if (cross < 0 ||
                    (cross === 0 &&
                        ((points[i].x - points[p].x) ** 2 + (points[i].y - points[p].y) ** 2 >
                            (points[q].x - points[p].x) ** 2 + (points[q].y - points[p].y) ** 2))) {
                    q = i;
                }
            }

            p = q;
        } while (p !== leftmost);

        return hull;
    }

    // Перерисовка холста
    function redrawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Рисуем линии
        ctx.fillStyle = 'black';
        state.lines.forEach(line => {
            drawLine(line.x1, line.y1, line.x2, line.y2);
        });

        // Рисуем полигоны
        state.polygons.forEach(polygon => {
            polygon.draw(ctx);
        });

        // Рисуем текущий полигон
        if (state.currentPolygon) {
            state.currentPolygon.draw(ctx);
        }

        // Рисуем точки
        ctx.fillStyle = 'red';
        state.points.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // Обновление информационной панели
    function updateInfo(message) {
        document.getElementById('infoPanel').textContent = message;
    }

    // Обработчики событий
    function handleMouseDown(e) {
        const x = e.offsetX;
        const y = e.offsetY;

        if (state.mode === 'line') {
            if (!state.isDrawing) {
                state.startX = x;
                state.startY = y;
                state.isDrawing = true;
            } else {
                const line = new Line(state.startX, state.startY, x, y);
                state.lines.push(line);
                drawLine(state.startX, state.startY, x, y);
                state.isDrawing = false;
            }
        } else if (state.mode === 'polygon') {
            if (!state.currentPolygon) {
                state.currentPolygon = new Polygon();
            }
            state.currentPolygon.addVertex(x, y);
            redrawCanvas();
        } else if (state.mode === 'point') {
            state.points.push({x, y});

            // Проверяем принадлежность точки полигонам
            let insideAny = false;
            for (const polygon of state.polygons) {
                if (polygon.vertices.length >= 3 && polygon.closed) {
                    if (isPointInPolygon(x, y, polygon.vertices)) {
                        insideAny = true;
                        break;
                    }
                }
            }

            redrawCanvas();
            updateInfo(`Точка добавлена. Принадлежит полигону: ${insideAny ? 'ДА' : 'НЕТ'}`);
        }
    }

    function handleKeyPress(e) {
        if (e.key === 'd' || e.key === 'D') {
            toggleDebugMode();
        } else if (e.key === '1' && state.debugMode) {
            // Шаг отладки
            if (state.lines.length > 0) {
                const lastLine = state.lines[state.lines.length - 1];
                drawLine(lastLine.x1, lastLine.y1, lastLine.x2, lastLine.y2);
            }
        } else if (e.key === 'c' || e.key === 'C') {
            finishPolygon();
        }
    }

    // Публичный интерфейс
    window.Editor5 = {
        init: function() {
            // Настройка обработчиков событий
            canvas.addEventListener('mousedown', handleMouseDown);
            document.addEventListener('keydown', handleKeyPress);

            // Начальная отрисовка
            redrawCanvas();
            updateInfo("Графический редактор готов к работе. Выберите режим.");
        },

        // Публичные методы
        setAlgorithm: setAlgorithm,
        clearCanvas: clearCanvas,
        toggleDebugMode: toggleDebugMode,
        finishPolygon: finishPolygon,
        checkConvexity: checkConvexity,
        calculateNormals: calculateNormals,
        buildConvexHull: buildConvexHull,
        setMode: setMode
    };

    Editor5.init();
})();