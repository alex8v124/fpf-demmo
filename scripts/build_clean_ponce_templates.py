"""
Builds the clean 19-page official templates combining:
- Page 1: Clean official FPF Medical Certificate ("Certificado Médico FPF")
- Pages 2..19: Clean 18-page evaluation & diagnostic protocol from PONCE ECHEVARRIA CARLOS.docx

Outputs:
1. PLANTILLA_EN_BLANCO_EXPEDIENTE_FPF.docx (root & client/public/, 19 pages, 100% blank player fields)
2. client/public/PLANTILLA_OFICIAL_CON_SELLOS.docx (19 pages, parameterized {{...}} master with stamps)
3. Scratch helper docx files for pure facsimile base renders (page_01_base.png & page_13_base.png)
4. Sanitizes diagnostic sample images in client/public/assets/ (zero third-party patient leaks)
"""
import copy
import io
import os
import shutil
import zipfile
import fitz
import lxml.etree as ET
import numpy as np
from PIL import Image, ImageDraw

ROOT_DIR = r"C:\Users\alex0\Downloads\chamba"
SRC_DOCX = os.path.join(ROOT_DIR, "PONCE ECHEVARRIA CARLOS.docx")
TALEXSIO_PDF = os.path.join(ROOT_DIR, "TALEXSIO GUZMAN ADDU ELIAS.pdf")
PUBLIC_DIR = os.path.join(ROOT_DIR, "client", "public")
ASSETS_DIR = os.path.join(PUBLIC_DIR, "assets")
SCRATCH_DIR = r"C:\Users\alex0\.gemini\antigravity\brain\d1c8c2a7-46de-479c-a2b6-29d1cc073fa1\scratch"

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
MC_NS = "http://schemas.openxmlformats.org/markup-compatibility/2006"
A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"
WP_NS = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
WPS_NS = "http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
PIC_NS = "http://schemas.openxmlformats.org/drawingml/2006/picture"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
V_NS = "urn:schemas-microsoft-com:vml"
XML_SPACE = "{http://www.w3.org/XML/1998/namespace}space"

NS = {"w": W_NS, "mc": MC_NS, "a": A_NS, "wp": WP_NS, "wps": WPS_NS, "pic": PIC_NS, "r": R_NS, "v": V_NS}

# A4 dimensions in EMUs and Points (matching Word sectPr 11906 x 16838 dxa)
PAGE_W_PT = 11906 / 20.0   # 595.30 pt
PAGE_H_PT = 16838 / 20.0   # 841.90 pt
PAGE_W_EMU = int(round(PAGE_W_PT * 12700))  # 7,560,310 EMU
PAGE_H_EMU = int(round(PAGE_H_PT * 12700))  # 10,692,130 EMU


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


def set_paragraph_empty_lines(p_elem, num_lines=9):
    """Replaces text in p_elem with empty line breaks preserving exact vertical height."""
    runs = p_elem.findall("w:r", NS)
    rpr_copy = None
    for r in runs:
        rpr = r.find("w:rPr", NS)
        if rpr is not None:
            rpr_copy = copy.deepcopy(rpr)
            break
    for r in list(runs):
        p_elem.remove(r)

    new_r = ET.SubElement(p_elem, f"{{{W_NS}}}r")
    if rpr_copy is not None:
        new_r.append(rpr_copy)
    for idx in range(num_lines):
        t = ET.SubElement(new_r, f"{{{W_NS}}}t")
        t.set(XML_SPACE, "preserve")
        t.text = " "
        if idx < num_lines - 1:
            ET.SubElement(new_r, f"{{{W_NS}}}br")


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


