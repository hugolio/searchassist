<?php

//read (select) or write (insert) bookmarks
$doinsert = $_GET['doinsert'];
$url = $_GET['url'];
$timestamp = $_GET['timestamp'];
$title = $_GET['title'];
$description = $_GET['description'];
$pageid = $_GET['pageid'];
$userid = $_GET['userid'];

//include 'dbconfig.php';
//$con = mysql_connect($dbhost,$dbuser,$dbpass);

$con = mysql_connect("localhost","root","");
mysql_select_db("searchassist") or die(mysql_error());

if($doinsert == "true") {
	$position = 0;
	$result = mysql_query("SELECT MAX(position) FROM bookmarks WHERE userid='".$userid."';");
	$data = array();
	$row = mysql_fetch_row($result);
	$position = $row[0] + 1;
	$result = mysql_query("INSERT INTO bookmarks (pageid,userid,timestamp,url,title,description,position) VALUES ('".$pageid."','".$userid."','".$timestamp."','".$url."','".$title."','".$description."','".$position."');");
	
} else if ($doinsert == "false") {
	//only read contents
	$result = mysql_query("SELECT * FROM bookmarks;");
	$data = array();
	while ( $row = mysql_fetch_row($result) )
	{
  		$data[] = $row;
	}
	echo json_encode( $data );
} else {
	//wrong value; do nothing
}

?>