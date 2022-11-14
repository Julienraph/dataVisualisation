//////////////////     COLOR LEGEND FILE
const colorLegend = (selection, props) => {
    const { colorScale, circleRadius, spacing, textOffSet, backgroundRectWidth, onClick, selectedColorValue, currentDomainGenre } = props;
  

    const backgroundRect = selection.selectAll("rect")
    .data([null]);
    const n = currentDomainGenre.length
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
      .data(currentDomainGenre.sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'})));
    const groupsEnter = groups.enter().append('g').attr("class","tick")
    groupsEnter
      .merge(groups)
        .attr('transform', (d, i) =>
          `translate(0,${i * spacing})`
        )
        .attr('opacity', d => 
        (!selectedColorValue || d === selectedColorValue) ? 1 : 0.2)
        .on('click', d => onClick(
          d == selectedColorValue ? null : d
        ));
    groups.exit().remove();
    
   
    groupsEnter.append('circle')
      .merge(groups.select('circle'))
        .attr('r', circleRadius)
        .attr("fill",d => {
          if(d != "Undefined") {
          return colorScale(d)
          } else {
            return "rgb(107,107,107)"
          }})
    
    groupsEnter.append('text')
      .merge(groups.select('text'))
        .text(d => d.charAt(0).toUpperCase() + d.toLowerCase().slice(1))
        .attr("dy","0.32em")
        .attr('x', textOffSet);
  }
  //////////////////////////////////////////////////

 ///////////////////////// LoadAndProcessData FILE
var year = 2011
var rangeColor = []
var domainColor
var currentDomainGenre
const loadAndProcessData = () =>
Promise.all([
  //d3.tsv('https://unpkg.com/world-atlas@1.1.4/world/50m.json'),
    d3.csv('http://127.0.0.1:5500/dataGroupBy.csv'),
    d3.json('https://unpkg.com/world-atlas@1.1.4/world/50m.json'),
    d3.tsv('https://unpkg.com/world-atlas@1.1.4/world/50m.tsv')
]).then(([tsvData, topoJSONdata,tsvCountryData]) => {
    const countries = topojson.feature(topoJSONdata, topoJSONdata.objects.countries);
    const rowById = {}
    const rowByIdCountry = {}
    rangeColor = []
    domainColor = [...new Set(tsvData.map(item => item.goodGeneralGenre))]
    for (let i = 0; i < domainColor.length; i++) {
      rangeColor.push(d3.interpolateSinebow(i/domainColor.length))
    }

    tsvData.forEach(d => {
      rowById[d.goodISO] = d;
    });
    tsvCountryData.forEach(d => {
      rowByIdCountry[d.iso_n3] = d;
    });
    countries.features.forEach(d => {
      var newdata = tsvData.filter(function(row) {return row.goodISO == d.id && row.goodDate == year && row.goodGeneralGenre != "Other" && row.goodGeneralGenre != "Undefined"});
     // console.log(newdata)
      var max = d3.max(newdata, function(row) { return row.deezerFans});
      var filterData = newdata.filter(function(row) {return row.deezerFans == max});
     //   Object.assign(d.properties, filterData.length > 0 ? objectNotDefined : objectNotDefined); 
      var line;
      if (filterData.length > 0) {
        line = {"": "22632","goodDate": filterData[0].goodDate, "goodCountry": filterData[0].goodCountry, "goodGenre": filterData[0].goodGenre, "goodGeneralGenre": filterData[0].goodGeneralGenre, 
        "goodISO": filterData[0].goodISO, "deezerFans": filterData[0].deezerFans}
      } else {
        line =  { "": "22632", "goodDate": "Undefined", "goodCountry": rowByIdCountry[d.id].name, "goodGenre": "Undefined", "goodISO": "Undefined", "goodGeneralGenre" : "Undefined","deezerFans": "Undefined" };
      }
      //Object.assign(d.properties, d.id in rowById ? rowById[d.id] : objectNotDefined);
      Object.assign(d.properties, line); 
        //Object.assign(d.properties, d.id in rowById ? rowById[d.id] : console.log("yo"));
  
    });
    return countries;
});
//////////////////////////////////////////////////
var width = window.innerWidth
    height = window.innerHeight
const svg = d3.select('svg')
  .attr("width", "100%")
  .attr("height", "100%")
  .attr('transform','transalate(',width,height,')')

const projection = d3.geoNaturalEarth1();
const pathGenerator = d3.geoPath().projection(projection);

const choroplethMapG = svg.append("g")
.attr('transform', 'scale(2)')
.attr('id', 'map');

const colorLegendG = svg.append("g")
.attr('transform',`translate(80,220)`);



const colorScale = d3.scaleOrdinal();
const colorValue = d => {
  return d.properties.goodGeneralGenre
}

let selectedColorValue;
let features; 
let selectedCountryId;

var slider = document.getElementById("slider");
var output = document.getElementById("demo");
output.innerHTML = slider.value;

slider.oninput = function() {

  output.innerHTML = this.value;
  year = slider.value
  loadAndProcessData().then(countries => {
    currentDomainGenre = [...new Set(countries.features.map(item => item.properties.goodGeneralGenre))]
    features = countries.features;
    render();
  });
}

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
  currentDomainGenre = [...new Set(countries.features.map(item => item.properties.goodGeneralGenre))]
  render();
});

const render = () => {
  colorScale.domain(domainColor);
    colorScale.domain(colorScale.domain().sort())
    .range(rangeColor);

    colorLegendG.call(colorLegend, {
        colorScale,
        circleRadius: 8,
        spacing: 20,
        textOffSet: 12,
        backgroundRectWidth: 235,
        onClick, 
        selectedColorValue,
        currentDomainGenre
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
 const countryPaths = g.selectAll('.country').data(features.filter(d =>d.id !== "010"));   
 const countryPathsEnter = countryPaths
 .enter()
   .append('path')
   .attr('class', 'country') 
countryPaths
 .merge(countryPathsEnter)
 .attr('d', pathGenerator)
 .attr("fill",d => {
  if(d.properties.goodGeneralGenre != "Undefined") {
  return colorScale(colorValue(d))
  } else {
    return "rgb(107,107,107)"
  }})
  .attr('opacity', d => (!selectedColorValue && ! selectedCountryId) || selectedColorValue === colorValue(d) || selectedCountryId === d.id ? 1 : 0.1)
  .classed('highlighted', d => (selectedColorValue || selectedCountryId ) && (selectedColorValue == colorValue(d)) || selectedCountryId === d.id);
  
  countryPathsEnter.append("title").attr("class","title")

  g.selectAll('.country').data(features.filter(d =>d.id !== "010")).select(".title").text(function(d) {  
    var countryUppercase = d.properties.goodCountry.charAt(0).toUpperCase() + d.properties.goodCountry.slice(1);
    var generalGenreUppercase = colorValue(d).charAt(0).toUpperCase() + colorValue(d).slice(1);
    var genreUppercase = d.properties.goodGenre.charAt(0).toUpperCase() + d.properties.goodGenre.slice(1);
    return "Country: " + countryUppercase + "\n" + "Genre" + ": " + generalGenreUppercase + " - " + genreUppercase + "\n" + "Deezer fans: " + d.properties.deezerFans
});

  countryPaths
  .merge(countryPathsEnter)
   .on("click", d => {
    if (selectedCountryId && selectedCountryId === d.id) {
      onCountryClick(null);
    } else {
    onCountryClick(d.id);
    }
  })
 };