def build_p1_assets():
    """Extracts and cleans the Page 1 FPF Certificate frame and Dr. Darío Hernández stamp
    directly from TALEXSIO GUZMAN ADDU ELIAS.pdf Page 1 (with repo fallback)."""
    os.makedirs(ASSETS_DIR, exist_ok=True)
    frame_asset_path = os.path.join(ASSETS_DIR, "fpf_cert_frame_clean.png")
    stamp_asset_path = os.path.join(ASSETS_DIR, "sello-dario-hernandez-transparent.png")

    t_pdf = fitz.open(TALEXSIO_PDF)
    p0 = t_pdf[0]

    # xref=13 is the 465x746 FPF Certificate form; xref=14 is the 192x66 cardiologist stamp
    pix_frame = fitz.Pixmap(t_pdf, 13)
    if pix_frame.n - pix_frame.alpha > 3:
        pix_frame = fitz.Pixmap(fitz.csRGB, pix_frame)
    im_frame = Image.open(io.BytesIO(pix_frame.tobytes("png"))).convert("L")
    arr = np.array(im_frame)

    # 1. Remove outer 6px gray scan border and top-left competition crest (matching official FPF generic form)
    arr[:6, :] = 255
    arr[-6:, :] = 255
    arr[:, :6] = 255
    arr[:, -6:] = 255
    arr[8:86, 10:85] = 255

    im_clean_gray = Image.fromarray(arr, mode="L")
    im_up = im_clean_gray.resize((im_clean_gray.width * 3, im_clean_gray.height * 3), Image.Resampling.LANCZOS)
    up_arr = np.array(im_up, dtype=np.float32)

    alpha = np.clip((232.0 - up_arr) * 2.25, 0, 255).astype(np.uint8)
    rgba = np.zeros((im_up.height, im_up.width, 4), dtype=np.uint8)
    rgba[:, :, 3] = alpha
    im_frame_rgba = Image.fromarray(rgba, mode="RGBA")

    fbuf = io.BytesIO()
    im_frame_rgba.save(fbuf, format="PNG")
    frame_png_bytes = fbuf.getvalue()
    with open(frame_asset_path, "wb") as f:
        f.write(frame_png_bytes)

    # 2. Extract and clean Dr. Darío Hernández Alarcón stamp (xref=14)
    pix_stamp = fitz.Pixmap(t_pdf, 14)
    if pix_stamp.n - pix_stamp.alpha > 3:
        pix_stamp = fitz.Pixmap(fitz.csRGB, pix_stamp)
    im_stamp = Image.open(io.BytesIO(pix_stamp.tobytes("png"))).convert("L")
    s_arr = np.array(im_stamp)
    s_arr[:2, :] = 255
    s_arr[-2:, :] = 255
    s_arr[:, :2] = 255
    s_arr[:, -2:] = 255
    im_s_up = Image.fromarray(s_arr, mode="L").resize(
        (im_stamp.width * 4, im_stamp.height * 4), Image.Resampling.LANCZOS
    )
    su_arr = np.array(im_s_up, dtype=np.float32)
    s_alpha = np.clip((235.0 - su_arr) * 2.4, 0, 255).astype(np.uint8)
    s_rgba = np.zeros((im_s_up.height, im_s_up.width, 4), dtype=np.uint8)
    s_rgba[:, :, 3] = s_alpha
    im_stamp_rgba = Image.fromarray(s_rgba, mode="RGBA")

    sbuf = io.BytesIO()
    im_stamp_rgba.save(sbuf, format="PNG")
    stamp_png_bytes = sbuf.getvalue()
    with open(stamp_asset_path, "wb") as f:
        f.write(stamp_png_bytes)

    t_pdf.close()
    return frame_png_bytes, stamp_png_bytes


def build_sanitized_media(src_zip, p1_frame_bytes, p1_stamp_bytes):
    """Returns dict of clean media bytes and transparent PNG bytes for blank mode."""
    clean = {
        "word/media/p1_cert_frame.png": p1_frame_bytes,
        "word/media/sello_dario_hernandez.png": p1_stamp_bytes,
    }

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

    trans_im = Image.new("RGBA", (10, 10), (255, 255, 255, 0))
    tbuf = io.BytesIO()
    trans_im.save(tbuf, format="PNG")
    transparent_png = tbuf.getvalue()

    return clean, transparent_png


