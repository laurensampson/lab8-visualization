//Author: Lauren Sampson 
const margin = ({top: 750/10, right: 750/10, bottom: 750/10, left: 750/10})
const height =750 - margin.top- margin.bottom;
const width = 750 - margin.right- margin.left;

function ConnectedScatterplot(data, {
    x = ([x]) => x, 
    y = ([, y]) => y, 
    title,
    r = 4, // fixed radius for the dots
    orient = () => "top", 
    defined,
    curve = d3.curveCatmullRom,
    height = 420, 
    width = 640,  
    marginBottom = 30, 
    marginTop = 20, 
    marginLeft = 30, 
    marginRight = 20, 
    inset = r * 2, 
    insetBottom = inset, 
    insetTop = inset, 
    insetLeft = inset,
    insetRight = inset, 
    yType = d3.scaleLinear, 
    yDomain, 
    yRange = [height - marginBottom - insetBottom, marginTop + insetTop], 
    yFormat, // y-axis format specifier string
    yLabel,
    xType = d3.scaleLinear, 
    xDomain, 
    xRange = [marginLeft + insetLeft, width - marginRight - insetRight], 
    xFormat, // x-axis format specifier string
    xLabel, 
    fill = "pink", 
    strokeLinecap = "round", 
    strokeLinejoin = "round", 
    stroke = "currentColor", 
    strokeWidth = 2, 
    halo = "#fff", 
    haloWidth = 5, 
    duration = 0
  } = {}) {
    
    // Compute values
    const Y = d3.map(data, y);
    const X = d3.map(data, x);
    const T = title == null ? null : d3.map(data, title);
    const O = d3.map(data, orient);
    const I = d3.range(X.length);
    if (defined === undefined) defined = (d, i) => !isNaN(X[i]) && !isNaN(Y[i]);
    const D = d3.map(data, defined);
  
     // Compute the default domains
    if (xDomain === undefined) xDomain = d3.nice(...d3.extent(X), width / 80);
    if (yDomain === undefined) yDomain = d3.nice(...d3.extent(Y), height / 50);
  
    const xScale = xType(xDomain, xRange);
    const yScale = yType(yDomain, yRange);
    const xAxis = d3.axisBottom(xScale).ticks(width / 80, xFormat);
    const yAxis = d3.axisLeft(yScale).ticks(height / 50, yFormat);
  
    const line = d3.line()
        .curve(curve)
        .defined(i => D[i])
        .x(i => xScale(X[i]))
        .y(i => yScale(Y[i]));
  
    const svg = d3.select(".chart").append("svg")
        .attr("height", height)
        .attr("width", width)
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
        .attr("viewBox", [0, 0, width, height]);
  
    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(xAxis)
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("stroke-opacity", 0.1))
            .attr("y2", marginTop + marginBottom - height)
        .call(g => g.append("text")
            .attr("x", width)
            .attr("y", marginBottom - 4)
            .attr("fill", "currentColor")
            .attr("text-anchor", "end")
            .text(xLabel));
        
    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(yAxis)
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", width - marginLeft - marginRight)
            .attr("stroke-opacity", 0.1))
        .call(g => g.append("text")
            .attr("y", 10)
            .attr("x", -marginLeft)
            .attr("text-anchor", "start")
            .attr("fill", "currentColor")
            .text(yLabel));
  
    const path = svg.append("path")
        .attr("fill", "none")
        .attr("stroke", stroke)
        .attr("stroke-width", strokeWidth)
        .attr("stroke-linejoin", strokeLinejoin)
        .attr("stroke-linecap", strokeLinecap)
        .attr("d", line(I));
    
    svg.append("g")
        .attr("fill", fill)
        .attr("stroke-width", strokeWidth)
        .attr("stroke", stroke)
        .selectAll("circle")
        .data(I.filter(i => D[i]))
        .join("circle")
        .attr("cy", i => yScale(Y[i]))
        .attr("cx", i => xScale(X[i]))
        .attr("r", r);
  
    const label = svg.append("g")
        .attr("font-size", 10)
        .attr("font-family", "calibri")
        .attr("stroke-linejoin", "round")
        .selectAll("g")
        .data(I.filter(i => D[i])).join("g")
        .attr("transform", i => `translate(${xScale(X[i])},${yScale(Y[i])})`);
  
    if (T) label.append("text")
        .text(i => T[i])
        .each(function(i) {
          const t = d3.select(this);
          switch (O[i]) {
            case "bottom": t.attr("text-anchor", "middle").attr("dy", "1.4em"); break;
            case "left": t.attr("dx", "-0.5em").attr("dy", "0.32em").attr("text-anchor", "end"); break;
            case "right": t.attr("dx", "0.5em").attr("dy", "0.32em").attr("text-anchor", "start"); break;
            default: t.attr("text-anchor", "middle").attr("dy", "-0.7em"); break;
          }
        })
        .call(text => text.clone(true))
        .attr("fill", "none")
        .attr("stroke", halo)
        .attr("stroke-width", haloWidth);
  
    // Measure the length of the given SVG path string
    function length(path) {
      return d3.create("svg:path").attr("d", path).node().getTotalLength();
    }
  
    function animate() {
      if (duration > 0) {
        const l = length(line(I));
  
        path
            .interrupt()
            .attr("stroke-dasharray", `0,${l}`)
            .transition()
            .duration(duration)
            .ease(d3.easeLinear)
            .attr("stroke-dasharray", `${l},${l}`);
  
        label
            .interrupt()
            .attr("opacity", 0)
            .transition()
            .delay(i => length(line(I.filter(j => j <= i))) / l * (duration - 125))
            .attr("opacity", 1);
      }    
    }
  
    animate();
  
    return Object.assign(svg.node(), {animate});
  }

d3.csv('driving.csv', d3.autoType)
.then(driving=>{
    chart = ConnectedScatterplot(driving, {
        y: d => d.gas,
        x: d => d.miles,
        title: d => d.year,
        orient: d => d.side,
        yFormat: ".2f",
        yLabel: "Cost per Gallon",
        xLabel: "Miles driven (per capita per year)",
        width,
        height: 720,
        duration: 5000 
      })
}
)