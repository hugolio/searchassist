/*! Bing Search Helper v1.0.0 - requires jQuery v1.7.2 */

var MAX_RESULTS_PER_PAGE = 8;
var SELECTED_FACET = 1;
var CURRENT_TASK = 0;

/*
Logging:
-events
	-query
	-get search results
	-get query suggestions
	-facet click
	-tag click
	-query suggestion click
	-history click
	-saved result click
	-click link
	-mouse move
-event properties
	-time
	-userID
	-eventName
	-click: title, url
	-getresults: numberResults, resultIds
	-mousemove: coordinates
*/

function initializeSearchEngine(query,facet,numTask,pageNumber) {
	if(query.length>0) {
		doSearch(query,facet,pageNumber);
		getTask();
	} else {
		getBookmarks();
		getLogEntries();
		getTask();
	}
}

function setTask(numTask) {
	CURRENT_TASK = numTask;
}

function getTask() {
	var data = {userid:CURRENT_USER};
	$.getJSON('proxies/current_task_sql_proxy.php', data, function(obj) {
		var items = obj;
		if(items[0]!=undefined) {
			setTask(items[0]);
			setTaskBar(items[0]);
		} else {
			setTask(CURRENT_TASK);
			setTaskBar(CURRENT_TASK);
		}
	});
}

function setTaskBar(taskNumber) {
		//configure task bar (bottom panel of SUI)
		$('#footer').empty();
		var currentTask = parseInt(taskNumber);
		var nextTask = parseInt(taskNumber)+1;
		var previousTask = parseInt(taskNumber)-1;
		$('#footer').append('<a href="'+generateLoggingURL(TASK_DESCR_ARR[currentTask-1],CURRENT_USER,'openTaskDescription',currentTask,'')+'" target="_blank"><b>Read task instructions (phase '+ currentTask + ' of '+NUMBER_OF_TASKS+').</b></a> &nbsp;&nbsp;');
			if(currentTask>1) {
$('#footer').append('<a class="q-hist" href="'+generateLoggingURL('',CURRENT_USER,'setCurrentTask',previousTask,'')+'">Previous Task</a>. ');
			}
			if(currentTask<NUMBER_OF_TASKS) {
				$('#footer').append('<a class="q-hist" 	href="'+generateLoggingURL('post-task-screens/_finished_task_'+currentTask+'.html',CURRENT_USER,'setCurrentTask',nextTask,'')+'"><b><u>I am finished with this step</u></b></a>')
			} else {
				$('#footer').append('<a class="q-hist" href="'+generateLoggingURL('post-task-screens/_finished_experiment.html',CURRENT_USER,'setCurrentTask',currentTask,query,facet)+'"><b><u>I am finished with this task</u></a>')
		}

}

function getLogEntries() {
	//get history items from log
	//todo: add filter here (which history to show) -- now queries, configured in history_sql_proxy.php
	var data = {userid:CURRENT_USER};
	$.getJSON('proxies/history_sql_proxy.php', data, function(obj) {
		var items = obj;
		//log.info(obj[0]);
		showHistory(obj);
	});
}

function showHistory(obj) {
	//show Recent Queries
	//use encodeURIComponent() to fix quotation bug
	for(var i=0;i<obj.length;i++) {
		var previousQuery = obj[i][1];
		var shortPreviousQuery = previousQuery;
		if(previousQuery.length>50) {
			shortPreviousQuery = shortPreviousQuery.substring(0,50) + "...";
		}
		$('#history').append('<a class="q-hist" href="'+generateLoggingURL('',CURRENT_USER,'clickHistoryItem',previousQuery,encodeURIComponent(previousQuery))+'">'+shortPreviousQuery+'</a><br/>');
	}
}

function doSearch(query,facet,pageNumber) {
	var serviceOp = $('input[name=service_op]:checked', '#my_form').val();

	if (query) {
		if(facet) {
			//if facet selected
			search(query, serviceOp, facet, pageNumber);
			getQuerySuggestions(query, serviceOp);
			getQueryCorrections(query, serviceOp);
			getLogEntries();
		} else {
			//no facet selected
			search(query, serviceOp, undefined, pageNumber);
			getQuerySuggestions(query, serviceOp);
			getQueryCorrections(query, serviceOp);
			getLogEntries();
		}
	}
}