def make_page_image_run_xml(r_id, doc_id, name, left_pct, top_pct, w_pct, h_pct, behind_doc=0, z_idx=251658240):
    x_emu = int(round(PAGE_W_EMU * left_pct / 100.0))
    y_emu = int(round(PAGE_H_EMU * top_pct / 100.0))
    cx_emu = int(round(PAGE_W_EMU * w_pct / 100.0))
    cy_emu = int(round(PAGE_H_EMU * h_pct / 100.0))
    return f"""
    <w:r xmlns:w="{W_NS}" xmlns:wp="{WP_NS}" xmlns:a="{A_NS}" xmlns:pic="{PIC_NS}" xmlns:r="{R_NS}">
      <w:rPr><w:noProof/></w:rPr>
      <w:drawing>
        <wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="{z_idx}" behindDoc="{behind_doc}" locked="0" layoutInCell="1" allowOverlap="1">
          <wp:simplePos x="0" y="0"/>
          <wp:positionH relativeFrom="page"><wp:posOffset>{x_emu}</wp:posOffset></wp:positionH>
          <wp:positionV relativeFrom="page"><wp:posOffset>{y_emu}</wp:posOffset></wp:positionV>
          <wp:extent cx="{cx_emu}" cy="{cy_emu}"/>
          <wp:effectExtent l="0" t="0" r="0" b="0"/>
          <wp:wrapNone/>
          <wp:docPr id="{doc_id}" name="{name}"/>
          <wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>
          <a:graphic>
            <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:pic>
                <pic:nvPicPr>
                  <pic:cNvPr id="{doc_id}" name="{name}"/>
                  <pic:cNvPicPr/>
                </pic:nvPicPr>
                <pic:blipFill>
                  <a:blip r:embed="{r_id}"/>
                  <a:stretch><a:fillRect/></a:stretch>
                </pic:blipFill>
                <pic:spPr>
                  <a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx_emu}" cy="{cy_emu}"/></a:xfrm>
                  <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                  <a:noFill/>
                  <a:ln><a:noFill/></a:ln>
                </pic:spPr>
              </pic:pic>
            </a:graphicData>
          </a:graphic>
        </wp:anchor>
      </w:drawing>
    </w:r>
    """


