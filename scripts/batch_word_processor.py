#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
batch_word_processor.py
Herramienta de procesamiento masivo de expedientes Word (.docx) de 18 páginas para FPF / CONMEBOL.
- Utiliza la plantilla oficial limpia parametrizada (PLANTILLA_OFICIAL_CON_SELLOS.docx).
- Modifica la fecha en cascada a múltiples archivos Word simultáneamente.
- Inserta Apellidos, Nombres, Club, País, Fecha de Nacimiento, Posición, Peso y Talla.
- CONSERVA AL 100% TODOS LOS SELLOS MÉDICOS Y FIRMAS OFICIALES.
"""

import os
import argparse
import zipfile
import re
import io
from xml.sax.saxutils import escape as xml_escape

TEMPLATE_NAME = "PLANTILLA_OFICIAL_CON_SELLOS.docx"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE_PATH = os.path.join(BASE_DIR, "client", "public", TEMPLATE_NAME)
if not os.path.exists(TEMPLATE_PATH):
    TEMPLATE_PATH = os.path.join(BASE_DIR, "PONCE ECHEVARRIA CARLOS.docx")


def safe_xml(val):
    if val is None:
        return ""
    return xml_escape(str(val), {'"': "&quot;", "'": "&apos;"})


def format_name(full_name, order="LAST_FIRST"):
    """
    Formatea el nombre según el orden requerido:
    - 'LAST_FIRST': "APELLIDOS NOMBRES"
    - 'FIRST_LAST': "NOMBRES APELLIDOS"
    """
    parts = full_name.strip().split()
    if len(parts) <= 1:
        return full_name.upper()

    if len(parts) >= 3:
        apellidos = " ".join(parts[:2])
        nombres = " ".join(parts[2:])
    else:
        apellidos = parts[0]
        nombres = parts[1]

    if order == "FIRST_LAST":
        return f"{nombres} {apellidos}".upper()
    return f"{apellidos} {nombres}".upper()


def process_word_document(
    input_path,
    output_path,
    raw_name,
    evaluation_date,
    club_name,
    order="LAST_FIRST",
    birth_date="18-09-2004",
    position="VOLANTE",
    country_club="PERÚ",
    weight="71 Kg",
    height="1.75 Cm",
):
    """
    Genera el expediente Word (.docx) reemplazando los tokens {{...}} de la plantilla limpia
    y conservando intactos todos los sellos médicos, firmas y membretes en word/media/.
    """
    parts = raw_name.strip().split()
    if len(parts) >= 3:
        apellidos = " ".join(parts[:2]).upper()
        nombres = " ".join(parts[2:]).upper()
    elif len(parts) == 2:
        apellidos = parts[0].upper()
        nombres = parts[1].upper()
    else:
        apellidos = raw_name.strip().upper()
        nombres = "-"

    if order == "FIRST_LAST":
        target_full_name = f"{nombres} {apellidos}".strip().upper()
    else:
        target_full_name = f"{apellidos} {nombres}".strip().upper()

    replacements = {
        "{{NOMBRE_COMPLETO}}": safe_xml(target_full_name),
        "{{APELLIDOS}}": safe_xml(apellidos),
        "{{NOMBRES}}": safe_xml(nombres or "-"),
        "{{CLUB}}": safe_xml(club_name.strip().upper()),
        "{{PAIS_CLUB}}": safe_xml(country_club.strip().upper()),
        "{{FECHA}}": safe_xml(evaluation_date.strip()),
        "{{FECHA_NAC}}": safe_xml(birth_date.strip()),
        "{{POSICION}}": safe_xml(position.strip().upper()),
        "{{PESO}}": safe_xml(weight.strip()),
        "{{TALLA}}": safe_xml(height.strip()),
    }

    with open(input_path, "rb") as f:
        zip_bytes = f.read()

    in_zip = zipfile.ZipFile(io.BytesIO(zip_bytes), "r")
    out_buffer = io.BytesIO()

    with zipfile.ZipFile(out_buffer, "w", zipfile.ZIP_DEFLATED) as out_zip:
        for item in in_zip.infolist():
            fname = item.filename
            content = in_zip.read(fname)
            if fname == "word/document.xml":
                xml_str = content.decode("utf-8")

                # 1. Reemplazo determinístico sobre la plantilla limpia parametrizada
                for token, value in replacements.items():
                    xml_str = xml_str.replace(token, value)

                # 2. Fallback en caso de recibir un documento antiguo sin parametrizar
                xml_str = xml_str.replace("PONCE ECHEVARRIA CARLOS", safe_xml(target_full_name))
                xml_str = xml_str.replace("PONCE ECHEVARRIA ", safe_xml(apellidos) + " ")
                xml_str = re.sub(r"ZU[\u00D1\xc3\x91N]IGA", safe_xml(club_name.upper()), xml_str, flags=re.IGNORECASE)
                xml_str = xml_str.replace("22-01-2026", safe_xml(evaluation_date))
                xml_str = xml_str.replace("____-____-2026", safe_xml(evaluation_date))
                xml_str = xml_str.replace("06-05-2026", safe_xml(evaluation_date))

                content = xml_str.encode("utf-8")

            out_zip.writestr(fname, content)

    in_zip.close()
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(out_buffer.getvalue())

    print(f"[OK] Generado: {os.path.basename(output_path)} (18 págs, plantilla limpia con sellos preservados).")


def main():
    parser = argparse.ArgumentParser(description="Procesador masivo de Words FPF con plantilla limpia y sellos protegidos.")
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
            if f.lower().endswith((".pdf", ".png", ".jpg", ".jpeg")):
                raw = os.path.splitext(f)[0]
                clean = re.sub(r"^(ECG|EKG|INFORME|RX|LAB)[\s_-]*", "", raw, flags=re.IGNORECASE).strip()
                if clean and clean not in names_to_process:
                    names_to_process.append(clean)
    else:
        print("[INFO] No se pasaron nombres directos ni carpeta. Modo demostración.")
        names_to_process = ["TALEXSIO GUZMAN ADDU ELIAS", "RAMIREZ FLORES DIEGO"]

    print("==================================================")
    print(" PROCESADOR MASIVO DE WORDS FPF - FAMIHEART (18P)")
    print("==================================================")
    print(f"Plantilla base:  {os.path.basename(TEMPLATE_PATH)}")
    print(f"Fecha unificada: {args.date}")
    print(f"Club:            {args.club}")
    print(f"Orden nombres:   {args.order}")
    print("Sellos médicos:  100% Protegidos (Cardiólogo, Radiólogo, Tecnólogo)")
    print(f"Total a generar: {len(names_to_process)}")
    print("--------------------------------------------------")

    for raw_name in names_to_process:
        formatted = format_name(raw_name, args.order)
        out_filename = f"{formatted}.docx"
        out_path = os.path.join(args.outdir, out_filename)
        process_word_document(TEMPLATE_PATH, out_path, raw_name, args.date, args.club, args.order)

    print("--------------------------------------------------")
    print(f"[EXITO] Procesamiento completado. Archivos en: {args.outdir}")


if __name__ == "__main__":
    main()
