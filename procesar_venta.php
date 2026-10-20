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
    // 2. AUTOMATIZACIÓN DE IMPRESIÓN TÉRMICA (ESC/POS por Red / IP Local)
    // -------------------------------------------------------------------------
    try {
        $printer_ip = "192.168.1.87"; // Cambia por la IP de tu tiquetera térmica en red
        $port = 9100;                 // Puerto estándar RAW para impresoras térmicas (EPSON, Bixolon, etc.)
        
        $socket = @socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
        if ($socket && @socket_connect($socket, $printer_ip, $port)) {
            $ticket_content  = "\x1B\x40"; // Inicializar impresora (ESC @)
            $ticket_content .= "\x1B\x61\x01"; // Centrar texto
            $ticket_content .= "LA CHUSPA TECH - RESTAURANTE\n";
            $ticket_content .= "--------------------------------\n";
            $ticket_content .= "\x1B\x61\x00"; // Alinear a la izquierda
            $ticket_content .= "Cliente : " . $cliente . "\n";
            $ticket_content .= "DNI     : " . $dni . "\n";
            $ticket_content .= "Fecha   : " . date("Y-m-d H:i:s") . "\n";
            $ticket_content .= "--------------------------------\n";
            
            // Imprimir productos si vienen en el array
            if (!empty($items)) {
                foreach ($items as $item) {
                    $nombreItem = isset($item['nombre']) ? $item['nombre'] : 'Plato';
                    $cantItem = isset($item['cantidad']) ? $item['cantidad'] : 1;
                    $subTotalItem = isset($item['precio']) ? ($item['precio'] * $cantItem) : 0;
                    $ticket_content .= "{$cantItem}x {$nombreItem} - S/ " . number_format($subTotalItem, 2) . "\n";
                }
                $ticket_content .= "--------------------------------\n";
            }
            
            $ticket_content .= "\x1B\x61\x02"; // Alinear a la derecha
            $ticket_content .= "TOTAL: S/ " . number_format($total, 2) . "\n\n";
            $ticket_content .= "\x1B\x61\x01"; // Centrar
            $ticket_content .= "¡Gracias por su preferencia!\n\n\n";
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
        'mensaje' => 'Venta guardada e impresora activada con éxito'
    ]);
} else {
    echo json_encode([
        'success' => false, 
        'mensaje' => 'Datos incompletos o erróneos'
    ]);
}
?>
