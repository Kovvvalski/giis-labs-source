(function() {
    const canvas = document.getElementById('canvas2d');
    const ctx = canvas.getContext('2d');
    const info = document.getElementById('info2d');

    // Фиксированный прямоугольник отсечения посередине
    const clipRect = {
        x: canvas.width / 2 - 100,
        y: canvas.height / 2 - 75,
        width: 200,
        height: 150
    };

    // Состояние
    const state = {
        lines: [],
        isDrawingLine: false,
        currentLine: null
    };

    // Инициализация
    function init() {
        document.getElementById('clipLineBtn').addEventListener('click', () => {
            updateInfo("Режим рисования отрезков. Кликните и перетащите чтобы нарисовать отрезок.");
        });

        document.getElementById('clipBtn').addEventListener('click', clipAllLines);
        document.getElementById('clear2dBtn').addEventListener('click', clearCanvas);

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);

        updateInfo("2D редактор готов. Рисуйте отрезки, затем нажмите 'Отсечь невидимые линии'.");
        redrawCanvas();
    }

    // Обработчики событий мыши
    function handleMouseDown(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        state.currentLine = [{x, y}, {x, y}];
        state.isDrawingLine = true;
        redrawCanvas();
    }

    function handleMouseMove(e) {
        if (!state.isDrawingLine || !state.currentLine) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        state.currentLine[1] = {x, y};
        redrawCanvas();
    }

    function handleMouseUp(e) {
        if (state.isDrawingLine && state.currentLine) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            state.currentLine[1] = {x, y};
            state.lines.push([...state.currentLine]);
            state.currentLine = null;
            state.isDrawingLine = false;
            updateInfo(`Добавлен отрезок`);
        }

        redrawCanvas();
    }

    // Алгоритм Коэна-Сазерленда для прямоугольного отсечения
    function cohenSutherlandClip(line) {
        const [p1, p2] = line;
        let x1 = p1.x, y1 = p1.y;
        let x2 = p2.x, y2 = p2.y;

        const INSIDE = 0; // 0000
        const LEFT = 1;   // 0001
        const RIGHT = 2;  // 0010
        const BOTTOM = 4; // 0100
        const TOP = 8;    // 1000

        function computeCode(x, y) {
            let code = INSIDE;

            if (x < clipRect.x) code |= LEFT;
            else if (x > clipRect.x + clipRect.width) code |= RIGHT;

            if (y < clipRect.y) code |= TOP;
            else if (y > clipRect.y + clipRect.height) code |= BOTTOM;

            return code;
        }

        let code1 = computeCode(x1, y1);
        let code2 = computeCode(x2, y2);
        let accept = false;

        while (true) {
            if ((code1 === 0) && (code2 === 0)) {
                accept = true;
                break;
            } else if (code1 & code2) {
                break;
            } else {
                let x, y;
                const codeOut = code1 ? code1 : code2;

                if (codeOut & TOP) {
                    x = x1 + (x2 - x1) * (clipRect.y - y1) / (y2 - y1);
                    y = clipRect.y;
                } else if (codeOut & BOTTOM) {
                    x = x1 + (x2 - x1) * (clipRect.y + clipRect.height - y1) / (y2 - y1);
                    y = clipRect.y + clipRect.height;
                } else if (codeOut & RIGHT) {
                    y = y1 + (y2 - y1) * (clipRect.x + clipRect.width - x1) / (x2 - x1);
                    x = clipRect.x + clipRect.width;
                } else if (codeOut & LEFT) {
                    y = y1 + (y2 - y1) * (clipRect.x - x1) / (x2 - x1);
                    x = clipRect.x;
                }

                if (codeOut === code1) {
                    x1 = x;
                    y1 = y;
                    code1 = computeCode(x1, y1);
                } else {
                    x2 = x;
                    y2 = y;
                    code2 = computeCode(x2, y2);
                }
            }
        }

        if (accept) {
            return [{x: x1, y: y1}, {x: x2, y: y2}];
        } else {
            return null;
        }
    }

    function clipAllLines() {
        for (let i = 0; i < state.lines.length; i++) {
            const clipped = cohenSutherlandClip(state.lines[i]);
            if (clipped) {
                state.lines[i] = clipped;
            } else {
                state.lines[i] = null;
            }
        }

        // Удаляем полностью невидимые отрезки
        state.lines = state.lines.filter(line => line !== null);
        updateInfo("Невидимые части отрезков удалены");
        redrawCanvas();
    }

    // Перерисовка холста
    function redrawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Рисуем прямоугольник отсечения
        ctx.fillStyle = 'rgba(200, 200, 255, 0.3)';
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.strokeRect(clipRect.x, clipRect.y, clipRect.width, clipRect.height);
        ctx.fillRect(clipRect.x, clipRect.y, clipRect.width, clipRect.height);

        // Рисуем все отрезки
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        for (const line of state.lines) {
            ctx.beginPath();
            ctx.moveTo(line[0].x, line[0].y);
            ctx.lineTo(line[1].x, line[1].y);
            ctx.stroke();
        }

        // Рисуем текущий отрезок (если он рисуется)
        if (state.currentLine) {
            ctx.strokeStyle = 'gray';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(state.currentLine[0].x, state.currentLine[0].y);
            ctx.lineTo(state.currentLine[1].x, state.currentLine[1].y);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    // Очистка холста
    function clearCanvas() {
        state.lines = [];
        state.currentLine = null;
        state.isDrawingLine = false;
        redrawCanvas();
        updateInfo("Холст очищен.");
    }

    // Обновление информации
    function updateInfo(message) {
        info.innerHTML = `<div class="info-message">${message}</div>`;
    }

    window.Editor8_1 = {
        init: init,
        clearCanvas: clearCanvas
    };

    Editor8_1.init();
})();