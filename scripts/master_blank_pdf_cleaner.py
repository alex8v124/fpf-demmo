import fitz
import os

SRC_PDF = "TALEXSIO GUZMAN ADDU ELIAS.pdf"
DEST_PDF = "PLANTILLA_EN_BLANCO_EXPEDIENTE_FPF.pdf"
PUBLIC_PDF = "client/public/PLANTILLA_EN_BLANCO_EXPEDIENTE_FPF.pdf"
ASSETS_DIR = "client/public/assets/pages_blank"

os.makedirs(ASSETS_DIR, exist_ok=True)

doc = fitz.open(SRC_PDF)
print("=== INICIANDO LIMPIEZA MAESTRA EXHAUSTIVA 100% DE LAS 21 PAGINAS ===")

# 1. Busqueda y redaccion automatica por palabras clave en las 21 paginas
keywords = [
    "TALEXSIO", "GUZMAN", "ADDU", "ELIAS",
    "PONCE", "ECHEVARRIA", "CARLOS",
    "07-10-2026", "22-01-2026", "06-05-2026",
    "UNIVERSITARIO", "ALIANZA", "74290500"
]

total_kw_redacted = 0
for pno in range(len(doc)):
    page = doc[pno]
    for kw in keywords:
        rects = page.search_for(kw)
        for r in rects:
            padded = fitz.Rect(r.x0 - 3, r.y0 - 2, r.x1 + 3, r.y1 + 2)
            page.add_redact_annot(padded, fill=(1, 1, 1))
            total_kw_redacted += 1
    page.apply_redactions()

print(f"Redactadas {total_kw_redacted} ocurrencias de nombres y fechas personales.")

