<?php

//Get the current task done by the user
$userid = $_GET['userid'];

//include 'dbconfig.php';

//$con = mysql_connect($dbhost,$dbuser,$dbpass);
$con = mysql_connect("localhost","root","");
mysql_select_db("searchassist") or die(mysql_error());

$result = mysql_query("SELECT DISTINCT value FROM events WHERE event='setCurrentTask' AND userid='".$userid."' ORDER BY id DESC LIMIT 1;");

$data = array();

while ( $row = mysql_fetch_row($result) )
{
  $data[] = $row;
}

echo json_encode( $data );

?>