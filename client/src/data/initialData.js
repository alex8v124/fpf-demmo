// Base data extracted from official FPF/CONMEBOL and Famiheart medical records
import drivePatients from './drivePatients.json';
export { drivePatients };

export const initialStaff = [
  {
    id: 'dario-hernandez',
    name: 'Dr. Darío Hernández Alarcón',
    role: 'Médico Cardiólogo',
    specialty: 'Cardiología Clínica e Imagen Cardíaca',
    cmp: '27503',
    rne: '15620',
    signatureImg: '/assets/firma-cardiologo.jpeg',
    stampText: 'DARIO HERNANDEZ ALARCON\nC.M.P 27503 RNE 15620\nCARDIOLOGIA',
    active: true
  },
  {
    id: 'alfredo-vega',
    name: 'Dr. Alfredo Vega Cisneros',
    role: 'Médico Cardiólogo Evaluador',
    specialty: 'Ecocardiografía y Doppler Cardíaco - Famiheart',
    cmp: '1821',
    rne: '4480',
    signatureImg: '/assets/firma-cardiologo.jpeg',
    stampText: 'ALFREDO VEGA CISNEROS\nCARDIOLOGO\nC.M.P. 1821 - R.N.E. 4480',
    active: true
  },
  {
    id: 'lisbett-hilares',
    name: 'Lic. Lisbett Susan Hilares Moscoso',
    role: 'Tecnóloga Médica',
    specialty: 'Laboratorio Clínico y Anatomía Patológica',
    cmp: '8355',
    ctmp: '8355',
    signatureImg: '/assets/firma-tecnologo.jpeg',
    stampText: 'LISBETT SUSAN HILARES MOSCOSO\nTECNOLOGO MEDICO\nC.T.M.P 8355',
    active: true
  },
  {
    id: 'jorge-vera',
    name: 'Dr. Jorge Vera Ponce de León',
    role: 'Médico Radiólogo',
    specialty: 'Radiología - Ecografista',
    cmp: '29129',
    rne: '21706',
    signatureImg: '/assets/firma-radiologo.jpeg',
    stampText: 'JORGE VERA PONCE DE LEON\nMEDICO RADIOLOGO - ECOGRAFISTA\nCMP 29129 - RNE 21706',
    active: true
  },
  {
    id: 'jorge-aguilar',
    name: 'Dr. Jorge Aguilar Cosme',
    role: 'Médico Radiólogo',
    specialty: 'Radiología e Imagen Diagnóstica',
    cmp: '26465',
    rne: '13976',
    signatureImg: '/assets/firma-radiologo.jpeg',
    stampText: 'DR. AGUILAR COSME JORGE\nC.M.P 26465 R.N.E 13976\nRADIOLOGO',
    active: true
  }
];