# 2. Redaccion por coordenadas de campos rellenados, marcas 'X', 'NIEGA', 'NORMAL', numeros y fotos
page_clean_coords = {
    # Pag 1: Certificado FPF
    0: [
        (80, 90, 450, 112),    # Nombre
        (80, 112, 450, 134),   # Club
        (80, 685, 450, 710),   # Fecha
    ],
    # Pag 2: Ficha PCMA
    1: [
        (50, 410, 450, 440),   # Apellidos y Nombres
        (50, 495, 450, 530),   # Fecha nacimiento y posicion
        (50, 595, 450, 625),   # Club y Pais
        (50, 715, 550, 755),   # Fecha inferior y marcas
    ],
    # Pag 3: Anamnesis Cardiovascular (Quitar todas las 'X')
    2: [
        (515, 170, 545, 750),
    ],
    # Pag 4: Farmacos y Suplementos (Quitar 'NINGUNO')
    3: [
        (80, 180, 300, 215),
        (80, 510, 300, 545),
    ],
    # Pag 5: Musculo-Esqueletico I (Quitar todos los 20 'NIEGA' desde y=160 hasta 750)
    4: [
        (420, 160, 545, 750),
    ],
    # Pag 6: Musculo-Esqueletico II (Quitar 'NIEGA' y 'NORMAL')
    5: [
        (320, 60, 545, 230),
        (480, 575, 548, 750),
    ],
    # Pag 7: Examen Fisico (Quitar 'NORMAL', marcas 'X' y barra stray)
    6: [
        (80, 110, 130, 130),   # Barra '|'
        (485, 130, 548, 300),  # 'NORMAL'
        (270, 440, 315, 825),  # Marcas 'X' col izquierda
        (485, 440, 530, 825),  # Marcas 'X' col derecha si hubiera
    ],
    # Pag 8: ECG Protocolo CONMEBOL (Quitar 'X')
    7: [
        (195, 115, 235, 160),
        (525, 195, 548, 750),
    ],
    # Pag 9: Ecocardiograma Mediciones (Quitar 'X' superiores y mediciones numericas)
    8: [
        (525, 90, 550, 330),   # 10 marcas 'X' superiores
        (345, 415, 395, 750),  # Mediciones col 1 (24, 28, 10, 25, 50, N, 22, 57/39, N...)
        (455, 415, 548, 750),  # Mediciones col 2
    ],
    # Pag 10: Ecocardiograma Conclusiones (Quitar 'N', '3/7', '6/11' y conclusion)
    9: [
        (330, 130, 375, 245),  # 'N', '3/7', '6/11'
        (470, 130, 530, 245),  # marcas col 2
        (90, 365, 345, 385),   # 'ECOCARDIOGRAMA DENTRO DE LIMITES NORMALES.'
    ],
    # Pag 11: Resultados de Sangre (Quitar valores numericos)
    10: [
        (160, 205, 225, 380),
    ],
    # Pag 12: Resumen Pre-Participativa (Quitar 'SI', '07-10-2026', 'X')
    11: [
        (75, 535, 380, 575),   # 'SI'
        (40, 715, 130, 755),   # Fecha
        (420, 245, 460, 460),  # 'X'
    ],
    # Pag 13: Certificado Famiheart
    12: [
        (170, 240, 515, 315),  # Zona de TALEXSIO GUZMAN ADDU ELIAS
        (75, 605, 210, 645),   # Fecha
    ],
    # Pag 14: Informe Ecocardiografico (Cabecera)
    13: [
        (120, 175, 420, 208),  # Nombre
        (115, 205, 270, 228),  # Fecha
        (440, 180, 540, 205),  # Sexo
    ],
    # Pag 15: Ecocardiograma - Ultrasonido (Quitar las 2 fotos ecograficas personales)
    14: [
        (80, 155, 515, 425),
        (80, 430, 515, 690),
    ],
    # Pag 16: Electrocardiograma - Trazado (Quitar el trazo EKG con datos de Talexsio)
    15: [
        (80, 115, 515, 735),
    ],
    # Pag 17: Hemograma Completo
    16: [
        (135, 180, 420, 212),  # PACIENTE
        (450, 220, 545, 268),  # FECHA
        (440, 185, 465, 215),  # SEXO 'M'
        (310, 295, 385, 615),  # Resultados numericos (4.630, 14.7, 43, 5730, 236000, 89...)
    ],
    # Pag 18: Bioquimica Sanguinea
    17: [
        (135, 165, 420, 202),  # PACIENTE
        (460, 210, 550, 258),  # FECHA
        (440, 245, 460, 265),  # SEXO 'M'
        (250, 305, 274, 325),  # '88'
    ],
    # Pag 19: Parasitologico Seriado
    18: [
        (135, 180, 420, 218),  # PACIENTE
        (500, 238, 590, 275),  # FECHA
        (440, 260, 460, 280),  # SEXO 'M'
        (160, 305, 450, 390),  # Resultados: AMARILLO, SOLIDO, No se observa..., AUSENTE, -
    ],
    # Pag 20: Informe Radiografia de Torax
    19: [
        (125, 170, 420, 205),  # NOMBRE
        (125, 198, 300, 230),  # FECHA
    ],
    # Pag 21: Radiografia de Torax - Placa (Quitar la placa de rayos X personal)
    20: [
        (80, 160, 515, 730),
    ],
}

for pno, rlist in page_clean_coords.items():
    page = doc[pno]
    for r in rlist:
        page.add_redact_annot(fitz.Rect(r), fill=(1, 1, 1))
    page.apply_redactions()

# Redacciones quirurgicas exactas en Pag 14 (Informe Ecocardiografico)
p14 = doc[13]
p14_exact_boxes = [
    fitz.Rect(194.0, 241.0, 205.0, 251.0), # 22
    fitz.Rect(402.0, 241.0, 412.0, 251.0), # 24
    fitz.Rect(403.0, 252.0, 413.5, 262.0), # 16
    fitz.Rect(195.0, 263.0, 205.5, 273.0), # 50
    fitz.Rect(193.0, 274.0, 203.5, 284.0), # 23
    fitz.Rect(196.0, 252.0, 206.5, 262.0), # 10 (Septum)
    fitz.Rect(193.0, 285.0, 203.5, 295.0), # 10 (Pared Post)
    fitz.Rect(193.0, 296.0, 203.5, 306.0), # 28
    fitz.Rect(194.0, 331.0, 204.5, 341.0), # 57
    fitz.Rect(405.0, 331.0, 415.0, 341.0), # 74
    fitz.Rect(194.0, 342.0, 204.5, 352.0), # 39
    fitz.Rect(403.5, 342.0, 413.5, 352.0), # 66
    fitz.Rect(215.5, 409.0, 228.5, 419.5), # 1.7
    fitz.Rect(212.5, 420.0, 225.5, 430.5), # 2.8
    fitz.Rect(432.5, 420.0, 445.5, 430.5), # 0.7
]
for r in p14_exact_boxes:
    p14.add_redact_annot(r, fill=(1, 1, 1))
