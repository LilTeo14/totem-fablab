#!/bin/bash

API_URL="http://localhost:8000/api/status"

while true; do
    clear
    echo "==================================="
    echo "   GESTIÓN DE ESTADO FABLAB"
    echo "==================================="
    echo "1. Modo AUTOMÁTICO (Según horario)"
    echo "2. Forzar CERRADO"
    echo "3. Forzar ABIERTO"
    echo "4. Salir"
    echo "==================================="
    read -p "Seleccione una opción: " option

    case $option in
        1)
            echo "Estableciendo modo AUTOMÁTICO..."
            curl -X POST $API_URL -H "Content-Type: application/json" -d '{"mode": "AUTO"}'
            ;;
        2)
            echo "Forzando estado CERRADO..."
            curl -X POST $API_URL -H "Content-Type: application/json" -d '{"mode": "CLOSED"}'
            ;;
        3)
            echo "Forzando estado ABIERTO..."
            curl -X POST $API_URL -H "Content-Type: application/json" -d '{"mode": "OPEN"}'
            ;;
        4)
            echo "Saliendo..."
            exit 0
            ;;
        *)
            echo "Opción inválida."
            ;;
    esac

    echo ""
    read -p "Presione Enter para continuar..."
done