function search(query, serviceOp, selectedFacet, pageNumber) {
	//Performs the search.
	//retrieve Saved Results
	getBookmarks();

	// Establish the data to pass to the proxy.
	var data = { q: query, sop: serviceOp, market: 'en-gb' };

	// Calls the proxy, passing the query, service operation and market.
	$.getJSON('proxies/bing_proxy.php', data, function(obj) {
	//$.getJSON('json/example.json', data, function(obj) {

		if (obj.d !== undefined) {
			var items = obj.d.results;
			
			if(items.length>0) {	
				getResultsItemArray(items, function(enrichedItems) {
					showResults(enrichedItems, selectedFacet, query, pageNumber);
				});
			} else {
				$('#results').append('<b>No results found.</b>');
			}	
			
		} else {
			$('#results').append('<i>Oops, something went wrong...</i>');
		}
	});
}

function showResults(enrichedItems, selectedFacet, query, pageNumber) {
	//Sort results array here by rank
	enrichedItems.sort(compareRanks);
	//set max results per page (if enough results available)
	var maxRes;
	if(MAX_RESULTS_PER_PAGE < enrichedItems.length) {
		maxRes = MAX_RESULTS_PER_PAGE;
	} else {
		maxRes = enrichedItems.length;
	}
	
	var startResult = (pageNumber-1)*MAX_RESULTS_PER_PAGE;
	
	var numItems = 0;
	var numShownItems = 0;
	
	for(var i=0;i<enrichedItems.length;i++) {
		if(selectedFacet=="" || selectedFacet==null) {
			if(numShownItems<maxRes && numItems>=startResult) {
				showResult(enrichedItems[i]);
				createLogEntry("showQueryResult", CURRENT_USER, enrichedItems[i].Rank+","+enrichedItems[i].Url);
				numShownItems++;
			}
			numItems++;
		} else if(getSelectedFacetFromArray(enrichedItems[i].FacetArray)==selectedFacet) {
			if(numShownItems<maxRes && numItems>=startResult) {
				showResult(enrichedItems[i]);
				createLogEntry("showQueryResult", CURRENT_USER, enrichedItems[i].Rank+","+enrichedItems[i].Url);
				numShownItems++;
			}
			numItems++;
		}
	}
	
	showFacets(enrichedItems,query,selectedFacet);
	showTagCloud(enrichedItems,query,selectedFacet);
	var currTask = getTask();
	showPageNumbers(0,numItems/MAX_RESULTS_PER_PAGE,query,facet,pageNumber);
	
}

function showPageNumbers(start,end,query,facet,currentPage) {
	//show page numbers below Results List
	//todo: add 'next page' button
	//fixed: quotation marks
	$('#results').append('page: ');
	for(var i=start;i<end;i+=1) {
		var pageNumberToShow = i+1;
		if(pageNumberToShow==currentPage) {
			$('#results').append('<b>'+pageNumberToShow+'</b> ');
		} else {
			$('#results').append('<a class="pageNavigation" href="'+generateLoggingURL('',CURRENT_USER,'goToResultsPage',pageNumberToShow,encodeURIComponent(query),facet,pageNumberToShow)+'">'+pageNumberToShow+'</a> ');
		}
	}
}

function compareRanks(a,b) {
	//compare item ranks
  if (parseInt(a.Rank) < parseInt(b.Rank)) {
     return -1;
     }
  if (parseInt(a.Rank) > parseInt(b.Rank)) {
    return 1;
    }
  return 0;
}

function compareCounts(a,b) {
  if (a[1] < b[1])
     return -1;
  if (a[1] > b[1])
    return 1;
  return 0;
}

function getResultsItemArray(items,callback) {
	var enrichedItemArray=[];
	
	getResults(items, function(item) {	

		enrichedItemArray[enrichedItemArray.length]=item;
		
		//only callback when adding results is finished
		if(enrichedItemArray.length==items.length) {
			callback(enrichedItemArray);
		}
		
	});
}


