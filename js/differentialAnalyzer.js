function differentialAnalyzer(start, end) {
    let x = start.x;
    let y = start.y;
    let dx = end.x - start.x
    let dy = end.y - start.y;
    let length = Math.max(Math.abs(dx), Math.abs(dy));
    let xInc = dx / length;
    let yInc = dy / length;
    let pixelArray = [];

    for (let i = 0; i <= length; i++) {
        pixelArray.push({x: Math.round(x), y: Math.round(y), color: DEFAULT_COLOR});
        x += xInc;
        y += yInc;
    }
    return pixelArray;
}