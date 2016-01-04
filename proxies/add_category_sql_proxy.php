<?php

//read (select) or write (insert) bookmarks
$timestamp = $_GET['timestamp'];
$category = $_GET['category'];
$userid = $_GET['userid'];

//include 'dbconfig.php';
//$con = mysql_connect($dbhost,$dbuser,$dbpass);

$con = mysql_connect("localhost","root","");
mysql_select_db("searchassist") or die(mysql_error());

$result = mysql_query("INSERT INTO categories (category,userid,timestamp) VALUES ('".$category."','".$userid."','".$timestamp."');");

?>