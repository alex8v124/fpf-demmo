"""
Builds the clean 18-page official templates directly from PONCE ECHEVARRIA CARLOS.docx:
1. PLANTILLA_EN_BLANCO_EXPEDIENTE_FPF.docx (100% blank clean form, stamps & letterheads intact)
2. client/public/PLANTILLA_OFICIAL_CON_SELLOS.docx (parameterized {{...}} master with sanitized media)
3. Sanitizes diagnostic sample images in client/public/assets/ (zero third-party patient leaks)
"""
import io
import os
import re
import shutil
import zipfile
import lxml.etree as ET
from PIL import Image, ImageDraw

ROOT_DIR = r"C:\Users\alex0\Downloads\chamba"
SRC_DOCX = os.path.join(ROOT_DIR, "PONCE ECHEVARRIA CARLOS.docx")
PUBLIC_DIR = os.path.join(ROOT_DIR, "client", "public")
ASSETS_DIR = os.path.join(PUBLIC_DIR, "assets")
SCRATCH_DIR = r"C:\Users\alex0\.gemini\antigravity\brain\d1c8c2a7-46de-479c-a2b6-29d1cc073fa1\scratch"

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
MC_NS = "http://schemas.openxmlformats.org/markup-compatibility/2006"
A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"
XML_SPACE = "{http://www.w3.org/XML/1998/namespace}space"

NS = {"w": W_NS, "mc": MC_NS, "a": A_NS}


def set_paragraph_single_text(p_elem, new_text):
    """Collapses all direct w:r text runs in p_elem into the first text run."""
    runs = p_elem.findall("w:r", NS)
    text_runs = [r for r in runs if r.findall("w:t", NS)]
    if not text_runs:
        r = ET.SubElement(p_elem, f"{{{W_NS}}}r")
        t = ET.SubElement(r, f"{{{W_NS}}}t")
        if new_text != new_text.strip():
            t.set(XML_SPACE, "preserve")
        t.text = new_text
        return
    first_r = text_runs[0]
    t_elems = first_r.findall("w:t", NS)
    for extra_t in t_elems[1:]:
        first_r.remove(extra_t)
    t0 = t_elems[0]
    if new_text != new_text.strip():
        t0.set(XML_SPACE, "preserve")
    t0.text = new_text
    for extra_r in text_runs[1:]:
        p_elem.remove(extra_r)


def set_ac_textbox_text(ac_elem, new_text):
    """Updates BOTH mc:Choice and mc:Fallback w:txbxContent inside an mc:AlternateContent."""
    for txbx in ac_elem.findall(".//w:txbxContent", NS):
        p_list = txbx.findall("w:p", NS)
        if not p_list:
            p = ET.SubElement(txbx, f"{{{W_NS}}}p")
            p_list = [p]
        set_paragraph_single_text(p_list[0], new_text)
        for extra_p in p_list[1:]:
            txbx.remove(extra_p)


def get_ac_text(ac_elem):
    txbx = ac_elem.find(".//mc:Choice//w:txbxContent", NS)
    if txbx is None:
        txbx = ac_elem.find(".//w:txbxContent", NS)
    if txbx is None:
        return ""
    return "".join(t.text for t in txbx.findall(".//w:t", NS) if t.text)


def sanitize_core_xml(core_bytes):
    root = ET.fromstring(core_bytes)
    for elem in root.iter():
        local = elem.tag.split("}")[-1]
        if local == "creator":
            elem.text = "Famiheart S.A.C. - Comisión Médica FPF"
        elif local == "lastModifiedBy":
            elem.text = "Famiheart S.A.C."
        elif local in ("title", "subject", "description", "keywords"):
            elem.text = ""
    return ET.tostring(root, xml_declaration=True, encoding="UTF-8", standalone=True)


