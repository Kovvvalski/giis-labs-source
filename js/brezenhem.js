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
        pixelArray.push({x: x1, y: y1});

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
