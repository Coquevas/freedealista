<?php
	header('Content-type: application/json'); 
	$method = 'http://idealista-prod.apigee.net/public/2/search';
	$url = $method .
		'?center='    . $_GET['center'] .
		'&distance='  . $_GET['distance'] .
		'&minPrice='  . $_GET['minPrice'] .
		'&maxPrice='  . $_GET['maxPrice'] .
		'&operation=' . $_GET['operation'] .
		'&minSize='   . $_GET['minSize'] .
		'&maxSize='   . $_GET['maxSize'] .
		'&minRooms='  . $_GET['minRooms'] .
		'&since='     . $_GET['since'] .
		'&pics='      . $_GET['pics'] .
		'&numPage='   . $_GET['numPage'] .
		'&maxItems=50' .
		'&country=es' .
		'&action='    . $_GET['action'] .
		'&apikey='    . getenv('IDEALISTA_API_KEY');

	debugLog(sprintf("Request to idealista API: %s", $url));

	$ch = curl_init();
	
	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
	curl_setopt($ch, CURLOPT_MAXREDIRS, 10);
	
	$response = curl_exec($ch);
	
	if ($response === false) {
		debugLog(sprintf("Request to idealista API failed: %s", scurl_error($ch)));
	} 
	
	curl_close($ch); 

	echo $_GET['callback'] . '(' . $response . ')';

	function debugLog($message) {
		if (getenv('DEBUG')) {
			error_log($message);
		}
	}