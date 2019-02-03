queue()
    .defer(d3.json, "/donorschoose/projects")
    .defer(d3.json, "./static/geojson/us-states.json")
    .await(makeGraphs);

function makeGraphs(error, apiData, statesJson) {
	
//Start Transformations
	var dataSet = apiData;
	var dateFormat = d3.time.format("%m/%d/%Y");	
	var xa = 0;
	var ya = 0;
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
	var gradeLevel = ndx.dimension(function(d) { return d.grade_level; });
	var resourceType = ndx.dimension(function(d) { return d.resource_type; });
	var fundingStatus = ndx.dimension(function(d) { return d.funding_status; });
	var povertyLevel = ndx.dimension(function(d) { return d.poverty_level; });
	var totalDonations  = ndx.dimension(function(d) { return d.total_donations; });
	var state = ndx.dimension(function(d) { return d.school_state; });




///////////////////////////////////////////////////
	var schoolDistrict = ndx.dimension(function(d) { return d.school_district; });
	var schoolMetro = ndx.dimension(function(d) { return d.school_metro; });
	var totalExcluding = ndx.dimension(function(d) { return d.total_price_excluding_optional_support; });
	var institution = ndx.dimension(function(d) { return d.school_nlns; });
	var fuente  = ndx.dimension(function(d) { return d.school_magnet; });
	var caracter  = ndx.dimension(function(d) { return d.school_year_round; });
	var stateFull = ndx.dimension(function(d) { return d.school_city; });

	var year = ndx.dimension(function(d) { return d.school_county; });
///////////////////////////////////////////////////













	//Calculate metrics
	var projectsByDate = datePosted.group(); 
	var projectsByGrade = gradeLevel.group(); 
	var projectsByResourceType = resourceType.group();
	var projectsByFundingStatus = fundingStatus.group();
	var projectsByPovertyLevel = povertyLevel.group();
	var stateGroup = state.group();
	var totalDonationsByState = state.group().reduceSum(function(d) {
		return d["total_donations"];
	});


///////////////////////////////////////////////////
	var yearGroup = year.group(); 
	var schoolDistrictGroup = schoolDistrict.group();
	var schoolMetroGroup = schoolMetro.group();
	var fuenteGroup = fuente.group();
	var caracterGroup = caracter.group();
	var stateFullGroup = stateFull.group();

	//var totalExcludingGroup = totalExcluding.group();
	var institutionGroup = institution.group();
////////////////////////////////////////////////////










	var all = ndx.groupAll();

	//Calculate Groups
	var totalDonationsState = state.group().reduceSum(function(d) {
		return d.total_donations;
	});

	var totalDonationsGrade = gradeLevel.group().reduceSum(function(d) {
		return d.grade_level;
	});

	var totalDonationsFundingStatus = schoolDistrictGroup.reduceSum(function(d) {
		return d.funding_status;
	});







///////////////////////////////////////////////////
	var presupuesto = fundingStatus.group().reduceSum(function(d) {
		return d.total_price_excluding_optional_support;
	});

	var presupuestoBySchool = schoolDistrictGroup.reduceSum(function(d) {
		return d.total_price_excluding_optional_support;
	});
	
///////////////////////////////////////////////////






	var presupuestoP = ndx.groupAll().reduceSum(function(d) {return d.total_price_excluding_optional_support;});
	var netTotalDonations = ndx.groupAll().reduceSum(function(d) {return d.school_nlns;});

	//Define threshold values for data
	var minDate = datePosted.bottom(1)[0].date_completed;
	var maxDate = datePosted.top(1)[0].date_completed;

	var max_state = totalDonationsByState.top(1)[0].value;

console.log(minDate);
console.log(maxDate);

    //Charts
	var dateChart = dc.lineChart("#date-chart");
	var gradeLevelChart = dc.rowChart("#grade-chart");
	var resourceTypeChart = dc.rowChart("#resource-chart");
	var fundingStatusChart = dc.pieChart("#funding-chart");
	var povertyLevelChart = dc.rowChart("#poverty-chart");
	var totalProjects = dc.numberDisplay("#total-projects");
	var netDonations = dc.numberDisplay("#net-donations");
	var stateDonations = dc.barChart("#state-donations");
	var bubblechart = dc.bubbleChart("#bubble-chart");
	//var bubblechart = dc.bubbleOverlay("#bubble-chart");
	var dataTable = dc.dataTable("#dc-table-graph");
	var usChart = dc.geoChoroplethChart("#us-chart");
	var institutionChart = dc.rowChart("#institution-chart");




  	


    cbox = dc.selectMenu('#menuselectyear')
           .dimension(year)
           .group(yearGroup);

	       dc.dataCount("#row-selection")
	        .dimension(ndx)
	        .group(all);


	// total proposed
	totalProjects
		.formatNumber(d3.format("d"))
		.valueAccessor(function(d){return d; })
		.group(presupuestoP)
		.formatNumber(d3.format("$.3s"));


	// Total paid budget
	netDonations
		.formatNumber(d3.format("d"))
		.valueAccessor(function(d){return d; })
		.group(netTotalDonations)
		.formatNumber(d3.format("$.3s"));

	//
	dateChart
		//.width(600)
		.height(220)
		.margins({top: 10, right: 50, bottom: 30, left: 50})
		.dimension(datePosted)
		.group(projectsByDate)
		.renderArea(true)
		.transitionDuration(500)
		.x(d3.time.scale().domain([minDate, maxDate]))
		.elasticY(true)
		.renderHorizontalGridLines(true)
    	.renderVerticalGridLines(true)
		.xAxisLabel("Year")
		.yAxis().ticks(6);

	resourceTypeChart
        //.width(300)
        .height(300)
        .dimension(presupuesto)
        .group(fuenteGroup)
        .elasticX(true)
        .xAxis().ticks(5);

     // Donation Count by Poverty Level
	povertyLevelChart
		//.width(300)
		.height(300)
        .dimension(presupuesto)
        .group(fuenteGroup)
        .ordering(function(d) { return -d.value })
        .xAxis().ticks(4);

    // INSTITUTION CHART
	institutionChart
		//.width(300)
		.height(1000)
        .dimension(presupuesto)
        .group(institutionGroup)
        .rowsCap(20)
        .ordinalColors(['lightblue'])
        .ordering(function(d) { return -d.value })
        .xAxis().ticks(4);


    // donation count per grade
	gradeLevelChart
		//.width(300)
		.height(300)
        .dimension(presupuesto)
        .group(fuenteGroup)
        .xAxis().ticks(4);

  
  // PIE CHART
	fundingStatusChart
		.height(300)
		//.width(350)
		.radius(140)
		.innerRadius(40)
		.transitionDuration(1000)
		.dimension(presupuesto)
		.group(caracterGroup)
		.legend(dc.legend());


    stateDonations
    	.width(800)
        .height(220)
        .transitionDuration(1000)
        .dimension(state)
        .group(totalDonationsState)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .centerBar(false)
        .gap(5)
        .elasticY(true)
        .x(d3.scale.ordinal().domain(state))
        .xUnits(dc.units.ordinal)
        .renderHorizontalGridLines(true)
        .renderVerticalGridLines(true)
        .ordering(function(d){return d.value;})
        .yAxis().tickFormat(d3.format("s"));

	var presupuestoPor = schoolDistrict.group().reduce(
                function(d, v) {
                    d.x += 0.11;
                    d.sum += v.total_price_excluding_optional_support*0.0000001; 
                    d.col =  v.school_metro;
                    d.y += Math.log(v.total_price_excluding_optional_support);
                    //console.log(d.col);
                    return d;
                },
                function(d, v) {
                    d.x -= 0.11;
                    d.sum -= v.total_price_excluding_optional_support*0.0000001;                    
                    d.y -= Math.log(v.total_price_excluding_optional_support);
                    d.col =  v.school_metro;
                    //console.log(d.col);
                    return d;
                },
                function() {
                    return {
                        x:0,y:0,sum:0, col:0
                    };
                }
        );
		

    bubblechart
		.width(1000)
        .height(600)
        //UNIDAD
    	.dimension(schoolDistrict) // set dimension
        .group(presupuestoPor)
        // Color
		.colorAccessor(function(d) {
            return d.value.col;
        })  
        // X
        .keyAccessor(function(d) {return d.value.col;})
        // Y
        .valueAccessor(function(d) {return d.value.y;})
        // closure used to retrieve radius value from multi-value group
        //.radiusValueAccessor(function(d) {return d.value;})
        .radiusValueAccessor(function(d) {return d.value.sum;})
        // set x scale
        //.x(d3.scale.linear().domain([-10, 140]))
        // set y scale
        //.y(d3.scale.linear().domain([-300, 400]))

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

	

 


	usChart.width(1000)
		.height(600)
		.dimension(state)
		.group(totalDonationsByState)
		.colors(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"])
		.colorDomain([0, max_state])
		.overlayGeoJson(statesJson["features"], "state", function (d) {
			return d.properties.name;
		})

		//.projection(d3.geo.albersUsa()
    	//			.scale(600)
    	//			.translate([340, 150])
    	//			) 
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
  

    



	// Table of earthquake data
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