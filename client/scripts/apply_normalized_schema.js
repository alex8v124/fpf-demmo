import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.yqajcjzkgcmauazcvwtd',
  password: 'VUGV5bTmVPzYJczF',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

const sql = `
BEGIN;

-- -----------------------------------------------------------------------------
-- 0. LIMPIEZA PREVIA (DROP CASCADE DE TABLAS OBSOLETAS)
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.vw_expediente_completo_fpf CASCADE;
DROP TABLE IF EXISTS public.expediente_archivos_adjuntos CASCADE;
DROP TABLE IF EXISTS public.radiografia_torax CASCADE;
DROP TABLE IF EXISTS public.laboratorio_parasitologico CASCADE;
DROP TABLE IF EXISTS public.laboratorio_bioquimica CASCADE;
DROP TABLE IF EXISTS public.laboratorio_hemograma CASCADE;
DROP TABLE IF EXISTS public.ecocardiograma_conclusiones CASCADE;
DROP TABLE IF EXISTS public.ecocardiograma_doppler CASCADE;
DROP TABLE IF EXISTS public.electrocardiograma_reposo CASCADE;
DROP TABLE IF EXISTS public.salud_femenina CASCADE;
DROP TABLE IF EXISTS public.antecedentes_quirurgicos_lesiones CASCADE;
DROP TABLE IF EXISTS public.farmacos_suplementos CASCADE;
DROP TABLE IF EXISTS public.anamnesis_cardiovascular CASCADE;
DROP TABLE IF EXISTS public.examen_fisico CASCADE;
DROP TABLE IF EXISTS public.evaluaciones_medicas CASCADE;
DROP TABLE IF EXISTS public.fichas_deportivas CASCADE;
DROP TABLE IF EXISTS public.pacientes CASCADE;
DROP TABLE IF EXISTS public.personal_salud CASCADE;
DROP TABLE IF EXISTS public.clubes CASCADE;
DROP TABLE IF EXISTS public.zonas_anatomicas CASCADE;
DROP TABLE IF EXISTS public.sedes_clinicas CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Función de trigger para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION public.fn_actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 1. TIPOS ENUMERADOS
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_sexo') THEN
        CREATE TYPE public.enum_sexo AS ENUM ('M', 'F');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_estado_aptitud') THEN
        CREATE TYPE public.enum_estado_aptitud AS ENUM ('APTO', 'EN_OBSERVACION', 'NO_APTO', 'PENDIENTE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_lado_anatomico') THEN
        CREATE TYPE public.enum_lado_anatomico AS ENUM ('DERECHA', 'IZQUIERDA', 'BILATERAL', 'NO_APLICA');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_tipo_antecedente_quirurgico') THEN
        CREATE TYPE public.enum_tipo_antecedente_quirurgico AS ENUM ('OPERACION', 'LESION_GRAVE', 'PATOLOGIA_ARTICULAR');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_tipo_adjunto') THEN
        CREATE TYPE public.enum_tipo_adjunto AS ENUM ('ECG_TRAZADO', 'ECOCARDIOGRAMA_DOPPLER', 'RADIOGRAFIA_TORAX', 'DOCUMENTO_PDF', 'OTRO');
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. TABLAS MAESTRAS Y CATÁLOGOS
-- -----------------------------------------------------------------------------

CREATE TABLE public.sedes_clinicas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_sede VARCHAR(20) UNIQUE NOT NULL,
    razon_social VARCHAR(150) NOT NULL,
    nombre_comercial VARCHAR(100) NOT NULL,
    ruc VARCHAR(11) UNIQUE,
    direccion TEXT NOT NULL,
    distrito VARCHAR(80),
    provincia VARCHAR(80) DEFAULT 'LIMA',
    telefono VARCHAR(30),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.clubes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(120) UNIQUE NOT NULL,
    siglas VARCHAR(20),
    pais VARCHAR(60) DEFAULT 'PERU',
    ciudad VARCHAR(60) DEFAULT 'LIMA',
    division VARCHAR(60),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.zonas_anatomicas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(80) UNIQUE NOT NULL,
    categoria VARCHAR(50) DEFAULT 'Articulación / Músculo',
    orden INT DEFAULT 0
);

CREATE TABLE public.personal_salud (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    cmp VARCHAR(20),
    rne VARCHAR(20),
    ctmp VARCHAR(20),
    especialidad VARCHAR(100) NOT NULL,
    rol_institucional VARCHAR(80) NOT NULL,
    firma_url TEXT,
    sello_texto TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. JUGADORES / PACIENTES
-- -----------------------------------------------------------------------------
CREATE TABLE public.pacientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_documento VARCHAR(10) DEFAULT 'DNI',
    numero_documento VARCHAR(20) UNIQUE NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    nombre_completo VARCHAR(200) GENERATED ALWAYS AS (apellidos || ' ' || nombres) STORED,
    fecha_nacimiento DATE NOT NULL,
    sexo public.enum_sexo NOT NULL DEFAULT 'M',
    nacionalidad VARCHAR(60) DEFAULT 'PERUANA',
    email VARCHAR(120),
    telefono VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.fichas_deportivas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES public.clubes(id) ON DELETE RESTRICT,
    categoria VARCHAR(80) NOT NULL,
    posicion VARCHAR(80) NOT NULL,
    numero_camiseta INT,
    es_activo BOOLEAN DEFAULT TRUE,
    fecha_registro DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. EXPEDIENTE CENTRAL: EVALUACIÓN MÉDICA PRE-COMPETENCIA
-- -----------------------------------------------------------------------------
CREATE TABLE public.evaluaciones_medicas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_expediente VARCHAR(50) UNIQUE NOT NULL,
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE RESTRICT,
    club_id UUID NOT NULL REFERENCES public.clubes(id) ON DELETE RESTRICT,
    sede_id UUID REFERENCES public.sedes_clinicas(id) ON DELETE SET NULL,
    medico_responsable_id UUID NOT NULL REFERENCES public.personal_salud(id) ON DELETE RESTRICT,
    fecha_evaluacion DATE NOT NULL DEFAULT CURRENT_DATE,
    numero_recibo VARCHAR(50),
    temporada_competencia VARCHAR(10) DEFAULT '2026',
    estado_aptitud public.enum_estado_aptitud NOT NULL DEFAULT 'PENDIENTE',
    dictamen_oficial_texto TEXT,
    apto_con_indicaciones_detalle TEXT,
    no_apto_motivo TEXT,
    medico_revisor_conmebol VARCHAR(150),
    fecha_revision_conmebol DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. MÓDULOS CLÍNICOS ASOCIADOS
-- -----------------------------------------------------------------------------

CREATE TABLE public.examen_fisico (
    evaluacion_id UUID PRIMARY KEY REFERENCES public.evaluaciones_medicas(id) ON DELETE CASCADE,
    peso_kg NUMERIC(5,2) NOT NULL CHECK (peso_kg > 20 AND peso_kg < 250),
    talla_m NUMERIC(3,2) NOT NULL CHECK (talla_m > 1.0 AND talla_m < 2.5),
    imc NUMERIC(4,1) GENERATED ALWAYS AS (ROUND(peso_kg / (talla_m * talla_m), 1)) STORED,
    pulso_lpm INT CHECK (pulso_lpm > 30 AND pulso_lpm < 220),
    presion_sistolica_mmhg INT CHECK (presion_sistolica_mmhg > 50 AND presion_sistolica_mmhg < 260),
    presion_diastolica_mmhg INT CHECK (presion_diastolica_mmhg > 30 AND presion_diastolica_mmhg < 160),
    arer BOOLEAN DEFAULT TRUE,
    aren BOOLEAN DEFAULT TRUE,
    no_soplos BOOLEAN DEFAULT TRUE,
    vias_aereas_libres BOOLEAN DEFAULT TRUE,
    cabeza_normal BOOLEAN DEFAULT TRUE,
    cuello_normal BOOLEAN DEFAULT TRUE,
    torax_corazon_normal BOOLEAN DEFAULT TRUE,
    torax_pulmonar_normal BOOLEAN DEFAULT TRUE,
    abdomen_normal BOOLEAN DEFAULT TRUE,
    columna_normal BOOLEAN DEFAULT TRUE,
    codo_mano_normal BOOLEAN DEFAULT TRUE,
    cadera_ingle_normal BOOLEAN DEFAULT TRUE,
    muslo_normal BOOLEAN DEFAULT TRUE,
    rodilla_normal BOOLEAN DEFAULT TRUE,
    pierna_normal BOOLEAN DEFAULT TRUE,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.anamnesis_cardiovascular (
    evaluacion_id UUID PRIMARY KEY REFERENCES public.evaluaciones_medicas(id) ON DELETE CASCADE,
    dolor_toracico_esfuerzo BOOLEAN DEFAULT FALSE,
    lipotimia_sincope BOOLEAN DEFAULT FALSE,
    disnea_fatiga_desproporcionada BOOLEAN DEFAULT FALSE,
    soplo_cardiaco_previo BOOLEAN DEFAULT FALSE,
    hipertension_arterial BOOLEAN DEFAULT FALSE,
    restriccion_deporte_previa BOOLEAN DEFAULT FALSE,
    muerte_subita_familiar_menor_50 BOOLEAN DEFAULT FALSE,
    enfermedad_coronaria_familiar_menor_50 BOOLEAN DEFAULT FALSE,
    cardiopatia_riesgo_muerte_subita BOOLEAN DEFAULT FALSE,
    cirugias_no_traumatologicas BOOLEAN DEFAULT FALSE,
    hospitalizaciones_no_quirurgicas BOOLEAN DEFAULT FALSE,
    traumatismo_craneo_encefalico BOOLEAN DEFAULT FALSE,
    asma_bronquial BOOLEAN DEFAULT FALSE,
    otra_patologia_relevante BOOLEAN DEFAULT FALSE,
    otra_patologia_detalle TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.farmacos_suplementos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluacion_id UUID NOT NULL REFERENCES public.evaluaciones_medicas(id) ON DELETE CASCADE,
    es_suplemento BOOLEAN DEFAULT FALSE,
    nombre VARCHAR(150) NOT NULL,
    dosis VARCHAR(100),
    indicacion_diagnostico TEXT
);

CREATE TABLE public.antecedentes_quirurgicos_lesiones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluacion_id UUID NOT NULL REFERENCES public.evaluaciones_medicas(id) ON DELETE CASCADE,
    zona_anatomica_id INT NOT NULL REFERENCES public.zonas_anatomicas(id) ON DELETE RESTRICT,
    tipo_antecedente public.enum_tipo_antecedente_quirurgico NOT NULL,
    lado public.enum_lado_anatomico DEFAULT 'NO_APLICA',
    es_aguda BOOLEAN DEFAULT FALSE,
    es_cronica BOOLEAN DEFAULT FALSE,
    fecha_o_tiempo VARCHAR(80) DEFAULT 'NIEGA',
    diagnostico_detalle TEXT
);

CREATE TABLE public.salud_femenina (
    evaluacion_id UUID PRIMARY KEY REFERENCES public.evaluaciones_medicas(id) ON DELETE CASCADE,
    ciclo_menstrual_regular BOOLEAN DEFAULT TRUE,
    dismenorrea BOOLEAN DEFAULT FALSE,
    dismenorrea_ultimas_4_semanas BOOLEAN DEFAULT FALSE,
    esta_embarazada BOOLEAN DEFAULT FALSE,
    semanas_gestacion INT,
    usa_metodos_hormonales_retardo BOOLEAN DEFAULT FALSE,
    observaciones TEXT
);

CREATE TABLE public.electrocardiograma_reposo (
    evaluacion_id UUID PRIMARY KEY REFERENCES public.evaluaciones_medicas(id) ON DELETE CASCADE,
    medico_cardiologo_id UUID REFERENCES public.personal_salud(id) ON DELETE RESTRICT,
    es_normal BOOLEAN DEFAULT TRUE,
    frecuencia_cardiaca_lpm INT,
    ritmo VARCHAR(60) DEFAULT 'Sinusal regular',
    intervalo_pr_ms INT,
    duracion_qrs_ms INT,
    intervalo_qt_ms INT,
    intervalo_qtc_ms INT,
    eje_p_grados NUMERIC(5,2),
    eje_qrs_grados NUMERIC(5,2),
    eje_t_grados NUMERIC(5,2),
    rvs_sv1_mv NUMERIC(5,2),
    rvs_mas_sv1_mv NUMERIC(5,2),
    hallazgos_tipo1_deportista BOOLEAN DEFAULT FALSE,
    hallazgos_limitrofes BOOLEAN DEFAULT FALSE,
    hallazgos_tipo2_anormales BOOLEAN DEFAULT FALSE,
    conclusion_diagnostica TEXT DEFAULT 'ELECTROCARDIOGRAMA DE REPOSO DENTRO DE LÍMITES NORMALES',
    imagen_trazado_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.ecocardiograma_doppler (
    evaluacion_id UUID PRIMARY KEY REFERENCES public.evaluaciones_medicas(id) ON DELETE CASCADE,
    medico_cardiologo_id UUID REFERENCES public.personal_salud(id) ON DELETE RESTRICT,
    ventriculo_derecho_mm NUMERIC(4,1),
    aorta_raiz_mm NUMERIC(4,1),
    aorta_apertura_mm NUMERIC(4,1),
    tracto_salida_vi_mm NUMERIC(4,1),
    septum_interventricular_mm NUMERIC(4,1),
    vi_diastole_mm NUMERIC(4,1),
    vi_sistole_mm NUMERIC(4,1),
    pared_posterior_vi_mm NUMERIC(4,1),
    auricula_izquierda_diametro_mm NUMERIC(4,1),
    auricula_izquierda_area_cm2 NUMERIC(4,1),
    auricula_izquierda_volumen_ml_m2 NUMERIC(4,1),
    auricula_derecha_area_cm2 NUMERIC(4,1),
    ventriculo_derecho_basal_mm NUMERIC(4,1),
    fraccion_eyeccion_porc NUMERIC(4,1) NOT NULL,
    fraccion_acortamiento_porc NUMERIC(4,1),
    volumen_sistolico_ml NUMERIC(5,1),
    gasto_cardiaco_l_min NUMERIC(4,1),
    indice_cardiaco_l_min_m2 NUMERIC(4,1),
    onda_e_mitral_cm_s NUMERIC(5,1),
    onda_a_mitral_cm_s NUMERIC(5,1),
    relacion_ea NUMERIC(4,2),
    mitral_gradiente_max NUMERIC(4,1),
    aortica_gradiente_max NUMERIC(4,1),
    area_aortica_cm2 NUMERIC(4,2),
    ee_medial VARCHAR(20),
    ee_lateral VARCHAR(20),
    presion_sistolica_ap_mmhg VARCHAR(30) DEFAULT 'NORMAL',
    cavidades_cardiacas VARCHAR(50) DEFAULT 'NORMAL',
    grosor_miocardio VARCHAR(50) DEFAULT 'NORMAL',
    valvulas_cardiacas VARCHAR(50) DEFAULT 'COMPETENTES',
    patron_contractil_global VARCHAR(50) DEFAULT 'CONSERVADO',
    patron_contractil_segmentario VARCHAR(50) DEFAULT 'LIBRE',
    tracto_salida_vi VARCHAR(50) DEFAULT 'CONSERVADO',
    doppler_flujo VARCHAR(50) DEFAULT 'E > A',
    arterias_aorta VARCHAR(50) DEFAULT 'CONSERVADO',
    arterias_pulmonar VARCHAR(50) DEFAULT 'CONSERVADO',
    pericardio VARCHAR(50) DEFAULT 'NO DERRAME',
    funcion_ventriculo_izquierdo VARCHAR(50) DEFAULT 'CONSERVADO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.ecocardiograma_conclusiones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluacion_id UUID NOT NULL REFERENCES public.evaluaciones_medicas(id) ON DELETE CASCADE,
    orden INT NOT NULL,
    conclusion_texto TEXT NOT NULL
);

CREATE TABLE public.laboratorio_hemograma (
    evaluacion_id UUID PRIMARY KEY REFERENCES public.evaluaciones_medicas(id) ON DELETE CASCADE,
    tecnologo_id UUID REFERENCES public.personal_salud(id) ON DELETE RESTRICT,
    globulos_rojos_mm3 NUMERIC(10,2),
    hemoglobina_gr_dl NUMERIC(4,1) NOT NULL,
    hematocrito_porc NUMERIC(4,1) NOT NULL,
    leucocitos_mm3 NUMERIC(8,2) NOT NULL,
    plaquetas_mm3 NUMERIC(9,2) NOT NULL,
    vcm_fl NUMERIC(5,1),
    hcm_pg NUMERIC(5,1),
    chcm_gr_dl NUMERIC(5,1),
    segmentados_porc INT CHECK (segmentados_porc >= 0 AND segmentados_porc <= 100),
    abastonados_porc INT CHECK (abastonados_porc >= 0 AND abastonados_porc <= 100),
    linfocitos_porc INT CHECK (linfocitos_porc >= 0 AND linfocitos_porc <= 100),
    monocitos_porc INT CHECK (monocitos_porc >= 0 AND monocitos_porc <= 100),
    eosinofilos_porc INT CHECK (eosinofilos_porc >= 0 AND eosinofilos_porc <= 100),
    basofilos_porc INT CHECK (basofilos_porc >= 0 AND basofilos_porc <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.laboratorio_bioquimica (
    evaluacion_id UUID PRIMARY KEY REFERENCES public.evaluaciones_medicas(id) ON DELETE CASCADE,
    tecnologo_id UUID REFERENCES public.personal_salud(id) ON DELETE RESTRICT,
    glucosa_basal_mg_dl NUMERIC(5,1) NOT NULL,
    creatinina_mg_dl NUMERIC(4,2),
    sodio_meq_l NUMERIC(5,1),
    potasio_meq_l NUMERIC(4,2),
    calcio_mg_dl NUMERIC(4,1),
    fosforo_mg_dl NUMERIC(4,1),
    colesterol_total_mg_dl NUMERIC(5,1),
    colesterol_ldl_mg_dl NUMERIC(5,1),
    colesterol_hdl_mg_dl NUMERIC(5,1),
    trigliceridos_mg_dl NUMERIC(5,1),
    proteina_c_reactiva_mg_l NUMERIC(4,2),
    ferritina_ng_ml NUMERIC(6,1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.laboratorio_parasitologico (
    evaluacion_id UUID PRIMARY KEY REFERENCES public.evaluaciones_medicas(id) ON DELETE CASCADE,
    tecnologo_id UUID REFERENCES public.personal_salud(id) ON DELETE RESTRICT,
    color VARCHAR(40) DEFAULT 'AMARILLO',
    consistencia VARCHAR(40) DEFAULT 'SOLIDO',
    quistes_larvas_huevos TEXT DEFAULT 'No se observa quistes, larvas ni huevos de parásitos',
    mucosidad VARCHAR(40) DEFAULT 'AUSENTE',
    observaciones_otros TEXT DEFAULT 'NEGATIVO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.radiografia_torax (
    evaluacion_id UUID PRIMARY KEY REFERENCES public.evaluaciones_medicas(id) ON DELETE CASCADE,
    medico_radiologo_id UUID REFERENCES public.personal_salud(id) ON DELETE RESTRICT,
    incidencia VARCHAR(50) DEFAULT 'PA (Póstero-Anterior)',
    transparencia_pulmonar TEXT DEFAULT 'Transparencia pulmonar conservada en ambos campos pulmonares',
    senos_costodiafragmaticos TEXT DEFAULT 'Senos costo diafragmáticos libres',
    indice_cardiotoracico TEXT DEFAULT 'Índice cardiotorácico dentro de límites normales',
    partes_blandas TEXT DEFAULT 'Partes blandas adyacentes conservadas',
    conclusion_radiologica TEXT DEFAULT 'Estudio radiográfico dentro de límites normales',
    imagen_placa_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.expediente_archivos_adjuntos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluacion_id UUID NOT NULL REFERENCES public.evaluaciones_medicas(id) ON DELETE CASCADE,
    tipo_adjunto public.enum_tipo_adjunto NOT NULL,
    nombre_archivo VARCHAR(200) NOT NULL,
    url_almacenamiento TEXT NOT NULL,
    formato_extension VARCHAR(10),
    tamano_bytes BIGINT,
    pagina_documento INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. ÍNDICES DE RENDIMIENTO
-- -----------------------------------------------------------------------------
CREATE INDEX idx_pacientes_documento ON public.pacientes(numero_documento);
CREATE INDEX idx_pacientes_apellidos ON public.pacientes(apellidos);
CREATE INDEX idx_evaluaciones_codigo ON public.evaluaciones_medicas(codigo_expediente);
CREATE INDEX idx_evaluaciones_paciente ON public.evaluaciones_medicas(paciente_id);
CREATE INDEX idx_evaluaciones_club ON public.evaluaciones_medicas(club_id);
CREATE INDEX idx_evaluaciones_fecha ON public.evaluaciones_medicas(fecha_evaluacion DESC);
CREATE INDEX idx_evaluaciones_aptitud ON public.evaluaciones_medicas(estado_aptitud);
CREATE INDEX idx_archivos_evaluacion ON public.expediente_archivos_adjuntos(evaluacion_id);

-- -----------------------------------------------------------------------------
-- 7. TRIGGERS
-- -----------------------------------------------------------------------------
CREATE TRIGGER trg_pacientes_updated_at
BEFORE UPDATE ON public.pacientes
FOR EACH ROW EXECUTE FUNCTION public.fn_actualizar_timestamp();

CREATE TRIGGER trg_evaluaciones_updated_at
BEFORE UPDATE ON public.evaluaciones_medicas
FOR EACH ROW EXECUTE FUNCTION public.fn_actualizar_timestamp();

-- -----------------------------------------------------------------------------
-- 8. VISTA DE CONSULTA DEL EXPEDIENTE COMPLETO
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_expediente_completo_fpf AS
SELECT 
    e.id AS evaluacion_id,
    e.codigo_expediente,
    e.fecha_evaluacion,
    e.numero_recibo,
    e.estado_aptitud,
    e.dictamen_oficial_texto,
    e.temporada_competencia,
    p.id AS paciente_id,
    p.numero_documento AS dni,
    p.nombres,
    p.apellidos,
    p.nombre_completo,
    p.fecha_nacimiento,
    EXTRACT(YEAR FROM AGE(e.fecha_evaluacion, p.fecha_nacimiento))::INT AS edad_calculada,
    p.sexo,
    p.nacionalidad,
    c.nombre AS club_nombre,
    c.pais AS club_pais,
    c.division AS club_division,
    fd.posicion,
    fd.categoria,
    med.nombres || ' ' || med.apellidos AS medico_responsable_nombre,
    med.cmp AS medico_cmp,
    med.rne AS medico_rne,
    med.firma_url AS medico_firma_url,
    ef.peso_kg,
    ef.talla_m,
    ef.imc,
    ef.pulso_lpm,
    ef.presion_sistolica_mmhg || '/' || ef.presion_diastolica_mmhg AS presion_arterial,
    ekg.frecuencia_cardiaca_lpm AS ekg_fc,
    ekg.ritmo AS ekg_ritmo,
    ekg.conclusion_diagnostica AS ekg_conclusion,
    eco.fraccion_eyeccion_porc AS eco_fevi,
    eco.ventriculo_derecho_mm AS eco_vd,
    eco.septum_interventricular_mm AS eco_septum,
    lab_h.hemoglobina_gr_dl,
    lab_h.hematocrito_porc,
    lab_h.leucocitos_mm3,
    lab_h.plaquetas_mm3,
    lab_b.glucosa_basal_mg_dl,
    rx.conclusion_radiologica AS rx_conclusion,
    rx.imagen_placa_url AS rx_placa_url
FROM public.evaluaciones_medicas e
JOIN public.pacientes p ON e.paciente_id = p.id
JOIN public.clubes c ON e.club_id = c.id
LEFT JOIN public.fichas_deportivas fd ON fd.paciente_id = p.id AND fd.club_id = c.id
LEFT JOIN public.personal_salud med ON e.medico_responsable_id = med.id
LEFT JOIN public.examen_fisico ef ON ef.evaluacion_id = e.id
LEFT JOIN public.electrocardiograma_reposo ekg ON ekg.evaluacion_id = e.id
LEFT JOIN public.ecocardiograma_doppler eco ON eco.evaluacion_id = e.id
LEFT JOIN public.laboratorio_hemograma lab_h ON lab_h.evaluacion_id = e.id
LEFT JOIN public.laboratorio_bioquimica lab_b ON lab_b.evaluacion_id = e.id
LEFT JOIN public.radiografia_torax rx ON rx.evaluacion_id = e.id;

-- -----------------------------------------------------------------------------
-- 9. SEGURIDAD ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE public.sedes_clinicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zonas_anatomicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_salud ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fichas_deportivas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluaciones_medicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examen_fisico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamnesis_cardiovascular ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmacos_suplementos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.antecedentes_quirurgicos_lesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salud_femenina ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electrocardiograma_reposo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecocardiograma_doppler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecocardiograma_conclusiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laboratorio_hemograma ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laboratorio_bioquimica ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laboratorio_parasitologico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radiografia_torax ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expediente_archivos_adjuntos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura publica sedes" ON public.sedes_clinicas FOR SELECT USING (true);
CREATE POLICY "Lectura publica clubes" ON public.clubes FOR SELECT USING (true);
CREATE POLICY "Lectura publica zonas" ON public.zonas_anatomicas FOR SELECT USING (true);
CREATE POLICY "Lectura publica staff" ON public.personal_salud FOR SELECT USING (true);
CREATE POLICY "Acceso total pacientes" ON public.pacientes FOR ALL USING (true);
CREATE POLICY "Acceso total fichas_deportivas" ON public.fichas_deportivas FOR ALL USING (true);
CREATE POLICY "Acceso total evaluaciones" ON public.evaluaciones_medicas FOR ALL USING (true);
CREATE POLICY "Acceso total examen_fisico" ON public.examen_fisico FOR ALL USING (true);
CREATE POLICY "Acceso total anamnesis" ON public.anamnesis_cardiovascular FOR ALL USING (true);
CREATE POLICY "Acceso total farmacos" ON public.farmacos_suplementos FOR ALL USING (true);
CREATE POLICY "Acceso total quirurgicos" ON public.antecedentes_quirurgicos_lesiones FOR ALL USING (true);
CREATE POLICY "Acceso total femenino" ON public.salud_femenina FOR ALL USING (true);
CREATE POLICY "Acceso total ekg" ON public.electrocardiograma_reposo FOR ALL USING (true);
CREATE POLICY "Acceso total ecocardiograma" ON public.ecocardiograma_doppler FOR ALL USING (true);
CREATE POLICY "Acceso total eco_conclusiones" ON public.ecocardiograma_conclusiones FOR ALL USING (true);
CREATE POLICY "Acceso total hemograma" ON public.laboratorio_hemograma FOR ALL USING (true);
CREATE POLICY "Acceso total bioquimica" ON public.laboratorio_bioquimica FOR ALL USING (true);
CREATE POLICY "Acceso total parasitologico" ON public.laboratorio_parasitologico FOR ALL USING (true);
CREATE POLICY "Acceso total radiografia" ON public.radiografia_torax FOR ALL USING (true);
CREATE POLICY "Acceso total adjuntos" ON public.expediente_archivos_adjuntos FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- 10. CATÁLOGOS BASE
-- -----------------------------------------------------------------------------
INSERT INTO public.zonas_anatomicas (nombre, orden) VALUES
('Hombro', 1),
('Codo', 2),
('Mano', 3),
('Columna', 4),
('Cadera', 5),
('Pubis', 6),
('Rodilla - Ligamento', 7),
('Rodilla - Meniscos', 8),
('Muslo', 9),
('Tobillo', 10),
('Pie', 11),
('Tendón Aquiles', 12)
ON CONFLICT (nombre) DO NOTHING;

COMMIT;
`;

async function main() {
  try {
    console.log('Connecting to PostgreSQL database...');
    await client.connect();
    console.log('Executing normalized schema migration...');
    await client.query(sql);
    console.log('SCHEMA APPLIED SUCCESSFULLY!');

    const res = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name;
    `);
    console.log('Tables created in public:', res.rows.map(r => r.table_name));

    await client.end();
  } catch (err) {
    console.error('Error executing schema:', err);
    process.exit(1);
  }
}

main();
