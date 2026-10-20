document.getElementById('btnConfirmarVenta').addEventListener('click', function() {
    let dni = document.getElementById('dni_cliente').value;
    let cliente = document.getElementById('nombre_cliente').value;
    
    if(!cliente) {
        alert('Debe registrar o buscar un cliente antes de procesar la venta.');
        return;
    }

    // Datos de la orden (ejemplo)
    let datosVenta = {
        dni: dni,
        cliente: cliente,
        total: 45.00, // Monto de ejemplo
        items: [...] // Productos del carrito
    };

    // Enviar al servidor para guardar y disparar impresión
    fetch('procesar_venta.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosVenta)
    })
    .then(response => response.json())
    .then(data => {
        if(data.success) {
            alert('¡Venta registrada y ticket enviado a impresión con éxito!');
            // Opcional: Limpiar formulario para la siguiente mesa
            location.reload(); 
        } else {
            alert('Error al procesar la venta.');
        }
    });
});
