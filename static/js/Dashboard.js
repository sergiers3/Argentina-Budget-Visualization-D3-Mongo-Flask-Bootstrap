queue()
	// Call this to access database
    .defer(d3.json, "/budget/projects")
    .defer(d3.json, "./static/geojson/ar-states.json")
    .await(makeGraphs);


function makeGraphs(error, apiData, statesJson) {
	//Start Transformations
	var dataSet = apiData;
	var dateFormat = d3.time.format("%m/%d/%Y");

	dataSet.forEach(function(d) {
		d.date_completed = dateFormat.parse(d.date_completed);
		d.date_completed.setDate(1);
		d.y = d.date_completed.getFullYear();
		d.total_donations = +d.total_donations;
	});


	//Create a Crossfilter instance
	var ndx = crossfilter(dataSet);

	//Define Dimensions
	var datePosted = ndx.dimension(function(d) { return d.date_completed; });
	var fundingStatus = ndx.dimension(function(d) { return d.funding_status; });
	var state = ndx.dimension(function(d) { return d.school_state; });
	var type = ndx.dimension(function(d) { return d.school_district; });
	var institution = ndx.dimension(function(d) { return d.school_nlns; });
	var source  = ndx.dimension(function(d) { return d.school_magnet; });
	var year = ndx.dimension(function(d) { return d.school_county; });
	var caracter  = ndx.dimension(function(d) { return d.school_year_round; });


	// Create all filter
	var all = ndx.groupAll();

	//Calculate metrics
	var groupByDate = datePosted.group(); 
	var yearGroup = year.group(); 
	var schoolDistrictGroup = type.group();
	var sourceGroup = source.group();
	var institutionGroup = institution.group();
	var caracterGroup = caracter.group();


	var budgetGroup = ndx.groupAll().reduceSum(function(d) {
		return d.total_price_excluding_optional_support;
	});
	var budgetMoney = fundingStatus.group().reduceSum(function(d) {
		return d.total_price_excluding_optional_support;
	});
	var totalDonationsByState = state.group().reduceSum(function(d) {
		return d["total_donations"];
	});

	//Define threshold values for data
	var minDate = datePosted.bottom(1)[0].date_completed;
	var maxDate = datePosted.top(1)[0].date_completed;
	var max_state = totalDonationsByState.top(1)[0].value;

    //Initialize and map Charts
	var dateChart = dc.lineChart("#date-chart");
	var fundingChart = dc.pieChart("#funding-chart");
	var sourceBarChart = dc.rowChart("#source-bar-chart");
	var totalSpentChart = dc.numberDisplay("#total-projects");
	var bubbleChart = dc.bubbleChart("#bubble-chart");
	var dataTable = dc.dataTable("#dc-table-graph");
	var arMapChart = dc.geoChoroplethChart("#ar-states");
	var institutionChart = dc.rowChart("#institution-chart");

	// Define menus
    cbox = dc.selectMenu('#menuselectyear')
           .dimension(year)
           .group(yearGroup);

	       dc.dataCount("#row-selection")
	        .dimension(ndx)
	        .group(all);


	// We need to wrap the variables for the bubblechart. We apply some ñapas
	// in order to match the huge amounts and fit a chachi piruli plot
	var budgetReduced = type.group().reduce(
        function(d, v) {
            d.x += 0.11;
            d.sum += v.total_price_excluding_optional_support*0.0000001; 
            d.col =  v.school_metro;
            d.y += Math.log(v.total_price_excluding_optional_support);
            return d;
        },
        function(d, v) {
            d.x -= 0.11;
            d.sum -= v.total_price_excluding_optional_support*0.0000001;                    
            d.y -= Math.log(v.total_price_excluding_optional_support);
            d.col =  v.school_metro;
            return d;
        },
        function() {
            return {
                x:0,y:0,sum:0, col:0
            };
        }
        );

	////////////
	// CHARTS //
	////////////

	// total spent
	totalSpentChart
		.formatNumber(d3.format("d"))
		.valueAccessor(function(d){return d; })
		.group(budgetGroup)
		.formatNumber(d3.format("$.3s"));

	// Time line chart
	dateChart
		.height(220)
		.margins({top: 10, right: 50, bottom: 30, left: 50})
		.dimension(datePosted)
		.group(groupByDate)
		.renderArea(true)
		.transitionDuration(500)
		.x(d3.time.scale().domain([minDate, maxDate]))
		.elasticY(true)
		.renderHorizontalGridLines(true)
    	.renderVerticalGridLines(true)
		.xAxisLabel("Year")
		.yAxis().ticks(6);


	// Source barchart
	sourceBarChart
		.height(300)
        .dimension(budgetMoney)
        .group(sourceGroup)
        .ordering(function(d) { return -d.value })
        .xAxis().ticks(4);

    // Institution barchart
	institutionChart
		.height(1000)
        .dimension(budgetMoney)
        .group(institutionGroup)
        .rowsCap(20)
        .ordinalColors(['lightblue'])
        .ordering(function(d) { return -d.value })
        .xAxis().ticks(4);

  
  	// Funding piechart
	fundingChart
		.height(300)
		.radius(140)
		.innerRadius(40)
		.transitionDuration(1000)
		.dimension(budgetMoney)
		.group(caracterGroup)
		.legend(dc.legend());

	// Bubblechart
    bubbleChart
		.width(1000)
        .height(600)
    	.dimension(type) 
        .group(budgetReduced)
		.colorAccessor(function(d) {
            return d.value.col;
        })  
        // X axis
        .keyAccessor(function(d) {return d.value.col;})
        // Y axis
        .valueAccessor(function(d) {return d.value.y;})
        .radiusValueAccessor(function(d) {return d.value.sum;})
        .x(d3.scale.linear().domain([-100, 1000]))
        .y(d3.scale.linear().domain([-100, 1000]))
        // set radius scale
        .r(d3.scale.linear().domain([0, 300000]))
		// (optional) render horizontal grid lines, :default=false
        .renderHorizontalGridLines(false)
        // (optional) render vertical grid lines, :default=false
        .renderVerticalGridLines(false) 
        .renderLabel(true)
        .renderTitle(false)
        .elasticX(true)
        .elasticY(true)
        .yAxisPadding(2500)
        .xAxisPadding(1)
        .maxBubbleRelativeSize(0.4)
        .margins({top: 10, right: 50, bottom: 30, left: 40});

    // map
	arMapChart.width(1000)
		.height(600)
		.dimension(state)
		.group(totalDonationsByState)
		.colors(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"])
		.colorDomain([0, max_state])
		.overlayGeoJson(statesJson["features"], "state", function (d) {
			return d.properties.name;
		})
    	.projection(d3.geo.transverseMercator()
                     .center([2.5, -38.5])
                     .rotate([66, 0])
                     .scale((500 * 56.5) / 33)
                     .translate([(450), (300)])
    		)
		.title(function (p) {
			return "State: " + p["key"]
					+ "\n"
					+ "Total Donations: " + Math.round(p["value"]) + " $";
		});
  
	// Table of atomic data
	  dataTable.width(1000).height(400)
	    .dimension(datePosted)
		.group(function(d) { return ""
		 })
		.size(100)
	    .columns([
	      function(d) { return d.school_county; },
	      function(d) { return d.school_kipp; },
	      function(d) { return d.total_price_excluding_optional_support; }
	    ])
	    .sortBy(function(d){ return d.total_price_excluding_optional_support; })
	    .order(d3.descending);

    dc.renderAll();
};