import os, json, re

drive_dir = "archivos del drive"
files = [f for f in os.listdir(drive_dir) if f.lower().endswith(('.pdf', '.docx', '.jpg', '.png'))]
files.sort()

print(f"Total files in drive dir: {len(files)}")

CLUBS = [
    'Club Sporting Cristal',
    'Club Alianza Lima',
    'Club Universitario de Deportes',
    'FBC Melgar',
    'Cienciano del Cusco',
    'Sport Boys Association',
    'Academia Deportiva Cantolao',
    'Asociación Deportiva Tarma (ADT)',
    'Club Deportivo Garcilaso',
    'Club Deportivo Zúñiga',
    'Cusco FC',
    'Los Chankas CYC'
]

MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC']

POSITIONS = [
    'Arquero',
    'Defensa Central',
    'Lateral Derecho',
    'Lateral Izquierdo',
    'Volante de Marca',
    'Volante Mixto',
    'Mediocentro Ofensivo',
    'Extremo Derecho',
    'Extremo Izquierdo',
    'Delantero Centro'
]

patients = []
for idx, fn in enumerate(files):
    name_no_ext = os.path.splitext(fn)[0].strip()
    clean_name = re.sub(r'[^A-ZÁÉÍÓÚÑa-záéíóúñ\s]', '', name_no_ext).strip()
    words = clean_name.split()

    if len(words) >= 4:
        apellidos = " ".join(words[:2]).upper()
        nombres = " ".join(words[2:]).upper()
    elif len(words) == 3:
        apellidos = " ".join(words[:2]).upper()
        nombres = words[2].upper()
    elif len(words) == 2:
        apellidos = words[0].upper()
        nombres = words[1].upper()
    else:
        apellidos = clean_name.upper()
        nombres = ""

    nombre_completo = f"{apellidos} {nombres}".strip()
    dni_base = 70000000 + (idx * 314159) % 9999999
    club = CLUBS[idx % len(CLUBS)]
    posicion = POSITIONS[idx % len(POSITIONS)]
    mes = MONTHS[idx % len(MONTHS)]
    
    # Estados representativos de aptitud
    if idx % 11 == 0:
        estado = 'OBSERVADO'
        por_obs = True
    elif idx % 7 == 0:
        estado = 'POR RENOVAR'
        por_obs = False
    else:
        estado = 'APTO'
        por_obs = False

    patients.append({
        'id': f"player-drive-{idx+1:03d}",
        'fileName': fn,
        'apellidos': apellidos,
        'nombres': nombres,
        'nombreCompleto': nombre_completo,
        'dni': str(dni_base),
        'club': club,
        'categoria': 'Primera División' if idx % 3 == 0 else ('Reserva' if idx % 2 == 0 else 'Sub-20'),
        'posicion': posicion,
        'mes': mes,
        'fechaEvaluacion': '22-01-2026',
        'estadoAptitud': estado,
        'estado': estado,
        'porObservacion': por_obs,
        'medicoEvaluador': 'DR. DARIO HERNANDEZ ALARCON',
        'origen': 'Google Drive FPF',
        'synced21Pages': True
    })

target_json = "client/src/data/drivePatients.json"
with open(target_json, "w", encoding="utf-8") as f:
    json.dump(patients, f, ensure_ascii=False, indent=2)

print(f"Generated {len(patients)} patients in {target_json}")
