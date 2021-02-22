<?php
$username = 'supersat';
$password = null;
$database = 'webcps';

$mysqli = new mysqli("localhost", $username, $password, $database);
if ($mysqli->connect_errno) {
    die("Unable to connect to DB: " . $mysqli->connect_error);
}

$_GET['since'] |= 0;

$stmt = $mysqli->prepare("SELECT id,callsign,fname,surname,city,state,country,remarks " .
    "FROM radioid_users WHERE last_updated > FROM_UNIXTIME(?)");
$stmt->bind_param("i", $_GET['since']);
$stmt->execute();
$res = $stmt->get_result();
while ($row = $res->fetch_row()) {
    print implode(",", $row);
    print "\n";
}
