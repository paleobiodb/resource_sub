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

function searchFocus(target,type){
  var dropdown = $("#" + target).next('.searchResult');
  console.log(document.activeElement);
  if (dropdown.html().length > 0 && document.activeElement != dropdown) {
    switch (type) {
      case "focusin":
        $("#" + target).next('.searchResult').css("display","inline-block");
        break;
      case "focusout":
        $("#" + target).next('.searchResult').css("display","none");
        break;
    };
  };
};


// function loadDisplayImage ( )
// {
//     var filesSelected = document.getElementById("res-imgfile").files;
    
//     if (filesSelected.length > 0)
//     {
// 	var fileToLoad = filesSelected[0];
	
// 	var fileReader = new FileReader();
	
// 	fileReader.onload = function(fileLoadedEvent) {
	    
//             // base64 data
//             var srcData = fileLoadedEvent.target.result;
	    
//             var newImage = document.createElement('img');
//             newImage.src = srcData;

//         document.getElementById("imageDisplay").innerHTML = newImage.outerHTML;
//         $("#imageDisplay").children("img").first();
	  
//         //console.log("Converted Base64 version is " + document.getElementById("imageDisplay").innerHTML);
//         //image_base64 = srcData;
// 	  var image_base64 = $('#imageDisplay').children('img').attr('src'); //shrunk to display size
// 	  $("#res-imagedata").val(image_base64);
//       }
	
//       fileReader.readAsDataURL(fileToLoad);
//     }
//   };

function loadDisplayImage ( )
{
    var filesSelected = document.getElementById("inputFileToLoad").files;
    
    if (filesSelected.length > 0)
    {
        var fileToLoad = filesSelected[0];
        var fileReader = new FileReader();
	
        fileReader.onload = function(fileLoadedEvent) {
            
            // The expression fileLoadedEvent.target.result returns base64 data
	    
            var srcData = fileLoadedEvent.target.result;
            var thumbImg = document.getElementById('res-thumb');
	    
	    // $$$ need to check for allowed image types
	    
            thumbImg.src = srcData;
	    
	    $("#res-imagedata").val(srcData);
	    
	    // // Create a canvas which we can use to resize the image and transform it into a PNG if
	    // // it is not already in that format.
	    
	    // var resizer = document.createElement("canvas");
	    // resizer.width = 4096;
	    // resizer.height = 4096;
	    // var ctx = resizer.getContext("2d");
	    // ctx.drawImage(thumbImg, 0, 0);
	    
	    // // If either the width or height of the image exceeds 150 pixels, it must be scaled down.
	    
	    // if ( thumbImg.width > 150 || thumbImg.height > 150 )
	    // {

	    // 	// If the height is larger than the width, scale the image so that the height is 150.

	    // 	if ( thumbImg.height > thumbImg.width )
	    // 	{
	    // 	    var heightRatio = 150 / thumbImg.height;
	    // 	    ctx.scale(heightRatio, heightRatio);
	    // 	}

	    // 	// Otherwise, scale the image so that the width is 150.

	    // 	else
	    // 	{
	    // 	    var widthRatio = 150 / thumbImg.width;
	    // 	    ctx.scale(widthRatio, widthRatio);
	    // 	}

	    // 	// Copy the scaled image data back to thumbImg.

	    // 	thumbImg.src = 
		
            // var MAX_WIDTH = 150;
            // var MAX_HEIGHT = 150;
            // var width = thumbImg.width;
            // var height = thumbImg.height;
	    
	    // if ( 
	    
	    //         //avoid resize code for now
	    //         if (width>150 || height>150) {
            //         alert('Please choose an image no larger than 150x150 pixels');
            //         return;
	    //         } else {
            //         image_base64 = thumbImg.src;
	    //         };

        };
	
        fileReader.readAsDataURL(fileToLoad);
    }
}