def make_page_textbox_run_xml(
    doc_id,
    left_pct,
    top_pct,
    w_pct,
    h_pct,
    lines,
    font_name="Calibri",
    font_pt=11.0,
    align="left",
    line_after_twips=0,
    z_idx=251665000,
):
    x_emu = int(round(PAGE_W_EMU * left_pct / 100.0))
    y_emu = int(round(PAGE_H_EMU * top_pct / 100.0))
    cx_emu = int(round(PAGE_W_EMU * w_pct / 100.0))
    cy_emu = int(round(PAGE_H_EMU * h_pct / 100.0))

    x_pt = PAGE_W_PT * left_pct / 100.0
    y_pt = PAGE_H_PT * top_pct / 100.0
    w_pt = PAGE_W_PT * w_pct / 100.0
    h_pt = PAGE_H_PT * h_pct / 100.0

    sz_half_pt = int(round(font_pt * 2))
    jc_xml = f'<w:jc w:val="{align}"/>' if align != "left" else ""

    p_xml_items = []
    for ln in lines:
        safe_ln = (
            ln.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
        )
        p_xml_items.append(
            f"""
            <w:p>
              <w:pPr>
                <w:spacing w:before="0" w:after="{line_after_twips}" w:line="240" w:lineRule="auto"/>
                {jc_xml}
              </w:pPr>
              <w:r>
                <w:rPr>
                  <w:rFonts w:ascii="{font_name}" w:hAnsi="{font_name}" w:cs="{font_name}"/>
                  <w:color w:val="000000"/>
                  <w:sz w:val="{sz_half_pt}"/>
                  <w:szCs w:val="{sz_half_pt}"/>
                </w:rPr>
                <w:t xml:space="preserve">{safe_ln}</w:t>
              </w:r>
            </w:p>
            """
        )
    txbx_inner = "".join(p_xml_items)

    return f"""
    <w:r xmlns:w="{W_NS}" xmlns:mc="{MC_NS}" xmlns:wp="{WP_NS}" xmlns:a="{A_NS}" xmlns:wps="{WPS_NS}" xmlns:v="{V_NS}">
      <w:rPr><w:noProof/></w:rPr>
      <mc:AlternateContent>
        <mc:Choice Requires="wps">
          <w:drawing>
            <wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="{z_idx}" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1">
              <wp:simplePos x="0" y="0"/>
              <wp:positionH relativeFrom="page"><wp:posOffset>{x_emu}</wp:posOffset></wp:positionH>
              <wp:positionV relativeFrom="page"><wp:posOffset>{y_emu}</wp:posOffset></wp:positionV>
              <wp:extent cx="{cx_emu}" cy="{cy_emu}"/>
              <wp:effectExtent l="0" t="0" r="0" b="0"/>
              <wp:wrapNone/>
              <wp:docPr id="{doc_id}" name="P1TextBox_{doc_id}"/>
              <wp:cNvGraphicFramePr/>
              <a:graphic>
                <a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">
                  <wps:wsp>
                    <wps:cNvSpPr txBox="1"/>
                    <wps:spPr>
                      <a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx_emu}" cy="{cy_emu}"/></a:xfrm>
                      <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                      <a:noFill/>
                      <a:ln><a:noFill/></a:ln>
                    </wps:spPr>
                    <wps:txbx>
                      <w:txbxContent>{txbx_inner}</w:txbxContent>
                    </wps:txbx>
                    <wps:bodyPr rot="0" spcFirstLastPara="0" vertOverflow="overflow" horzOverflow="overflow" vert="horz" wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" numCol="1" spcCol="0" rtlCol="0" fromWordArt="0" anchor="t" anchorCtr="0" forceAA="0" compatLnSpc="1">
                      <a:prstTxWarp prst="textNoShape"><a:avLst/></a:prstTxWarp>
                      <a:noAutofit/>
                    </wps:bodyPr>
                  </wps:wsp>
                </a:graphicData>
              </a:graphic>
            </wp:anchor>
          </w:drawing>
        </mc:Choice>
        <mc:Fallback>
          <w:pict>
            <v:shape id="P1VShape_{doc_id}" type="#_x0000_t202" style="position:absolute;margin-left:{x_pt:.2f}pt;margin-top:{y_pt:.2f}pt;width:{w_pt:.2f}pt;height:{h_pt:.2f}pt;z-index:{z_idx};mso-position-horizontal-relative:page;mso-position-vertical-relative:page" filled="f" stroked="f">
              <v:textbox inset="0,0,0,0">
                <w:txbxContent>{txbx_inner}</w:txbxContent>
              </v:textbox>
            </v:shape>
          </w:pict>
        </mc:Fallback>
      </mc:AlternateContent>
    </w:r>
    """


