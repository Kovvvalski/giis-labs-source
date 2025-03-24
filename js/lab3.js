document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const curveType = document.getElementById("curveType");
    const clearButton = document.getElementById("clearButton");
    let points = [];
    let selectedPoint = null;

    canvas.addEventListener("mousedown", (event) => {
        const { offsetX, offsetY } = event;
        selectedPoint = points.find(p => Math.hypot(p.x - offsetX, p.y - offsetY) < 10);
    });

    canvas.addEventListener("mousemove", (event) => {
        if (selectedPoint) {
            selectedPoint.x = event.offsetX;
            selectedPoint.y = event.offsetY;
            draw();
        }
    });

    canvas.addEventListener("mouseup", () => {
        selectedPoint = null;
    });

    canvas.addEventListener("click", (event) => {
        points.push({ x: event.offsetX, y: event.offsetY });
        draw();
    });

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw control points
        ctx.fillStyle = "red";
        points.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fill();
        });

        if (points.length >= 4) {
            ctx.strokeStyle = "blue";
            ctx.lineWidth = 2;
            ctx.beginPath();
            let curvePoints;
            if (curveType.value === "hermite") {
                curvePoints = hermiteCurve(points);
            } else if (curveType.value === "bezier") {
                curvePoints = bezierCurve(points);
            } else if (curveType.value === "bspline" && points.length > 3) {
                curvePoints = bsplineCurve(points);
            }

            if (curvePoints) {
                ctx.moveTo(curvePoints[0].x, curvePoints[0].y);
                curvePoints.forEach(p => ctx.lineTo(p.x, p.y));
                ctx.stroke();
            }
        }
    }

    function transpose(matrix) {
        return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
    }

    function multiplyMatrices(m1, m2) {
        m2 = transpose(m2);
        return m1.map(row => m2.map(col => row.reduce((sum, val, i) => sum + val * col[i], 0)));
    }

    function bresenhamLine(x0, y0, x1, y1) {
        let points = [];
        let dx = Math.abs(x1 - x0);
        let dy = Math.abs(y1 - y0);
        let sx = x0 < x1 ? 1 : -1;
        let sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        while (true) {
            points.push({ x: x0, y: y0 });
            if (x0 === x1 && y0 === y1) break;
            let e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }

        return points;
    }

    function calculatePointsBetween(C) {
        let mainPoints = [];
        let points = [];

        for (let t = 0; t <= 30; t++) {
            let T = [[(t / 30) ** 3, (t / 30) ** 2, (t / 30), 1]];
            mainPoints.push(multiplyMatrices(T, C)[0]);
        }

        for (let i = 0; i < mainPoints.length - 1; i++) {
            points.push(...bresenhamLine(
                Math.round(mainPoints[i][0]), Math.round(mainPoints[i][1]),
                Math.round(mainPoints[i + 1][0]), Math.round(mainPoints[i + 1][1])
            ));
        }

        return points;
    }

    function hermiteCurve(points) {
        if (points.length < 4) return [];
        let Gn = points.slice(0, 4).map(p => [p.x, p.y]);

        let Mn = [
            [2, -2, 1, 1],
            [-3, 3, -2, -1],
            [0, 0, 1, 0],
            [1, 0, 0, 0]
        ];

        let tangent1 = { x: (Gn[1][0] - Gn[0][0]) * 2, y: (Gn[1][1] - Gn[0][1]) * 2 };
        let tangent2 = { x: (Gn[3][0] - Gn[2][0]) * 2, y: (Gn[3][1] - Gn[2][1]) * 2 };

        Gn[2] = [tangent1.x, tangent1.y];
        Gn[3] = [tangent2.x, tangent2.y];

        let C = multiplyMatrices(Mn, Gn);
        return calculatePointsBetween(C);
    }

    function bezierCurve(points) {
        if (points.length < 4) return [];
        let Gb = points.slice(0, 4).map(p => [p.x, p.y]);

        let Mb = [
            [-1, 3, -3, 1],
            [3, -6, 3, 0],
            [-3, 3, 0, 0],
            [1, 0, 0, 0]
        ];

        let C = multiplyMatrices(Mb, Gb);
        return calculatePointsBetween(C);
    }

    function bsplineCurve(points) {
        if (points.length < 4) return [];
        let Ms = [
            [-1, 3, -3, 1],
            [3, -6, 3, 0],
            [-3, 0, 3, 0],
            [1, 4, 1, 0]
        ].map(row => row.map(v => v / 6));

        let curvePoints = [];

        for (let i = 0; i < points.length - 3; i++) {
            let Cs = [points[i], points[i + 1], points[i + 2], points[i + 3]].map(p => [p.x, p.y]);
            let C = multiplyMatrices(Ms, Cs);
            curvePoints.push(...calculatePointsBetween(C));
        }

        return curvePoints;
    }

    clearButton.addEventListener("click", () => {
        points = [];
        draw();
    });
});
