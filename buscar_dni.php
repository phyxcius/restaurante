<?php
// buscar_dni.php
header('Content-Type: application/json');

if (isset($_GET['dni'])) {
    $dni = $_GET['dni'];
    
    // AQUÍ INTEGRAS TU TOKEN Y CONEXIÓN A LA API DE RENIEC (ej. APISPERU, Nubefact, etc.)
    $token = "TU_TOKEN_API_AQUI"; 
    
    $url = "https://api.apis.net.pe/v2/reniec/dni?numero=" . $dni; // Ejemplo de proveedor de API en Perú
    
    $curl = curl_init();
    curl_setopt_array($curl, array(
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_HTTPHEADER => array(
            "Authorization: Bearer " . $token,
            "Referer: httpsapis.net.pe"
        ),
    ));
    
    $response = curl_exec($curl);
    curl_close($curl);
    
    $datos = json_decode($response, true);
    
    if (isset($datos['nombres'])) {
        $nombresCompletos = $datos['nombres'] . ' ' . $datos['apellidoPaterno'] . ' ' . $datos['apellidoMaterno'];
        echo json_encode([
            'success' => true,
            'nombres_completos' => $nombresCompletos
        ]);
    } else {
        echo json_encode(['success' => false]);
    }
}
?>