def build_page1_section_paragraph(mode="master"):
    """Constructs Section 1 (Page 1: Certificado Médico Oficial FPF).
    mode='master': parameterized {{...}} tokens
    mode='blank': static clinic fields + stamp, blank NOMBRE/CLUB/FECHA/RECIBO
    mode='facsimile_base': ONLY frame + stamp (zero text, so React overlays cleanly)
    """
    runs_xml = [
        # Clean FPF Certificate frame centered horizontally (left=7%, w=86%, top=2%, h=94%)
        make_page_image_run_xml(
            "rId91", 9001, "FPF_Cert_Frame", 7.00, 2.00, 86.00, 94.00, behind_doc=1, z_idx=251658240
        ),
        # Crisp transparent Dr. Darío Hernández Alarcón stamp inside FIRMA Y SELLO DEL MEDICO box
        make_page_image_run_xml(
            "rId92", 9002, "Sello_Dario_Hernandez", 20.50, 79.55, 20.00, 5.80, behind_doc=0, z_idx=251660000
        ),
    ]

    if mode == "master":
        runs_xml.extend([
            make_page_textbox_run_xml(9011, 23.20, 14.65, 64.00, 2.20, ["{{NOMBRE_COMPLETO}}"], "Calibri", 11.0),
            make_page_textbox_run_xml(9012, 23.20, 17.80, 64.00, 2.20, ["{{CLUB}}"], "Calibri", 11.0),
            make_page_textbox_run_xml(9013, 23.20, 20.85, 42.50, 2.20, ["{{MEDICO_CERT}}"], "Times New Roman", 11.5),
            make_page_textbox_run_xml(9014, 74.20, 20.85, 16.50, 2.20, ["{{CMP_CERT}}"], "Times New Roman", 11.5),
            make_page_textbox_run_xml(9015, 23.20, 24.22, 64.00, 2.20, ["{{DOMICILIO_CLINICA}}"], "Calibri", 11.0),
            make_page_textbox_run_xml(
                9016,
                15.50,
                35.50,
                69.00,
                26.00,
                [
                    "QUIEN AL EXAMEN CLINICO PRESENTA:",
                    "ARER",
                    "AREN",
                    "NO SOPLOS",
                    "VIAS AEREAS LIBRES",
                    "",
                    "{{APTITUD_DETALLE}}",
                ],
                "Calibri",
                11.0,
                line_after_twips=110,
            ),
            make_page_textbox_run_xml(9017, 53.68, 83.20, 31.00, 2.20, ["{{FECHA}}"], "Calibri", 11.0, align="center"),
            make_page_textbox_run_xml(9018, 30.80, 91.15, 24.00, 2.00, ["{{RECIBO}}"], "Calibri", 10.0),
        ])
    elif mode == "blank":
        runs_xml.extend([
            make_page_textbox_run_xml(9013, 23.20, 20.85, 42.50, 2.20, ["DARIO HERNANDEZ"], "Times New Roman", 11.5),
            make_page_textbox_run_xml(9014, 74.20, 20.85, 13.00, 2.20, ["27503"], "Times New Roman", 11.5),
            make_page_textbox_run_xml(
                9015, 23.20, 24.22, 64.00, 2.20, ["AV CONQUISTADORES 1588 SAN ISIDRO"], "Calibri", 11.0
            ),
            make_page_textbox_run_xml(
                9016,
                15.50,
                35.50,
                69.00,
                26.00,
                [
                    "QUIEN AL EXAMEN CLINICO PRESENTA:",
                    "ARER",
                    "AREN",
                    "NO SOPLOS",
                    "VIAS AEREAS LIBRES",
                    "",
                    "SE ENCUENTRA APTO PARA REALIZAR ACTIVIDAD DEPORTIVA ( FUTBOL )",
                ],
                "Calibri",
                11.0,
                line_after_twips=110,
            ),
        ])

    p_xml = f"""
    <w:p xmlns:w="{W_NS}" xmlns:r="{R_NS}">
      <w:pPr>
        <w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/>
        <w:sectPr>
          <w:headerReference w:type="even" r:id="rId38"/>
          <w:headerReference w:type="default" r:id="rId39"/>
          <w:footerReference w:type="even" r:id="rId40"/>
          <w:footerReference w:type="default" r:id="rId41"/>
          <w:pgSz w:w="11906" w:h="16838"/>
          <w:pgMar w:top="0" w:right="1701" w:bottom="0" w:left="1701" w:header="708" w:footer="708" w:gutter="0"/>
          <w:cols w:space="708"/>
          <w:docGrid w:linePitch="360"/>
        </w:sectPr>
      </w:pPr>
      {''.join(runs_xml)}
    </w:p>
    """
    return ET.fromstring(p_xml)


