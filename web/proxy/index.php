<?php
	header('Content-type: application/json'); 
	$method = 'https://www.idealista.com/labs/api/2/search';
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
		'&action='    . $_GET['action'] .
		'&apikey='    . getenv('IDEALISTA_API_KEY');

	if (getenv('DEBUG')) {
		error_log(sprintf("Request to idealista API: %s", $url));
	}

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_REFERER, 'http://www.freedealista.com/');
	$response = curl_exec($ch);
	curl_close($ch);

	echo $_GET['callback'] . '(' . $response . ')';
