<?php
$username = posix_getpwuid(posix_geteuid())['name'];
$password = null;
$database = 'webcps';

$mysqli = new mysqli("localhost", $username, $password, $database);
if ($mysqli->connect_errno) {
    die("Unable to connect to DB: " . $mysqli->connect_error);
}

$stmt = $mysqli->prepare("INSERT INTO radioid_users " .
    "(id, callsign, fname, surname, city, state, country, remarks) " .
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE " .
    "callsign = VALUES(callsign), " . 
    "fname = VALUES(fname), " .
    "surname = VALUES(surname), " .
    "city = VALUES(city), " .
    "state = VALUES(state), " .
    "country = VALUES(country), " .
    "remarks = VALUES(remarks)"
);

$stmt->bind_param("isssssss", $id, $callsign, $fname, $surname,
    $city, $state, $country, $remarks);

while ($line = trim(fgets(STDIN))) {
    $cols = explode(",", $line);
    if (count($cols) == 8) {
        $id = $cols[0];
        $callsign = $cols[1];
        $fname = $cols[2];
        $surname = $cols[3];
        $city = $cols[4];
        $state = $cols[5];
        $country = $cols[6];
        $remarks = $cols[7];
        $stmt->execute();
    }
}
?>