def add_p1_relationships(rels_bytes, blank_rx=False):
    rels_root = ET.fromstring(rels_bytes)
    rel_ns = rels_root.tag.split("}")[0].strip("{")
    img_type = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"

    if blank_rx:
        for rel in rels_root:
            if rel.attrib.get("Id") == "rId37":
                rel.set("Target", "media/image26_blank.png")

    existing_ids = {r.attrib.get("Id") for r in rels_root}
    if "rId91" not in existing_ids:
        r91 = ET.SubElement(rels_root, f"{{{rel_ns}}}Relationship")
        r91.set("Id", "rId91")
        r91.set("Type", img_type)
        r91.set("Target", "media/p1_cert_frame.png")
    if "rId92" not in existing_ids:
        r92 = ET.SubElement(rels_root, f"{{{rel_ns}}}Relationship")
        r92.set("Id", "rId92")
        r92.set("Type", img_type)
        r92.set("Target", "media/sello_dario_hernandez.png")

    return ET.tostring(rels_root, xml_declaration=True, encoding="UTF-8", standalone=True)


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

    # Ponce Page 1 (now Page 2): Cover boxes
    acs_14 = body[14].findall(".//mc:AlternateContent", NS)
    set_ac_textbox_text(acs_14[1], "{{APELLIDOS}}")

    acs_15 = body[15].findall(".//mc:AlternateContent", NS)
    set_ac_textbox_text(acs_15[0], "{{POSICION}}")
    set_ac_textbox_text(acs_15[1], "{{CLUB}}")
    set_ac_textbox_text(acs_15[2], "{{PAIS_CLUB}}")
    set_ac_textbox_text(acs_15[8], "{{FECHA_NAC}}")
    set_ac_textbox_text(acs_15[12], "{{NOMBRES}}")

    # Ponce Page 6 (now Page 7): Peso & Talla
    acs_31 = body[31].findall(".//mc:AlternateContent", NS)
    set_ac_textbox_text(acs_31[44], "{{TALLA}}")
    set_ac_textbox_text(acs_31[45], "{{PESO}}")

    # Ponce Page 11 (now Page 12): Fecha -> {{FECHA}} in body[65]
    acs_65 = body[65].findall(".//mc:AlternateContent", NS)
    set_ac_textbox_text(acs_65[0], "{{FECHA}}")

    # Ponce Page 12 (now Page 13): Certificado Famiheart
    runs_77 = body[77].findall("w:r", NS)
    for r in runs_77:
        txt = "".join(t.text for t in r.findall("w:t", NS) if t.text)
        if "PONCE ECHEVARRIA CARLOS" in txt:
            r.findall("w:t", NS)[0].text = "{{NOMBRE_COMPLETO}}"
    set_paragraph_single_text(body[81], "{{FECHA}}")

    # Ponce Page 13 (now Page 14): Informe Ecocardiográfico
    runs_97 = body[97].findall("w:r", NS)
    for r in runs_97:
        txt = "".join(t.text for t in r.findall("w:t", NS) if t.text)
        if "PONCE ECHEVARRIA CARLOS" in txt:
            r.findall("w:t", NS)[0].text = "{{NOMBRE_COMPLETO}}"
    set_paragraph_single_text(body[98], "Fecha :   {{FECHA}}")

    # Ponce Page 15 (now Page 16): ECG 12 derivaciones floating textboxes
    acs_160 = body[160].findall(".//mc:AlternateContent", NS)
    set_ac_textbox_text(acs_160[0], "NAME: {{NOMBRE_COMPLETO}}")
    acs_162 = body[162].findall(".//mc:AlternateContent", NS)
    set_ac_textbox_text(acs_162[0], "              DATE: {{FECHA}}")

    # Ponce Page 16 (now Page 17): Hemograma table (body[178])
    tbl = body[178]
    rows = tbl.findall("w:tr", NS)
    r0_cells = rows[0].findall("w:tc", NS)
    set_paragraph_single_text(r0_cells[1].find("w:p", NS), "{{NOMBRE_COMPLETO}}")
    r3_cells = rows[3].findall("w:tc", NS)
    for sub_p in r3_cells[6].findall(".//w:p", NS):
        ptxt = "".join(t.text for t in sub_p.findall(".//w:t", NS) if t.text)
        if "22-01-2026" in ptxt:
            set_paragraph_single_text(sub_p, "{{FECHA}}")

    # Ponce Page 17 (now Page 18): Informe Radiografía de Tórax
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

    # Prepend Section 1 (Page 1: Certificado Médico Oficial FPF) at index 0 of w:body!
    p1_elem = build_page1_section_paragraph(mode="master")
    body.insert(0, p1_elem)

    return ET.tostring(root, xml_declaration=True, encoding="UTF-8", standalone=True)


