(function renderInteractiveAIRMap() {
    // 1. Data Processing & Normalization
    const countryData = {};
    const years = Object.values(window.bibData)
        .map(d => parseInt(d.year))
        .filter(y => !isNaN(y));
    
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    function getFilteredData(start, end) {
        const counts = {};
        const details = {};

        Object.entries(window.bibData).forEach(([key, entry]) => {
            const year = parseInt(entry.year);
            if (year >= start && year <= end && entry.born) {
                const countries = entry.born.split(',').map(c => c.trim());
                const authors = entry.author.split(',').map(a => a.trim());

                countries.forEach((country, i) => {
                    if (country === "Unknown" || country === "Various") return;
                    
                    // Normalize for D3 World Atlas
                    let name = country;
                    if (name === "USA") name = "United States of America";
                    if (name === "UK" || name === "England" || name === "Scotland") name = "United Kingdom";
                    if (name === "Russia") name = "Russian Federation";

                    counts[name] = (counts[name] || 0) + 1;
                    if (!details[name]) details[name] = [];
                    
                    details[name].push({
                        author: authors[i] || authors[0], // Fallback for single-author labeled entries
                        year: year,
                        title: entry.title
                    });
                });
            }
        });
        return { counts, details };
    }

    // 2. Load Libraries
    const libs = [
        "https://d3js.org/d3.v7.min.js",
        "https://unpkg.com/topojson@3"
    ];

    let loaded = 0;
    libs.forEach(src => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => { if (++loaded === libs.length) init(); };
        document.head.appendChild(s);
    });

    function init() {
        const target = document.getElementById('contents');
        const container = d3.select(target).append("div").attr("id", "map-viz-container")
            .style("position", "relative").style("font-family", "sans-serif");

        // Controls
        const controls = container.append("div").style("margin", "20px 0");
        controls.append("label").text(`Time Range: `).style("font-weight", "bold");
        const yearDisplay = controls.append("span").text(`${minYear} - ${maxYear}`);
        
        const sliderContainer = controls.append("div").style("display", "flex").style("gap", "10px").style("margin-top", "10px");
        const startInput = sliderContainer.append("input").attr("type", "range")
            .attr("min", minYear).attr("max", maxYear).attr("value", minYear);
        const endInput = sliderContainer.append("input").attr("type", "range")
            .attr("min", minYear).attr("max", maxYear).attr("value", maxYear);

        // Tooltip
        const tooltip = d3.select("body").append("div")
            .style("position", "absolute").style("background", "white").style("padding", "10px")
            .style("border", "1px solid #ccc").style("border-radius", "4px").style("pointer-events", "none")
            .style("visibility", "hidden").style("z-index", "1000").style("box-shadow", "0 2px 5px rgba(0,0,0,0.2)");

        const svg = container.append("svg").attr("viewBox", "0 0 960 500").style("width", "100%").style("background", "#f9f9f9");
        const g = svg.append("g");
        const projection = d3.geoNaturalEarth1().scale(160).translate([480, 250]);
        const path = d3.geoPath().projection(projection);
        const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, 10]);

        d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(world => {
            const countries = topojson.feature(world, world.objects.countries).features;

            function update() {
                const s = +startInput.property("value");
                const e = +endInput.property("value");
                if (s > e) return; // Simple validation
                yearDisplay.text(`${s} - ${e}`);
                
                const { counts, details } = getFilteredData(s, e);

                const paths = g.selectAll("path").data(countries);
                paths.enter().append("path")
                    .attr("d", path)
                    .attr("stroke", "#fff")
                    .merge(paths)
                    .attr("fill", d => counts[d.properties.name] ? colorScale(counts[d.properties.name]) : "#eee")
                    .on("mouseover", (event, d) => {
                        const name = d.properties.name;
                        const countryDetails = details[name];
                        if (!countryDetails) return;

                        tooltip.style("visibility", "visible")
                            .html(`<strong>${name}</strong><br/>` + 
                                countryDetails.map(item => `• ${item.author} (${item.year}): <em>${item.title}</em>`).join("<br/>")
                            );
                    })
                    .on("mousemove", (event) => {
                        tooltip.style("top", (event.pageY + 10) + "px").style("left", (event.pageX + 10) + "px");
                    })
                    .on("mouseout", () => tooltip.style("visibility", "hidden"));
            }

            startInput.on("input", update);
            endInput.on("input", update);
            update();
        });
    }
})();
