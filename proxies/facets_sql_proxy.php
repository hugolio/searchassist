<?php

// Get the requested facet from the dmoz data. Default to ''.
$query = ($_GET['q']) ? $_GET['q'] : '';

//include 'dbconfig.php';

//$con = mysql_connect($dbhost,$dbuser,$dbpass);
$con = mysql_connect("localhost","root","");
mysql_select_db("searchassist") or die(mysql_error());

$result = mysql_query("SELECT category FROM `facets` WHERE url='" . $query . "' LIMIT 1");

$row = mysql_fetch_row($result);
echo json_encode( $row );

?>