export const patientTalexsio = {
  id: 'talexsio-guzman',
  nombres: 'ADDU ELIAS',
  apellidos: 'TALEXSIO GUZMAN',
  nombreCompleto: 'TALEXSIO GUZMAN ADDU ELIAS',
  dni: '74829103',
  fechaNacimiento: '14-04-2005',
  edad: 21,
  sexo: 'M',
  nacionalidad: 'PERUANA',
  posicion: 'DELANTERO / EXTREMO',
  club: 'UNIVERSITARIO',
  paisClub: 'PERU',
  categoria: 'PRIMERA DIVISIÓN / RESERVA',
  fechaEvaluacion: '22-01-2026',
  numeroRecibo: 'REC-2026-08942',
  domicilioClinica: 'AV CONQUISTADORES 1588 SAN ISIDRO',
  estadoAptitud: 'APTO',
  aptitudDetalle: 'SE ENCUENTRA APTO PARA REALIZAR ACTIVIDAD DEPORTIVA ( FUTBOL )',
  medicoEvaluador: 'Dr. Darío Hernández Alarcón',
  medicoCmp: '27503',
  medicoRne: '15620',

  // Somatometría y Examen Físico
  peso: '68.5',
  talla: '1.76',
  imc: '22.1',
  pulso: '58 lpm',
  presionArterial: '115/75 mmHg',
  examenClinicoGeneral: {
    arer: true, // ARER
    aren: true, // AREN
    noSoplos: true,
    viasAereasLibres: true,
    cabeza: 'NORMAL',
    cuello: 'NORMAL',
    toraxCorazon: 'NORMAL',
    toraxPulmonar: 'NORMAL',
    abdomen: 'NORMAL'
  },
  examenMusculoEsqueletico: {
    columna: 'NORMAL',
    codoMano: 'NORMAL',
    caderaIngle: 'NORMAL',
    muslo: 'NORMAL',
    rodilla: 'NORMAL',
    pierna: 'NORMAL'
  },

  // Historia Cardiológica Personal
  cardioPersonal: {
    dolorToracico: false,
    lipotimiaSincope: false,
    disneaFatiga: false,
    soploCardiaco: false,
    hipertensionArterial: false,
    restriccionPrevia: false
  },

  // Historia Cardiológica Familiar
  cardioFamiliar: {
    muerteSubita50: false,
    enfermedadCoronaria50: false,
    cardiopatiaRiesgo: false
  },

  // Historia Cardiológica General
  cardioGeneral: {
    cirugiasNoTrauma: false,
    hospitalizacionesNoQuirurgicas: false,
    tec: false,
    asmaBronquial: false,
    otraPatologia: false
  },

  farmacos: [
    { nombre: 'NINGUNO', dosis: '-', diagnostico: '-' }
  ],
  suplementos: [
    { nombre: 'NINGUNO', dosis: '-', indicacion: '-' }
  ],

  // Operaciones & Lesiones
  operaciones: [
    { zona: 'Hombro', der: false, izq: false, fecha: 'NIEGA' },
    { zona: 'Codo', der: false, izq: false, fecha: 'NIEGA' },
    { zona: 'Mano', der: false, izq: false, fecha: 'NIEGA' },
    { zona: 'Columna', der: false, izq: false, fecha: 'NIEGA' },
    { zona: 'Cadera', der: false, izq: false, fecha: 'NIEGA' },
    { zona: 'Pubis', der: false, izq: false, fecha: 'NIEGA' },
    { zona: 'Rodilla - Ligamento', der: false, izq: false, fecha: 'NIEGA' },
    { zona: 'Rodilla - Meniscos', der: false, izq: false, fecha: 'NIEGA' },
    { zona: 'Muslo', der: false, izq: false, fecha: 'NIEGA' },
    { zona: 'Tobillo', der: false, izq: false, fecha: 'NIEGA' },
    { zona: 'Pie', der: false, izq: false, fecha: 'NIEGA' },
    { zona: 'Tendón Aquiles', der: false, izq: false, fecha: 'NIEGA' }
  ],
  lesionesGraves: [
    { zona: 'Hombro', der: false, izq: false, fecha: 'NIEGA' },
    { zona: 'Codo', der: false, izq: false, fecha: 'NIEGA' },
    { zona: 'Mano', der: false, izq: false, fecha: 'NIEGA' },
    { zona: 'Columna', der: false, izq: false, fecha: 'NIEGA' },
    { zona: 'Cadera', der: false, izq: false, fecha: 'NIEGA' },
    { zona: 'Pubis', der: false, izq: false, fecha: 'NIEGA' },
    { zona: 'Rodilla - Ligamento', der: false, izq: false, fecha: 'NIEGA' }
  ],

  // Electrocardiograma
  ekg: {
    resultadoGeneral: 'NORMAL',
    frecuenciaCardiaca: '53 bpm',
    ritmo: 'Sinusal regular',
    intervaloPR: '122 ms',
    duracionQRS: '84 ms',
    intervaloQT: '419 ms',
    intervaloQTc: '393 ms',
    ejeP: '50.50°',
    ejeQRS: '65.00°',
    ejeT: '33.70°',
    rvs_sv1: '2.61 / 0.99 mV',
    rvs_mas_sv1: '3.60 mV',
    conclusion: 'EKG NORMAL',
    imagen: '/assets/talexsio/ecg.jpeg',
    hallazgosTipo1: false,
    hallazgosLimitrofes: false,
    hallazgosTipo2: false
  },

  // Ecocardiograma
  ecocardiograma: {
    ventriculoDerecho: '22',
    aortaRaiz: '24',
    aortaApertura: '16',
    tractoSalidaVI: '-',
    septumInterventricular: '10',
    viDiastole: '50',
    viSistole: '23',
    paredPosteriorVI: '10',
    auriculaIzquierda: '28',
    auriculaIzquierdaArea: '31',
    auriculaIzquierdaVol: '34',
    auriculaDerechaArea: '26',
    fraccionEyeccion: '57',
    fraccionAcortamiento: '39',
    ondaEMitral: '74',
    ondaAMitral: '66',
    mitralGradienteMax: '1.7',
    aorticaGradienteMax: '2.8',
    areaAortica: '0.7',
    eeMedial: '3/7',
    eeLateral: '6/11',
    valvulaMitral: 'NORMAL',
    valvulaAortica: 'NORMAL',
    valvulaTricuspide: 'NORMAL',
    valvulaPulmonar: 'NORMAL',
    presionSistolicaAP: 'NORMAL',
    interpretacion: {
      cavidades: 'NORMAL',
      grosorMiocardio: 'NORMAL',
      valvulas: 'COMPETENTES',
      patronContractilGlobal: 'CONSERVADO',
      patronContractilSegmentario: 'LIBRE',
      tractoSalida: 'CONSERVADO',
      doppler: 'E > A',
      arteriasAorta: 'CONSERVADO',
      arteriasPulmonar: 'CONSERVADO',
      pericardio: 'NO DERRAME',
      funcionVI: 'CONSERVADO'
    },
    conclusiones: [
      'FUNCION SISTOLICA DE VI CONSERVADA.',
      'CAVIDADES CARDIACAS DENTRO DE LIMITES NORMALES.',
      'NO SIGNO DE HTP.',
      'PERICARDIO LIBRE, NO DERRAME.',
      'ECOCARDIOGRAFIA EN REPOSO DENTRO DE LÍMITES NORMALES.',
      'APTO PARA REALIZAR ACTIVIDADES DEPORTIVAS SIN RESTRICCIONES.'
    ],
    imagenes: [
      '/assets/talexsio/echo-1.jpeg',
      '/assets/talexsio/echo-2.jpeg'
    ]
  },

  // Laboratorio Clínico
  laboratorio: {
    hemograma: {
      globulosRojos: '4,630,000.00',
      hemoglobina: '14.7',
      hematocrito: '43',
      leucocitos: '5,730.00',
      plaquetas: '236,000.00',
      vcm: '89',
      hcm: '28',
      chcm: '32',
      linfocitos: '26',
      monocitos: '6',
      eosinofilos: '2',
      basofilos: '0',
      segmentados: '66',
      abastonados: '0'
    },
    bioquimica: {
      glucosaBasal: '88',
      creatinina: '0.9',
      sodio: '139',
      potasio: '3.5',
      calcio: '9.4',
      fosforo: '3.8',
      colesterolTotal: '162',
      colesterolLDL: '98',
      colesterolHDL: '52',
      trigliceridos: '110',
      proteinaCReactiva: '0.4',
      ferritina: '145'
    },
    parasitologico: {
      color: 'AMARILLO',
      consistencia: 'SOLIDO',
      parasitos: 'No se observa quistes, larvas ni huevos de parásitos',
      mucosidad: 'AUSENTE',
      otros: 'NEGATIVO'
    },
    tecnologoMedico: 'LISBETT SUSAN HILARES MOSCOSO',
    ctmp: '8355'
  },

  // Radiografía de Tórax
  radiografia: {
    incidencia: 'PA (Póstero-Anterior)',
    transparenciaPulmonar: 'Conservada en ambos campos pulmonares',
    senosCostoDiafragmaticos: 'Libres',
    indiceCardiotoracico: 'Dentro de límites normales',
    partesBlandas: 'Conservadas',
    conclusion: 'Estudio radiográfico dentro de límites normales',
    radiologo: 'JORGE VERA PONCE DE LEON',
    cmp: '29129',
    rne: '21706',
    imagenPlaca: '/assets/talexsio/rayosx.jpeg'
  }
};