def build_sanitized_media(src_zip):
    """Returns dict of clean media bytes (image17.png, image18.png, image19.png, image26.jpeg)
    and transparent PNG bytes for blank mode."""
    clean = {}

    # image17.png: crop top 55px (removes HERNANDEZ AGUILAR & 2022-02-18)
    im17 = Image.open(io.BytesIO(src_zip.read("word/media/image17.png")))
    im17_c = im17.crop((0, 55, im17.width, im17.height))
    buf = io.BytesIO()
    im17_c.save(buf, format="PNG")
    clean["word/media/image17.png"] = buf.getvalue()

    # image18.png: crop top 53px (removes HERNANDEZ AGUILAR & 2022-02-18)
    im18 = Image.open(io.BytesIO(src_zip.read("word/media/image18.png")))
    im18_c = im18.crop((0, 53, im18.width, im18.height))
    buf = io.BytesIO()
    im18_c.save(buf, format="PNG")
    clean["word/media/image18.png"] = buf.getvalue()

    # image19.png: wipe ADAN AGUILAR CARLOS, Age:17Y, Date:19/03/2025, and raw Prompt text
    im19 = Image.open(io.BytesIO(src_zip.read("word/media/image19.png"))).convert("RGB")
    d19 = ImageDraw.Draw(im19)
    d19.rectangle([28, 14, 152, 49], fill=(255, 255, 255))
    d19.rectangle([385, 20, 455, 46], fill=(255, 255, 255))
    d19.rectangle([470, 52, 608, 78], fill=(255, 255, 255))
    d19.rectangle([252, 738, 560, 810], fill=(255, 255, 255))
    buf = io.BytesIO()
    im19.save(buf, format="PNG")
    clean["word/media/image19.png"] = buf.getvalue()

    # image26.jpeg: crop top 118px (removes ALAYO MARTINEZ MATIAS, DNI, JMG, 2023-01-13)
    im26 = Image.open(io.BytesIO(src_zip.read("word/media/image26.jpeg")))
    im26_c = im26.crop((0, 118, im26.width, im26.height))
    buf = io.BytesIO()
    im26_c.save(buf, format="JPEG", quality=95)
    clean["word/media/image26.jpeg"] = buf.getvalue()

    # Transparent 10x10 PNG for blank template slots (preserves exact layout & watermark)
    trans_im = Image.new("RGBA", (10, 10), (255, 255, 255, 0))
    tbuf = io.BytesIO()
    trans_im.save(tbuf, format="PNG")
    transparent_png = tbuf.getvalue()

    return clean, transparent_png


def clear_srcrects_on_diagnostic_images(body):
    for idx in (148, 152, 213):
        for sr in body[idx].findall(".//a:srcRect", NS):
            sr.attrib.clear()


def remove_stray_pipe_on_p6(body):
    p31 = body[31]
    for r in list(p31.findall("w:r", NS)):
        txt = "".join(t.text for t in r.findall("w:t", NS) if t.text)
        if txt.strip() == "|":
            p31.remove(r)


