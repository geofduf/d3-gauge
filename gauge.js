function gauge(p) {

    const defaultValues = {
        "outerRadius": 100,
        "innerRadius": 90,
        "labelType": "majorTick",
        "majorTickFrequency": 10,
        "labelFontSize": "10px",
        "labelFormatter": x => x.toString(),
        "valueFontSize": "14px",
        "valueFormatter": x => x.toString(),
        "colors": []
    };

    p = Object.assign(defaultValues, p);

    if (p.max <= p.min) {
        p.max = p.min + 1;
    }

    const valueRange = p.max - p.min;

    if (Math.max(...p.colors.map(x => x[0])) < p.max) {
        p.colors.push([
            p.max,
            "gray"
        ]);
    }

    if (p.minorTickStep > valueRange) {
        p.minorTickStep = valueRange;
        p.majorTickFrequency = 1;
    }

    if (p.innerRadius > p.outerRadius) {
        p.innerRadius = p.outerRadius;
    }

    const startAngle = -Math.PI * .75;
    const endAngle = Math.PI * .75;

    const range = endAngle - startAngle;

    const width = p.outerRadius * 2 + 80;
    const height = width;

    const svg = d3.select(`#${p.target}`)
        .append("svg")
            .attr("width", width)
            .attr("height", height);

    const g = svg.append("g")
        .attr("transform", `translate(${width / 2} ${height / 2})`);

    const arcs = [];
    const labels = [];

    let start = startAngle;
    for (const [v, color] of p.colors) {
        const angle = toAngle(v);
        if (angle > start) {
            const end = Math.min(angle, endAngle);
            arcs.push({
                "start": start,
                "end": end,
                "color": color
            });
            if (p.labelType === "colors") {
                labels.push({
                    "angle": end,
                    "text": p.labelFormatter(v),
                    "position": toCartesian(p.outerRadius + 10, end)
                });
            }
            start = end;
        }
    }

    const arc = d3.arc()
        .innerRadius(p.innerRadius)
        .outerRadius(p.outerRadius)
        .startAngle(d => d.start)
        .endAngle(d => d.end);

    g.selectAll("path")
        .data(arcs)
        .enter()
        .append("path")
            .attr("stroke", d => d.color)
            .attr("fill", d => d.color)
            .attr("d", arc);

    const ticks = [];

    let cnt = 0;
    let value = p.min;
    while (value <= p.max && cnt <= 360) {
        const major = cnt % p.majorTickFrequency === 0 ? true : false;
        const index = p.colors.findIndex(x => value < x[0]);
        const length = major ? 5 : 2;
        const angle = toAngle(value);
        ticks.push({
            "angle": angle,
            "color": index === -1 ? p.colors[p.colors.length - 1][1] : p.colors[index][1],
            "line": [
                toCartesian(p.innerRadius - length, angle),
                toCartesian(p.outerRadius + length, angle)
            ]
        });
        if (major && p.labelType === "majorTick") {
            labels.push({
                "angle": angle,
                "text": p.labelFormatter(value),
                "position": toCartesian(p.outerRadius + 10, angle)
            });
        }
        value = Math.round((value + p.minorTickStep) * 1000000) / 1000000;
        cnt++;
    }

    g.selectAll("line")
        .data(ticks)
        .enter()
        .append("line")
            .attr("x1", d => d.line[0][0])
            .attr("y1", d => d.line[0][1])
            .attr("x2", d => d.line[1][0])
            .attr("y2", d => d.line[1][1])
            .attr("stroke", d => d.color);

    g.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 6)
        .attr("stroke", "black")
        .attr("fill", "black");

    const valueSafe = Math.min(Math.max(p.min, p.value), p.max);

    const arrowLine = [
        toCartesian(14, toAngle(valueSafe) - Math.PI),
        toCartesian(p.outerRadius, toAngle(valueSafe))
    ];

    g.append("line")
        .attr("x1", arrowLine[0][0])
        .attr("y1", arrowLine[0][1])
        .attr("x2", arrowLine[1][0])
        .attr("y2", arrowLine[1][1])
        .attr("stroke", "black")
        .attr("stroke-width", 3);

    if (p.labelType === "colors") {
        labels.push({
            "angle": startAngle,
            "text": p.labelFormatter(p.min),
            "position": toCartesian(p.outerRadius + 10, startAngle)
        });
    }

    g.selectAll("text")
        .data(labels)
        .enter()
        .append("text")
            .text(d => d.text)
            .attr("dx", d => d.position[0])
            .attr("dy", d => d.position[1])
            .attr("transform", d => `rotate(${d.angle * 180 / Math.PI} ${d.position.join(" ")})`)
            .style("text-anchor", "middle")
            .style("font-size", p.labelFontSize)
            .style("font-family", "helvetica")
            .style("fill", "black");

    g.append("text")
        .text(p.valueFormatter(p.value))
        .attr("dx", 0)
        .attr("dy", p.outerRadius * .5)
        .style("text-anchor", "middle")
        .style("font-size", p.valueFontSize)
        .style("font-family", "helvetica")
        .style("font-weight", "bold")
        .style("fill", "black");

    function toCartesian(r, angle) {
        return [r * Math.cos(angle - Math.PI / 2), r * Math.sin(angle - Math.PI / 2)];
    }

    function toAngle(value) {
        return startAngle + (value - p.min) / valueRange * range;
    }

}