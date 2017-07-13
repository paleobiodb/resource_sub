function myFunction() {
    var x = document.getElementById("fname");
    x.value = x.value.toUpperCase();
}

//Autocomplete for taxon/time pick lists
//var autocomplete = $("#taxonAutocompleteInput,#timeStartAutocompleteInput,#timeEndAutocompleteInput").on('keyup', function(event) {
function autocomplete() {
  console.log($(this));
  var dataUrl = window.location.origin,
      testUrl = "https://paleobiodb.org",
      stateUrl = "https://paleobiodb.org",
      dataService = "/data1.2";

  if ( window.location.search.indexOf("local") > -1 ) {
    dataUrl = window.location.origin + ":3000";
    testUrl = window.location.origin + ":3000";
  } else if (window.location.search.indexOf("test") > -1) {
    dataUrl = "https://training.paleobiodb.org";
  } else if ( window.location.hostname === "localhost" ) {
    dataUrl = "https://training.paleobiodb.org";
  }

  if (/[;,]/.test($(this).val())) {
    var autocompleteInput = $(this).val().match(/(.*[;,] )(.*)/)[2];
  } else {
    var autocompleteInput = $(this).val();
  };
console.log(autocompleteInput);
  var thisName = $(this).attr('id'),
      thisInput = '#' + thisName;
  switch(thisName) {
    case "taxonAutocompleteInput":
      requestType = "&type=txn";
      break;
    case "timeStartAutocompleteInput":
    case "timeEndAutocompleteInput":
      requestType = "&type=int";
      break;
  }
  var stratRankMap = {
    "member": "Mbr",
    "formation": "Fm",
    "group": "Gp"
  };

  if (autocompleteInput.length < 3) {
    $(thisInput).next('.searchResult').css("display","none");
    $(thisInput).next('.searchResult').html("");
  } else {
    var htmlRequest = dataUrl + dataService + '/combined/auto.json?show=countries&name=' + autocompleteInput + requestType;
    $.getJSON(encodeURI(htmlRequest)).then(
      function(json){ //if getJSON succeeded
        var htmlResult = "";
        if (json.records.length == 0) {htmlResult += "<div class='autocompleteError'>No matching results for \"" + autocompleteInput + "\"</div>"} //no matches
        else {
          var currentType = "";
          json.records.map(function(d){
            var oidsplit = d.oid.split(":");
            var rtype = oidsplit[0];
            var oidnum = oidsplit[1];
            switch (rtype) {
              case "int": 
                if ( currentType != "int" ) { htmlResult += "<h4 class='autocompleteTitle'>Time Intervals</h4>"; currentType = "int"; }
                htmlResult += "<div class='suggestion' data-nam='" + d.nam + "' data-oid='" + oidnum + "'>"
                htmlResult += "<p class='tt-suggestion'>" + d.nam + " <small class=taxaRank>" + Math.round(d.eag) + "-" + Math.round(d.lag) + " ma</small></p></div>";
                break;
              case "str": 
                if ( currentType != "str" ) { htmlResult += "<h4 class='autocompleteTitle'>Stratigraphic Units</h4>"; currentType = "str"; }
                htmlResult += "<div class='suggestion' data-nam='" + d.nam + "'>"
                if ( thisName == "universalAutocompleteInput") { htmlResult += "<a href=\"/classic/displaySearchStrataResults?group_formation_member=" + encodeURI(d.nam) + "\">"}
                htmlResult += "<p class='tt-suggestion'>" + d.nam + " " + stratRankMap[d.rnk] + " <small class=taxaRank>in " + d.cc2 + "</small></p>"
                if ( thisName == "universalAutocompleteInput" ) { htmlResult += "</a>"}
                htmlResult += "</div>";
                break;
              case "txn": 
                if ( currentType != "txn" ) { htmlResult += "<h4 class='autocompleteTitle'>Taxa</h4>"; currentType = "txn"; }
                htmlResult += "<div class='suggestion' data-nam='" + d.nam + "' data-typ='" + rtype + "' data-oid='" + oidnum + "' data-searchstr='" + oidnum + "'>"
                if ( thisName == "universalAutocompleteInput") { htmlResult += "<a href=\"/classic/basicTaxonInfo?taxon_no=" + oidnum + "\">"}
                if (d.tdf) { htmlResult += "<p class='tt-suggestion'>" + d.nam + " <small class=taxaRank>" + d.rnk + " in " + d.htn + "</small><br><small class=misspelling>" + d.tdf + " " + d.acn + "</small></p>"; }
                else { htmlResult += "<p class='tt-suggestion'>" + d.nam + " <small class=taxaRank>" + d.rnk + " in " + d.htn + "</small></p>"; }
                if ( thisName == "universalAutocompleteInput" ) { htmlResult += "</a>"}
                htmlResult += "</div>";
                break;
              case "col":
                var interval = d.oei ? d.oei : "" ;
                if (d.oli) { interval += "-" + d.oli };
                if ( currentType != "col" ) { htmlResult += "<h4 class='autocompleteTitle'>Collections</h4>"; currentType = "col"; }
                htmlResult += "<div class='suggestion' data-nam='" + d.nam + "' data-typ='" + rtype + "' data-oid='" + oidnum + "' data-searchval='" + oidnum + "'>"
                if ( thisName == "universalAutocompleteInput") { htmlResult += "<a href=\"/classic/displayCollResults?collection_no=" + oidnum + "\">"}
                htmlResult += "<p class='tt-suggestion'>" + d.nam + " <br><small class=taxaRank>" + " (" + interval + " of " + d.cc2 + ")</small></p>";
                if ( thisName == "universalAutocompleteInput" ) { htmlResult += "</a>"}
                htmlResult += "</div>";
                break;
              case "ref":
                if ( currentType != "ref" ) { htmlResult += "<h4 class='autocompleteTitle'>References</h4>"; currentType = "ref"; }
                htmlResult += "<div class='suggestion' data-nam='" + d.nam + "' data-typ='" + rtype + "' data-oid='" + oidnum + "' data-searchval='" + oidnum + "'>"
                if ( thisName == "universalAutocompleteInput") { htmlResult += "<a href=\"/classic/displayRefResults?reference_no=" + oidnum + "\">"}
                htmlResult += "<p class='tt-suggestion'>" + " <small> " + d.nam + "</small></p>";
                if ( thisName == "universalAutocompleteInput" ) { htmlResult += "</a>"}
                htmlResult += "</div>";
                break;
              default: //do nothing 
              };
            });
          };
          $(thisInput).next('.searchResult').html(htmlResult);
          $(thisInput).next('.searchResult').css("display","inline-block");
          $(".suggestion").on("click", function(event) {
            // event.preventDefault();
            switch (thisName) {
              case "taxonAutocompleteInput": //allow multiple values
                if ($(thisInput).val().indexOf(';') > -1) {
                  var previousTaxa = $(thisInput).val().match(/(.*[;,] )(.*)/)[1];
                  var newval = previousTaxa + $(this).attr('data-nam')
                  $(thisInput).val(newval);
                  $(thisInput).attr('data-oid',$(thisInput).attr('data-oid') + ",txn:" + $(this).attr('data-oid'));
                } else {
                  $(thisInput).val($(this).attr('data-nam'));
                  $(thisInput).attr('data-oid',"txn:" + $(this).attr('data-oid'));
                };
                break;
              case "timeStartAutocompleteInput":
              case "timeEndAutocompleteInput":
                $(thisInput).val($(this).attr('data-nam'));
                $(thisInput).attr('data-oid',$(this).attr('data-oid'));
                break;
              case "universalAutocompleteInput": //this is handled by the previous switch function
              default: //do nothing           
                break;
            }
            $(thisInput).next('.searchResult').css("display","none");
          }); 
        return;
        }, function() { //if getJSON failed
          var htmlResult = "<div class='autocompleteError'>Error: server did not respond</div>"
          $(thisInput).next('.searchResult').html(htmlResult);
          $(thisInput).next('.searchResult').css("display","block");
        }
      )
    };
  });

//var searchFocus = $("#universalAutocompleteInput").on('focus blur', function(event) {
function searchFocus(){
  if ($(this).next('searchResult').html().length() > 0) {
    switch (event.type) {
      case "focus":
        $(this).next('.searchResult').css("display","inline-block");
        break;
      case "blur":
        $(this).next('.searchResult').css("display","none");
        break;
    };
  }
});

