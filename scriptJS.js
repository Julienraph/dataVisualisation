//////////////////     COLOR LEGEND FILE
const colorLegend = (selection, props) => {
    const { colorScale, circleRadius, spacing, textOffSet, backgroundRectWidth, onClick, selectedColorValue } = props;
  

    const backgroundRect = selection.selectAll("rect")
    .data([null]);
    const n = colorScale.domain().length
    backgroundRect.enter().append('rect')
    .merge(backgroundRect)
        .attr("x", -circleRadius * 2)
        .attr("y", -circleRadius * 2)
        .attr("rx",circleRadius * 2)
        .attr("width", backgroundRectWidth)
        .attr("height", spacing * n + circleRadius * 2)
        .attr("fill", "white")
        .attr("opacity",0.8);
    const groups = selection.selectAll('g')
      .data(colorScale.domain());
    const groupsEnter = groups.enter().append('g').attr("class","tick")
    groupsEnter
      .merge(groups)
        .attr('transform', (d, i) =>
          `translate(0,${i * spacing})`
        )
        .attr('opacity', d => 
        (!selectedColorValue || d === selectedColorValue) ? 1 : 0.2)
        .on('click', d => onClick(
          d== selectedColorValue ? null : d
        ));
    groups.exit().remove();
    
    groupsEnter.append('circle')
      .merge(groups.select('circle'))
        .attr('r', circleRadius)
        .attr('fill', d => colorScale(d));
    
    groupsEnter.append('text')
      .merge(groups.select('text'))
        .text(d => d)
        .attr("dy","0.32em")
        .attr('x', textOffSet);
  }
  //////////////////////////////////////////////////

 ///////////////////////// LoadAndProcessData FILE
const objectNotDefined = { "": "22632", goodDate: "Other", goodCountry: "Other", goodGenre: "Other", goodISO: "Other", deezerFans: "Other" }

test = d3.tsv('http://127.0.0.1:5500/dataGroupBy.tsv')
const loadAndProcessData = () =>
Promise.all([
  //d3.tsv('https://unpkg.com/world-atlas@1.1.4/world/50m.json'),
    d3.csv('http://127.0.0.1:5500/dataGroupBy.csv'),
    d3.json('https://unpkg.com/world-atlas@1.1.4/world/50m.json')
]).then(([tsvData, topoJSONdata]) => {
    const rowById = {}
    tsvData.forEach(d => {
      rowById[d.goodISO] = d;
    });
    const countries = topojson.feature(topoJSONdata, topoJSONdata.objects.countries);
    countries.features.forEach(d => {
        Object.assign(d.properties, d.id in rowById ? rowById[d.id] : objectNotDefined);
    });
    return countries;
});
//////////////////////////////////////////////////
var width = window.innerWidth
    height = window.innerHeight
const svg = d3.select('svg')
  .attr("width", width)
  .attr("height", height)
  .attr('transform','transalate(',width,height,')')

const projection = d3.geoNaturalEarth1();
const pathGenerator = d3.geoPath().projection(projection);


const choroplethMapG = svg.append("g")
.attr('transform', 'scale(2)')
.attr('id', 'map');

const colorLegendG = svg.append("g")
.attr('transform',`translate(100,500)`);


const colorScale = d3.scaleOrdinal();
const colorValue = d => {
  return d.properties.goodGenre
}

let selectedColorValue;
let features; 
let selectedCountryId;

const onClick = d => {
  if(d != null) {
    selectedCountryId = null
  }
  selectedColorValue = d;
  render();
};

const onCountryClick = id => {
  if(id != null) {
    selectedColorValue = null
  }
  selectedCountryId = id;
  render();
}

loadAndProcessData().then(countries => {
  features = countries.features;
  render();
});

const render = () => {
  colorScale.domain(features.map(colorValue));
    colorScale.domain(colorScale.domain().sort().reverse())
    .range(d3.schemeRdYlGn[colorScale.domain().length]);

    colorLegendG.call(colorLegend, {
        colorScale,
        circleRadius: 8,
        spacing: 20,
        textOffSet: 12,
        backgroundRectWidth: 235,
        onClick, 
        selectedColorValue
    });  

    choroplethMapG.call(choroplethMap, {
      features,
      colorScale,
      colorValue,
      selectedColorValue,
      selectedCountryId,
      onCountryClick,
      width,
      height
    });
 
  };


 ///////////////////////// choropleth FILE

 const choroplethMap = (selection, props) => {
  const {
    features,
    colorScale,
    colorValue,
    selectedColorValue,
    selectedCountryId,
    onCountryClick,
    width,
    height
  } = props;
 
  const gUpdate = selection.selectAll('g').data([null]);
  const gEnter = gUpdate.enter().append('g')
  const g = gUpdate.merge(gEnter);
  gEnter.append('path')
  .attr('class', 'sphere')
  .attr('d', pathGenerator({type: 'Sphere'}))
  .merge(gUpdate.select('.sphere'))
    .attr('opacity', selectedColorValue || selectedCountryId ? 0.05 : 1);
  var topLeft = projection([0,0]);
  var bottomRight = projection([200,200]);
  selection.call(d3.zoom().scaleExtent([1, Infinity]).translateExtent([[0,0],[width,height]]).on("zoom", () => {
  g.attr("transform",d3.event.transform);
  }));
 const countryPaths = g.selectAll('.country').data(features);   
 const countryPathsEnter = countryPaths
 .enter().append('path')
   .attr('class', 'country')
countryPaths
 .merge(countryPathsEnter)
 .attr('d', pathGenerator)
 .attr("fill",d => colorScale(colorValue(d)))
  .attr('opacity', d => (!selectedColorValue && ! selectedCountryId) || selectedColorValue === colorValue(d) || selectedCountryId === d.id ? 1 : 0.1)
  .classed('highlighted', d => (selectedColorValue || selectedCountryId ) && (selectedColorValue == colorValue(d)) || selectedCountryId === d.id)
  .on("click", d => {
    if (selectedCountryId && selectedCountryId === d.id) {
      onCountryClick(null);
    } else {
    onCountryClick(d.id);
    }
  })
   countryPathsEnter.append("title")
   .text(d => d.properties.name + ": " + colorValue(d));

   
 };