def transform_for_blank_template(doc_bytes, empty_p13_body=False, p1_mode="blank"):
    root = ET.fromstring(doc_bytes)
    body = root.find("w:body", NS)

    clear_srcrects_on_diagnostic_images(body)
    remove_stray_pipe_on_p6(body)

    STATIC_P2_LABELS = {
        "APELLIDOS",
        "NOMBRES",
        "PAIS DEL CLUB",
        "CLUB LOCAL / SELECCION",
        "POSICIÓN JUGADOR/A",
        "FECHA DE NACIMIENTO",
    }
    STATIC_P12_LABELS = {
        "ALFREDO VEGA CISNEROS",
        "FAMIHEART",
    }

    for idx, child in enumerate(body):
        for ac in child.findall(".//mc:AlternateContent", NS):
            cur = get_ac_text(ac).strip()
            if not cur:
                continue
            if idx in (14, 15) and cur in STATIC_P2_LABELS:
                continue
            if idx in (61, 63) and cur in STATIC_P12_LABELS:
                continue
            set_ac_textbox_text(ac, "")

    # Ponce Page 11 (now Page 12): clear 'SI' in body[57]
    set_paragraph_single_text(body[57], " ")

    # Ponce Page 12 (now Page 13): Certificado Famiheart
    if empty_p13_body:
        # Preserve exact 10-line height of 24pt paragraph so stamp & Page 14 NEVER shift up!
        set_paragraph_empty_lines(body[77], num_lines=10)
        set_paragraph_single_text(body[79], " ")
        set_paragraph_single_text(body[81], " ")
    else:
        for r in body[77].findall("w:r", NS):
            txt = "".join(t.text for t in r.findall("w:t", NS) if t.text)
            if "PONCE ECHEVARRIA CARLOS" in txt:
                rpr = r.find("w:rPr", NS)
                if rpr is not None:
                    for b_tag in rpr.findall("w:b", NS) + rpr.findall("w:bCs", NS):
                        rpr.remove(b_tag)
                t0 = r.findall("w:t", NS)[0]
                t0.set(XML_SPACE, "preserve")
                t0.text = "____________________________"
        set_paragraph_single_text(body[81], " ")

    # Ponce Page 13 (now Page 14): Informe Ecocardiográfico
    for r in body[97].findall("w:r", NS):
        txt = "".join(t.text for t in r.findall("w:t", NS) if t.text)
        if "PONCE ECHEVARRIA CARLOS" in txt:
            t0 = r.findall("w:t", NS)[0]
            t0.set(XML_SPACE, "preserve")
            t0.text = "                                            "
    set_paragraph_single_text(body[98], "Fecha :   ")

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

    # Ponce Page 16 (now Page 17): Hemograma Completo table (body[178])
    tbl = body[178]
    rows = tbl.findall("w:tr", NS)
    set_paragraph_single_text(rows[0].findall("w:tc", NS)[1].find("w:p", NS), "")
    for sub_p in rows[3].findall("w:tc", NS)[6].findall(".//w:p", NS):
        ptxt = "".join(t.text for t in sub_p.findall(".//w:t", NS) if t.text)
        if "22-01-2026" in ptxt:
            set_paragraph_single_text(sub_p, "")
    result_cells = [
        (7, 1),
        (8, 2),
        (10, 2),
        (12, 3),
        (14, 2),
        (16, 3),
        (17, 3),
        (18, 3),
        (21, 3),
        (22, 3),
        (23, 3),
        (24, 3),
        (25, 2),
        (26, 2),
    ]
    for r_i, c_i in result_cells:
        cell = rows[r_i].findall("w:tc", NS)[c_i]
        p = cell.find("w:p", NS)
        if p is not None:
            set_paragraph_single_text(p, "")

    # Ponce Page 17 (now Page 18): Informe Radiografía de Tórax
    set_paragraph_single_text(body[185], "NOMBRE:         ")
    set_paragraph_single_text(body[186], "FECHA:                        ")

    # Prepend Section 1 (Page 1: Certificado Médico Oficial FPF)
    p1_elem = build_page1_section_paragraph(mode=p1_mode)
    body.insert(0, p1_elem)

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
        existing = set(src_zip.namelist())
        for mname, mbytes in media_overrides.items():
            if mname not in existing and mbytes is not None:
                zout.writestr(mname, mbytes)


