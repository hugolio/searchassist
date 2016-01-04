<?
//log events in text file
$time = $_POST["timestamp"];
$url = $_POST["url"];
$message = $_POST["message"];
$micro = sprintf("%06d",($time - floor($t)));
$microsubstr = substr($micro, -3);
$timeStringFile = date("Y-m-d_H");
$myFile = '../logging/log4javascript/'.$timeStringFile.'_systemLog.txt';
$fh = fopen($myFile, 'a') or die("can't open file");
fwrite($fh,$message."\n");
fclose($fh);
?>