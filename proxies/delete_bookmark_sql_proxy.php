<?php

// Delete a bookmark
$pageid = $_GET['pageid'];
$userid = $_GET['userid'];

//include 'dbconfig.php';

//$con = mysql_connect($dbhost,$dbuser,$dbpass);
$con = mysql_connect("localhost","root","");
mysql_select_db("searchassist") or die(mysql_error());

$result = mysql_query("DELETE FROM bookmarks WHERE pageid='".$pageid."' AND userid='".$userid."';");

?>