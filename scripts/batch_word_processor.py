#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
batch_word_processor.py
Herramienta de procesamiento masivo de expedientes Word (.docx) para FPF / CONMEBOL.
- Modifica la fecha a múltiples archivos Word al mismo tiempo.
- Modifica o inserta el nombre del Club en la Hoja 1, Hoja 2 y anexos.
- Cambia o normaliza el orden de Apellidos y Nombres simultáneamente.
- CONSERVA AL 100% TODOS LOS SELLOS MÉDICOS Y FIRMAS (no borra imágenes ni sellos).
"""

import os
import sys
import argparse
import zipfile
import re
import io

TEMPLATE_NAME = "PLANTILLA_OFICIAL_CON_SELLOS.docx"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE_PATH = os.path.join(BASE_DIR, "client", "public", TEMPLATE_NAME)
if not os.path.exists(TEMPLATE_PATH):
    TEMPLATE_PATH = os.path.join(BASE_DIR, "PONCE ECHEVARRIA CARLOS.docx")

def format_name(full_name, order="LAST_FIRST"):
    """
    Formatea el nombre según el orden requerido:
    - 'LAST_FIRST': "PONCE ECHEVARRIA CARLOS"
    - 'FIRST_LAST': "CARLOS PONCE ECHEVARRIA"
    """
    parts = full_name.strip().split()
    if len(parts) <= 1:
        return full_name.upper()

    # Si ya viene en formato LAST_FIRST (2 apellidos + nombres)
    if len(parts) >= 3:
        apellidos = " ".join(parts[:2])
        nombres = " ".join(parts[2:])
    else:
        apellidos = parts[0]
        nombres = parts[1]

    if order == "FIRST_LAST":
        return f"{nombres} {apellidos}".upper()
    return f"{apellidos} {nombres}".upper()

def process_word_document(input_path, output_path, raw_name, evaluation_date, club_name, order="LAST_FIRST"):
    """
    Modifica el archivo docx (que es un zip de XMLs) reemplazando textos pero
    dejando la carpeta word/media/ (donde viven los 28 sellos y firmas) 100% intacta.
    """
    parts = raw_name.strip().split()
    if len(parts) >= 3:
        apellidos = " ".join(parts[:2])
        nombres = " ".join(parts[2:])
    elif len(parts) == 2:
        apellidos = parts[0]
        nombres = parts[1]
    else:
        apellidos = raw_name.strip()
        nombres = ""

    if order == "FIRST_LAST":
        target_full_name = f"{nombres} {apellidos}".strip().upper()
        first_box = (nombres or target_full_name).upper()
        second_box = apellidos.upper()
    else:
        target_full_name = f"{apellidos} {nombres}".strip().upper()
        first_box = (apellidos or target_full_name).upper()
        second_box = nombres.upper()

    with open(input_path, "rb") as f:
        zip_bytes = f.read()

    in_zip = zipfile.ZipFile(io.BytesIO(zip_bytes))
    out_buffer = io.BytesIO()
    out_zip = zipfile.ZipFile(out_buffer, "w", zipfile.ZIP_DEFLATED)

    for item in in_zip.infolist():
        content = in_zip.read(item.filename)
        if item.filename == "word/document.xml":
            xml_str = content.decode("utf-8")

            # 1. Reemplazar nombre completo en certificados y anexos
            xml_str = xml_str.replace("PONCE ECHEVARRIA CARLOS", target_full_name)

            # 2. Casillas separadas en Ficha PCMA
            xml_str = xml_str.replace("PONCE ECHEVARRIA ", first_box + " ")
            xml_str = xml_str.replace("CARLOS", second_box if second_box else "-")

            # 3. Reemplazar Nombre del Club
            xml_str = re.sub(r'ZU[\u00D1\xc3\x91N]IGA', club_name.upper(), xml_str, flags=re.IGNORECASE)

            # 4. Reemplazar fecha masiva en cascada
            xml_str = xml_str.replace("22-01-2026", evaluation_date)
            xml_str = xml_str.replace("____-____-2026", evaluation_date)
            xml_str = xml_str.replace("06-05-2026", evaluation_date)

            content = xml_str.encode("utf-8")

        # Escribir el archivo en el zip de salida
        out_zip.writestr(item, content)

    out_zip.close()
    with open(output_path, "wb") as f:
        f.write(out_buffer.getvalue())

    print(f"[OK] Generado: {os.path.basename(output_path)} con sellos preservados.")

def main():
    parser = argparse.ArgumentParser(description="Procesador masivo de Words FPF con sellos protegidos.")
    parser.add_argument("--date", default="22-01-2026", help="Fecha unificada de evaluación (ej: 22-01-2026)")
    parser.add_argument("--club", default="Club FPF / Liga Formativa", help="Nombre del Club")
    parser.add_argument("--order", choices=["LAST_FIRST", "FIRST_LAST"], default="LAST_FIRST", help="Orden de nombres")
    parser.add_argument("--indir", help="Carpeta de archivos de entrada (extrae automáticamente los nombres)")
    parser.add_argument("--names", nargs="+", help="Nombres de los jugadores a procesar")
    parser.add_argument("--outdir", default="output_words", help="Directorio de salida")

    args = parser.parse_args()

    os.makedirs(args.outdir, exist_ok=True)

    names_to_process = []
    if args.names:
        names_to_process = args.names
    elif args.indir and os.path.exists(args.indir):
        for f in os.listdir(args.indir):
            if f.lower().endswith(('.pdf', '.png', '.jpg', '.jpeg')):
                raw = os.path.splitext(f)[0]
                clean = re.sub(r'^(ECG|EKG|INFORME|RX|LAB)[\s_-]*', '', raw, flags=re.IGNORECASE).strip()
                if clean and clean not in names_to_process:
                    names_to_process.append(clean)
    else:
        print("[INFO] No se pasaron nombres directos ni carpeta. Modo demostración.")
        names_to_process = ["PONCE ECHEVARRIA CARLOS", "TALEXSIO GUZMAN ADDU ELIAS"]

    print(f"==================================================")
    print(f" PROCESADOR MASIVO DE WORDS FPF - FAMIHEART")
    print(f"==================================================")
    print(f"Fecha unificada: {args.date}")
    print(f"Club:            {args.club}")
    print(f"Orden nombres:   {args.order}")
    print(f"Sellos médicos:  100% Protegidos (Cardiólogo, Radiólogo, Tecnólogo)")
    print(f"Total a generar: {len(names_to_process)}")
    print(f"--------------------------------------------------")

    for raw_name in names_to_process:
        formatted = format_name(raw_name, args.order)
        out_filename = f"{formatted}.docx"
        out_path = os.path.join(args.outdir, out_filename)
        process_word_document(TEMPLATE_PATH, out_path, raw_name, args.date, args.club, args.order)

    print(f"--------------------------------------------------")
    print(f"[EXITO] Procesamiento completado. Archivos en: {args.outdir}")

if __name__ == "__main__":
    main()
