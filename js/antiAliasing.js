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