function getResults(items,callback) {
	// Shows one item of Web results
	for (var k = 0, len = items.length; k < len; k++) {	
		var item = items[k];
		var hostname = getHostname(item.DisplayUrl);
		item.Hostname = hostname;
		
		//create array of "tags" from item description
		item.TagArray = getTagArray(item.Description);
		
		getFacet(item, function(item) {
		    //create facet array
		    //facet format eg Top/Business/Aerospace_and_Defense/Aeronautical
		    item.FacetArray = item.Facet.split("/");
		    item.Rank = getRank(item);
			
			getIsBookmarkProperty(item, function(item) {
				callback(item);
			});
		});
	}
}

function getRank(item) {
	//get the ranking order of a results, workaround needed since it is not a regular metadata value
	//split to get $skip value: https://api.datamarket.azure.com/Data.ashx/Bing/Search/Web?Query='the world is not enough'&Market='en-us'&$skip=38&$top=1
	return item.__metadata.uri.split("&$skip=")[1].split("&$top")[0];
}

function getTagArray(text) {
	//create array of 'tags' by splitting the text in the results item description
	var itemDescrSplit = text.split(" ");
	var tagArray = [];
	
	for(var i=0; i<itemDescrSplit.length; i++) {
		//remove special chars, keep lowercase
		var currentTag = itemDescrSplit[i].toLowerCase().replace(/[^a-z]/gi,'')
		if(currentTag.length>0) {
			tagArray[tagArray.length]=currentTag;
		}
	}
	return tagArray;
}

function getFacet(item, callback) {
	//retrieves a facet
	//establish the data to pass to the sql proxy.
	var data = { q: item.Hostname};

	// Calls the proxy, passing the query, service operation and market.
	$.getJSON('proxies/facets_sql_proxy.php', data, function(obj) {
		if (obj[0] !== undefined && obj[0] !== "undefined") {
			item.Facet = obj[0];
			callback(item);
		} else {
			//potential improvement: redo query matching only domain
			item.Facet = ('Uncategorized');
			callback(item);
		}
	});
}

