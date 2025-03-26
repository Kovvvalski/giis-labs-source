document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const curveType = document.getElementById("curveType");
    const clearButton = document.getElementById("clearButton");
    let points = [];
    let curves = [];
    let selectedPoint = null;

    class Curve {
        constructor(p1, p2, p3, p4) {
            this.points = [p1, p2, p3, p4];
        }
    }

    class BSpline {
        constructor() {
            this.points = [];
        }

        addPoint(point) {
            let existingPoint = points.find(p => Math.hypot(p.x - point.x, p.y - point.y) < 10);
            if (!existingPoint) {
                points.push(point);
                this.points.push(point);
            } else {
                this.points.push(existingPoint);
            }
        }
    }

    const bspline = new BSpline();

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
        if (selectedPoint) {
            let existingPoint = points.find(p => p !== selectedPoint && Math.hypot(p.x - selectedPoint.x, p.y - selectedPoint.y) < 10);
            if (existingPoint) {
                curves.forEach(curve => {
                    curve.points = curve.points.map(p => (p === selectedPoint ? existingPoint : p));
                });
                bspline.points = bspline.points.map(p => (p === selectedPoint ? existingPoint : p));
                points = points.filter(p => p !== selectedPoint);
            }
        }
        selectedPoint = null;
    });

    canvas.addEventListener("dblclick", (event) => {
        let newPoint = { x: event.offsetX, y: event.offsetY };
        let existingPoint = points.find(p => Math.hypot(p.x - newPoint.x, p.y - newPoint.y) < 10);

        if (existingPoint) {
            points = points.map(p => (p === existingPoint ? existingPoint : p));
            bspline.points = bspline.points.map(p => (p === existingPoint ? existingPoint : p));
        } else {
            points.push(newPoint);
            existingPoint = newPoint;
        }

        if (curveType.value === "bspline") {
            bspline.addPoint(existingPoint);
            if (bspline.points.length >= 4) {
                curves.push(new Curve(...bspline.points.slice(-4)));
            }
        } else {
            if (points.length % 4 === 0) {
                curves.push(new Curve(...points.slice(-4)));
            }
        }
        draw();
    });

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "red";
        points.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;

        curves.forEach(curve => {
            ctx.beginPath();
            let curvePoints = [];

            if (curveType.value === "hermite") {
                curvePoints = hermiteCurve(curve.points);
                drawVectors(curve.points[0], curve.points[2]);
                drawVectors(curve.points[1], curve.points[3]);
            } else if (curveType.value === "bezier") {
                curvePoints = bezierCurve(curve.points);
                drawVectors(curve.points[0], curve.points[1]);
                drawVectors(curve.points[2], curve.points[3]);
            } else if (curveType.value === "bspline") {
                curvePoints = bsplineCurve(curve.points);
                for (let i = 0; i < curve.points.length - 1; i++) {
                    drawVectors(curve.points[i], curve.points[i + 1]);
                }
            }

            if (curvePoints.length > 0) {
                ctx.moveTo(curvePoints[0].x, curvePoints[0].y);
                curvePoints.forEach(p => ctx.lineTo(p.x, p.y));
                ctx.stroke();
            }
        });
    }

    function drawVectors(p1, p2) {
        ctx.strokeStyle = "green";
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.strokeStyle = "blue";
    }


    function transpose(matrix) {
        let rows = matrix.length;
        let cols = matrix[0].length;
        let transposed = [];
        for (let i = 0; i < cols; i++) {
            let row = [];
            for (let j = 0; j < rows; j++) {
                row.push(0);
            }
            transposed.push(row);
        }
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                transposed[j][i] = matrix[i][j];
            }
        }
        return transposed;
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
            points.push({x: x0, y: y0});
            if (x0 === x1 && y0 === y1) break;
            let e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
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
        let allCurvePoints = [];
        for (let i = 0; i < points.length - 3; i += 4) {
            let p = points.slice(i, i + 4).map(p => [p.x, p.y]);

            let pointsVector = [];
            for (let j = 0; j < p.length; j++) {
                pointsVector.push([...p[j]]);
            }

            pointsVector[0] = p[0];
            pointsVector[1] = p[3];
            pointsVector[2] = p[1];
            pointsVector[3] = p[2];

            let m = [
                [2, -2, 1, 1],
                [-3, 3, -2, -1],
                [0, 0, 1, 0],
                [1, 0, 0, 0]
            ];

            pointsVector[2][0] -= pointsVector[0][0];
            pointsVector[3][0] -= pointsVector[1][0];
            pointsVector[2][0] *= 4;
            pointsVector[3][0] *= 4;

            pointsVector[2][1] -= pointsVector[0][1];
            pointsVector[3][1] -= pointsVector[1][1];
            pointsVector[2][1] *= 4;
            pointsVector[3][1] *= 4;

            let c = multiplyMatrices(m, pointsVector);
            allCurvePoints.push(...calculatePointsBetween(c));
        }
        return allCurvePoints;
    }

    function bezierCurve(points) {
        let allCurvePoints = [];
        for (let i = 0; i < points.length - 3; i += 4) {
            let Gb = points.slice(i, i + 4).map(p => [p.x, p.y]);

            let Mb = [
                [-1, 3, -3, 1],
                [3, -6, 3, 0],
                [-3, 3, 0, 0],
                [1, 0, 0, 0]
            ];

            let C = multiplyMatrices(Mb, Gb);
            allCurvePoints.push(...calculatePointsBetween(C));
        }
        return allCurvePoints;
    }

    function bsplineCurve(points) {
        let allCurvePoints = [];
        let Ms = [
            [-1, 3, -3, 1],
            [3, -6, 3, 0],
            [-3, 0, 3, 0],
            [1, 4, 1, 0]
        ].map(row => row.map(v => v / 6));

        for (let i = 0; i < points.length - 3; i++) {
            let Cs = [points[i], points[i + 1], points[i + 2], points[i + 3]].map(p => [p.x, p.y]);
            let C = multiplyMatrices(Ms, Cs);
            allCurvePoints.push(...calculatePointsBetween(C));
        }

        return allCurvePoints;
    }

    clearButton.addEventListener("click", () => {
        points = [];
        curves =[];
        bspline.points = [];
        draw();
    });
});
