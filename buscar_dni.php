<?php
// buscar_dni.php
header('Content-Type: application/json');

if (isset($_GET['dni'])) {
    $dni = trim($_GET['dni']);
    
    // Tu token activo de ApisPerú
    $token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImVkd2lub2JsaXRhc3ViYWxkZUBnbWFpbC5jb20iLCJqdGkiOiJjYzdmYzhiYzVmMWZkNDJlIn0.bOjhDNGwlMQYXdlV84_qivtkV4bl4Ir3aRZ_Lx48wuE"; 
    
    $url = "https://api.apis.net.pe/v2/reniec/dni?numero=" . $dni;
    
    $ch = curl_init();
    curl_setopt_array($ch, array(
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_HTTPHEADER => array(
            "Authorization: Bearer " . $token,
            "Referer: https://apis.net.pe",
            "Accept: application/json"
        ),
    ));
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if (curl_errno($ch)) {
        echo json_encode([
            'success' => false,
            'message' => 'Error de conexión cURL: ' . curl_error($ch)
        ]);
        curl_close($ch);
        exit;
    }
    
    curl_close($ch);
    $datos = json_decode($response, true);
    
    if ($httpCode === 200 && isset($datos['nombres']) && !empty($datos['nombres'])) {
        $nombresCompletos = trim($datos['nombres'] . ' ' . $datos['apellidoPaterno'] . ' ' . $datos['apellidoMaterno']);
        echo json_encode([
            'success' => true,
            'nombres_completos' => $nombresCompletos
        ]);
    } else {
        $mensajeError = isset($datos['message']) ? $datos['message'] : 'No se encontraron datos para el DNI ingresado.';
        echo json_encode([
            'success' => false,
            'message' => $mensajeError
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Parámetro DNI no proporcionado.'
    ]);
}
?>
