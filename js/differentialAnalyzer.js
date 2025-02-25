function differentialAnalyzer(start, end) {
    let x = start.x, y = start.y;
    let dx = end.x - start.x, dy = end.y - start.y;
    let steps = Math.max(Math.abs(dx), Math.abs(dy));
    let xInc = dx / steps, yInc = dy / steps;
    let pixelArray = [];

    for (let i = 0; i <= steps; i++) {
        pixelArray.push({x: Math.round(x), y: Math.round(y)});
        x += xInc;
        y += yInc;
    }
    return pixelArray;
}