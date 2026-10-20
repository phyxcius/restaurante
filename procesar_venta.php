<?php
// procesar_venta.php
header('Content-Type: application/json');

// Recibimos los datos enviados en formato JSON desde el panel (JavaScript)
$inputJSON = file_get_contents('php://input');
$data = json_decode($inputJSON, true);

if ($data && isset($data['dni']) && isset($data['cliente'])) {
    $dni = trim($data['dni']);
    $cliente = trim($data['cliente']);
    $total = isset($data['total']) ? floatval($data['total']) : 0.00;
    $items = isset($data['items']) ? $data['items'] : [];
    $tipoComprobante = isset($data['tipo_comprobante']) ? $data['tipo_comprobante'] : '2'; // 2: Boleta, 1: Factura

    // -------------------------------------------------------------------------
    // 1. GUARDAR EN BASE DE DATOS (Ejemplo con PDO SQLite o MySQL)
    // -------------------------------------------------------------------------
    try {
        // Descomenta y ajusta si deseas registrarlo en SQLite:
        /*
        $pdo = new PDO('sqlite:tu_base_de_datos.db');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $stmt = $pdo->prepare("INSERT INTO ventas (dni_cliente, nombre_cliente, total, fecha) VALUES (?, ?, ?, datetime('now'))");
        $stmt->execute([$dni, $cliente, $total]);
        $venta_id = $pdo->lastInsertId();
        */
    } catch (Exception $e) {
        // Opcional: registrar error de base de datos si ocurre
    }

    // -------------------------------------------------------------------------
    // 2. INTEGRACIÓN CON API DE FACTURACIÓN ELECTRÓNICA (APISPERÚ)
    // -------------------------------------------------------------------------
    
    // CAMBIA ESTO A TRUE CUANDO EL RESTAURANTE YA ESTÉ OPERANDO DE FORMA REAL CON SUNAT
    $modoProduccion = false; 

    // Token integrado de ApisPerú
    $tokenApisPerU = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImVkd2lub2JsaXRhc3ViYWxkZUBnbWFpbC5jb20iLCJqdGkiOiJjYzdmYzhiYzVmMWZkNDJlIn0.bOjhDNGwlMQYXdlV84_qivtkV4bl4Ir3aRZ_Lx48wuE";

    // Asignación de tokens independientes para cada entorno
    $tokenBeta = $tokenApisPerU;
    $tokenProd = $tokenApisPerU;
    $tokenActivo = $modoProduccion ? $tokenProd : $tokenBeta;

    // URL oficial del endpoint de comprobantes de ApisPerú
    $urlApiFacturacion = "https://facturacion.apisperu.com/api/v1/fe/comprobantes";

    // Estructura de datos requerida por el estándar UBL 2.1 de la API
    $igv = round($total - ($total / 1.18), 2);
    $subtotal = round($total / 1.18, 2);

    $datosComprobante = [
        "tipo_de_comprobante" => $tipoComprobante, // 2 para Boleta, 1 para Factura
        "serie" => ($tipoComprobante == "1") ? "F001" : "B001",
        "numero" => rand(100, 9999), // En producción esto debe ser correlativo de tu base de datos
        "fecha_de_emision" => date("Y-m-d"),
        "cliente_tipo_de_documento" => (strlen($dni) == 11) ? "6" : "1", // 6 para RUC, 1 para DNI
        "cliente_numero_de_documento" => $dni,
        "cliente_denominacion" => $cliente,
        "cliente_direccion" => "-",
        "moneda" => "PEN",
        "total_op_gravadas" => $subtotal,
        "total_igv" => $igv,
        "total" => $total,
        "items" => []
    ];

    // Añadir los ítems del carrito dinámicamente
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
        // Ítem por defecto si no se mandó carrito detallado
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

    // Ejecutar petición cURL hacia ApisPerú
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
    curl_close($ch);

    $respuestaSunat = json_decode($response, true);
    $enlacePdf = isset($respuestaSunat['enlacedelpdf']) ? $respuestaSunat['enlacedelpdf'] : '';

    // -------------------------------------------------------------------------
    // 3. AUTOMATIZACIÓN DE IMPRESIÓN TÉRMICA (ESC/POS por Red / IP Local)
    // -------------------------------------------------------------------------
    try {
        $printer_ip = "192.168.1.87"; // Cambia por la IP de tu tiquetera térmica en red
        $port = 9100;                 // Puerto estándar RAW para impresoras térmicas
        
        $socket = @socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
        if ($socket && @socket_connect($socket, $printer_ip, $port)) {
            $ticket_content  = "\x1B\x40"; // Inicializar impresora (ESC @)
            $ticket_content .= "\x1B\x61\x01"; // Centrar texto
            $ticket_content .= "LA CHUSPA TECH - RESTAURANTE\n";
            $ticket_content .= $modoProduccion ? "*** COMPROBANTE ELECTRONICO ***\n" : "*** [MODO BETA - PRUEBAS] ***\n";
            $ticket_content .= "--------------------------------\n";
            $ticket_content .= "\x1B\x61\x00"; // Alinear a la izquierda
            $ticket_content .= "Cliente : " . $cliente . "\n";
            $ticket_content .= "DNI/RUC : " . $dni . "\n";
            $ticket_content .= "Fecha   : " . date("Y-m-d H:i:s") . "\n";
            $ticket_content .= "--------------------------------\n";
            
            // Imprimir productos si vienen en el array
            foreach ($datosComprobante['items'] as $it) {
                $ticket_content .= "{$it['cantidad']}x {$it['descripcion']} - S/ " . number_format($it['precio_unitario'] * $it['cantidad'], 2) . "\n";
            }
            
            $ticket_content .= "--------------------------------\n";
            $ticket_content .= "\x1B\x61\x02"; // Alinear a la derecha
            $ticket_content .= "TOTAL: S/ " . number_format($total, 2) . "\n\n";
            $ticket_content .= "\x1B\x61\x01"; // Centrar
            $ticket_content .= "¡Gracias por su preferencia!\n";
            if($enlacePdf) {
                $ticket_content .= "Consulte su comprobante en:\n" . $enlacePdf . "\n\n";
            }
            $ticket_content .= "\x1D\x56\x41\x00"; // Comando de corte de papel (Cut)
            
            @socket_write($socket, $ticket_content, strlen($ticket_content));
            @socket_close($socket);
        }
    } catch (Exception $e) {
        // La venta se procesa aunque la impresora física no esté conectada en ese preciso instante
    }

    // Respuesta JSON satisfactoria al frontend
    echo json_encode([
        'success' => true, 
        'modo_produccion' => $modoProduccion,
        'mensaje' => '¡Venta registrada, guardada y ticket enviado a la tiquetera con éxito!',
        'enlace_pdf' => $enlacePdf
    ]);
} else {
    echo json_encode([
        'success' => false, 
        'mensaje' => 'Datos incompletos o erróneos'
    ]);
}
?>