export const patientCarlos = {
  id: 'carlos-ponce',
  nombres: 'CARLOS',
  apellidos: 'PONCE ECHEVARRIA',
  nombreCompleto: 'PONCE ECHEVARRIA CARLOS',
  dni: '72194850',
  fechaNacimiento: '18-09-2004',
  edad: 22,
  sexo: 'M',
  nacionalidad: 'PERUANA',
  posicion: 'VOLANTE MIXTO',
  club: 'ZUÑIGA',
  paisClub: 'PERU',
  categoria: 'COPA PERÚ / RESERVA',
  fechaEvaluacion: '22-01-2026',
  numeroRecibo: 'REC-2026-07412',
  domicilioClinica: 'AV CONQUISTADORES 1588 SAN ISIDRO',
  estadoAptitud: 'APTO',
  aptitudDetalle: 'SE ENCUENTRA APTO PARA REALIZAR ACTIVIDAD DEPORTIVA ( FUTBOL )',
  medicoEvaluador: 'ALFREDO VEGA CISNEROS',
  medicoCmp: '27503',
  medicoRne: '15620',

  peso: '71.2',
  talla: '1.78',
  imc: '22.5',
  pulso: '60 lpm',
  presionArterial: '120/80 mmHg',
  examenClinicoGeneral: {
    arer: true,
    aren: true,
    noSoplos: true,
    viasAereasLibres: true,
    cabeza: 'NORMAL',
    cuello: 'NORMAL',
    toraxCorazon: 'NORMAL',
    toraxPulmonar: 'NORMAL',
    abdomen: 'NORMAL'
  },
  examenMusculoEsqueletico: {
    columna: 'NORMAL',
    codoMano: 'NORMAL',
    caderaIngle: 'NORMAL',
    muslo: 'NORMAL',
    rodilla: 'NORMAL',
    pierna: 'NORMAL'
  },

  cardioPersonal: {
    dolorToracico: false,
    lipotimiaSincope: false,
    disneaFatiga: false,
    soploCardiaco: false,
    hipertensionArterial: false,
    restriccionPrevia: false
  },
  cardioFamiliar: {
    muerteSubita50: false,
    enfermedadCoronaria50: false,
    cardiopatiaRiesgo: false
  },
  cardioGeneral: {
    cirugiasNoTrauma: false,
    hospitalizacionesNoQuirurgicas: false,
    tec: false,
    asmaBronquial: false,
    otraPatologia: false
  },

  farmacos: [
    { nombre: 'NINGUNO', dosis: '-', diagnostico: '-' }
  ],
  suplementos: [
    { nombre: 'NINGUNO', dosis: '-', indicacion: '-' }
  ],

  operaciones: [
    { zona: 'Hombro', der: false, izq: false, fecha: 'NIEGA' },
    { zona: 'Codo', der: false, izq: false, fecha: 'NIEGA' },
    { zona: 'Mano', der: false, izq: false, fecha: 'NIEGA' },
    { zona: 'Columna', der: false, izq: false, fecha: 'NIEGA' },
    { zona: 'Cadera', der: false, izq: false, fecha: 'NIEGA' },
    { zona: 'Pubis', der: false, izq: false, fecha: 'NIEGA' },
    { zona: 'Rodilla - Ligamento', der: false, izq: false, fecha: 'NIEGA' }
  ],
  lesionesGraves: [
    { zona: 'Hombro', der: false, izq: false, fecha: 'NIEGA' },
    { zona: 'Codo', der: false, izq: false, fecha: 'NIEGA' },
    { zona: 'Mano', der: false, izq: false, fecha: 'NIEGA' }
  ],

  ekg: {
    resultadoGeneral: 'NORMAL',
    frecuenciaCardiaca: '55 bpm',
    ritmo: 'Sinusal normal',
    intervaloPR: '130 ms',
    duracionQRS: '86 ms',
    intervaloQT: '410 ms',
    intervaloQTc: '390 ms',
    ejeP: '52°',
    ejeQRS: '60°',
    ejeT: '40°',
    rvs_sv1: '2.50 / 0.95 mV',
    rvs_mas_sv1: '3.45 mV',
    conclusion: 'EKG NORMAL',
    imagen: '/assets/electrocardiograma.jpeg',
    hallazgosTipo1: false,
    hallazgosLimitrofes: false,
    hallazgosTipo2: false
  },

  ecocardiograma: {
    ventriculoDerecho: '24',
    aortaRaiz: '25',
    aortaApertura: '17',
    tractoSalidaVI: '-',
    septumInterventricular: '10',
    viDiastole: '44',
    viSistole: '24',
    paredPosteriorVI: '10',
    auriculaIzquierda: '32',
    auriculaIzquierdaArea: '30',
    auriculaIzquierdaVol: '32',
    auriculaDerechaArea: '25',
    fraccionEyeccion: '64',
    fraccionAcortamiento: '33',
    ondaEMitral: '76',
    ondaAMitral: '62',
    mitralGradienteMax: '1.2',
    aorticaGradienteMax: '2.4',
    areaAortica: '0.7',
    eeMedial: '3/6',
    eeLateral: '5/10',
    valvulaMitral: 'NORMAL',
    valvulaAortica: 'NORMAL',
    valvulaTricuspide: 'NORMAL',
    valvulaPulmonar: 'NORMAL',
    presionSistolicaAP: 'NORMAL',
    interpretacion: {
      cavidades: 'NORMAL',
      grosorMiocardio: 'NORMAL',
      valvulas: 'COMPETENTES',
      patronContractilGlobal: 'CONSERVADO',
      patronContractilSegmentario: 'LIBRE',
      tractoSalida: 'CONSERVADO',
      doppler: 'E > A',
      arteriasAorta: 'CONSERVADO',
      arteriasPulmonar: 'CONSERVADO',
      pericardio: 'NO DERRAME',
      funcionVI: 'CONSERVADO'
    },
    conclusiones: [
      'FUNCION SISTOLICA DE VI CONSERVADA.',
      'CAVIDADES CARDIACAS DENTRO DE LIMITES NORMALES.',
      'NO SIGNO DE HTP.',
      'PERICARDIO LIBRE, NO DERRAME.',
      'ECOCARDIOGRAFIA EN REPOSO DENTRO DE LÍMITES NORMALES.',
      'APTO PARA REALIZAR ACTIVIDADES DEPORTIVAS SIN RESTRICCIONES.'
    ],
    imagenes: [
      '/assets/ecocardiograma-1.png',
      '/assets/ecocardiograma-2.png'
    ]
  },

  laboratorio: {
    hemograma: {
      globulosRojos: '4,620,000.00',
      hemoglobina: '14.7',
      hematocrito: '43',
      leucocitos: '6,241.00',
      plaquetas: '199,000.00',
      vcm: '88',
      hcm: '29',
      chcm: '33',
      linfocitos: '28',
      monocitos: '5',
      eosinofilos: '2',
      basofilos: '0',
      segmentados: '65',
      abastonados: '0'
    },
    bioquimica: {
      glucosaBasal: '85',
      creatinina: '0.85',
      sodio: '140',
      potasio: '3.6',
      calcio: '9.2',
      fosforo: '3.6',
      colesterolTotal: '155',
      colesterolLDL: '90',
      colesterolHDL: '54',
      trigliceridos: '105',
      proteinaCReactiva: '0.3',
      ferritina: '150'
    },
    parasitologico: {
      color: 'AMARILLO',
      consistencia: 'SOLIDO',
      parasitos: 'No se observa quistes, larvas ni huevos de parásitos',
      mucosidad: 'AUSENTE',
      otros: 'NEGATIVO'
    },
    tecnologoMedico: 'LISBETT SUSAN HILARES MOSCOSO',
    ctmp: '8355'
  },

  radiografia: {
    incidencia: 'PA (Póstero-Anterior)',
    transparenciaPulmonar: 'Conservada en ambos campos pulmonares',
    senosCostoDiafragmaticos: 'Libres',
    indiceCardiotoracico: 'Dentro de límites normales',
    partesBlandas: 'Conservadas',
    conclusion: 'Estudio radiográfico dentro de límites normales',
    radiologo: 'DR. AGUILAR COSME JORGE',
    cmp: '26465',
    rne: '13976',
    imagenPlaca: '/assets/radiografia-torax.jpeg'
  }
};

