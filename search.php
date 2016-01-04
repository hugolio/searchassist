<?php
	//get all URL parameters
	
	//get query or set default
	if (isset($_GET['query'])) {
   		$query = $_GET['query'];
	} else {
   		$query = '';
	}
   
	//get facet or set default
	if(isset($_GET['facet'])) {
		$facet = $_GET['facet'];
	} else {
		$facet = '';
	}
	
	//get task number or set default (task 1)
	if(isset($_GET['task'])) {
		$task = $_GET['task'];
	} else {
		$task = '1';
	}
	
	//for logging clicked links
	if (isset($_GET['gotourl'])) {
		$gotourl = $_GET['gotourl'];
	} else {
   		$gotourl = '';
	}
	
	//get user_id
	if (isset($_GET['userid'])) {
		$userid = $_GET['userid'];
	} else {
   		$userid = '';
	}
	
	//get eventname
	if (isset($_GET['eventname'])) {
   		$eventname = $_GET['eventname'];
	} else {
   		$eventname = '';
	}
	
	//get event value
	if (isset($_GET['eventvalue'])) {
		$eventvalue = $_GET['eventvalue'];
	} else {
		$eventvalue = '';
	}

	//get current page number
	if (isset($_GET['page'])) {
   		$pagenumber = $_GET['page'];
	} else {
   		$pagenumber = 1;
	}
   
	//get msg to display onscreen
	if (isset($_GET['msg'])) {
   		$msg = $_GET['msg'];
	} else {
   		$msg = '';
	}
?>

<html>

<head>

<title><?php echo $query; ?> - SearchAssist</title>

<meta http-equiv='Content-Type' content='text/html; charset=utf-8' />

<link href='css/bing.css' rel='stylesheet' type='text/css' />

<script type='text/javascript' src='js/log4javascript.js'></script>

<!-- Load jQuery locally. Several sites also let you load this externally if you prefer -->
<script language='JavaScript' type='text/javascript' src='js/jquery-1.7.2.js'></script>
<script language='JavaScript' type='text/javascript' src="js/jquery-ui.js"></script>
<script language='JavaScript' type='text/javascript' src='js/jquery.tagcloud.js'></script>
<script language='JavaScript' type='text/javascript' src='js/bing.js'></script>

<!--include usr, task-->
<script language='JavaScript' type='text/javascript' src='settings/user.js'></script>
<script language='JavaScript' type='text/javascript' src='settings/task.js'></script>

<script type='text/javascript'>

//functions to register whether the search page is active in the browser
window.onpageshow = function() {
	//only log this when no event has been specified
    if(eventName == '') {
    	createLogEntry("activeSearchWindow", CURRENT_USER, "true");
    }
};

window.onpagehide = function() {
	//only log this when no event has been specified
	if(eventName == '') {
		/*createLogEntry("searchWindowActive", CURRENT_USER, "false");*/
    }
};

window.onbeforeunload = function() {
	setTimeout(function(){
		createLogEntry("activeSearchWindow", CURRENT_USER, "false");}, 0);
}

$(window).focus(function(e) {
    createLogEntry("activeSearchWindow", CURRENT_USER, "true");
});

$(window).blur(function(e) {
    createLogEntry("activeSearchWindow", CURRENT_USER, "false");
});

//functions for saved results feature
$(function() {
	$( "#saved-results" ).sortable({    
    	start: function(e, ui) {
        // creates a temporary attribute on the element with the old index
        $(this).attr('data-previndex', ui.item.index());
    },
    	stop: function(e, ui) {
        	$("#saved-results li").each(function(index, value) {
        		var newPosition = index + 1;
				//console.log('index' + newPosition + ':' + $(this).attr('id')); 
				var pageID = $(this).attr('id');
				var pageURL = $(this).attr('url');
				if(pageURL==undefined) {
					//if it's a category
					pageURL = "category:"+pageID;
				}
				createLogEntry("moveBookmark", CURRENT_USER, newPosition+","+pageURL);
    			updateBookmarkPosition(newPosition,pageID);
			});
    	}
    });
    $( "#saved-results" ).disableSelection();
});
  
//logging functions
	
// Create the logger
var log = log4javascript.getLogger();
var timeLayout = new log4javascript.PatternLayout("%d{HH:mm:ss} %-5p - %m%n");
//Create appender which logs events to a text file (via php proxy)
var ajaxAppender = new log4javascript.AjaxAppender("./proxies/log4javascript.php");
ajaxAppender.setSendAllOnUnload(true);
log.addAppender(ajaxAppender);
	