def main():
    p1_frame_bytes, p1_stamp_bytes = build_p1_assets()

    with zipfile.ZipFile(SRC_DOCX, "r") as src_zip:
        doc_bytes = src_zip.read("word/document.xml")
        rels_bytes = src_zip.read("word/_rels/document.xml.rels")
        clean_media, transparent_png = build_sanitized_media(src_zip, p1_frame_bytes, p1_stamp_bytes)

        # 1. Parameterized 19-Page Master: PLANTILLA_OFICIAL_CON_SELLOS.docx
        master_rels = add_p1_relationships(rels_bytes, blank_rx=False)
        master_xml = transform_for_parameterized_master(doc_bytes)
        master_public = os.path.join(PUBLIC_DIR, "PLANTILLA_OFICIAL_CON_SELLOS.docx")
        write_docx_variant(src_zip, master_public, master_xml, clean_media, master_rels)
        print("Built 19-page master:", master_public)

        # 2. 100% Blank 19-Page Template: PLANTILLA_EN_BLANCO_EXPEDIENTE_FPF.docx
        blank_rels = add_p1_relationships(rels_bytes, blank_rx=True)
        blank_media = {
            "word/media/p1_cert_frame.png": p1_frame_bytes,
            "word/media/sello_dario_hernandez.png": p1_stamp_bytes,
            "word/media/image17.png": transparent_png,
            "word/media/image18.png": transparent_png,
            "word/media/image19.png": transparent_png,
            "word/media/image26.jpeg": None,
            "word/media/image26_blank.png": transparent_png,
        }
        blank_xml = transform_for_blank_template(doc_bytes, empty_p13_body=False, p1_mode="blank")
        blank_root_path = os.path.join(ROOT_DIR, "PLANTILLA_EN_BLANCO_EXPEDIENTE_FPF.docx")
        blank_pub_path = os.path.join(PUBLIC_DIR, "PLANTILLA_EN_BLANCO_EXPEDIENTE_FPF.docx")
        write_docx_variant(src_zip, blank_root_path, blank_xml, blank_media, blank_rels)
        shutil.copy2(blank_root_path, blank_pub_path)
        print("Built 19-page blank:", blank_root_path)
        print("Copied 19-page blank:", blank_pub_path)

        # 3. Build temporary facsimile base docx (for page_01_base.png and page_13_base.png)
        os.makedirs(SCRATCH_DIR, exist_ok=True)
        facsimile_bg_xml = transform_for_blank_template(
            doc_bytes, empty_p13_body=True, p1_mode="facsimile_base"
        )
        facsimile_bg_docx = os.path.join(SCRATCH_DIR, "facsimile_19p_bg.docx")
        write_docx_variant(src_zip, facsimile_bg_docx, facsimile_bg_xml, blank_media, blank_rels)
        print("Built temp facsimile base docx:", facsimile_bg_docx)

        # 4. Update sanitized diagnostic sample assets in client/public/assets/
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
        im19_rgb = Image.open(io.BytesIO(clean_media["word/media/image19.png"])).convert("RGB")
        im19_rgb.save(os.path.join(ASSETS_DIR, "electrocardiograma.jpeg"), format="JPEG", quality=95)

        with open(os.path.join(ASSETS_DIR, "radiografia-torax.jpeg"), "wb") as f:
            f.write(clean_media["word/media/image26.jpeg"])
        with open(os.path.join(ASSETS_DIR, "rx_sample_clean.jpeg"), "wb") as f:
            f.write(clean_media["word/media/image26.jpeg"])

        im11 = Image.open(io.BytesIO(src_zip.read("word/media/image11.png"))).convert("RGBA")
        datas = im11.getdata()
        new_data = []
        for r, g, b, a in datas:
            if r > 240 and g > 240 and b > 240:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append((r, g, b, a))
        im11.putdata(new_data)
        im11.save(os.path.join(ASSETS_DIR, "sello-alfredo-vega-transparent.png"), format="PNG")
        print("Updated sanitized diagnostic & stamp assets in:", ASSETS_DIR)


if __name__ == "__main__":
    main()