def transform_for_parameterized_master(doc_bytes):
    root = ET.fromstring(doc_bytes)
    body = root.find("w:body", NS)

    clear_srcrects_on_diagnostic_images(body)
    remove_stray_pipe_on_p6(body)

    # Page 1: Cover boxes
    # body[14] AC[1] -> {{APELLIDOS}}
    acs_14 = body[14].findall(".//mc:AlternateContent", NS)
    set_ac_textbox_text(acs_14[1], "{{APELLIDOS}}")

    # body[15] boxes: AC[0]=POSICION, AC[1]=CLUB, AC[2]=PAIS_CLUB, AC[8]=FECHA_NAC, AC[12]=NOMBRES
    acs_15 = body[15].findall(".//mc:AlternateContent", NS)
    set_ac_textbox_text(acs_15[0], "{{POSICION}}")
    set_ac_textbox_text(acs_15[1], "{{CLUB}}")
    set_ac_textbox_text(acs_15[2], "{{PAIS_CLUB}}")
    set_ac_textbox_text(acs_15[8], "{{FECHA_NAC}}")
    set_ac_textbox_text(acs_15[12], "{{NOMBRES}}")

    # Page 6: Peso & Talla
    acs_31 = body[31].findall(".//mc:AlternateContent", NS)
    set_ac_textbox_text(acs_31[44], "{{TALLA}}")
    set_ac_textbox_text(acs_31[45], "{{PESO}}")

    # Page 11: Keep body[50] intact (contains 2 X paragraphs inside one tall textbox), set Fecha -> {{FECHA}} in body[65]
    acs_65 = body[65].findall(".//mc:AlternateContent", NS)
    set_ac_textbox_text(acs_65[0], "{{FECHA}}")

    # Page 12: Certificado Famiheart
    # body[77]: preserve bold run[4] for {{NOMBRE_COMPLETO}}
    runs_77 = body[77].findall("w:r", NS)
    for r in runs_77:
        txt = "".join(t.text for t in r.findall("w:t", NS) if t.text)
        if "PONCE ECHEVARRIA CARLOS" in txt:
            r.findall("w:t", NS)[0].text = "{{NOMBRE_COMPLETO}}"
    set_paragraph_single_text(body[81], "{{FECHA}}")

    # Page 13: Informe Ecocardiográfico
    runs_97 = body[97].findall("w:r", NS)
    for r in runs_97:
        txt = "".join(t.text for t in r.findall("w:t", NS) if t.text)
        if "PONCE ECHEVARRIA CARLOS" in txt:
            r.findall("w:t", NS)[0].text = "{{NOMBRE_COMPLETO}}"
    set_paragraph_single_text(body[98], "Fecha :   {{FECHA}}")

    # Page 15: ECG 12 derivaciones floating textboxes
    acs_160 = body[160].findall(".//mc:AlternateContent", NS)
    set_ac_textbox_text(acs_160[0], "NAME: {{NOMBRE_COMPLETO}}")
    acs_162 = body[162].findall(".//mc:AlternateContent", NS)
    set_ac_textbox_text(acs_162[0], "              DATE: {{FECHA}}")

    # Page 16: Hemograma table (body[178])
    tbl = body[178]
    rows = tbl.findall("w:tr", NS)
    # Row 0 cell 1 -> {{NOMBRE_COMPLETO}}
    r0_cells = rows[0].findall("w:tc", NS)
    set_paragraph_single_text(r0_cells[1].find("w:p", NS), "{{NOMBRE_COMPLETO}}")
    # Row 3 cell 6 (nested w:tbl) -> {{FECHA}}
    r3_cells = rows[3].findall("w:tc", NS)
    for sub_p in r3_cells[6].findall(".//w:p", NS):
        ptxt = "".join(t.text for t in sub_p.findall(".//w:t", NS) if t.text)
        if "22-01-2026" in ptxt:
            set_paragraph_single_text(sub_p, "{{FECHA}}")

    # Page 17: Informe Radiografía de Tórax
    runs_185 = body[185].findall("w:r", NS)
    for r in runs_185:
        txt = "".join(t.text for t in r.findall("w:t", NS) if t.text)
        if "PONCE ECHEVARRIA CARLOS" in txt:
            r.findall("w:t", NS)[0].text = "{{NOMBRE_COMPLETO}}"
    runs_186 = body[186].findall("w:r", NS)
    for r in runs_186:
        txt = "".join(t.text for t in r.findall("w:t", NS) if t.text)
        if "22-01-2026" in txt:
            r.findall("w:t", NS)[0].text = "{{FECHA}}"

    return ET.tostring(root, xml_declaration=True, encoding="UTF-8", standalone=True)


