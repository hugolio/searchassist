<?php

//Store the order of the bookmarks after a user drags and drops a bookmark or bookmark category
//$query = ($_GET['log']) ? $_GET['log'] : '';
$pageid = $_GET['pageid'];
$newposition = $_GET['newposition'];
$userid = $_GET['userid'];

//include 'dbconfig.php';

//$con = mysql_connect($dbhost,$dbuser,$dbpass);
$con = mysql_connect("localhost","root","");
mysql_select_db("searchassist") or die(mysql_error());

mysql_query("UPDATE bookmarks SET position='". $newposition ."' WHERE pageid='".$pageid."' AND userid='".$userid."';"); 

?>