export const blankPatientTemplate = {
  id: 'plantilla-en-blanco',
  nombres: '',
  apellidos: '',
  nombreCompleto: '',
  dni: '',
  fechaNacimiento: '',
  edad: '',
  sexo: '',
  nacionalidad: 'PERUANA',
  posicion: '',
  club: '',
  paisClub: 'PERU',
  categoria: '',
  fechaEvaluacion: '19-10-2026',
  numeroRecibo: '',
  domicilioClinica: 'AV CONQUISTADORES 1588 SAN ISIDRO',
  estadoAptitud: 'PENDIENTE',
  aptitudDetalle: '',
  medicoEvaluador: 'DARIO HERNANDEZ',
  medicoCmp: '27503',
  medicoRne: '15620',

  peso: '',
  talla: '',
  imc: '',
  pulso: '',
  presionArterial: '',
  examenClinicoGeneral: {
    arer: false,
    aren: false,
    noSoplos: false,
    viasAereasLibres: false,
    cabeza: '',
    cuello: '',
    toraxCorazon: '',
    toraxPulmonar: '',
    abdomen: ''
  },
  examenMusculoEsqueletico: {
    columna: '',
    codoMano: '',
    caderaIngle: '',
    muslo: '',
    rodilla: '',
    pierna: ''
  },

  cardioPersonal: {
    dolorToracico: false,
    lipotimiaSincope: false,
    disneaFatiga: false,
    soploCardiaco: false,
    hipertensionArterial: false,
    restriccionPrevia: false
  },
  cardioFamiliar: {
    muerteSubita50: false,
    enfermedadCoronaria50: false,
    cardiopatiaRiesgo: false
  },
  cardioGeneral: {
    cirugiasNoTrauma: false,
    hospitalizacionesNoQuirurgicas: false,
    tec: false,
    asmaBronquial: false,
    otraPatologia: false
  },

  farmacos: [
    { nombre: '', dosis: '', diagnostico: '' }
  ],
  suplementos: [
    { nombre: '', dosis: '', indicacion: '' }
  ],

  operaciones: [
    { zona: 'Hombro', der: false, izq: false, fecha: '' },
    { zona: 'Codo', der: false, izq: false, fecha: '' },
    { zona: 'Mano', der: false, izq: false, fecha: '' },
    { zona: 'Columna', der: false, izq: false, fecha: '' },
    { zona: 'Cadera', der: false, izq: false, fecha: '' },
    { zona: 'Pubis', der: false, izq: false, fecha: '' },
    { zona: 'Rodilla - Ligamento', der: false, izq: false, fecha: '' },
    { zona: 'Rodilla - Meniscos', der: false, izq: false, fecha: '' },
    { zona: 'Muslo', der: false, izq: false, fecha: '' },
    { zona: 'Tobillo', der: false, izq: false, fecha: '' },
    { zona: 'Pie', der: false, izq: false, fecha: '' },
    { zona: 'Tendón Aquiles', der: false, izq: false, fecha: '' }
  ],
  lesionesGraves: [
    { zona: 'Hombro', der: false, izq: false, fecha: '' },
    { zona: 'Codo', der: false, izq: false, fecha: '' },
    { zona: 'Mano', der: false, izq: false, fecha: '' },
    { zona: 'Columna', der: false, izq: false, fecha: '' },
    { zona: 'Cadera', der: false, izq: false, fecha: '' },
    { zona: 'Pubis', der: false, izq: false, fecha: '' },
    { zona: 'Rodilla - Ligamento', der: false, izq: false, fecha: '' }
  ],

  ekg: {
    resultadoGeneral: '',
    frecuenciaCardiaca: '',
    ritmo: '',
    intervaloPR: '',
    duracionQRS: '',
    intervaloQT: '',
    intervaloQTc: '',
    ejeP: '',
    ejeQRS: '',
    ejeT: '',
    rvs_sv1: '',
    rvs_mas_sv1: '',
    conclusion: '',
    imagen: '',
    hallazgosTipo1: false,
    hallazgosLimitrofes: false,
    hallazgosTipo2: false
  },

  ecocardiograma: {
    ventriculoDerecho: '',
    aortaRaiz: '',
    aortaApertura: '',
    tractoSalidaVI: '',
    septumInterventricular: '',
    viDiastole: '',
    viSistole: '',
    paredPosteriorVI: '',
    auriculaIzquierda: '',
    auriculaIzquierdaArea: '',
    auriculaIzquierdaVol: '',
    auriculaDerechaArea: '',
    fraccionEyeccion: '',
    fraccionAcortamiento: '',
    ondaEMitral: '',
    ondaAMitral: '',
    mitralGradienteMax: '',
    aorticaGradienteMax: '',
    areaAortica: '',
    eeMedial: '',
    eeLateral: '',
    valvulaMitral: '',
    valvulaAortica: '',
    valvulaTricuspide: '',
    valvulaPulmonar: '',
    presionSistolicaAP: '',
    interpretacion: {
      cavidades: '',
      grosorMiocardio: '',
      valvulas: '',
      patronContractilGlobal: '',
      patronContractilSegmentario: '',
      tractoSalida: '',
      doppler: '',
      arteriasAorta: '',
      arteriasPulmonar: '',
      pericardio: '',
      funcionVI: ''
    },
    conclusiones: [],
    imagenes: []
  },

  laboratorio: {
    hemograma: {
      globulosRojos: '',
      hemoglobina: '',
      hematocrito: '',
      leucocitos: '',
      plaquetas: '',
      vcm: '',
      hcm: '',
      chcm: '',
      linfocitos: '',
      monocitos: '',
      eosinofilos: '',
      basofilos: '',
      segmentados: '',
      abastonados: ''
    },
    bioquimica: {
      glucosaBasal: '',
      creatinina: '',
      sodio: '',
      potasio: '',
      calcio: '',
      fosforo: '',
      colesterolTotal: '',
      colesterolLDL: '',
      colesterolHDL: '',
      trigliceridos: '',
      proteinaCReactiva: '',
      ferritina: ''
    },
    parasitologico: {
      color: '',
      consistencia: '',
      parasitos: '',
      mucosidad: '',
      otros: ''
    },
    tecnologoMedico: 'LISBETT SUSAN HILARES MOSCOSO',
    ctmp: '8355'
  },

  radiografia: {
    incidencia: 'PA (Póstero-Anterior)',
    transparenciaPulmonar: '',
    senosCostoDiafragmaticos: '',
    indiceCardiotoracico: '',
    partesBlandas: '',
    conclusion: '',
    radiologo: 'JORGE VERA PONCE DE LEON',
    cmp: '29129',
    rne: '21706',
    imagenPlaca: ''
  }
};

