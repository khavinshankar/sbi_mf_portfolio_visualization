const canvas = d3.select(".canvas");

const svg = canvas
  .append("svg")
  .attr("width", 1000)
  .attr("height", 1000);

const margin = { top: 20, right: 20, bottom: 70, left: 70 };
const graph_width = 600 - margin.left - margin.right;
const graph_height = 600 - margin.top - margin.bottom;
const padding = 1.5;
const clusterPadding = 16;
const max_radius = 15;
const mColors = d3.scaleOrdinal(d3["schemeSet2"]);
const divsion = [
  "Banks/Finance",
  "Consumer Products",
  "Construction & Products",
  "Petroleum & Pesticide Products",
  "Software & Telecom",
  "Pharmaceuticals",
  "Automobiles",
  "Power/Coal Mining",
  "Industrial Products"
];

const main_canvas = svg
  .append("g")
  .attr("width", graph_width / 2)
  .attr("height", graph_height / 2)
  .attr("transform", `translate(${margin.left}, ${margin.top + 100})`);

async function main() {
  let nodes = await d3.csv("./data/data.csv");

  const radiusScale = d3
    .scaleLinear()
    .domain(
      d3.extent(nodes, function(d) {
        return parseInt(d.market_value.replace(/[,]/g, ""));
      })
    )
    .range([10, max_radius + 80]);

  const numberOfBaseTypesScale = d3
    .scaleOrdinal()
    .domain(nodes.map(d => parseInt(d.encoding)));

  const distinctTypesScale = numberOfBaseTypesScale.domain().length;

  const clusters = new Array(distinctTypesScale);

  nodes.map((node, i) => {
    node.cluster = parseInt(node.encoding);
    node.x =
      Math.cos((i / nodes.length) * 2 * Math.PI) * 200 +
      graph_width / 2 +
      Math.random();
    node.y =
      Math.sin((i / nodes.length) * 2 * Math.PI) * 200 +
      graph_height / 2 +
      Math.random();
    node.radius = radiusScale(parseInt(node.market_value.replace(/[,]/g, "")));

    if (!clusters[node.cluster] || node.radius > clusters[node.cluster].radius)
      clusters[node.cluster] = node;
  });

  const force = d3
    .forceSimulation()
    .force("center", d3.forceCenter(graph_width / 2, graph_height / 2))
    .force("cluster", cluster().strength(0.7))
    .force("collide", d3.forceCollide(d => d.radius + padding).strength(0.9))
    .velocityDecay(0.4)
    .on("tick", layoutTick)
    .nodes(nodes);

  const node = main_canvas
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .style("fill", function(d) {
      return mColors(d.cluster / distinctTypesScale);
    });

  node
    .transition()
    .duration(700)
    .delay(function(d, i) {
      return i * 5;
    })
    .attrTween("r", function(d) {
      var i = d3.interpolate(0, d.radius);

      return function(t) {
        return (d.radius = i(t));
      };
    });

  function layoutTick(e) {
    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", d => d.radius)
      .on("mouseover", tip.show)
      .on("mouseout", tip.hide);
  }

  //source: https://bl.ocks.org/mbostock/7881887
  function cluster() {
    var nodes,
      strength = 0.1;

    function force(alpha) {
      alpha *= strength * alpha;

      nodes.forEach(function(d) {
        var cluster = clusters[d.cluster];
        if (cluster === d) return;

        let x = d.x - cluster.x,
          y = d.y - cluster.y,
          l = Math.sqrt(x * x + y * y),
          r = d.radius + cluster.radius;

        if (l != r) {
          l = ((l - r) / l) * alpha;
          d.x -= x *= l;
          d.y -= y *= l;
          cluster.x += x;
          cluster.y += y;
        }
      });
    }

    force.initialize = function(_) {
      nodes = _;
    };

    force.strength = _ => {
      strength = _ == null ? strength : _;
      return force;
    };

    return force;
  }

  scaleLegend
    .domain(
      d3.extent(nodes, function(d) {
        return +d.radius;
      })
    )
    .range([10, max_radius]);

  mColors.domain(divsion);
  legendGroup.call(legend);
  legendGroup.selectAll("text").attr("fill", "white");
  scaleLegendGroup.call(legendSize);
  scaleLegendGroup.selectAll("text").attr("fill", "white");
  scaleLegendGroup.select("g").attr("fill", "#8da0cb");
}

const tip = d3
  .tip()
  .attr("class", "d3-tip")
  .offset([0, -3])
  .direction("e")
  .html(function(d) {
    var mainHtml =
      "<div id='thumbnail'><h3> INFO </h3></div>" +
      "Company:" +
      ": <span style='color:orange'>" +
      d.company_name +
      "</span>" +
      "<p>ISIN: " +
      "<span style='color:orangered'>" +
      d.ISIN +
      "</span> </p>" +
      "<p>Sector: " +
      "<span style='color:orange'>" +
      d.sector +
      "</span> </p>" +
      "<p>Quantity: " +
      "<span style='color:orange'>" +
      d.quantity +
      "</span> </p>" +
      "<p>Market Value (in Lakhs): " +
      "<span style='color:orange'>" +
      d.market_value +
      "</span> </p>" +
      "<p>% to AUM: " +
      "<span style='color:orange'>" +
      d.aum +
      "</span> </p>";

    return mainHtml;
  });

main_canvas.call(tip);

const legendGroup = svg
  .append("g")
  .attr("transform", `translate(${graph_width + 100}, 30)`);

const legend = d3
  .legendColor()
  .shape("circle")
  .shapePadding(4)
  .title("Color Legend")
  .scale(mColors);

const scaleLegendGroup = svg
  .append("g")
  .attr("class", "scale-legend")
  .attr("transform", `translate(${graph_width / 2 - 100}, 30)`);

const scaleLegend = d3.scaleLinear();

const legendSize = d3
  .legendSize()
  .scale(scaleLegend)
  .shape("circle")
  .title("Size Legend")
  .shapePadding(12)
  .labelOffset(20)
  .orient("horizontal")
  .labels(["Small Investment", "", "", "", "High Investment"])
  .labelWrap(30)
  .shapeWidth(40)
  .labelAlign("start");

main();
