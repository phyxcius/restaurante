<?php
// buscar_dni.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// 1. TOKEN PARA DNI (RENIEC)
$tokenDni = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImVkd2lub2JsaXRhc3ViYWxkZUBnbWFpbC5jb20iLCJqdGkiOiIxNzExZGRjNTc5M2ZhYjQ0In0.h1PcqQHzHBK6abr7ZGVkMeSTOSN49BWOWHzB7wpIDw8";

// 2. TOKEN PARA FACTURACIÓN / RUC (SUNAT)
$tokenRuc = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJ1c2VybmFtZSI6ImVkd2lub2JsaXRhc3ViYWxkZUBnbWFpbC5jb20iLCJjb21wYW55IjoiMTA0MjQyMzU0OT","ZZZ..."; // (Token completo proporcionado)

// BÚSQUEDA POR DNI
if (isset($_GET['dni'])) {
    $dni = trim($_GET['dni']);
    if (strlen($dni) !== 8 || !is_numeric($dni)) {
        echo json_encode(['success' => false, 'message' => 'DNI inválido (debe tener 8 dígitos).']);
        exit;
    }
    
    $url = "https://api.apis.net.pe/v2/reniec/dni?numero=" . $dni . "&token=" . $tokenDni;
    
    $ch = curl_init();
    curl_setopt_array($ch, array(
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_TIMEOUT => 5,
        CURLOPT_HTTPHEADER => array("Accept: application/json"),
    ));
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && $response) {
        $datos = json_decode($response, true);
        if (isset($datos['nombres']) && !empty($datos['nombres'])) {
            $nombresCompletos = trim($datos['nombres'] . ' ' . ($datos['apellidoPaterno'] ?? '') . ' ' . ($datos['apellidoMaterno'] ?? ''));
            echo json_encode(['success' => true, 'nombres_completos' => $nombresCompletos]);
            exit;
        }
    }
    echo json_encode(['success' => false, 'message' => 'No se encontraron datos para el DNI ingresado.']);
    exit;
}

// BÚSQUEDA POR RUC (SUNAT)
if (isset($_GET['ruc'])) {
    $ruc = trim($_GET['ruc']);
    if (strlen($ruc) !== 11 || !is_numeric($ruc)) {
        echo json_encode(['success' => false, 'message' => 'RUC inválido (debe tener 11 dígitos).']);
        exit;
    }
    
    // Para RUC usamos el token de facturación mediante cabecera Bearer
    $url = "https://api.apis.net.pe/v2/sunat/ruc?numero=" . $ruc;
    
    $ch = curl_init();
    curl_setopt_array($ch, array(
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_TIMEOUT => 6,
        CURLOPT_HTTPHEADER => array(
            "Authorization: Bearer " . $tokenRuc,
            "Accept: application/json"
        ),
    ));
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && $response) {
        $datos = json_decode($response, true);
        if (isset($datos['razonSocial']) && !empty($datos['razonSocial'])) {
            echo json_encode(['success' => true, 'razon_social' => $datos['razonSocial']]);
            exit;
        }
    }
    
    echo json_encode(['success' => false, 'message' => 'No se encontraron datos para el RUC ingresado (HTTP ' . $httpCode . ').']);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Parámetro no proporcionado.']);
?>