export const samplePlayersList = drivePatients;

export const cloudDriveFiles = [
  {
    name: 'TALEXSIO GUZMAN ADDU ELIAS.pdf',
    size: '1.2 MB',
    type: 'pdf',
    date: '19/10/2026 00:54',
    sync: 'Sincronizado',
    status: 'Listo',
    source: 'Google Drive Folder'
  },
  {
    name: 'PONCE ECHEVARRIA CARLOS.docx',
    size: '3.8 MB',
    type: 'docx',
    date: '19/10/2026 00:54',
    sync: 'Sincronizado',
    status: 'Listo',
    source: 'Google Drive Folder'
  },
  {
    name: 'PLANTILLA_EN_BLANCO_EVALUACION_FPF.pdf',
    size: '890 KB',
    type: 'pdf',
    date: '18/10/2026 22:30',
    sync: 'Disponible',
    status: 'Plantilla Base',
    source: 'Google Drive Folder'
  },
  {
    name: 'FORMATO_CONMEBOL_OFICIAL_2026.docx',
    size: '2.1 MB',
    type: 'docx',
    date: '18/10/2026 21:15',
    sync: 'Disponible',
    status: 'Plantilla Base',
    source: 'Google Drive Folder'
  }
];

export const pagesCatalog = [
  { number: 1, title: 'Certificado Médico FPF', section: 'Certificación FPF', tag: 'Aptitud' },
  { number: 2, title: 'Evaluación Pre-Competencia', section: 'Ficha Jugador', tag: 'Datos' },
  { number: 3, title: 'Historia Pre-Participativa I', section: 'Cardiovascular', tag: 'Anamnesis' },
  { number: 4, title: 'Historia Pre-Participativa II', section: 'Fármacos / Suplementos', tag: 'Anamnesis' },
  { number: 5, title: 'Sistema Músculo-Esquelético I', section: 'Operaciones / Lesiones', tag: 'Músculo-Esquelético' },
  { number: 6, title: 'Sistema Músculo-Esquelético II', section: 'Salud Femenina / Articular', tag: 'Músculo-Esquelético' },
  { number: 7, title: 'Examen Físico Pre-Participativo', section: 'Somatometría & Signos', tag: 'Examen Físico' },
  { number: 8, title: 'ECG Reposo - Protocolo CONMEBOL', section: 'Criterios Tipo 1 / Limítrofes', tag: 'Cardiología' },
  { number: 9, title: 'Ecocardiograma M-2D & Doppler', section: 'Mediciones Cavidades', tag: 'Cardiología' },
  { number: 10, title: 'Ecocardiograma Conclusiones', section: 'Válvulas & Dictamen', tag: 'Cardiología' },
  { number: 11, title: 'Resultados Análisis de Sangre', section: 'Bioquímica & Electrolitos', tag: 'Laboratorio' },
  { number: 12, title: 'Resumen Pre-Participativa', section: 'Dictamen Oficial FPF/CONMEBOL', tag: 'Comisión Médica' },
  { number: 13, title: 'Certificado Médico Famiheart', section: 'Aptitud Institucional Famiheart', tag: 'Certificado' },
  { number: 14, title: 'Informe Ecocardiográfico', section: 'Protocolo Cardiológico Extenso', tag: 'Cardiología' },
  { number: 15, title: 'Ecocardiograma - Ultrasonido', section: 'Capturas Doppler / Modo M', tag: 'Imágenes' },
  { number: 16, title: 'Electrocardiograma - Trazado', section: 'Trazo ECG 12 Derivaciones', tag: 'Imágenes' },
  { number: 17, title: 'Hemograma Completo', section: 'Serie Roja / Leucocitaria', tag: 'Laboratorio' },
  { number: 18, title: 'Bioquímica Sanguínea', section: 'Glucosa Basal / Perfil', tag: 'Laboratorio' },
  { number: 19, title: 'Parasitológico Seriado', section: 'Examen Coproparasitológico', tag: 'Laboratorio' },
  { number: 20, title: 'Informe Radiografía de Tórax', section: 'Reporte Radiológico PA', tag: 'Radiología' },
  { number: 21, title: 'Radiografía de Tórax - Placa', section: 'Placa Digital de Rayos X', tag: 'Imágenes' }
];
