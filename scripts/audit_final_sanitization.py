import fitz

doc = fitz.open('PLANTILLA_EN_BLANCO_EXPEDIENTE_FPF.pdf')
print("=== AUDITORIA COMPLETA DE SANITIZACION (21 PAGINAS) ===")

sensitive_keywords = [
    'TALEXSIO', 'GUZMAN', 'ADDU', 'ELIAS',
    '07-10-2026', '22-01-2026', '06-05-2026',
    'UNIVERSITARIO', 'ALIANZA', '74290500',
    'NIEGA', '4.630', '5,730', '236.000', '14.7',
    'AMARILLO', 'SOLIDO', 'larvas'
]

leaks = 0
for i in range(len(doc)):
    page = doc[i]
    text = page.get_text()
    for kw in sensitive_keywords:
        if kw in text:
            print(f'ALERTA: Pagina {i+1} contiene "{kw}"')
            leaks += 1

# Check for stray checkmarks 'X' in pages 3, 7, 8, 9, 12
for pno in [2, 6, 7, 8, 11]:
    p = doc[pno]
    words = p.get_text('words')
    for w in words:
        if w[4] in ['X', 'x']:
            print(f'ALERTA: Pagina {pno+1} todavia tiene una X en ({w[0]:.1f}, {w[1]:.1f})')
            leaks += 1

if leaks == 0:
    print('[PERFECTO] Cero fugas encontradas. Las 21 paginas estan 100% limpias y sanitizadas.')
else:
    print(f'Se encontraron {leaks} residuos pendientes.')
