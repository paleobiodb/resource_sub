


function ResourceManagerApp( data_url, app_mode )
{
    "use strict";
    
    var resource_mode;
    var tag_type = { };
    var tag_id = { };
    var tag_name = { };
    
    // Initialize the application. This function should be called after the DOM content is loaded.
    
    function init ( )
    {
	// If app_mode wasn't specified, figure out whether we are in 'manage' mode or 'submit'
	// mode.
	
	if ( app_mode != 'manage' && app_mode != 'submit' )
	{
	    if ( document.getElementById('btn-activate') )
	    {
		app_mode = 'manage';
	    }
	    
	    else
	    {
		app_mode = 'submit';
	    }
	}
	
	// Disable the 'fill in my userinfo' button unless we are in 'submit' mode.
	
	if ( app_mode != 'submit' )
	    $('#btn-userinfo').css('display', 'none');
	
	// Grab the list of tags and store them locally.

	$.getJSON(data_url + 'eduresources/tags.json', function(json) {
	    for (var r of json.records )
	    {
		var name = r.nam;
		var oid_match = /\d+/.exec(r.oid);
		var oid = oid_match ? oid_match[0] : "0";
		
		tag_name[oid] = name;
		tag_name[name] = name;
		tag_id[name] = oid;
		tag_id[oid] = oid;
		
		// Tags whose identifier is 100 or greater represent audiences.
		
		if ( oid >= 100 ) {
		    tag_type[oid] = 'audience';
		    tag_type[name] = 'audience';
		}
		
		// Tags whose identifier is less than 100 represent resource types.
		
		else if ( oid > 0 ) {
		    tag_type[oid] = 'type';
		    tag_type[name] = 'type';
		}
	    }
	}).fail(function(xhr, textStatus, error) {
	    showAPIError(textStatus, error);
	});
	
	// Display the initial list of resources.
	
	listResources();
    }
    
    this.init = init;
    
    // List the resources of the specified type. If no type is given, use the type indicated by
    // the hash fragment of the location.
    
    function listResources ( selector )
    {
	selector ||= location.hash;
	
	var request_arg;
	var select_tab;
	
	if ( app_mode == 'submit' )
	{
	    request_arg = '?enterer=me';
	    resource_mode = 'submitted';
	}
	
	else if ( selector == '#active' )
	{
	    request_arg = '?active';
	    select_tab = '#active';
	    resource_mode = 'active';
	}
	
	else if ( selector == '#inactive' )
	{
	    request_arg = '?active&status=inactive';
	    select_tab = '#inactive';
	    resource_mode = 'inactive';
	}
	
	else if ( selector == '#pending' )
	{
	    request_arg = '?queue';
	    select_tab = '#pending';
	    resource_mode = 'pending';
	}
	
	else // if no valid hash fragment is given
	{
	    request_arg = '?queue';
	    select_tab = '#pending';
	    resource_mode = 'pending';
	}
	
	if ( select_tab ) {
	    $('#nav-tabs a[href="' + select_tab + '"]').tab('show');
	}
	
	$("#res-selector").html("");
	
	var html_request = data_url + 'eduresources/list.json' + request_arg;
	
	$.getJSON(html_request, function(json) {
	    var list_content = "";
	    if (json.records.length > 0) {
 		var displayed_resource = $("#res-oid").val();
		
       		json.records.map( function(d) {
		    if ( app_mode == 'submit' ||
			 resource_mode == 'active' && d.sta == 'active' ||
		         resource_mode == 'inactive' && d.sta == 'inactive' ||
		         resource_mode == 'pending' && d.sta != 'active' && d.sta != 'inactive' )
		    {
			var status = d.sta;
			if (d.sta == 'pending' && app_mode == 'manage' ) status = 'new';
			
			var entry = d.oid + ' [' + status + '] - ' + d.title + " (" + d.author + ")";
			var selected = "";
			
			if ( d.oid == displayed_resource )
			{
			    selected = "selected ";
			}
			
			list_content += '<option ' + selected + 'name="resource" value="' +
			    d.oid + '"> ' + entry + ' </option>';
		    }
        	});
	    }
	    
	    if ( list_content == "" )
	    {
		var message = app_mode == 'submit' ? 'You have not submitted any resources'
		    : 'There are no ' + resource_mode + ' resources';
		
		list_content = '<option disabled name="resource" value=""> - ' + message +
		    ' - </option>';
	    }
	    
	    $("#res-selector").html(list_content);
	    $("#res-selector").focus();
	    selectResource();
	    
	}).fail(function(xhr, textStatus, error) {
	    var list_content = '<option disabled name="resource" value=""> - An error occurred ' +
		'while loading the resource list: ' + textStatus + ' - </option>';
	    
	    $("#res-selector").html(list_content);
	    showAPIError(textStatus, error);
	});
	
	// Disable the action buttons, since nothing is selected.
	
	getSelectionEnable();
    }
    
    this.listResources = listResources;
    
    // Fill in the editing pane with the details of the selected resource.
    
    function selectResource ( )
    {
	// Start by clearing the resource editing form, whether or not anything has been selected.
	
	clearEditForm();
	
	// Get the identifier of the selected resource, and return if there isn't one. The action
	// buttons will be enabled or disabled by getSelectionEnable() according to whether or not
	// there is a selected resource.
	
	var selected_oid = getSelectionEnable();
	
    	if ( !selected_oid ) return;
	
	// Construct an HTML request to get the attributes of the selected resource and execute
	// it. The response should contain a single record.

	var rmode = '';
	if ( resource_mode == 'active' || resource_mode == 'inactive' ) rmode = '&active';
	
	var fetch_url = data_url + "eduresources/single.json?eduresource_id=" + selected_oid +
	    rmode + "&show=image";
	
	$.getJSON(fetch_url, function(json) {
	    var res = json.records[0];
	    
	    if ( ! res ) {
		showError("Error", "Could not fetch resource attributes");
		return;
	    }
	    
	    if (res.oid) {
		$("#res-oid").val(res.oid);
	    }
	    
	    if (res.sta && res.oid ) {
		$("#res-status").html(res.sta);
		$("#msg-new").css('display', 'none');
		if ( res.sta == 'pending' )
		    $("#msg-pending").css('display', 'block');
		else if ( res.sta == 'changed' )
		    $("#msg-changed").css('display', 'block');		
	    }
	    
	    if (res.title) {
		$('#res-title').val(res.title);
		$('#orig-title').val(res.title)
	    };
	    
	    if (res.description) {
		$('#res-desc').val(res.description);
		$('#orig-desc').val(res.description);
	    }
	    
	    if (res.url) {
		$('#res-url').val(res.url);
		$('#orig-url').val(res.url);
	    }
	    
	    if (res.author) {
		$('#auth-name').val(res.author);
		$('#orig-name').val(res.author);
	    }
	    
	    if (res.email) {
		$('#auth-email').val(res.email);
		$('#orig-email').val(res.email);
	    }
	    
	    if (res.affil) {
		$('#auth-affil').val(res.affil);
		$('#orig-affil').val(res.affil);
	    }
	    
	    if (res.orcid) {
		$('#auth-orcid').val(res.orcid);
		$('#orig-orcid').val(res.orcid);
	    }
	    
	    if (res.tags)
	    {
		$('#orig-tags').val(res.tags);
                res.tags.split(/\s*,\s*/).map(function(d) {
		    $('input[value=' + d + ']').prop('checked','true');
                });
		var type = $("input[name=res-type]:checked").val();
		$('#orig-type').val(type);
		var audience = $("input[name=res-aud]:checked").map(function() {
		    return(this.value);}).get().join(",");
		$('#orig-aud').val(audience);
	    }
	    
	    if (res.topics) {
		$('#res-topics').val(res.topics);
		$('#orig-topics').val(res.topics);
	    }
	    
	    if (res.taxa) {
		$('#res-taxa').val(res.taxa);
		$('#orig-taxa').val(res.taxa);
	    }
	    
	    if (res.timespan)
	    {
		$('#orig-timespan').val(res.timespan);
		
		if ( /-/.test(res.timespan) )
		{
		    var startend = res.timespan.split(/\s*-\s*/);
		    $('#res-timestart').val(startend[0]);
		    $('#res-timeend').val(startend[1]);
		}

		else
		{
		    $('#res-timestart').val(res.timespan);
		    $('#res-timeend').val('');
		}
	    }
	    
	    if (res.image && res.image != "1" )
	    {
		var display_img = document.createElement('img');
		display_img.src = "/build/img/" + res.image;
		$('#res-thumb').html('');
		$('#res-thumb').append(display_img);
		$('#res-imagename').val(res.image);
		$('#orig-imagename').val(res.image);
		$('#res-imagedata').val('');
		$('#orig-imagedata').val('');
	    }

	    else if (res.image_data)
	    {
		var display_img = document.createElement('img');
		display_img.src = res.image_data;
		$('#res-thumb').html('');
		$('#res-thumb').append(display_img);
		$('#res-imagename').val('');
		$('#orig-imagename').val('');
		$('#res-imagedata').val(res.image_data);
		$('#orig-imagedata').val(res.image_data);
	    }
	    
	    // If this record has the status 'changed', that means there is an active version whose
	    // attributes are different. Fetch the attributes of the active record, and use them to
	    // highlight which fields have changed.
	    
	    if ( res.sta == 'changed' )
	    {
		var fetch_active = data_url + "eduresources/active.json?eduresource_id=" +
		    selected_oid + "&show=image";

		var editable_status = res.sta;
		
		$.getJSON(fetch_active, function(json) {
		    var res = json.records[0];
		    
		    if ( ! res ) return;
		    
		    $('#active-status').val(res.sta);
		    if (res.sta != editable_status )
			$('#res-status').html(editable_status + ' [' + res.sta + ']');
		    
		    $('#active-title').val(res.title);
		    if ( $('#active-title').val() != $('#res-title').val() )
			$('#res-title').addClass('change-mark');
		    
		    $('#active-desc').val(res.description);
		    if ( $('#active-desc').val() != $('#res-desc').val() )
			$('#res-desc').addClass('change-mark');
		    
		    $('#active-url').val(res.url);
		    if ( $('#active-url').val() != $('#res-url').val() )
			$('#res-url').addClass('change-mark');
		    
		    $('#active-name').val(res.author);
		    if ( $('#active-name').val() != $('#res-name').val() )
			$('#res-name').addClass('change-mark');
		    
		    $('#active-email').val(res.email);
		    if ( $('#active-email').val() != $('#res-email').val() )
			$('#res-email').addClass('change-mark');
		    
		    $('#active-affil').val(res.affil);
		    if ( res.affil != $('#auth-affil').val() )
			$('#auth-affil').addClass('change-mark');
		    
		    $('#active-orcid').val(res.orcid);
		    if ( $('#active-orcid').val() != $('#auth-orcid').val() )
			$('#auth-orcid').addClass('change-mark');
		    
		    var type_string = "";
		    var audiences = [ ];
		    if ( res.tags ) {
			$('#active-tags').val(res.tags);
			res.tags.split(/\s*,\s*/).map(function(d) {
			    if ( tag_type[d] == 'type' )
				type_string = tag_name[d];
			    else if ( tag_type[d] == 'audience' )
				audiences.push(tag_name[d]);
			});
		    }
		    var aud_string = audiences.join(",");
		    $('#active-type').val(type_string);
		    $('#active-aud').val(aud_string);
		    if ( $('#active-type').val() != $('#orig-type').val() )
			$('#res-typegroup').addClass('change-mark');
		    if ( $('#active-aud').val() != $('#orig-aud').val() )
			$('#res-audgroup').addClass('change-mark');
		    
		    $('#active-topics').val(res.topics);
		    if ( $('#active-topics').val() != $('#res-topics').val() )
			$('#res-topics').addClass('change-mark');
		    
		    $('#active-taxa').val(res.taxa);
		    if ( $('#active-taxa').val() != $('#res-taxa').val() )
			$('#res-taxa').addClass('change-mark');
		    
		    $('#active-timespan').val(res.timespan);
		    if ( res.timespan && /-/.test(res.timespan) )
		    {
			var startend = res.timespan.split(/\s*-\s*/);
			if ( startend[0] != $('#res-timestart').val() )
			    $('#res-timestart').addClass('change-mark');
			if ( startend[1] != $('#res-timeend').val() )
			    $('#res-timeend').addClass('change-mark');
		    }
		    else
		    {
			if ( $('#active-timespan').val() != $('#res-timestart').val() )
			    $('#res-timestart').addClass('change-mark');
			if ( $('#res-timeend').val() )
			    $('#res-timeend').addClass('change-mark');
		    }
		    
		    if ( res.image && res.image != "1" ) {
			$('#active-imagename').val(res.image);
			if ( $('#active-imagename').val() != $('#res-imagename').val() )
			    $('#res-thumbcontainer').addClass('change-mark');
		    }
		    
		    else if (res.image_data) {
			$('#active-imagedata').val(res.image_data);
			if ( $('#active-imagedata').val() != $('#res-imagedata').val() )
			    $('#res-thumbcontainer').addClass('change-mark');
		    }
		}).fail(function(xhr, textStatus, error) {
		    showAPIError(textStatus, error, "Error fetching active attributes");
		});
	    }
        }).fail(function(xhr, textStatus, error) {
	    showAPIError(textStatus, error, "Error fetching editable attributes");
	});
    }
    
    this.selectResource = selectResource;

    // Clear the resource editing form and the selection.
    
    function clearSelection ( )
    {
	$("#res-selector option[name=resource]").prop('selected', false);
	getSelectionEnable();
	clearEditForm();
    }

    this.clearSelection = clearSelection;
    
    // Clear the resource editing form.
    
    function clearEditForm ( )
    {
	$('#res-edit textarea').val('');
	$('#res-edit file').val('');
	$('#res-edit input[type=text]').val('');
	$('#res-edit input[type=hidden]').val('');
	$('#res-edit input[type=select]').val('');
	$('#res-edit input[type=radio]').prop('checked',false);
	$('#res-edit input[type=file]').val('');
	$('#res-edit input[type=checkbox]').prop('checked',false);
	$('#res-status').html('');
	$('#res-thumb').html('');

	$('#res-edit textarea').removeClass('change-mark');
	$('#res-edit input').removeClass('change-mark');
	$('#res-edit div').removeClass('change-mark');

	$('#msg-pending').css('display', 'none');
	$('#msg-changed').css('display', 'none');
	$('#msg-new').css('display', 'block');
    }
    
    this.clearEditForm = clearEditForm;
    
    // Change the status of the selected resource

    function changeResourceStatus ( status )
    {
	var oid = $('#res-oid').val();
	
	if ( oid )
	{
	    var action_url = data_url + 'eduresources/addupdate.json?eduresource_id=' + oid +
		'&status=' + status;
	    
	    $.getJSON(action_url, function(response_data) {
		if ( response_data.records[0].oid == oid &&
		     response_data.records[0].sta == 'active' )
		{
		    showSuccess(null, "Resource " + oid + " is now active");
		    listResources();
		}
		
		else if ( response_data.records[0].oid == oid &&
			  response_data.records[0].sta == 'inactive' )
		{
		    showSuccess(null, "Resource " + oid + " is now inactive");
		    listResources();
		}
		
		else
		{
		    showError("Error", "Something went wrong");
		}
	    }).fail(function(xhr, textStatus, error) {
		showAPIError(textStatus, error, "Error changing resource status");
	    });
	}
	
	else
	{
	    showNotice(null, "You must select a resource first");
	    return;
	}
    }
    
    this.changeResourceStatus = changeResourceStatus;
    
    // Delete the selected resource
    
    function deleteResource ( status )
    {
	var oid = $('#res-oid').val();
	
	if ( oid )
	{
	    var action_url = data_url + 'eduresources/delete.json?eduresource_id=' + oid;
	    
	    $.getJSON(action_url, function(response_data) {
		if ( response_data.records[0].oid == oid &&
		     response_data.records[0].sta == 'deleted' )
		{
		    showSuccess(null, "Resource " + oid + " was deleted");
		    listResources();
		}
		
		else
		{
		    showError("Error", "Something went wrong");
		}
	    }).fail(function(xhr, textStatus, error) {
		showAPIError(textStatus, error, "Error deleting resource");
	    });
	}

	else
	{
	    showNotice("You must select a resource");
	    return;
	}
    }
    
    this.deleteResource = deleteResource;
    
    // Add a new resource or change the attributes of the selected resource. The parameter
    // 'operation' must be either 'submit', 'approve', or 'save'.
    
    function addUpdateResource ( operation )
    {
	// Make sure that we have an oid if we are in 'manage' mode.
	
	var oid = $('#res-oid').val();
	
	if ( app_mode == 'manage' && ! oid )
	{
	    showError("Cannot update the resource because the oid is missing");
	    return;
	}
	
	// Collect data from the editing form
	
	var title = $('#res-title').val();
	var description = $('#res-desc').val();
	var url = $('#res-url').val();
	var imagename = $('#res-imagename').val();
	var imagedata = $('#res-imagedata').val();
	var restype = $("input[name=res-type]:checked").val();
	var audience = $("input[name=res-aud]:checked").map(function() {
	    return(this.value);}).get().join(",");
	var is_video = url.match(/watch\?v\=/) ? 1 : 0;
	var author = $('#auth-name').val();
	var email = $('#auth-email').val();
        var affil = $('#auth-affil').val();
        var orcid = $('#auth-orcid').val();
	var topics = $('#res-topics').val();
	var taxa = $('#res-taxa').val();
	var timestart = $('#res-timestart').val();
	var timeend = $('#res-timeend').val();
	var timespan = timestart;
	if ( timeend ) { timespan += " - " + timeend; }
	
	// Validate required fields.
	
	if ( title == "" || author == "" )
	{
	    showNotice(null, "Title and author name are required");
	    return;
	}
	
	if ( ! restype )
	{
	    showNotice(null, "You must select a resource type");
	    return;
	}
	
	// Validate ORCID field.
	
	if ( orcid != "" && ! /^\d\d\d\d-\d\d\d\d-\d\d\d\d-\d\d\d\d$/.test(orcid) )
	{
	    // If the field has the right number of digits but the wrong number of dashes,
	    // normalize it.
	    
	    if ( /^\d\d\d\d-*\d\d\d\d-*\d\d\d\d-*\d\d\d\d$/.test(orcid) )
	    {
		var digits = orcid.match(/(\d\d\d\d)-*(\d\d\d\d)-*(\d\d\d\d)-*(\d\d\d\d)/);
		orcid = digits[1] + '-' + digits[2] + '-' + digits[3] + '-' + digits[4];
	    }
	    
	    // Otherwise, alert the user.
	    
	    else
	    {
		showNotice(null, "The ORCID does not have the proper format");
		return;
	    }
	}
	
	// Create an object containing only those attributes whose values have changed.
	// This will be submitted to the API to save those changes.
	
	var updates = { };
	var has_update;
	var approve_status = $('#active-status').val() || 'active';
	
	if ( title != $('#orig-title').val() )
	    updates.title = title;
	
	else if ( operation == 'approve' && title != $('#active-title').val() )
	    updates.status = approve_status;
	
	if ( description != $('#orig-desc').val() )
	    updates.description = description;

	else if ( operation == 'approve' && description != $('#active-desc').val() )
	    updates.status = approve_status;
	
	if ( url != $('#orig-url').val() ) {
	    updates.url = url;
	    updates.is_video = is_video;
	}

	else if ( operation == 'approve' && url != $('#active-url').val() )
	    updates.status = approve_status;
	
	if ( restype != $('#orig-type').val() || audience != $('#orig-aud').val() )
	    updates.tags = audience ? restype + ',' + audience : restype;

	else if ( operation == 'approve' && ( restype != $('#active-type').val() ||
					      audience != $('#active-aud').val() ) )
	    updates.status = approve_status;
	
	if ( author != $('#orig-name').val() )
	    updates.author = author;

	else if ( operation == 'approve' && author != $('#active-name').val() )
	    updates.status = approve_status;
	
	if ( email != $('#orig-email').val() )
	    updates.email = email;

	else if ( operation == 'approve' && email != $('#active-email').val() )
	    updates.status = approve_status;
	
	if ( affil != $('#orig-affil').val() )
	    updates.affil = affil;

	else if ( operation == 'approve' && affil != $('#active-affil').val() )
	    updates.status = approve_status;
	
	if ( orcid != $('#orig-orcid').val() )
	    updates.orcid = orcid;

	else if ( operation == 'approve' && orcid != $('#active-orcid').val() )
	    updates.status = approve_status;
	
	if ( topics != $('#orig-topics').val() )
	    updates.topics = topics;
	
	else if ( operation == 'approve' && topics != $('#active-topics').val() )
	    updates.status = approve_status;
	
	if ( taxa != $('#orig-taxa').val() )
	    updates.taxa = taxa;
	
	else if ( operation == 'approve' && taxa != $('#active-taxa').val() )
	    updates.status = approve_status;
	
	if ( timespan != $('#orig-timespan').val() )
	    updates.timespan = timespan;
	
	else if ( operation == 'approve' && timespan != $('#active-timespan').val() )
	    updates.status = approve_status;
	
	// If we have non-empty image data, if it is different from the original data then a new
	// image was explicitly loaded and should be submitted as an update. Otherwise, we leave
	// the image attributes unchanged.
	
	if ( imagedata && imagedata != $('#orig-imagedata').val() )
	    updates.image_data = imagedata;
	
	else if ( operation == 'approve' && imagedata && imagedata != $('#active-imagedata').val() )
	    updates.status = approve_status;
	
	// If the image data is empty and the image name has changed, submit that value as the
	// attribute 'image'.
	
	if ( ! imagedata && imagename != $('#orig-imagename').val() )
	    updates.image = imagename;

	else if ( operation == 'approve' && ! imagedata && imagename != $('#active-imagename').val() )
	    updates.status = approve_status;
	
	// If we have added any properties at all to the updates object, that means at least one
	// field value has changed. So we need to make an API call to add or update the
	// corresponding database record.
	
	for (var prop in updates)
	{
	    has_update = 1;
	    break;
	}
	
	if ( has_update )
	{
	    // Set the new status for this record. If this record is being approved, then
	    // the new status will be either the current active-status value ('active' or 'inactive')
	    // or else it will default to 'active'. Otherwise, 
	    
	    if ( operation == 'submit' || operation == 'save' )
	    {
		if ( $('#active-status').val() ) updates.status = 'changed';
		else updates.status = 'pending';
	    }
	    
	    else if ( operation == 'approve' )
	    {
		updates.status = approve_status;
	    }
	    
	    else
	    {
		showNotice(null, "Unknown operation '" + operation + "'");
	    }
	    
	    // If we have an oid, include it in the record. Otherwise, a new record will be added.
	    
	    if ( oid ) updates.eduresource_id = oid;
	    
	    // Now execute an API call to add or update the record.
	    
	    $.ajax({
		url: data_url + 'eduresources/addupdate.json',
		type: 'PUT',
		data: JSON.stringify(updates),
		contentType: 'application/json; charset=utf-8',
		dataType: 'json',
		async: false,
		success: function(data) {
		    if ( data.records && data.records.length > 0 )
		    {
			var oid = data.records[0].oid;
			var newstatus = data.records[0].sta;
			var displaystatus = newstatus;
			
			if ( newstatus == 'active' )
			{
			    showSuccess(null, 'Resource ' + oid + ' is active');
			    $('#res-status').html(newstatus);
			}
			
			else if ( newstatus == 'inactive' )
			{
			    showSuccess(null, 'Resource ' + oid + ' is inactive');
			    $('#res-status').html(newstatus);
			}
			
			else
			{
			    showSuccess(null, 'The changes to ' + oid + ' have been saved');
			    var activestatus = $('#active-status').val();
			    if ( activestatus )
				$('#res-status').html(newstatus + ' [' + activestatus + ']');
			}

			listResources();
		    }
		    
		    else
		    {
			showAPIError(null, null, 'Bad response from server');
		    }
		},
		error: function (xhr, textStatus, error) {
	            showAPIError(textStatus, error, "Error updating record");                
		}
	    });
	}
	
	else
	{
	    showNotice(null, "No changes to save");
	}
    }

    this.addUpdateResource = addUpdateResource;
    
    // The following function returns the oid of the selected resource, or else null. At the same
    // time, it enables or disables the action buttons depending on whether or not there is a
    // selected resource.
    
    function getSelectionEnable ( )
    {
	var selected_oid = $("#res-selector option[name=resource]:selected").val();
	
	if ( selected_oid )
	{
	    $("#btn-activate").prop("disabled", false);
	    $("#btn-inactivate").prop("disabled", false);
	    $("#btn-delete").prop("disabled", false);
	    return selected_oid;
	}
	
	else
	{
	    $("#btn-activate").prop("disabled", true);
	    $("#btn-inactivate").prop("disabled", true);
	    $("#btn-delete").prop("disabled", true);
	    return null;
	}
    }
    
    this.getSelectionEnable = getSelectionEnable;
    
    // Load image data from a file. If it is a recognized type, the content will be used as the
    // image for this resource.
    
    function loadDisplayImage ( )
    {
	var files = $('#res-imagefile').prop('files');
	
	if ( files.length > 0 )
	{
            var fileReader = new FileReader();

	    // Read the data and encode it into base64.
	    
            fileReader.readAsDataURL(files[0]);
	    
	    // Asynchronously store the data when the read operation is complete.
	    
            fileReader.onload = function (e) {
            
		// $$$ need to check for allowed image types
		
		// Save the image data for upload, and clear the image name.
		
		var file_data = e.target.result;
		$("#res-imagedata").val(file_data);
		$("#res-imagename").val('');
		
		// Create an image object to display the file contents.

		var new_img = document.createElement('img');
		new_img.src = file_data;

		// Resize the image to a maximum of 150x150 pixels.

		var width = new_img.width;
		var height = new_img.height;
		
		if ( height > width && height > 150 )
		{
		    new_img.height = 150;
		}
		
		else if ( width > 150 )
		{
		    new_img.width = 150;
		}
		
		$('#res-thumb').html('');
		$('#res-thumb').append(new_img);
            };
	    
	    fileReader.onerror = function (e) {

		showError(null, "An error occurred while reading the file.");
	    };
	}
    }
    
    this.loadDisplayImage = loadDisplayImage;
    
    // Clear any image data that was loaded locally in this session and set the display image to a
    // default based on the resource type and URL.
    
    function resetDisplayImage ( )
    {
	$("#res-imagename").val('');
	$("#res-imagedata").val('');
	$('#res-imagefile').val('');
	$('#res-thumb').html('');
	setDefaultImage();
    }
    
    this.resetDisplayImage = resetDisplayImage;
    
    // Set the display image to a default based on the resource type and URL. Resources that are
    // YouTube videos have the is_video flag set, and an empty image name. This function is
    // intended to be called whenever the resource type is changed.
    
    function setDefaultImage ( )
    {
	var imagename = $("#res-imagename").val();
	var restype = $("input[name=res-type]:checked").val();
	
	// If image content has been loaded, do nothing. That content will be used as the image
	// for this resource.
	
	if ( $("#res-imagedata").val() )
	    return;
	
	// If no resource type has been selected, do nothing. The resource cannot be submitted
	// until a resource type has been selected.
	
	if ( ! restype )
	    return;
	
	// If the image name is empty or starts with "default_", then set it to the default that
	// matches the current resource type and URL. Otherwise, leave it alone.
	
	if ( imagename == "" || imagename.match(/^default_/) )
	{
	    var url = $("#res-url").val();
	    var video_id = url.match( /watch\?v\=([^&]+)/ );
	    var new_imagename;
	    
	    if ( video_id )
		new_imagename = '';
	    
	    else switch (restype) {
		case 'web':
                    new_imagename = 'default_web.png';
                    break;
                case 'mobile':
                    new_imagename = 'default_mobile.png';
                    break;
                case 'lesson_plan':
                    new_imagename = 'default_lesson_plan.png';
                    break;
                case 'tutorial':
                    new_imagename = 'default_tutorial.png';
                    break;
                case 'data_entry':
                    new_imagename = 'default_data_entry.png';
                    break;
                case 'R':
                    new_imagename = 'default_R.png';
                    break;
                case 'presentation':
                    new_imagename = 'default_presentation.png';
                    break;
                case 'API':
                    new_imagename = 'default_api.png';
                    break;
		default:
                    new_imagename = 'default_other.png';
                    break;
	    }

	    // Save the new imagename and set the thumbnail to display the new image.
	    
	    $('#res-imagename').val(new_imagename);
	    
	    var new_imagesrc;
	    
	    if ( video_id )
		new_imagesrc = 'https://img.youtube.com/vi/' + video_id + '/hqdefault.jpg';

	    else
		new_imagesrc = '/build/img/' + new_imagename;
	    
	    var old_imagesrc = $("#res-thumb img").prop('src');
	    
	    if ( new_imagesrc != old_imagesrc )
	    {
		$("#res-thumb").html('<img src="' + encodeURI(new_imagesrc) + '">');
	    }
	}
    }
    
    this.setDefaultImage = setDefaultImage;
    
    // Fill in the author fields with user information. This information must be included in the
    // HTML source using variable substitution.
    
    function applyUserInfo ( )
    {
	if ( typeof(user_name) != 'undefined' && user_name )
	    $('#auth-name').val(user_name);
	
	if ( typeof(user_email) != 'undefined' && user_email )
	    $('#auth-email').val(user_email);
	
	if ( typeof(user_affil) != 'undefined' && user_affil )
	    $('#auth-affil').val(user_affil);
	
	if ( typeof(user_orcid) != 'undefined' && user_orcid )
	    $('#auth-orcid').val(user_orcid);
    }

    this.applyUserInfo = applyUserInfo;
    
    // Autocompletion for form fields. The first argument must be the id of a text input, the
    // second gives the value of the 'type' parameter to be passed to the API.
    
    function autocomplete ( field_id, request_type )
    {
	var selector = '#' + field_id;
	var user_input = $(selector).val();
	var drop_down = $(selector).next('.searchResult');
	
	// If the existing content of the field includes a , or ; then autocomplete only the
	// portion after that.
	
	if ( /[;,]/.test(user_input) )
	{
	    user_input = user_input.match(/(.*[;,] )(.*)/)[2];
	}
	
	// Only autocomplete once at least 3 characters have been typed.
	
	if ( user_input.length < 3 )
	{
	    drop_down.css("display", "none");
	    drop_down.html("");
	    return;
	}
	
	var api_request = data_url + 'combined/auto.json?name=' + encodeURI(user_input) +
	    '&type=' + request_type;
	
	$.getJSON(api_request, function (json) {
	    
	    // If there are no matching results, let the user know.
	    
            if (json.records.length == 0)
	    {
		var message = '<div class="autocompleteError">No matching results for "' +
		    user_input + '"</div>';
		drop_down.html(message);
		drop_down.css("display", "block");
		return;
	    }
	    
	    // Otherwise, display the list of matches.
	    
	    var matches = "";
	    
            json.records.map( function (d) {
		
		var match = '<div class="suggestion" data-nam="' + d.nam +
		    '" data-oid="' + d.oid + '">' + d.nam + '</div>\n';
		
		matches += match;
	    });
	    
	    drop_down.html(matches);
	    drop_down.css("display", "block");
	    
		// if ( /int:/.test(d.oid) )
		// {
		//     match += ' <small class=taxaRank>' + Math.round(d.eag) + '-'
		// 	+ Math.round(d.lag) + ' ma</small></p></div>';
		// }
		
		// else if ( /txn:|var:/.test(d.oid) )
		// {
		//     match += ' <small class=taxaRank>' + d.rnk + " in " + d.htn + "</small><br><small class=misspelling>" + d.tdf + " " + d.acn + "</small></p>"
		// }
		
	}).error( function ( jqXHR, errorString ) {

	    drop_down.html("Autocomplete error: " + errorString);
	    drop_down.css("display", "block");

	});
    }

    this.autocomplete = autocomplete;

    function autohide ( field_id )
    {
	var selector = '#' + field_id;
	var drop_down = $(selector).next('.searchResult');

	drop_down.css("display", "none");
    }

    this.autohide = autohide;

    function autoshow ( field_id )
    {
	var selector = '#' + field_id;
	var user_input = $(selector).val();
	var drop_down = $(selector).next('.searchResult');

	if ( user_input != "" && user_input.length >= 3 && drop_down.val() != "" )
	{
	    drop_down.css("display", "block");
	}
    }
    
    this.autoshow = autoshow;

    function showSuccess ( title, text )
    {
	new PNotify ({ type: "success",
		       title: title,
		       text: text,
		       width: '420px',
		       delay: 3000 });
    }

    this.showSuccess = showSuccess;

    function showError ( title, text )
    {
	new PNotify ({ type: "error",
		       title: title,
		       text: text,
		       width: '420px' });
    }

    this.showError = showError;

    function showAPIError ( status, message, marker )
    {
	var text = marker || '';

	if ( text ) text += ': ';

	if ( status == 'error' ) text += message;
	else if ( message ) text += status + ', ' + message;
	else text += status;
	
	showError("API Error", text);
    }
    
    this.showAPIError = showAPIError;
    
    function showNotice ( title, text )
    {
	new PNotify ({ type: "notice",
		       title: title,
		       text: text,
		       width: '420px',
		       delay: 3000 });
    }

    this.showNotice = showNotice;

    function showInfo ( title, text )
    {
	new PNotify ({ type: "info",
		       title: title,
		       text: text,
		       width: '420px',
		       delay: 8000 });
    }
    
    this.showInfo = showInfo;
}
    

