<?php
// Get query (or other log) history - this can be adapted by customizing the value for 'event'. 

$userid = $_GET['userid'];

//include 'dbconfig.php';

//$con = mysql_connect($dbhost,$dbuser,$dbpass);
$con = mysql_connect("localhost","root","");
mysql_select_db("searchassist") or die(mysql_error());

$result = mysql_query("SELECT DISTINCT event,value FROM events WHERE event='doQuery' AND userid='".$userid."' ORDER BY id DESC ;");

$data = array();

while ( $row = mysql_fetch_row($result) )
{
  $data[] = $row;
}

echo json_encode( $data );

?>