// Multiline Graph Reference: https://d3-graph-gallery.com/graph/line_several_group.html

// set the dimensions and margins of the graph
var margin = { top: 10, right: 30, bottom: 40, left: 90 },
  width = 1000 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3
  .select("#container")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
const map = new Map();
//Read the data
d3.csv("WHO-COVID-19-global-data.csv", function (data) {
  // Filter only AMRO region
  var filtered_data = data.filter(function (d) {
    if (d["WHO_region"] == "SEARO") {
      return d;
    }
  });

  // group the data: I want to draw one line per group
  var sumstat = d3
    .nest() // nest function allows to group the calculation per level of a factor
    .key(function (d) {
      return d.Country;
    })
    .entries(filtered_data);

  // Add X axis --> it is a date format
  var x = d3
    .scaleTime()
    .domain(
      d3.extent(filtered_data, function (d) {
        return d3.timeParse("%Y-%m-%d")(d.Date_reported);
      })
    )
    .range([0, width]);
  svg
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).ticks(5));

  // Add Y axis
  var y = d3
    .scaleLog()
    .base(2)
    .domain([
      1,
      d3.max(filtered_data, function (d) {
        return Math.max(+d.New_cases, 1);
      }),
    ])
    .range([height, 0]);

  svg.append("g").call(d3.axisLeft(y));

  // Add x-axis label
  svg
    .append("text")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height + margin.top + 20)
    .text("Date Reported");

  // Add y-axis label
  svg
    .append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -margin.top)
    .text("New Cases (in log2)");

  // Tooltip Reference: https://d3-graph-gallery.com/graph/scatter_tooltip.html
  var tooltip = d3
    .select("#container")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("position", "absolute")
    .style("z-index", 1);

  // Draw the line
  var lines = svg
    .selectAll(".line")
    .data(sumstat)
    .enter()
    .append("path")
    .classed("line", true)
    .attr("fill", "none")
    .attr("stroke", "grey")
    .attr("stroke-width", 1.5)
    .attr("country", function (d) {
      if (d.values?.length == 0) return "nothing";
      return d.values[0].Country;
    })
    .attr("highest-cases", function (d) {
      return d3.max(d.values.map((obj) => +obj.New_cases));
    })
    .attr("cumulative-cases", function (d) {
      return d3.max(d.values.map((obj) => +obj.Cumulative_cases));
    })
    .attr("highest-deaths", function (d) {
      return d3.max(d.values.map((obj) => +obj.New_deaths));
    })
    .attr("cumulative-deaths", function (d) {
      return d3.max(d.values.map((obj) => +obj.Cumulative_deaths));
    })
    .attr("d", function (d) {
      return d3
        .line()
        .x(function (d) {
          return x(d3.timeParse("%Y-%m-%d")(d.Date_reported));
        })
        .y(function (d) {
          return y(Math.max(+d.New_cases, 1));
        })(d.values);
    })
    .on("mouseover", function (d) {
      d3.select(this).classed("over", true);
      tooltip.style("opacity", 1);
      console.log(tooltip.style("opacity", 1));
    })
    .on("mousemove", function (d) {
      tooltip
        .html(
          "<p class='tooltip'; style='margin : 0; padding-top:0;'>" +
            this.getAttribute("country") +
            "<br><br>Highest cases in a day: " +
            Number(this.getAttribute("highest-cases")).toLocaleString() +
            "<br><br>Cumulative cases: " +
            Number(this.getAttribute("cumulative-cases")).toLocaleString() +
            "</p>"
        )
        .style("left", d3.mouse(this)[0] + 100 + "px")
        .style("top", d3.mouse(this)[1] + "px");
    })
    .on("mouseout", function (d) {
      d3.select(this).classed("over", false);
      tooltip.transition().duration(200).style("opacity", 0);
    })
    .on("click", selectLine);

  function selectLine(event, d) {
    lines.classed("selected", false);
    d3.select(this).classed("selected", true);
    const info_box = document.getElementById("info-box");
    const country_name = info_box.querySelector("h2");
    const highest_death = info_box.querySelector("p.highest-deaths");
    const cumulative_death = info_box.querySelector("p.cumulative-deaths");

    country_name.innerText = this.getAttribute("country");
    highest_death.innerText = `Highest deaths in a day: ${Number(
      this.getAttribute("highest-deaths")
    ).toLocaleString()}`;
    cumulative_death.innerText = `Cumulative deaths: ${Number(
      this.getAttribute("cumulative-deaths")
    ).toLocaleString()}`;
  }
});
