<?php

// Delete a bookmark category

$category = $_GET['category'];
$userid = $_GET['userid'];

//include 'dbconfig.php';
//$con = mysql_connect($dbhost,$dbuser,$dbpass);

$con = mysql_connect("localhost","root","");
mysql_select_db("searchassist") or die(mysql_error());

$result = mysql_query("DELETE FROM categories WHERE category='".$category."' AND  userid='".$userid."';");

?>