function createLogEntry(eventName, userID, eventValue) {
	//write log to text file
	log.info(getDate() + "\t" + getMilliseconds() + "\t" + CURRENT_USER + "\t" + CURRENT_TASK + "\t" +eventName + "\t" + eventValue);
	//write log to sql database
	var data = 	{eventname:eventName,timestamp:getDate(),userid:userID,eventvalue:eventValue};
		$.getJSON('proxies/logging_sql_proxy.php', data, function(obj) {
		});
	}
	
	//function to capture clicked urls while retaining right-click etc functionality
	var goToUrl = '<?php echo $gotourl; ?>';
	var userID = '<?php echo $userid; ?>';
	var eventName = '<?php echo $eventname; ?>';
	var eventValue = '<?php echo $eventvalue; ?>';
	var query = '<?php echo $query; ?>';
	var facet = '<?php echo $facet; ?>';
	var task = '<?php echo $task; ?>';
	var msg = '<?php echo $msg; ?>';//'please open the next task by clicking "Read task instructions" in the bottom left corner';
	var pageNumber = '<?php echo $pagenumber; ?>';
	
	if(goToUrl !=='') {
		//capture log info and go to url
		createLogEntry(eventName, userID, eventValue);
		
		//show informative message to user
		if(eventName=='setCurrentTask') {
			alert("Thank you, please follow the instructions on the next page");
		}
		
		window.open(goToUrl,"_self","","replace=true");

	} else if (eventName!=='') {
		//log event and open new page
		createLogEntry(eventName, userID, eventValue);
	window.open('search.php?query='+query+'&facet='+facet+"&page="+pageNumber,"_self","","replace=true");	
	} else if(msg !=='' && msg !==undefined) {
		//create log item, show informative message to user
		createLogEntry('showMessage', CURRENT_USER, query);
		alert(msg);
		window.open("search.php","_self","","replace=true");
	} else {
		createLogEntry('doQuery', CURRENT_USER, query);
		window.onload = initializeSearchEngine(query,facet,task,pageNumber);
	}

function addZero(x,n) {
    if (x.toString().length < n) {
        x = "0" + x;
    }
    return x;
}

function getDate() {
    var d = new Date();
    var y = addZero(d.getFullYear(), 2);
    var mo = addZero((d.getMonth()+1), 2);
    var da = addZero(d.getDate(), 2);
    var h = addZero(d.getHours(), 2);
    var m = addZero(d.getMinutes(), 2);
    var s = addZero(d.getSeconds(), 2);
    var ms = addZero(d.getMilliseconds(), 3);
    return y + "-" + mo + "-" + da + " " + h + ":" + m + ":" + s + "." + ms;
}

function getMilliseconds() {
	var d = new Date();
	return d.getTime();
}

//mouse tracking functions
(function() {
    if(eventName=='') {
    
    document.onmousemove = handleMouseMove;
    function handleMouseMove(event) {
        var dot, eventDoc, doc, body, pageX, pageY;

        event = event || window.event; // IE-ism

        // If pageX/Y aren't available and clientX/Y are,
        // calculate pageX/Y - logic taken from jQuery.
        // (This is to support old IE)
        if (event.pageX == null && event.clientX != null) {
            eventDoc = (event.target && event.target.ownerDocument) || document;
            doc = eventDoc.documentElement;
            body = eventDoc.body;

            event.pageX = event.clientX +
              (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
              (doc && doc.clientLeft || body && body.clientLeft || 0);
            event.pageY = event.clientY +
              (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
              (doc && doc.clientTop  || body && body.clientTop  || 0 );
        }
		log.info(getDate() + "\t" + getMilliseconds() + "\t" +  CURRENT_USER + "\t" + CURRENT_TASK + "\t" + "mouseMove" + "\t" + event.pageX + "," + event.pageY);
        // Use event.pageX / event.pageY here
    	}
    }
})();

</script>

</head>

<body>

<!-- Results container. -->
<div id='results'></div>

<div id='wrapper'>

<!--SearchAssist logo-->
<h1>S<span style='color:#666777'>earch</span><span style='color:#0266C8'>A</span><span style='color:#F90101'>s</span><span style='color:#F2B50F'>s</span><span style='color:#00933B'>i</span><span style='color:#0266C8'>s</span><span style='color:#F90101'>t</span></h1>

<form id='my_form' form method='get' action='search.php?test=test'>

<input id='query' name='query' type='text' size='80' value='<?php echo $query; ?>' />
<input type='submit' value='Search' />

</form>

</div>

<div id='query-corrections'></div>

<!-- Facets container -->
<div id='facets'><h2>Filter by category:</h2></div>

<!-- Query suggestions container -->
<div id='query-suggestions'><h2>Query suggestions:</h2></div>

<!-- Tag Cloud container -->
<div id='tag-cloud'><h2>Add keyword to query:</h2></div>

<!-- Saved results container. -->
<div id='saved-results'><h2>Saved results:</h2></div>

<!-- Action history container -->
<div id='history'><h2>Recent queries:</h2></div>

<!-- Task description bar -->
<div id='footer'>Loading task details...
</div>

</body>

</html>