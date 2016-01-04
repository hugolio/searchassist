<?php

/****
* PHP proxy for using the Bing Search API with AJAX
*/

$querySuggestionsDir = '../logging/query-suggestions/';
//enter your Bing Search API key below ($acctKey)
$acctKey = '';
$rootUri = 'https://api.datamarket.azure.com/Bing/Search';

// Get the query. Default to ''.
$query = ($_GET['q']) ? $_GET['q'] : '';

//get query for reading / writing query files (caching)
$queryforfilename = urlencode($query);//strtolower(str_replace(' ','-', $query));
$queryresultsfilename = $querySuggestionsDir . $queryforfilename . '.json';

if (file_exists($queryresultsfilename) && filesize($queryresultsfilename)>0) {
	echo file_get_contents($queryresultsfilename);

} else {

// Get the service operation. Default to Web.
//$serviceOp = ($_GET['sop']) ? $_GET['sop'] : 'Web';
$serviceOp = 'RelatedSearch';

// Get the market. Default to en-us.
//$market = ($_GET['market']) ? $_GET['market'] : 'en-us';
$market = 'en-gb';

// Encode the query along with the single quotation marks that must surround it.
$query = urlencode("'$query'");

// Encode the market along with the single quotation marks that must surround it.
$market = urlencode("'$market'");

// Construct the full URL for the query.
$requestUri = "$rootUri/$serviceOp?\$format=json&Query=$query&Market=$market";

// Encode the credentials and create the stream context.
$auth = base64_encode("$acctKey:$acctKey");

$data = array(
'http' => array(
'request_fulluri' => true,

// ignore_errors can help debug – remove for production. This option added in PHP 5.2.10
'ignore_errors' => true,
'header' => "Authorization: Basic $auth"),
    "ssl"=>array(
        "verify_peer"=>false,
        "verify_peer_name"=>false,
    )
);

$context = stream_context_create($data);

// Get the response from Bing.
$response = file_get_contents($requestUri, 0, $context);

$file = $queryresultsfilename;
// Write the contents back to the file
file_put_contents($file, $response);

// Send the response back to the browser.
echo $response;

}

?>