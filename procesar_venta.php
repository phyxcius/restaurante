<?php
// procesar_venta.php
header('Content-Type: application/json');

$inputJSON = file_get_contents('php://input');
$data = json_decode($inputJSON, true);

if ($data && isset($data['dni']) && isset($data['cliente'])) {
    $dni = trim($data['dni']);
    $cliente = trim($data['cliente']);
    $total = isset($data['total']) ? floatval($data['total']) : 0.00;
    $items = isset($data['items']) ? $data['items'] : [];
    $tipoComprobante = isset($data['tipo_comprobante']) ? $data['tipo_comprobante'] : '2'; // 2: Boleta, 1: Factura

    $modoProduccion = false; 

    // Tu token activo de ApisPerú integrado para facturación electrónica
    $tokenApisPerU = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImVkd2lub2JsaXRhc3ViYWxkZUBnbWFpbC5jb20iLCJqdGkiOiJjYzdmYzhiYzVmMWZkNDJlIn0.bOjhDNGwlMQYXdlV84_qivtkV4bl4Ir3aRZ_Lx48wuE"; 
    $tokenActivo = $tokenApisPerU;

    $urlApiFacturacion = "https://facturacion.apisperu.com/api/v1/fe/comprobantes";

    $igv = round($total - ($total / 1.18), 2);
    $subtotal = round($total / 1.18, 2);

    $datosComprobante = [
        "tipo_de_comprobante" => $tipoComprobante,
        "serie" => ($tipoComprobante == "1") ? "F001" : "B001",
        "numero" => time(), // Correlativo dinámico basado en tiempo para evitar duplicados en pruebas
        "fecha_de_emision" => date("Y-m-d"),
        "cliente_tipo_de_documento" => (strlen($dni) == 11) ? "6" : "1",
        "cliente_numero_de_documento" => $dni,
        "cliente_denominacion" => $cliente,
        "cliente_direccion" => "-",
        "moneda" => "PEN",
        "total_op_gravadas" => $subtotal,
        "total_igv" => $igv,
        "total" => $total,
        "items" => []
    ];

    if (!empty($items)) {
        foreach ($items as $item) {
            $nombreItem = isset($item['nombre']) ? $item['nombre'] : 'Consumo Restaurante';
            $cantItem = isset($item['cantidad']) ? intval($item['cantidad']) : 1;
            $precioUnit = isset($item['precio']) ? floatval($item['precio']) : $total;
            $valorUnit = round($precioUnit / 1.18, 2);
            $igvItem = round($precioUnit - $valorUnit, 2);

            $datosComprobante['items'][] = [
                "unidad_de_medida" => "NIU",
                "cantidad" => $cantItem,
                "codigo" => "01",
                "descripcion" => $nombreItem,
                "monto_unitario" => $valorUnit,
                "precio_unitario" => $precioUnit,
                "igv" => $igvItem,
                "tipo_de_igv" => 1
            ];
        }
    } else {
        $datosComprobante['items'][] = [
            "unidad_de_medida" => "NIU",
            "cantidad" => 1,
            "codigo" => "01",
            "descripcion" => "Consumo General en Salón",
            "monto_unitario" => $subtotal,
            "precio_unitario" => $total,
            "igv" => $igv,
            "tipo_de_igv" => 1
        ];
    }

    $ch = curl_init($urlApiFacturacion);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($datosComprobante));
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer " . $tokenActivo,
        "Content-Type: application/json",
        "Accept: application/json"
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        echo json_encode([
            'success' => false,
            'mensaje' => 'Error de red cURL: ' . $curlError
        ]);
        exit;
    }

    $respuestaSunat = json_decode($response, true);

    if ($httpCode >= 200 && $httpCode < 300) {
        $enlacePdf = isset($respuestaSunat['enlacedelpdf']) ? $respuestaSunat['enlacedelpdf'] : '';
        echo json_encode([
            'success' => true,
            'mensaje' => '¡Comprobante emitido correctamente en ApisPerú!',
            'enlace_pdf' => $enlacePdf
        ]);
    } else {
        $mensajeError = isset($respuestaSunat['message']) ? $respuestaSunat['message'] : json_encode($respuestaSunat);
        echo json_encode([
            'success' => false,
            'mensaje' => 'Rechazo de ApisPerú/SUNAT (HTTP ' . $httpCode . '): ' . $mensajeError
        ]);
    }
} else {
    echo json_encode([
        'success' => false, 
        'mensaje' => 'Datos incompletos para procesar la venta.'
    ]);
}
?>
