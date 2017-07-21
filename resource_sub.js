//Autocomplete for taxon/time pick lists
//var autocomplete = $("#taxonAutocompleteInput,#timeStartAutocompleteInput,#timeEndAutocompleteInput").on('keyup', function(event) {
function autocompleteFill(fieldContents) {
  var thisName = fieldContents.id,
      thisInput = '#' + thisName;

  if (/[;,]/.test($(thisInput).val())) {
    var autocompleteInput = $(thisInput).val().match(/(.*[;,] )(.*)/)[2];
  } else {
    var autocompleteInput = $(thisInput).val();
  };

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
    var htmlRequest = data_service_url + 'combined/auto.json?show=countries&name=' + autocompleteInput + requestType;
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
            switch (thisName) {
              case "taxonAutocompleteInput": //allow multiple values in field
                if ($(thisInput).val().indexOf(';') > -1 || $(thisInput).val().indexOf(',') > -1) {
                  var previousTaxa = $(thisInput).val().match(/(.*[;,] )(.*)/)[1];
		  var newval = previousTaxa + this.getAttribute('data-nam')
                  $(thisInput).val(newval);
                } else {
                  $(thisInput).val(this.getAttribute('data-nam'));
                };
                break;
              case "timeStartAutocompleteInput":
              case "timeEndAutocompleteInput":
                $(thisInput).val(this.getAttribute('data-nam'));
                break;
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
  };
//  });

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
};
//});


  function encodeImageFileAsURL() {
    var filesSelected = document.getElementById("inputFileToLoad").files;
    if (filesSelected.length > 0) {
      var fileToLoad = filesSelected[0];

      var fileReader = new FileReader();

      fileReader.onload = function(fileLoadedEvent) {

        // base64 data
        var srcData = fileLoadedEvent.target.result;

        var newImage = document.createElement('img');
        newImage.src = srcData;

        document.getElementById("imgTest").innerHTML = newImage.outerHTML;
        $("#imgTest").children("img").first()
        //console.log("Converted Base64 version is " + document.getElementById("imgTest").innerHTML);
        //image_base64 = srcData;
            image_base64 = $('#imgTest').children('img').attr('src'); //shrunk to display size
      }
      fileReader.readAsDataURL(fileToLoad);
    }
  };