def transform_for_blank_template(doc_bytes, empty_p12_body=False):
    root = ET.fromstring(doc_bytes)
    body = root.find("w:body", NS)

    clear_srcrects_on_diagnostic_images(body)
    remove_stray_pipe_on_p6(body)

    # Static labels on Page 1 that MUST remain untouched
    STATIC_P1_LABELS = {
        "APELLIDOS",
        "NOMBRES",
        "PAIS DEL CLUB",
        "CLUB LOCAL / SELECCION",
        "POSICIÓN JUGADOR/A",
        "FECHA DE NACIMIENTO",
    }
    # Institutional constants on Page 11 that remain on the form
    STATIC_P11_LABELS = {
        "ALFREDO VEGA CISNEROS",
        "FAMIHEART",
    }

    # Clear all dynamic floating textboxes across the entire 18-page document
    for idx, child in enumerate(body):
        for ac in child.findall(".//mc:AlternateContent", NS):
            cur = get_ac_text(ac).strip()
            if not cur:
                continue
            if idx in (14, 15) and cur in STATIC_P1_LABELS:
                continue
            if idx in (61, 63) and cur in STATIC_P11_LABELS:
                continue
            set_ac_textbox_text(ac, "")

    # Page 11: clear 'SI' in body[57] (keep space so paragraph height stays identical)
    set_paragraph_single_text(body[57], " ")

    # Page 12: Certificado Famiheart
    if empty_p12_body:
        set_paragraph_single_text(body[77], " ")
        set_paragraph_single_text(body[79], " ")
        set_paragraph_single_text(body[81], " ")
    else:
        for r in body[77].findall("w:r", NS):
            txt = "".join(t.text for t in r.findall("w:t", NS) if t.text)
            if "PONCE ECHEVARRIA CARLOS" in txt:
                # remove bold for the blank line
                rpr = r.find("w:rPr", NS)
                if rpr is not None:
                    for b_tag in rpr.findall("w:b", NS) + rpr.findall("w:bCs", NS):
                        rpr.remove(b_tag)
                t0 = r.findall("w:t", NS)[0]
                t0.set(XML_SPACE, "preserve")
                t0.text = "____________________________"
        set_paragraph_single_text(body[81], " ")

    # Page 13: Informe Ecocardiográfico
    # Keep "Sexo : MASCULINO" aligned at exact horizontal offset
    for r in body[97].findall("w:r", NS):
        txt = "".join(t.text for t in r.findall("w:t", NS) if t.text)
        if "PONCE ECHEVARRIA CARLOS" in txt:
            t0 = r.findall("w:t", NS)[0]
            t0.set(XML_SPACE, "preserve")
            t0.text = "                                            "
    set_paragraph_single_text(body[98], "Fecha :   ")

    # Clean filled Echo numbers on Page 13 (body[102..118]) to crisp blank underscores
    blank_echo_lines = {
        102: "Ventrículo derecho ____________________ mm  (0.8 – 2.7)                  Aorta Raiz___________mm (2.2 – 3.6) ",
        103: "Septum Interventricular _______________ mm (8 – 11)                           Aorta apertura ______ mm    (15 – 26)",
        104: "V.I Diástole ________________________ mm (35 – 57)                         Tracto de Salida VI _______mm (             )",
        105: "V.I sístole _________________________ mm (          )                             V Mitral Exclusión _______ mm (20 – 30)",
        106: "Pared Posterior V.I__________________mm (6 – 11)                               V Mitral Pendiente ___________ Mseg",
        107: "Aurícula Izquierda __________________mm (22 – 40)                        Pendiente E – S ___________ ____ (           )",
        110: "Fracción de Eyección ______________ % (55 – 80)                              Onda E (mitral) _________cm/s",
        111: "Fracción de Acortamiento _________ % (30 – 48)                               Onda A (mitral) __________cm/s",
        117: "Mitral diastos Gradiente Max ___________ Gradiente Medio ______ THP ______ área Mitral____",
        118: "Aortica sístole Gradiente Max __________ Gradiente Medio _____ VMXTSVI ____ área Aortica_____",
    }
    for b_idx, clean_line in blank_echo_lines.items():
        set_paragraph_single_text(body[b_idx], clean_line)

    # Page 16: Hemograma Completo table (body[178])
    tbl = body[178]
    rows = tbl.findall("w:tr", NS)
    # Clear patient name (Row 0, c1) and date (Row 3, c6 nested w:tbl)
    set_paragraph_single_text(rows[0].findall("w:tc", NS)[1].find("w:p", NS), "")
    for sub_p in rows[3].findall("w:tc", NS)[6].findall(".//w:p", NS):
        ptxt = "".join(t.text for t in sub_p.findall(".//w:t", NS) if t.text)
        if "22-01-2026" in ptxt:
            set_paragraph_single_text(sub_p, "")
    # Clear numeric result values in rows 7..26 while preserving ANALISIS, UND, and RANGO REFERENCIAL
    result_cells = [
        (7, 1),   # 4.620,000.00
        (8, 2),   # 13.8
        (10, 2),  # 42
        (12, 3),  # 6,241.00
        (14, 2),  # 199.000
        (16, 3),  # 97
        (17, 3),  # 30
        (18, 3),  # 31
        (21, 3),  # 35
        (22, 3),  # 1
        (23, 3),  # 3
        (24, 3),  # 0
        (25, 2),  # 61
        (26, 2),  # 0
    ]
    for r_i, c_i in result_cells:
        cell = rows[r_i].findall("w:tc", NS)[c_i]
        p = cell.find("w:p", NS)
        if p is not None:
            set_paragraph_single_text(p, "")

    # Page 17: Informe Radiografía de Tórax
    set_paragraph_single_text(body[185], "NOMBRE:         ")
    set_paragraph_single_text(body[186], "FECHA:                        ")

    return ET.tostring(root, xml_declaration=True, encoding="UTF-8", standalone=True)


