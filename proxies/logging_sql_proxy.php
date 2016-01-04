<?php

// Insert event from searchassist interface into events history DB
$eventname = $_GET['eventname'];
$timestamp = $_GET['timestamp'];
$userid = $_GET['userid'];
$eventvalue = $_GET['eventvalue'];

//include 'dbconfig.php';

//$con = mysql_connect($dbhost,$dbuser,$dbpass);
$con = mysql_connect("localhost","root","");
mysql_select_db("searchassist") or die(mysql_error());

$result = mysql_query("INSERT INTO events (event,timestamp,userid,value) VALUES ('".$eventname."','".$timestamp."','".$userid."','".$eventvalue."');");

?>