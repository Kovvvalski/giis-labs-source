(function() {
    // Инициализация элементов
    const canvas = document.getElementById('canvas6');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;

    // Элементы управления
    const fillAlgorithmSelect = document.getElementById('fillAlgorithm');
    const fillButton = document.getElementById('fillButton');
    const drawPolygonButton = document.getElementById('drawPolygon');
    const drawFreehandButton = document.getElementById('drawFreehand');
    const clearCanvasButton = document.getElementById('clearCanvas');
    const fillColorPicker = document.getElementById('fillColorPicker');
    const debugCheckbox = document.getElementById('debugCheckbox');
    const delayInput = document.getElementById('delayInput');
    const debugInfo = document.getElementById('debugInfo');

    // Состояние приложения
    const state = {
        isDrawing: false,
        currentMode: 'polygon', // 'polygon', 'freehand'
        vertices: [],
        polygons: [],
        currentPolygon: null,
        debugMode: false,
        fillColor: [255, 0, 0, 255], // Красный по умолчанию
        delay: 50,
        imageData: null,
        fillActive: false
    };

    // Инициализация редактора
    function init() {
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        clearCanvas();

        // Обработчики событий
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('dblclick', handleDoubleClick);

        fillButton.addEventListener('click', toggleFillMode);
        drawPolygonButton.addEventListener('click', () => setMode('polygon'));
        drawFreehandButton.addEventListener('click', () => setMode('freehand'));
        clearCanvasButton.addEventListener('click', clearCanvas);
        fillColorPicker.addEventListener('input', updateFillColor);
        debugCheckbox.addEventListener('change', updateDebugMode);
        delayInput.addEventListener('input', () => {
            state.delay = parseInt(delayInput.value);
        });

        updateInfo("Редактор заполнения готов к работе. Выберите режим.");
    }

    // Обработчики событий мыши
    function handleMouseDown(e) {
        const x = e.offsetX;
        const y = e.offsetY;

        if (state.fillActive) {
            fillAtPoint(x, y);
            return;
        }

        state.isDrawing = true;

        if (state.currentMode === 'polygon') {
            if (!state.currentPolygon) {
                state.currentPolygon = [];
                state.polygons.push(state.currentPolygon);
            }
            state.currentPolygon.push({x, y});
            state.vertices.push({x, y});

            // Рисуем точку
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();

            // Если это не первая точка, рисуем линию от предыдущей точки
            if (state.currentPolygon.length > 1) {
                const prev = state.currentPolygon[state.currentPolygon.length - 2];
                ctx.beginPath();
                ctx.moveTo(prev.x, prev.y);
                ctx.lineTo(x, y);
                ctx.stroke();
            }
        } else if (state.currentMode === 'freehand') {
            ctx.beginPath();
            ctx.moveTo(x, y);
            state.currentPolygon = [{x, y}];
            state.polygons.push(state.currentPolygon);
        }
    }

    function handleMouseMove(e) {
        if (!state.isDrawing || state.currentMode !== 'freehand') return;

        const x = e.offsetX;
        const y = e.offsetY;

        ctx.lineTo(x, y);
        ctx.stroke();
        state.currentPolygon.push({x, y});
    }

    function handleMouseUp() {
        state.isDrawing = false;
    }

    function handleDoubleClick() {
        if (state.currentMode === 'polygon' && state.currentPolygon && state.currentPolygon.length > 2) {
            // Замыкаем полигон
            const first = state.currentPolygon[0];
            const last = state.currentPolygon[state.currentPolygon.length - 1];

            ctx.beginPath();
            ctx.moveTo(last.x, last.y);
            ctx.lineTo(first.x, first.y);
            ctx.stroke();

            state.currentPolygon = null;
        }
    }

    // Управление режимами
    function setMode(mode) {
        state.currentMode = mode;
        state.fillActive = false;
        fillButton.classList.remove('active');
        canvas.style.cursor = 'crosshair';
        updateInfo(`Режим изменен на: ${mode === 'polygon' ? 'Рисование полигонов' : 'Рисование от руки'}`);
    }

    function toggleFillMode() {
        state.fillActive = !state.fillActive;
        fillButton.classList.toggle('active');
        canvas.style.cursor = state.fillActive ? 'crosshair' : 'default';
        updateInfo(state.fillActive ? 'Режим заливки: выберите точку для заливки' : 'Режим заливки выключен');
    }

    // Алгоритмы заполнения
    function fillAtPoint(x, y) {
        state.imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = state.imageData.data;

        const algorithm = fillAlgorithmSelect.value;
        const targetColor = getColorAtPixel(x, y, data);

        if (arrayEquals(targetColor, state.fillColor)) return;

        debugInfo.innerHTML = '';

        switch (algorithm) {
            case 'scanline':
                scanlineFill(state.polygons, state.fillColor);
                break;
            case 'scanlineAEL':
                scanlineFillWithAEL(state.polygons, state.fillColor);
                break;
            case 'floodFill':
                floodFill(x, y, targetColor, state.fillColor, data);
                break;
            case 'floodFillLine':
                floodFillLine(x, y, targetColor, state.fillColor, data);
                break;
        }

        if (!state.debugMode) {
            ctx.putImageData(state.imageData, 0, 0);
        }
    }

    function scanlineFill(polygons, fillColor) {
        const edges = [];

        for (const polygon of polygons) {
            if (polygon.length < 3) continue;

            for (let i = 0; i < polygon.length; i++) {
                const p1 = polygon[i];
                const p2 = polygon[(i + 1) % polygon.length];

                if (p1.y !== p2.y) {
                    const yMin = Math.min(p1.y, p2.y);
                    const yMax = Math.max(p1.y, p2.y);
                    const x = p1.y < p2.y ? p1.x : p2.x;
                    const slopeInv = (p2.x - p1.x) / (p2.y - p1.y);

                    edges.push({
                        yMin,
                        yMax,
                        x,
                        slopeInv
                    });
                }
            }
        }

        if (edges.length === 0) return;

        let minY = canvas.height;
        let maxY = 0;

        for (const edge of edges) {
            minY = Math.min(minY, edge.yMin);
            maxY = Math.max(maxY, edge.yMax);
        }

        edges.sort((a, b) => a.yMin - b.yMin);

        const AET = [];
        let currentEdgeIndex = 0;

        for (let y = minY; y <= maxY; y++) {
            while (currentEdgeIndex < edges.length && edges[currentEdgeIndex].yMin <= y) {
                AET.push(edges[currentEdgeIndex]);
                currentEdgeIndex++;
            }

            for (let i = AET.length - 1; i >= 0; i--) {
                if (AET[i].yMax <= y) {
                    AET.splice(i, 1);
                }
            }

            AET.sort((a, b) => a.x - b.x);

            for (let i = 0; i < AET.length; i += 2) {
                const x1 = Math.ceil(AET[i].x);
                const x2 = Math.floor(AET[i + 1]?.x ?? canvas.width);

                for (let x = x1; x <= x2; x++) {
                    setPixelColor(x, y, fillColor);
                    if (state.debugMode) {
                        debugStep(x, y, `Заполнение: (${x}, ${y})`);
                    }
                }
            }

            for (const edge of AET) {
                edge.x += edge.slopeInv;
            }

            if (state.debugMode) {
                debugStep(null, y, `Строка ${y}: AET содержит ${AET.length} ребер`);
            }
        }
    }

    function scanlineFillWithAEL(polygons, fillColor) {
        // Для простоты используем ту же реализацию
        scanlineFill(polygons, fillColor);
    }

    function floodFill(x, y, targetColor, fillColor, data) {
        const stack = [[x, y]];
        const width = canvas.width;
        const height = canvas.height;

        while (stack.length > 0) {
            const [currentX, currentY] = stack.pop();

            if (currentX < 0 || currentX >= width || currentY < 0 || currentY >= height) {
                continue;
            }

            const pixelColor = getColorAtPixel(currentX, currentY, data);

            if (arrayEquals(pixelColor, targetColor) && !arrayEquals(pixelColor, fillColor)) {
                setPixelColor(currentX, currentY, fillColor, data);

                if (state.debugMode) {
                    debugStep(currentX, currentY, `Затравка: (${currentX}, ${currentY})`);
                }

                stack.push([currentX + 1, currentY]);
                stack.push([currentX - 1, currentY]);
                stack.push([currentX, currentY + 1]);
                stack.push([currentX, currentY - 1]);
            }
        }
    }

    function floodFillLine(x, y, targetColor, fillColor, data) {
        const stack = [[x, y]];
        const width = canvas.width;
        const height = canvas.height;

        while (stack.length > 0) {
            const [currentX, currentY] = stack.pop();
            let leftX = currentX;
            let rightX = currentX;

            while (leftX >= 0 && arrayEquals(getColorAtPixel(leftX, currentY, data), targetColor)) {
                leftX--;
            }
            leftX++;

            while (rightX < width && arrayEquals(getColorAtPixel(rightX, currentY, data), targetColor)) {
                rightX++;
            }
            rightX--;

            for (let x = leftX; x <= rightX; x++) {
                setPixelColor(x, currentY, fillColor, data);

                if (state.debugMode) {
                    debugStep(x, currentY, `Построчная затравка: (${x}, ${currentY})`);
                }
            }

            if (currentY - 1 >= 0) {
                checkLineForFill(leftX, rightX, currentY - 1, targetColor, stack, data);
            }

            if (currentY + 1 < height) {
                checkLineForFill(leftX, rightX, currentY + 1, targetColor, stack, data);
            }
        }
    }

    function checkLineForFill(leftX, rightX, y, targetColor, stack, data) {
        let addedToStack = false;

        for (let x = leftX; x <= rightX; x++) {
            if (arrayEquals(getColorAtPixel(x, y, data), targetColor)) {
                if (!addedToStack) {
                    stack.push([x, y]);
                    addedToStack = true;
                }
            } else {
                addedToStack = false;
            }
        }
    }

    // Вспомогательные функции
    function getColorAtPixel(x, y, data = state.imageData.data) {
        const pos = (y * canvas.width + x) * 4;
        return [
            data[pos],
            data[pos + 1],
            data[pos + 2],
            data[pos + 3]
        ];
    }

    function setPixelColor(x, y, color, data = state.imageData.data) {
        const pos = (y * canvas.width + x) * 4;
        data[pos] = color[0];
        data[pos + 1] = color[1];
        data[pos + 2] = color[2];
        data[pos + 3] = color[3];

        if (state.debugMode) {
            setTimeout(() => {
                ctx.fillStyle = `rgba(${color.join()})`;
                ctx.fillRect(x, y, 1, 1);
            }, state.delay);
        }
    }

    function debugStep(x, y, message) {
        setTimeout(() => {
            if (x !== null && y !== null) {
                ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
                ctx.fillRect(x, y, 1, 1);
            }
            debugInfo.innerHTML += `<div>${message}</div>`;
            debugInfo.scrollTop = debugInfo.scrollHeight;
        }, state.delay);
    }

    function arrayEquals(arr1, arr2) {
        return arr1.length === arr2.length && arr1.every((val, i) => val === arr2[i]);
    }

    function updateFillColor() {
        const hex = fillColorPicker.value;
        const r = parseInt(hex.substr(1, 2), 16);
        const g = parseInt(hex.substr(3, 2), 16);
        const b = parseInt(hex.substr(5, 2), 16);
        state.fillColor = [r, g, b, 255];
    }

    function updateDebugMode() {
        state.debugMode = debugCheckbox.checked;
        updateInfo(`Режим отладки: ${state.debugMode ? 'ВКЛ' : 'ВЫКЛ'}`);
    }

    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        state.polygons = [];
        state.currentPolygon = null;
        state.vertices = [];
        state.fillActive = false;
        fillButton.classList.remove('active');
        canvas.style.cursor = 'crosshair';
        updateInfo("Холст очищен");
    }

    function updateInfo(message) {
        debugInfo.innerHTML += `<div class="info-message">${message}</div>`;
        debugInfo.scrollTop = debugInfo.scrollHeight;
    }

    // Публичный интерфейс
    window.Editor6 = {
        init: init,
        clearCanvas: clearCanvas,
        setMode: setMode,
        toggleFillMode: toggleFillMode,
        updateFillColor: updateFillColor,
        updateDebugMode: updateDebugMode
    };

    Editor6.init();
})();