def write_docx_variant(src_zip, out_path, new_doc_xml, media_overrides, rels_override=None):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with zipfile.ZipFile(out_path, "w", compression=zipfile.ZIP_DEFLATED) as zout:
        for item in src_zip.infolist():
            fname = item.filename
            if fname == "word/document.xml":
                zout.writestr(fname, new_doc_xml)
            elif fname == "docProps/core.xml":
                zout.writestr(fname, sanitize_core_xml(src_zip.read(fname)))
            elif fname == "word/_rels/document.xml.rels" and rels_override is not None:
                zout.writestr(fname, rels_override)
            elif fname in media_overrides:
                if media_overrides[fname] is not None:
                    zout.writestr(fname, media_overrides[fname])
            else:
                zout.writestr(fname, src_zip.read(fname))
        # Write any brand-new media entries not originally in src_zip
        existing = set(src_zip.namelist())
        for mname, mbytes in media_overrides.items():
            if mname not in existing and mbytes is not None:
                zout.writestr(mname, mbytes)


def main():
    with zipfile.ZipFile(SRC_DOCX, "r") as src_zip:
        doc_bytes = src_zip.read("word/document.xml")
        rels_bytes = src_zip.read("word/_rels/document.xml.rels")
        clean_media, transparent_png = build_sanitized_media(src_zip)

        # 1. Build Parameterized Master: PLANTILLA_OFICIAL_CON_SELLOS.docx
        master_xml = transform_for_parameterized_master(doc_bytes)
        master_public = os.path.join(PUBLIC_DIR, "PLANTILLA_OFICIAL_CON_SELLOS.docx")
        write_docx_variant(src_zip, master_public, master_xml, clean_media)
        print("Built:", master_public)

        # 2. Build 100% Blank Template: PLANTILLA_EN_BLANCO_EXPEDIENTE_FPF.docx
        # Point rId37 (image26.jpeg) to media/image26_blank.png so transparency preserves watermark
        rels_root = ET.fromstring(rels_bytes)
        for rel in rels_root:
            if rel.attrib.get("Id") == "rId37":
                rel.set("Target", "media/image26_blank.png")
        blank_rels_bytes = ET.tostring(rels_root, xml_declaration=True, encoding="UTF-8", standalone=True)

        blank_media = {
            "word/media/image17.png": transparent_png,
            "word/media/image18.png": transparent_png,
            "word/media/image19.png": transparent_png,
            "word/media/image26.jpeg": None,  # omit leaked jpeg completely!
            "word/media/image26_blank.png": transparent_png,
        }
        blank_xml = transform_for_blank_template(doc_bytes, empty_p12_body=False)
        blank_root_path = os.path.join(ROOT_DIR, "PLANTILLA_EN_BLANCO_EXPEDIENTE_FPF.docx")
        blank_pub_path = os.path.join(PUBLIC_DIR, "PLANTILLA_EN_BLANCO_EXPEDIENTE_FPF.docx")
        write_docx_variant(src_zip, blank_root_path, blank_xml, blank_media, blank_rels_bytes)
        shutil.copy2(blank_root_path, blank_pub_path)
        print("Built:", blank_root_path)
        print("Copied:", blank_pub_path)

        # 3. Also build temporary p12_facsimile_bg.docx so Page 12 Facsimile mode has pure letterhead+stamp
        os.makedirs(SCRATCH_DIR, exist_ok=True)
        p12_bg_xml = transform_for_blank_template(doc_bytes, empty_p12_body=True)
        p12_bg_docx = os.path.join(SCRATCH_DIR, "p12_facsimile_bg.docx")
        write_docx_variant(src_zip, p12_bg_docx, p12_bg_xml, blank_media, blank_rels_bytes)
        print("Built temp:", p12_bg_docx)

        # 4. Update diagnostic sample assets in client/public/assets/ with sanitized images
        with open(os.path.join(ASSETS_DIR, "echo_sample_2d.png"), "wb") as f:
            f.write(clean_media["word/media/image17.png"])
        with open(os.path.join(ASSETS_DIR, "ecocardiograma-1.png"), "wb") as f:
            f.write(clean_media["word/media/image17.png"])

        with open(os.path.join(ASSETS_DIR, "echo_sample_mmode.png"), "wb") as f:
            f.write(clean_media["word/media/image18.png"])
        with open(os.path.join(ASSETS_DIR, "ecocardiograma-2.png"), "wb") as f:
            f.write(clean_media["word/media/image18.png"])

        with open(os.path.join(ASSETS_DIR, "ecg_sample_strip.png"), "wb") as f:
            f.write(clean_media["word/media/image19.png"])
        # Also save JPEG version for electrocardiograma.jpeg
        im19_rgb = Image.open(io.BytesIO(clean_media["word/media/image19.png"])).convert("RGB")
        im19_rgb.save(os.path.join(ASSETS_DIR, "electrocardiograma.jpeg"), format="JPEG", quality=95)

        with open(os.path.join(ASSETS_DIR, "radiografia-torax.jpeg"), "wb") as f:
            f.write(clean_media["word/media/image26.jpeg"])
        with open(os.path.join(ASSETS_DIR, "rx_sample_clean.jpeg"), "wb") as f:
            f.write(clean_media["word/media/image26.jpeg"])

        # Also copy clean cardiologist stamp from Ponce (image20.png / image11.png) as transparent PNG
        im11 = Image.open(io.BytesIO(src_zip.read("word/media/image11.png"))).convert("RGBA")
        # Make near-white pixels transparent so overlay stamp never blocks lines
        datas = im11.getdata()
        new_data = []
        for r, g, b, a in datas:
            if r > 240 and g > 240 and b > 240:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append((r, g, b, a))
        im11.putdata(new_data)
        im11.save(os.path.join(ASSETS_DIR, "sello-alfredo-vega-transparent.png"), format="PNG")
        print("Updated sanitized diagnostic sample assets in:", ASSETS_DIR)


if __name__ == "__main__":
    main()