p14.apply_redactions()

# 3. Dibujar lineas oficiales y marcos vectoriales nitidos
# Pag 1
p1 = doc[0]
p1.draw_line(fitz.Point(85, 108), fitz.Point(450, 108), color=(0.75, 0.75, 0.75), width=0.8)
p1.draw_line(fitz.Point(85, 130), fitz.Point(450, 130), color=(0.75, 0.75, 0.75), width=0.8)
p1.draw_line(fitz.Point(85, 704), fitz.Point(220, 704), color=(0.75, 0.75, 0.75), width=0.8)

# Pag 2
p2 = doc[1]
p2.draw_line(fitz.Point(60, 435), fitz.Point(220, 435), color=(0.8, 0.8, 0.8), width=0.8)
p2.draw_line(fitz.Point(235, 435), fitz.Point(395, 435), color=(0.8, 0.8, 0.8), width=0.8)
p2.draw_line(fitz.Point(60, 620), fitz.Point(220, 620), color=(0.8, 0.8, 0.8), width=0.8)
p2.draw_line(fitz.Point(235, 620), fitz.Point(365, 620), color=(0.8, 0.8, 0.8), width=0.8)

# Pag 10
p10 = doc[9]
p10.draw_line(fitz.Point(90, 380), fitz.Point(480, 380), color=(0.75, 0.75, 0.75), width=0.8, dashes="3 2")

# Pag 13
p13 = doc[12]
p13.draw_line(fitz.Point(180, 275), fitz.Point(480, 275), color=(0.7, 0.7, 0.7), width=0.8, dashes="3 2")
p13.draw_line(fitz.Point(85, 635), fitz.Point(200, 635), color=(0.7, 0.7, 0.7), width=0.8, dashes="3 2")

# Pag 14
p14.draw_line(fitz.Point(135, 202), fitz.Point(380, 202), color=(0.75, 0.75, 0.75), width=0.8)
p14.draw_line(fitz.Point(135, 222), fitz.Point(250, 222), color=(0.75, 0.75, 0.75), width=0.8)
# Rellenar con linea las muescas de los numeros
for r in p14_exact_boxes:
    p14.draw_line(fitz.Point(r.x0, r.y1 - 1), fitz.Point(r.x1, r.y1 - 1), color=(0.4, 0.4, 0.4), width=0.6)

# Pag 15: Marcos de colocacion para Ecocardiograma
p15 = doc[14]
r15_1 = fitz.Rect(85, 165, 510, 420)
p15.draw_rect(r15_1, color=(0.7, 0.75, 0.8), width=1.0, dashes="4 2")
p15.insert_text(fitz.Point(140, 290), "[ ESPACIO PARA ADJUNTAR ECOCARDIOGRAMA 2D / DOPPLER ]", fontsize=9, color=(0.5, 0.55, 0.6))
r15_2 = fitz.Rect(85, 435, 510, 685)
p15.draw_rect(r15_2, color=(0.7, 0.75, 0.8), width=1.0, dashes="4 2")
p15.insert_text(fitz.Point(140, 560), "[ ESPACIO PARA ADJUNTAR ECOCARDIOGRAMA M-MODE / FLUJOS ]", fontsize=9, color=(0.5, 0.55, 0.6))

# Pag 16: Marco oficial limpio de Electrocardiograma
p16 = doc[15]
r16 = fitz.Rect(85, 125, 510, 725)
p16.draw_rect(r16, color=(0.6, 0.7, 0.8), width=1.2)
p16.insert_text(fitz.Point(100, 145), "ELECTROCARDIOGRAMA DE REPOSO (12 DERIVACIONES) - FAMIHEART S.A.C.", fontsize=9, fontname="helv", color=(0.1, 0.2, 0.4))
p16.insert_text(fitz.Point(115, 420), "[ ESPACIO OFICIAL PARA ADJUNTAR EL TRAZADO ELECTROCARDIOGRAFICO ]", fontsize=10, fontname="helv", color=(0.4, 0.45, 0.5))
p16.insert_text(fitz.Point(165, 440), "Estandar: 25 mm/s - 10 mm/mV - Filtro 50/60 Hz - 12 Derivaciones", fontsize=8, fontname="helv", color=(0.5, 0.55, 0.6))