function showResult(item) {
		//console.info(item.isBookmark);
		var extraBreak = '';
		
		//be sure that the description fits (for eye tracking items have to be in fixed position) - introduce extra break or decrease length if needed
		if (item.Description.length<90) {
			extraBreak = '<br/>';
		}
		var snippetToShow = item.Description;
		if(item.Description.length > 160) {
			snippetToShow = snippetToShow.substring(0,160); 
		}
		
		//remove "Top/" category from dmoz description
		var facetText = item.Facet.replace("Top/","").replace(/\//g,", ").replace(/_/g," ");
		if(facetText.split(",").length > 1) {
			facetText = facetText.split(",")[0]+", " + facetText.split(",")[1];
		} else {
			facetText = facetText.split(",")[0];
		}
		var urlAndFacetLength = item.DisplayUrl.length + facetText.length;
		
		//string for unsaved result
		var saveResultString = ' '+extraBreak+'<a class="saveResult saveresult-'+item.ID+'" style="cursor:pointer;"><i>save result</i></a></td></tr>';

		//string for saved result
		var savedResultString = '<span class="savedResult saveresult-'+item.ID+'"><i>saved</i></span></td></tr>';
		if(item.isBookmark=="true") {
			saveResultString = savedResultString;
		}
		
		$('#results').append('<tr><td height="90"><a class="result" href="'+generateLoggingURL(item.Url,CURRENT_USER,
'clickResult',item.Url+' '+item.Rank)+'"><h3>'+item.Title+'</a></h3><span class="shortenedUrl">'+item.DisplayUrl+'</span><span class="facetText">'+facetText+'</span><br/><span class="normalText">'+item.Description+'</span>'+saveResultString); 
		
		$("a.saveresult-"+item.ID).click(function(){ 
			createLogEntry("saveResult", CURRENT_USER, item.Url);
			addBookmark(item.Url, item.Title, item.Description, item.ID);
			$('#results a.saveresult-'+item.ID).replaceWith(savedResultString);
		});
}

function getSelectedFacetFromArray(facetArray) {
	if(facetArray.length<2) {
		return "Uncategorized";
	} else {
		return facetArray[SELECTED_FACET];
	}
}

function showFacets(items, query, selectedFacet) {
	//url encode query
	query = encodeURIComponent(query);

	//merge facets
	var facetArr = [];
	for(var i=0; i<items.length; i++) {
		facetArr[facetArr.length] = getSelectedFacetFromArray(items[i].FacetArray);	
	}
	
	//count #words
	var facetArrCnt = [];
	facetArrCnt = countArrayWords(facetArr);
	
	//print "all" facet
	if(selectedFacet=="" || selectedFacet==undefined) {
		$('#facets').append('<a href="'+generateLoggingURL('',CURRENT_USER,'clickFacet','All',query,'',1)+'"><b>All</b></a><br/>');
	} else {
		$('#facets').append('<a href="'+generateLoggingURL('',CURRENT_USER,'clickFacet','All',query,'',1)+'">All</a><br/>');
	}
	
	//print the other facets
	for(var i=0;i<facetArrCnt[0].length;i++) {
		var currentFacet = facetArrCnt[0][i][0];
		var currentCount = facetArrCnt[0][i][1];

		if(currentFacet == selectedFacet && currentFacet.length>1) {
			$('#facets').append('<a class="facet" href="'+generateLoggingURL('',CURRENT_USER,'clickFacet',currentFacet,query,currentFacet,1)+'"><b>'+currentFacet+'</b></a>',' (',currentCount,') ', '<br/>');
		} else {
			$('#facets').append('<a class="facet" href="'+generateLoggingURL('',CURRENT_USER,'clickFacet',currentFacet,query,currentFacet,1)+'">'+currentFacet+'</a>',' (',currentCount,') ', '<br/>');
		}	
	}
}

function showTagCloud(items, query, filter) {
	//generate the visual Tag Cloud
	//todo: split into separate functions
	
	//merge tag array items
	var tagArr = [];
	for(var i=0;i<items.length;i++) {
		if(filter=="" || filter==undefined || (filter!=="" && getSelectedFacetFromArray(items[i].FacetArray)==filter)) {
			for(var j=0;j<items[i].TagArray.length;j++) {
				if(query.toLowerCase().indexOf(items[i].TagArray[j].toLowerCase())==-1) {
					tagArr[tagArr.length]=items[i].TagArray[j];
				}
			}
		}
	}
	
	//count #words
	var tagArrCnt = [];
	tagArrCnt = countArrayWords(tagArr);
	
	//sort array by count
	tagArrCnt[0].sort(function(a, b) {
    	return b[1] - a[1];
	});
	
	var tagArrSlice = tagArrCnt[0].slice(0,50);
	//var tagArrSliceRandom = shuffle(tagArrSlice);
	var tagArrSliceRandom = tagArrSlice;
	
	//now sort array by tag
	tagArrSliceRandom.sort(function(a, b) {
   		if(a[0] < b[0]) return -1;
    	if(a[0] > b[0]) return 1;
    	return 0;
	});
	
	//show Tag Cloud
	var tagNumber=0;
	for(var i=0;i<tagArrSliceRandom.length;i++) {		
			var currentTag = tagArrSliceRandom[i][0];
			var currentCount = tagArrSliceRandom[i][1];
			if(currentTag.length>1 &&!isStopWord(currentTag)) {
				$('#tag-cloud').append('<a class="tag-'+currentTag+'" href="#"  rel="'+currentCount+'">'+currentTag+'</a> ');
				$("a.tag-"+currentTag).bind('click', {currentT: currentTag, q:query, rel:currentCount}, function(event) {
					//event.preventDefault();
					var data = event.data;
					createLogEntry("clickTag", CURRENT_USER, data.currentT);
					$('#tag-cloud a.tag-'+data.currentT).html('<s>'+data.currentT+'</s>');
					var currentQuery = $('#wrapper input[type=text]').val();
					$('#wrapper input[type=text]').val(currentQuery + " "+ data.currentT);
					$(function () {
						$('#tag-cloud a').tagcloud();
					});
				});		
				tagNumber++;
			}				
	}
	//some tag cloud layout settings
	$.fn.tagcloud.defaults = {
  		size: {start: 9, end: 14, unit: 'pt'},
  		color: {start: '#777', end: '#000'}
	};

	$(function () {
  		$('#tag-cloud a').tagcloud();
	});
}

function isStopWord(word) {
	//quick fix stop words
	//todo: add more complete list
	var stopWords = ["the", "a", "and", "of", "in", "to", "as", "is", "be", "or", "on", "by", "for", "you", "that", "are", "at", "with", "this", "do", "was", "but", "your"];
	for(var i=0; i<stopWords.length; i++) {
		if(word==stopWords[i]) {
			return true;
		}
	}
	return false;
}

//shuffle an array
function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

function addTagsToArray(item, tagArray) {
	//create an array of tags
	var itemDescr = item.Description;
	var itemDescrSplit = itemDescr.split(" ");
	for(var i=0; i<itemDescrSplit.length; i++) {
		var currentTag = itemDescrSplit[i].toLowerCase().replace(/[^a-z]/gi,'')
		if(currentTag.length>0) {
			tagArray[tagArray.length]=currentTag;
		}
	}
}

// Shows one item of Image result.
function showImageResult(item) {
	var p = document.createElement('p');
	var a = document.createElement('a');
	a.href = item.MediaUrl;
	
	// Create an image element and set its source to the thumbnail.
	var i = document.createElement('img');
	i.src = item.Thumbnail.MediaUrl;

	// Make the object that the user clicks the thumbnail image.
	$(a).append(i);
	$(p).append(item.Title);

	// Append the anchor tag and paragraph with the title to the results div.
	$('#results').append(a, p);
}

// Gets query suggestions
function getQuerySuggestions(query, serviceOp) {
	//get query suggestions from bing api
	//todo/tweak: get query suggestions for query+facet, e.g. climate change news
	
	// Establish the data to pass to the proxy.
	var data = { q: query, sop: 'RelatedSearch', market: 'en-us' };

	// Calls the proxy, passing the query, service operation and market.
	$.getJSON('proxies/bing_qsugg_proxy.php', data, function(obj) {
	//$.getJSON('json/example_sugg.json', data, function(obj) {
		if (obj.d !== undefined) {
			var items = obj.d.results;
			for (var k = 0, len = items.length; k < len; k++) {
				var item = items[k];		
				showQuerySuggestion(item);
			}
		
			if(items.length==0) {
				$('#query-suggestions').append('<span class="tips">no query suggestions available</span>');
			}
		}
	});
}

function getQueryCorrections(query, serviceOp) {
	//gets query corrections, i.e. misspellings	
	//establish the data to pass to the proxy.
	var data = { q: query, sop: 'SpellingSuggestions', market: 'en-gb' };

	// Calls the proxy, passing the query, service operation and market.
	$.getJSON('proxies/bing_qcorr_proxy.php', data, function(obj) {
		if (obj.d !== undefined) {
			var items = obj.d.results;
			if(items.length > 0) {
				showQueryCorrection(items[0].Value, query);
			}
		}
	});
}

function showQueryCorrection(qCorr, query) {
	$('#query-corrections').append('Did you mean: <a class="q-corr" href="'+generateLoggingURL('',CURRENT_USER,'clickQueryCorrection',qCorr,encodeURIComponent(qCorr))+'">'+qCorr+'</a><br/>');
}

function getHostname(url) {
	//get hostname from url (provisional)
	var urlClean = url.replace("www.","");
	var urlArray = urlClean.split('/');
	var hostname = urlArray[0];
	return hostname;
}

function showQuerySuggestion(item) {
	//todo: fix single quote issue, e.g. Blackbeard's ghost
	$('#query-suggestions').append('<a class="q-sugg" href="'+generateLoggingURL('',CURRENT_USER,'clickQuerySuggestion',item.Title,item.Title)+'">'+item.Title+'</a><br/>');
}

function countArrayWords(arr) {
    var a = [], b = [], prev;
    arr.sort();
    for ( var i = 0; i < arr.length; i++ ) {
        if ( arr[i] !== prev ) {
            a[a.length]=[arr[i],1]
            //a.push(arr[i]);
            //b.push(1);
        } else {
        	a[a.length-1][1]++;
            //b[b.length-1]++;
        }
        prev = arr[i];
    }
    return [a];
}

function addBookmark(url, title, description, pageID) {
	//read bookmarks
	//remove non alphanum chars from title, descr
	title = title.replace(/[^.,;:A-Za-z0-9]+/g, ' ').replace(/\s+/g,' ').trim();;
	description = description.replace(/[^.,;:A-Za-z0-9]+/g, ' ').replace(/\s+/g,' ').trim();
	var data = {doinsert:"true",url:url,timestamp:getDate(),title:title,description:description,pageid:pageID,userid:CURRENT_USER};
	
	$.getJSON('proxies/bookmark_sql_proxy.php', data, function(obj) {
		getBookmarks();
		//location.reload();
		
	});
	//callback to update results
}

function deleteBookmark(pageID) {
	var data = {userid:CURRENT_USER,pageid:pageID};
	$.getJSON('proxies/delete_bookmark_sql_proxy.php', data, function(obj) {
		//alert(obj);
		getBookmarks();
		location.reload();
	});
	//callback to update list
}

function getBookmarks() {
	var data = {userid:CURRENT_USER};
	$.getJSON('proxies/getbookmarks_sql_proxy.php', data, function(obj) {	
		if(obj !== undefined) {
			showBookmarks(obj);
		}
	});
}

function getIsBookmarkProperty(item,callback) {
	var pageID = item.ID;
	var data = {userid:CURRENT_USER, pageid:pageID};
	$.getJSON('proxies/check_bookmark_sql_proxy.php', data, function(obj) {	
		if(obj !== undefined) {
			if(obj[0]=="t") {
				//this bookmarked
				console.log(pageID,"=true");
				item.isBookmark = "true";
				callback(item);
			} else {
				console.log(pageID,"=false");
				item.isBookmark = "false";
				callback(item);
			}
		}
	});
}



function generateLoggingURL(goToUrl, userID, eventName, eventValue, query, facet, pageNumber) {
	if(goToUrl!='') {
		return 'search.php?gotourl='+goToUrl+'&userid='+userID+'&eventname='+eventName+'&eventvalue='+eventValue;
	} else {
		if(facet==undefined) {
			facet = '';
		}
		if(pageNumber==undefined) {
			pageNumber=1;
		}
		return 'search.php?query='+query+'&userid='+userID+'&eventname='+eventName+'&eventvalue='+eventValue+'&facet='+facet+'&page='+pageNumber;
	}
}

function addCategory(category) {
	//add category to saved results
	var data = {doinsert:"true",url:'',timestamp:getDate(),title:category,description:'category',pageid:category,userid:CURRENT_USER};
	
	$.getJSON('proxies/bookmark_sql_proxy.php', data, function(obj) {
		getBookmarks();
	});
	
}

function changeBookmarkOrder(pageID,newPosition) {
	var data = {pageid:pageID,userid:CURRENT_USER,newposition:newPosition};
	$.getJSON('proxies/change_bookmark_order_sql_proxy.php', data, function(obj) {
		getCategories();	
		if(obj !== undefined) {
			//no returned data
		}
	});
}

function getCategories() {
	var data = {userid:CURRENT_USER};
	$.getJSON('proxies/get_categories_sql_proxy.php', data, function(obj) {	
		if(obj !== undefined) {
			//showCategories(obj);
			//getBookmarks();
		}
	});
}

function showCategories(obj) {
	for(var i=0;i<obj.length;i++) {
		var category = obj[i][0];
		$('#saved-results').append(category +" <a href='' class='delete-category-"+i+"'>remove</a><br/>");
		$("#saved-results a.delete-category-"+i).bind('click', {category:category}, function(event) {
			var data = event.data;
			deleteCategory(data.category);
		});	
	}
}

function deleteCategory(category) {
	deleteBookmark(category);
}

function showBookmarks(obj) {
	$('#saved-results').empty();
	$('#saved-results').append("<h3>Saved results:</h3>");
	$('#saved-results').append("<ul id='sortable'>");

	//add filter here.
	for(var i=0;i<obj.length;i++) {
		var title = obj[i][5];
		var descr = obj[i][6];
		if(descr=="category") {
			$('#saved-results').append('<b><li id="'+obj[i][1]+'" class="category"><span id="'+title+'" class="ui-state-default">'+title+'</span></b> <img class="delete-category-'+i+'" src="images/delete.png" align="right" width="12px" style="cursor:pointer;"> </li></b>');
			$("img.delete-category-"+i).bind('click', {bookm:obj[i]}, function(event) {
				var data = event.data;
				createLogEntry("deleteCategory", CURRENT_USER, data.bookm[1]);
				deleteCategory(data.bookm[1]);
			});
		} else {
			var shortenedTitle = "";
			if(title.length>33) {
				shortenedTitle = title.substring(0,31) + "..";
			} else {
				shortenedTitle = title;
			}
			
			var urlForFavIco = "http://favicon.yandex.net/favicon/"+obj[i][4].split("/")[2];
			if(!imageExists(urlForFavIco)) {
				urlForFavIco = "images/page.png";
			}
			$('#saved-results').append('<li class="bookmark" url="'+obj[i][4]+'" id="'+obj[i][1]+'"><img src="'+urlForFavIco+'" width="10"><img class="delete-bookmark-'+i+'" style="cursor:pointer;" src="images/delete.png" width="12px" align="right" /> <a id="'+obj[i][1]+'" class="ui-state-default" href="'+generateLoggingURL(obj[i][4],CURRENT_USER,'clickBookmark',obj[i][4])+'">'+shortenedTitle+'</a></li>');
				
			$("img.delete-bookmark-"+i).bind('click', {bookm:obj[i]}, function(event) {
				var data = event.data;
				createLogEntry("deleteBookmark", CURRENT_USER, data.bookm[4]);
				deleteBookmark(data.bookm[1]);
				//make callback?
			});
		}
	}
	
	if(obj.length==0) {
		$('#saved-results').append('<span class="tips"><i>use "save result" to save pages</i></span>');
	} else {
		var addCategoryLink = "<li class='addCategory'><i><a href='cursor:pointer;' class='add-category'>+add category</a></i></li>";
	$('#saved-results').append(addCategoryLink);
	//print category input
		$("#saved-results a.add-category").bind('click', {}, function(event) {
		event.preventDefault();
		$('#saved-results a.add-category').replaceWith("<li class='category add-category-span ui-state-default'><input id='cat' name='cat' type='text' size='28' value=''/> <a href='' class='submit-category'> <b>add</b></a><i> &nbsp;<a href='' class='cancel-category'>cancel</a></span>");
			$("#saved-results a.submit-category").bind('click', {}, function(event) {
				event.preventDefault();
				var addedCat = document.getElementById('cat').value;
				$('#saved-results li.add-category-span').replaceWith(addedCat);
				addCategory(addedCat);
				createLogEntry("addCategory", CURRENT_USER, addedCat);
			});
			$("#saved-results a.cancel-category").bind('click', {}, function(event) {
			//add category to sql
				$('#saved-results a.add-category-span').replaceWith(addCategoryLink);
			});
	});
	}
	
	$('#saved-results').append('</ul>');
}

function imageExists(url) {
   var img = new Image();
   img.src = url;
   return img.height >= 10;
}

function updateBookmarkPosition(newPosition,pageID) {
	console.log(newPosition+" "+pageID);
	var data = {pageid:pageID,userid:CURRENT_USER,newposition:newPosition};
	$.getJSON('proxies/change_bookmark_order_sql_proxy.php', data, function(obj) {
		if(obj !== undefined) {
			//no returned data
		}
	});
}


$( "list" ).on( "click", "a", function( event ) {
	// Attach a delegated event handler
    event.preventDefault();
    alert( $( this ).text() );
});