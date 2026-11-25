"""
Generates downloadable PDF Comparison Reports using ReportLab.
"""

from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def build_comparison_pdf(report_data: dict) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=40, bottomMargin=40, leftMargin=42, rightMargin=42)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        fontSize=17,
        textColor=colors.HexColor("#0B2D52"),
        spaceAfter=6,
    )
    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#0F766E"),
        spaceAfter=14,
    )
    h2_style = ParagraphStyle(
        "SectionH2",
        parent=styles["Heading2"],
        fontSize=12,
        textColor=colors.HexColor("#0B2D52"),
        spaceBefore=12,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#1E293B"),
    )
    alert_style = ParagraphStyle(
        "Alert",
        parent=styles["Normal"],
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#0B2D52"),
        backColor=colors.HexColor("#E0F2FE"),
        borderPadding=8,
    )

    story = []
    story.append(Paragraph("AI vs Human Doctor – Detailed Clinical Comparison Report", title_style))
    story.append(Paragraph("Intelligent Healthcare. Human Expertise. Better Insights.", subtitle_style))

    story.append(Paragraph(
        f"<b>AUTHORITATIVE CLINICAL NOTICE:</b> {report_data.get('authoritative_statement', '')}",
        alert_style,
    ))
    story.append(Spacer(1, 10))

    meta_rows = [
        ["Comparison ID", f"CMP-{report_data.get('id')}", "Comparison Date", str(report_data.get("compared_at", ""))[:19]],
        ["Patient Name", report_data.get("patient_name", "N/A"), "Attending Doctor", report_data.get("doctor_name", "N/A")],
        ["Agreement Status", str(report_data.get("agreement_status", "")).replace("_", " ").upper(), "Alignment Score", f"{report_data.get('agreement_score', 0)}%"],
    ]
    meta_table = Table(meta_rows, colWidths=[110, 155, 110, 155])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#EFF6FF")),
        ("BACKGROUND", (2, 0), (2, -1), colors.HexColor("#EFF6FF")),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#0F2942")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(meta_table)

    story.append(Paragraph("Side-by-Side Assessment Summary", h2_style))
    ai_info = report_data.get("ai_assessment", {})
    doc_info = report_data.get("doctor_assessment", {})
    ai_conds = ", ".join(c.get("condition_name", "") for c in ai_info.get("possible_conditions", [])) or "N/A"

    comp_rows = [
        ["Parameter", "AI Doctor (Decision Support)", "Human Doctor (Authoritative)"],
        ["Primary Assessment / Diagnosis", ai_conds, doc_info.get("confirmed_diagnosis", "N/A")],
        ["Risk Classification", str(ai_info.get("risk_classification", "")).upper(), str(doc_info.get("risk_classification", "")).upper()],
        ["Identified Symptoms", ", ".join(ai_info.get("supporting_symptoms", [])) or "N/A", ", ".join(doc_info.get("symptoms_identified", [])) or "N/A"],
        ["Recommended Investigations", ", ".join(ai_info.get("suggested_investigations", [])) or "N/A", ", ".join(doc_info.get("recommended_investigations", [])) or "N/A"],
        ["Clinical Plan / Guidance", "Educational guidance only (no prescriptions)", doc_info.get("treatment_plan") or "N/A"],
    ]
    comp_table = Table(
        [[Paragraph(str(cell), body_style) for cell in row] for row in comp_rows],
        colWidths=[115, 207, 208],
    )
    comp_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0B2D52")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(comp_table)

    story.append(Paragraph("Areas of Agreement", h2_style))
    for item in report_data.get("areas_of_agreement", []) or ["No overlapping points recorded."]:
        story.append(Paragraph(f"• {item}", body_style))

    story.append(Paragraph("Areas of Disagreement & Clinical Review Notes", h2_style))
    for item in report_data.get("areas_of_disagreement", []) or ["No disagreements recorded."]:
        story.append(Paragraph(f"• {item}", body_style))

    story.append(Spacer(1, 12))
    story.append(Paragraph(
        f"<b>Doctor's Final Clinical Assessment:</b> {doc_info.get('clinical_assessment', 'N/A')}",
        body_style,
    ))

    doc.build(story)
    return buffer.getvalue()