# Pag 17
p17 = doc[16]
p17.draw_line(fitz.Point(150, 202), fitz.Point(380, 202), color=(0.75, 0.75, 0.75), width=0.8)
p17.draw_line(fitz.Point(465, 252), fitz.Point(535, 252), color=(0.75, 0.75, 0.75), width=0.8)

# Pag 18
p18 = doc[17]
p18.draw_line(fitz.Point(150, 190), fitz.Point(380, 190), color=(0.75, 0.75, 0.75), width=0.8)
p18.draw_line(fitz.Point(475, 245), fitz.Point(545, 245), color=(0.75, 0.75, 0.75), width=0.8)

# Pag 19: Coproparasitologico - Lineas para resultados limpios
p19 = doc[18]
p19.draw_line(fitz.Point(150, 205), fitz.Point(380, 205), color=(0.75, 0.75, 0.75), width=0.8)
p19.draw_line(fitz.Point(515, 265), fitz.Point(585, 265), color=(0.75, 0.75, 0.75), width=0.8)
p19.draw_line(fitz.Point(165, 321), fitz.Point(350, 321), color=(0.8, 0.8, 0.8), width=0.8)
p19.draw_line(fitz.Point(165, 336), fitz.Point(350, 336), color=(0.8, 0.8, 0.8), width=0.8)
p19.draw_line(fitz.Point(165, 351), fitz.Point(450, 351), color=(0.8, 0.8, 0.8), width=0.8)
p19.draw_line(fitz.Point(165, 366), fitz.Point(350, 366), color=(0.8, 0.8, 0.8), width=0.8)
p19.draw_line(fitz.Point(165, 381), fitz.Point(350, 381), color=(0.8, 0.8, 0.8), width=0.8)

# Pag 20
p20 = doc[19]
p20.draw_line(fitz.Point(140, 198), fitz.Point(400, 198), color=(0.75, 0.75, 0.75), width=0.8)
p20.draw_line(fitz.Point(140, 225), fitz.Point(280, 225), color=(0.75, 0.75, 0.75), width=0.8)

# Pag 21: Marco de Radiografia de Torax Placa
p21 = doc[20]
r21 = fitz.Rect(85, 165, 510, 725)
p21.draw_rect(r21, color=(0.6, 0.7, 0.8), width=1.2)
p21.insert_text(fitz.Point(100, 185), "SERVICIO DE DIAGNOSTICO POR IMAGENES - RADIOGRAFIA DE TORAX (PA)", fontsize=9, fontname="helv", color=(0.1, 0.2, 0.4))
p21.insert_text(fitz.Point(135, 440), "[ ESPACIO OFICIAL PARA ADJUNTAR LA PLACA RADIOGRAFICA DE TORAX ]", fontsize=10, fontname="helv", color=(0.4, 0.45, 0.5))
p21.insert_text(fitz.Point(175, 460), "Incidencia Postero-Anterior (PA) - Campo Pleuropulmonar y Silueta Cardiaca", fontsize=8, fontname="helv", color=(0.5, 0.55, 0.6))

# Guardar documento limpio optimizado
doc.save(DEST_PDF, garbage=4, deflate=True)
doc.save(PUBLIC_PDF, garbage=4, deflate=True)
print(f"[OK] Archivo PDF guardado en:\n  -> {DEST_PDF}\n  -> {PUBLIC_PDF}")

# Renderizar todas las 21 paginas a imagenes nitidas PNG para el frontend
print("\nGenerando las 21 imagenes de alta resolucion para el visor web...")
for i, page in enumerate(doc):
    pix = page.get_pixmap(dpi=150)
    out_file = os.path.join(ASSETS_DIR, f"page_{i+1:02d}.png")
    pix.save(out_file)
    print(f"  [OK] page_{i+1:02d}.png guardada ({pix.width}x{pix.height})")

print("\nSanitizacion 100% completada sin errores.")
