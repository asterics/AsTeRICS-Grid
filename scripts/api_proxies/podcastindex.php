<?php
// Required values
$apiKey = "<API_KEY>";
$apiSecret = "<API_SECRET>";
$apiHeaderTime = time();
$hash = sha1($apiKey . $apiSecret . $apiHeaderTime);

$allowed_origins = [
    'http://localhost:9095',
    'https://gridbeta.asterics-foundation.org',
    'https://grid.asterics.eu'
];


// Whitelisted API endpoints
// use semicolon instead of slash in parameter, e.g. "search;byterm"
$allowedEndpoints = [
    'search/byterm',
    'podcasts/byguid',
    'episodes/bypodcastguid',
    'episodes/byguid'
];

// Get and validate endpoints
$rawEndpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : '';
$endpoint = str_replace(';', '/', $rawEndpoint);
if (!in_array($endpoint, $allowedEndpoints)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(["error" => "Invalid or unsupported endpoint."]);
    exit;
}

// Remove endpoint from query string
$queryParams = $_GET;
unset($queryParams['endpoint']);

// Build full URL
$queryString = http_build_query($queryParams);
$url = "https://api.podcastindex.org/api/1.0/" . $endpoint;
if (!empty($queryString)) {
    $url .= "?" . $queryString;
}

// Set headers
$headers = [
    "User-Agent: AsTeRICS AAC",
    "X-Auth-Key: $apiKey",
    "X-Auth-Date: $apiHeaderTime",
    "Authorization: $hash"
];

// CORS check
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (empty($origin) || in_array($origin, $allowed_origins)) {
    // Allow CORS for empty origin (same origin request) or if origin in whitelist
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET');
} else {
    // If the origin is not allowed, block the request
    header('HTTP/1.1 403 Forbidden');
    echo "CORS policy: Access denied.";
    exit();
}

// Make the request
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
$response = curl_exec($ch);
curl_close($ch);

// Output
header('Content-Type: application/json');
echo $response;
?>