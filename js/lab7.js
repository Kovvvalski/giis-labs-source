const svg = d3.select("#visualization");

let points = [];
let delaunay = null;
let voronoi = null;

function updateVisualization() {
    svg.selectAll("*").remove();

    if (!delaunay || !voronoi) return;

    svg.append("g")
        .attr("class", "triangulation")
        .selectAll("path")
        .data(delaunay.trianglePolygons())
        .enter().append("path")
        .attr("d", d => "M" + d.join("L") + "Z")
        .style("stroke", "red")
        .style("stroke-width", 1)
        .style("fill", "none");

    svg.append("g")
        .attr("class", "points")
        .selectAll("circle")
        .data(points)
        .enter().append("circle")
        .attr("cx", d => d[0])
        .attr("cy", d => d[1])
        .attr("r", 3);

    svg.append("g")
        .attr("class", "voronoi")
        .selectAll("path")
        .data(voronoi.cellPolygons())
        .enter().append("path")
        .attr("d", d => "M" + d.join("L") + "Z")
        .style("stroke", "black")
        .style("stroke-width", 1)
        .style("fill", "none");
}

function handleMouseClick(event) {
    const point = d3.pointer(event, svg.node());
    points.push(point);
    delaunay = d3.Delaunay.from(points);
    voronoi = delaunay.voronoi([0, 0, 500, 500]);
    updateVisualization();
}

function clearCanvas() {
    points = [];
    delaunay = null;
    voronoi = null;
    updateVisualization();
}

svg.on("click", handleMouseClick);

// экспорт функции очистки, если надо вызывать с кнопки
window.clearVoronoiCanvas = clearCanvas;
