"""
Builds the complete ResourcePulse AI PowerPoint Presentation.
Meets all criteria:
- 14 slides with consistent, high-end emergency-operations theme.
- 16:9 widescreen layout (13.333 x 7.5 inches).
- Curated healthcare operations color palette.
- Integrated AI-generated visuals for Title, Problem, Hierarchy, Silo, Cockpit, and Route.
- Rich, editable vector shapes, cards, metrics, flowcharts, tables, and mathematical formulas.
- Comprehensive speaker notes on every single slide.
- Fictional/simulated data clearly labeled.
- Output: ResourcePulse-AI-Presentation.pptx
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.dml.color import RGBColor

# -------------------------------------------------------------
# COLOR PALETTE SPECIFICATION
# -------------------------------------------------------------
NAVY        = RGBColor(16, 42, 67)      # #102A43 Deep navy
TEAL        = RGBColor(15, 118, 110)    # #0F766E Dark teal
IVORY       = RGBColor(247, 244, 237)   # #F7F4ED Ivory background
SLATE       = RGBColor(36, 59, 83)      # #243B53 Slate text
MUTED       = RGBColor(98, 125, 152)    # #627D98 Muted slate
RED         = RGBColor(192, 57, 43)     # #C0392B Critical red
AMBER       = RGBColor(217, 130, 43)    # #D9822B Warning amber
GREEN       = RGBColor(47, 133, 90)     # #2F855A Safe green
PURPLE      = RGBColor(107, 70, 193)    # #6B46C1 AI accent purple
WHITE       = RGBColor(255, 255, 255)   # #FFFFFF Clean white
CARD_BG     = RGBColor(255, 255, 255)   # White card
BORDER_COL  = RGBColor(217, 226, 236)   # #D9E2EC Soft border
LIGHT_TEAL  = RGBColor(230, 246, 245)   # Teal tint
LIGHT_RED   = RGBColor(254, 238, 236)   # Red tint
LIGHT_AMBER = RGBColor(254, 243, 230)   # Amber tint
LIGHT_GREEN = RGBColor(234, 247, 238)   # Green tint
LIGHT_PURP  = RGBColor(243, 238, 253)   # Purple tint
DARK_CARD   = RGBColor(24, 55, 84)      # Dark mode card

FONT_HEAD = "Segoe UI"
FONT_BODY = "Segoe UI"

ASSETS_DIR = r"d:\OpsPulse\presentation_assets"

def get_asset(filename_pattern):
    """Finds image file matching pattern in ASSETS_DIR."""
    if not os.path.exists(ASSETS_DIR):
        return None
    for f in os.listdir(ASSETS_DIR):
        if filename_pattern in f:
            return os.path.join(ASSETS_DIR, f)
    return None

def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6] # Blank layout

    # -------------------------------------------------------------
    # HELPER FUNCTIONS
    # -------------------------------------------------------------
    def set_slide_background(slide, color):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = color
        bg.line.fill.background()
        return bg

    def add_header(slide, tag, title, subtitle=None, dark_mode=False):
        # Category Tag Pill
        tag_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.45), Inches(3.2), Inches(0.32))
        tag_box.fill.solid()
        tag_box.fill.fore_color.rgb = TEAL if dark_mode else LIGHT_TEAL
        tag_box.line.fill.background()
        tf_tag = tag_box.text_frame
        tf_tag.word_wrap = True
        tf_tag.vertical_anchor = MSO_ANCHOR.MIDDLE
        p_tag = tf_tag.paragraphs[0]
        p_tag.alignment = PP_ALIGN.CENTER
        p_tag.text = tag.upper()
        p_tag.font.name = FONT_HEAD
        p_tag.font.size = Pt(10)
        p_tag.font.bold = True
        p_tag.font.color.rgb = WHITE if dark_mode else TEAL

        # Title & Subtitle Box
        header_box = slide.shapes.add_textbox(Inches(0.75), Inches(0.8), Inches(11.8), Inches(1.05))
        tf = header_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        
        p_title = tf.paragraphs[0]
        p_title.text = title
        p_title.font.name = FONT_HEAD
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = WHITE if dark_mode else NAVY

        if subtitle:
            p_sub = tf.add_paragraph()
            p_sub.text = subtitle
            p_sub.font.name = FONT_BODY
            p_sub.font.size = Pt(13)
            p_sub.font.color.rgb = RGBColor(180, 200, 220) if dark_mode else MUTED
            p_sub.space_before = Pt(3)

    def add_card(slide, left, top, width, height, fill_color=CARD_BG, border_color=BORDER_COL, shape_type=MSO_SHAPE.ROUNDED_RECTANGLE):
        card = slide.shapes.add_shape(shape_type, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = fill_color
        if border_color:
            card.line.color.rgb = border_color
            card.line.width = Pt(1.2)
        else:
            card.line.fill.background()
        return card

    def add_speaker_notes(slide, notes_text):
        notes_slide = slide.notes_slide
        tf = notes_slide.notes_text_frame
        tf.text = notes_text

    # =============================================================
    # SLIDE 1: TITLE SLIDE (WITH DEDICATED PRESENTER CREDENTIALS SPACE)
    # =============================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1, NAVY)

    # Operations Center visual on right side
    img1 = get_asset("title_operations_center")
    if img1:
        s1.shapes.add_picture(img1, Inches(7.1), Inches(0.65), Inches(5.6), Inches(6.2))
        # Subtle border frame over picture
        border_frame = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(7.1), Inches(0.65), Inches(5.6), Inches(6.2))
        border_frame.fill.background()
        border_frame.line.color.rgb = TEAL
        border_frame.line.width = Pt(1.8)

    # Left content area - Width from 0.7 to 6.9 (Width = 6.2 inches)
    # Top Category Pill
    tag1 = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.7), Inches(0.55), Inches(3.4), Inches(0.32))
    tag1.fill.solid()
    tag1.fill.fore_color.rgb = TEAL
    tag1.line.fill.background()
    tag1.text_frame.text = "HEALTHCARE EMERGENCY LOGISTICS"
    tag1.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
    tag1.text_frame.paragraphs[0].font.name = FONT_HEAD
    tag1.text_frame.paragraphs[0].font.size = Pt(9.5)
    tag1.text_frame.paragraphs[0].font.bold = True
    tag1.text_frame.paragraphs[0].font.color.rgb = WHITE

    # Main Title Box
    title_box = s1.shapes.add_textbox(Inches(0.68), Inches(0.92), Inches(6.2), Inches(1.35))
    tf1 = title_box.text_frame
    tf1.word_wrap = True
    tf1.margin_left = tf1.margin_top = tf1.margin_right = tf1.margin_bottom = 0
    p1 = tf1.paragraphs[0]
    p1.text = "ResourcePulse AI"
    p1.font.name = FONT_HEAD
    p1.font.size = Pt(34)
    p1.font.bold = True
    p1.font.color.rgb = WHITE

    p1_sub = tf1.add_paragraph()
    p1_sub.text = "Explainable Emergency Resource Coordination Platform"
    p1_sub.font.name = FONT_HEAD
    p1_sub.font.size = Pt(15.5)
    p1_sub.font.bold = True
    p1_sub.font.color.rgb = RGBColor(120, 205, 195) # Soft cyan/teal
    p1_sub.space_before = Pt(4)

    p1_desc = tf1.add_paragraph()
    p1_desc.text = "Deterministic Invariants  •  Verifiable Math  •  Server-Side Gemini AI"
    p1_desc.font.name = FONT_BODY
    p1_desc.font.size = Pt(10.5)
    p1_desc.font.color.rgb = RGBColor(190, 210, 230)
    p1_desc.space_before = Pt(4)

    # Feature Badges Row (Compact)
    badges = [
        ("Deterministic Safety", GREEN),
        ("Verifiable Proofs", TEAL),
        ("Server-Side AI", PURPLE),
        ("Offline Fallback", AMBER)
    ]
    bx = 0.7
    for b_text, b_col in badges:
        b_shape = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(bx), Inches(2.32), Inches(1.45), Inches(0.3))
        b_shape.fill.solid()
        b_shape.fill.fore_color.rgb = DARK_CARD
        b_shape.line.color.rgb = b_col
        b_shape.line.width = Pt(1.2)
        p_b = b_shape.text_frame.paragraphs[0]
        p_b.text = b_text
        p_b.alignment = PP_ALIGN.CENTER
        p_b.font.name = FONT_HEAD
        p_b.font.size = Pt(8.5)
        p_b.font.bold = True
        p_b.font.color.rgb = WHITE
        bx += 1.52

    # Generous Dedicated Presenter & Project Credentials Card
    pres_card = add_card(s1, Inches(0.7), Inches(2.75), Inches(6.2), Inches(4.1), fill_color=DARK_CARD, border_color=TEAL)
    
    # Header bar on Presenter Card
    p_header = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.7), Inches(2.75), Inches(6.2), Inches(0.35))
    p_header.fill.solid()
    p_header.fill.fore_color.rgb = TEAL
    p_header.line.fill.background()
    p_hp = p_header.text_frame.paragraphs[0]
    p_hp.text = "PROJECT PRESENTATION & CANDIDATE CREDENTIALS"
    p_hp.alignment = PP_ALIGN.CENTER
    p_hp.font.name = FONT_HEAD
    p_hp.font.size = Pt(10)
    p_hp.font.bold = True
    p_hp.font.color.rgb = WHITE

    tf_pres = pres_card.text_frame
    tf_pres.word_wrap = True
    tf_pres.margin_top = Inches(0.45)
    tf_pres.margin_left = tf_pres.margin_right = Inches(0.22)

    # Field 1: Presenter Name
    p_f1 = tf_pres.paragraphs[0]
    p_f1.text = "PRESENTED BY:"
    p_f1.font.name = FONT_HEAD
    p_f1.font.size = Pt(9.5)
    p_f1.font.bold = True
    p_f1.font.color.rgb = RGBColor(120, 205, 195)

    p_f1_val = tf_pres.add_paragraph()
    p_f1_val.text = "Sahil Varma  [Click to edit / Add Team Members]"
    p_f1_val.font.name = FONT_HEAD
    p_f1_val.font.size = Pt(14)
    p_f1_val.font.bold = True
    p_f1_val.font.color.rgb = WHITE
    p_f1_val.space_before = Pt(2)

    # Field 2: Roll Number / Student ID
    p_f2 = tf_pres.add_paragraph()
    p_f2.text = "STUDENT ID / USN / ROLL NO:"
    p_f2.font.name = FONT_HEAD
    p_f2.font.size = Pt(9.5)
    p_f2.font.bold = True
    p_f2.font.color.rgb = RGBColor(120, 205, 195)
    p_f2.space_before = Pt(6)

    p_f2_val = tf_pres.add_paragraph()
    p_f2_val.text = "[Enter Your Roll Number / Registration ID]"
    p_f2_val.font.name = FONT_BODY
    p_f2_val.font.size = Pt(11)
    p_f2_val.font.color.rgb = RGBColor(230, 240, 250)
    p_f2_val.space_before = Pt(2)

    # Field 3: Department & Institution
    p_f3 = tf_pres.add_paragraph()
    p_f3.text = "DEPARTMENT & INSTITUTION:"
    p_f3.font.name = FONT_HEAD
    p_f3.font.size = Pt(9.5)
    p_f3.font.bold = True
    p_f3.font.color.rgb = RGBColor(120, 205, 195)
    p_f3.space_before = Pt(6)

    p_f3_val = tf_pres.add_paragraph()
    p_f3_val.text = "Department of Computer Science & Engineering\n[Enter Your College / University Name]"
    p_f3_val.font.name = FONT_BODY
    p_f3_val.font.size = Pt(11)
    p_f3_val.font.color.rgb = RGBColor(230, 240, 250)
    p_f3_val.space_before = Pt(2)

    # Field 4: Project Mentor / Faculty Guide
    p_f4 = tf_pres.add_paragraph()
    p_f4.text = "PROJECT GUIDE / MENTOR:"
    p_f4.font.name = FONT_HEAD
    p_f4.font.size = Pt(9.5)
    p_f4.font.bold = True
    p_f4.font.color.rgb = RGBColor(120, 205, 195)
    p_f4.space_before = Pt(6)

    p_f4_val = tf_pres.add_paragraph()
    p_f4_val.text = "[Enter Project Guide / Professor Name & Designation]"
    p_f4_val.font.name = FONT_BODY
    p_f4_val.font.size = Pt(11)
    p_f4_val.font.color.rgb = RGBColor(230, 240, 250)
    p_f4_val.space_before = Pt(2)

    # Field 5: Viva Panel & Academic Year
    p_f5 = tf_pres.add_paragraph()
    p_f5.text = "Evaluation: Final Capstone Viva & Technical Review Panel | Academic Year 2025–2026"
    p_f5.font.name = FONT_BODY
    p_f5.font.size = Pt(9.5)
    p_f5.font.color.rgb = RGBColor(180, 210, 230)
    p_f5.space_before = Pt(6)

    add_speaker_notes(s1, 
        "Good morning, esteemed panel members and faculty reviewers. Today, I am presenting ResourcePulse AI—an "
        "explainable emergency resource coordination platform designed for healthcare logistics during disaster surges. "
        "Unlike black-box AI wrappers, our platform pairs deterministic mathematical invariants to guarantee donor hospital safety "
        "with Google's Gemini 3.8 Flash for plain-language incident directives."
    )

    # =============================================================
    # SLIDE 2: PROBLEM STATEMENT
    # =============================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2, IVORY)
    add_header(s2, "01 / Systemic Crisis in Healthcare Logistics", "The 4 Critical Failure Modes in Disaster Logistics", 
               "Why conventional phone trees and isolated spreadsheets collapse during sudden demand surges")

    # Left visual card
    img2 = get_asset("problem_silos_contrast")
    if img2:
        s2.shapes.add_picture(img2, Inches(0.8), Inches(2.0), Inches(4.8), Inches(4.9))
        border2 = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(2.0), Inches(4.8), Inches(4.9))
        border2.fill.background()
        border2.line.color.rgb = BORDER_COL
        border2.line.width = Pt(1)

    # Right side: 4 failure cards in 2x2 grid or stacked list
    failures = [
        ("Asymmetric Visibility (Information Silos)", 
         "Facility managers only see their own local storeroom stock. They cannot observe whether an idle surplus exists 5 miles away.", 
         RED, LIGHT_RED),
        ("Latent Shortages (Delayed Response)", 
         "Critical supply deficits are recognized only when physical reserves reach absolute zero—making emergency triage dangerously reactive.", 
         AMBER, LIGHT_AMBER),
        ("Donor Exhaustion Risk (Unsafe Transfers)", 
         "Ad-hoc manual coordination overdraws from donor hospitals, inadvertently dropping the donor facility below its own safety baseline.", 
         RED, LIGHT_RED),
        ("'Black Box' AI Distrust & Hallucination", 
         "Emergency directors reject purely probabilistic neural networks that invent non-existent numbers or cannot mathematically prove patient safety.", 
         PURPLE, LIGHT_PURP)
    ]

    card_y = 2.0
    for title, desc, col_accent, fill_accent in failures:
        card = add_card(s2, Inches(5.8), Inches(card_y), Inches(6.7), Inches(1.15), fill_color=WHITE, border_color=BORDER_COL)
        # Left color bar
        bar = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(5.8), Inches(card_y), Inches(0.18), Inches(1.15))
        bar.fill.solid()
        bar.fill.fore_color.rgb = col_accent
        bar.line.fill.background()

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.3)
        tf.margin_top = Inches(0.08)
        
        p = tf.paragraphs[0]
        p.text = title
        p.font.name = FONT_HEAD
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = NAVY

        p_desc = tf.add_paragraph()
        p_desc.text = desc
        p_desc.font.name = FONT_BODY
        p_desc.font.size = Pt(11)
        p_desc.font.color.rgb = SLATE
        p_desc.space_before = Pt(3)

        card_y += 1.25

    # Bottom technical footnote
    foot2 = s2.shapes.add_textbox(Inches(5.8), Inches(7.0), Inches(6.7), Inches(0.3))
    foot2.text_frame.paragraphs[0].text = "[Technical Note: Evaluated on simulated mass-casualty surge scenarios (Metro Surge & Grid Outage)]"
    foot2.text_frame.paragraphs[0].font.size = Pt(9.5)
    foot2.text_frame.paragraphs[0].font.color.rgb = MUTED

    add_speaker_notes(s2,
        "During mass-casualty events, healthcare systems face four critical breakdowns: first, asymmetric visibility where wards "
        "operate in silos; second, latent shortages where deficits are discovered only when supplies hit zero; third, donor exhaustion, "
        "where manual transfers drain the helping hospital; and fourth, severe distrust in black-box AI tools that hallucinate data. "
        "ResourcePulse AI specifically targets and eliminates these four systemic failure points."
    )

    # =============================================================
    # SLIDE 3: WHAT IS A HOSPITAL WARD?
    # =============================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3, IVORY)
    add_header(s3, "02 / Operational Hierarchy & Ward Taxonomy", "What is a Hospital Ward? The Internal Operational Units", 
               "Understanding that hospital wards are internal specialized clinical divisions within one facility campus")

    # Left visual
    img3 = get_asset("hospital_wards_structure")
    if img3:
        s3.shapes.add_picture(img3, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.8))
        border3 = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.8))
        border3.fill.background()
        border3.line.color.rgb = BORDER_COL
        border3.line.width = Pt(1)

    # Right side: Hierarchy Tree and definitions
    # Top campus node
    c_node = add_card(s3, Inches(6.7), Inches(2.0), Inches(5.8), Inches(0.8), fill_color=NAVY, border_color=TEAL)
    tf_c = c_node.text_frame
    tf_c.word_wrap = True
    p_c1 = tf_c.paragraphs[0]
    p_c1.text = "ONE HEALTHCARE FACILITY / CAMPUS"
    p_c1.font.name = FONT_HEAD
    p_c1.font.size = Pt(13)
    p_c1.font.bold = True
    p_c1.font.color.rgb = WHITE
    p_c2 = tf_c.add_paragraph()
    p_c2.text = "Shared central inventory, power grid, and physical logistical jurisdiction"
    p_c2.font.name = FONT_BODY
    p_c2.font.size = Pt(10.5)
    p_c2.font.color.rgb = RGBColor(180, 210, 230)

    ward_units = [
        ("Emergency Ward (ED)", "Ground-floor rapid trauma intake, ambulance staging bays, resuscitation equipment.", RED),
        ("Intensive Care Unit (ICU)", "High-flow mechanical ventilators, hemodialysis, and continuous life-support telemetry.", TEAL),
        ("Cardiology Ward", "Specialized cardiac telemetry, perfusion equipment, and telemetry telemetry monitors.", PURPLE),
        ("General Inpatient Ward", "Standard acute recovery beds, general oxygen manifold lines, and basic patient monitoring.", GREEN)
    ]

    wy = 2.95
    for w_name, w_desc, w_col in ward_units:
        w_card = add_card(s3, Inches(6.7), Inches(wy), Inches(5.8), Inches(0.88), fill_color=WHITE, border_color=BORDER_COL)
        # Left indicator dot
        dot = s3.shapes.add_shape(MSO_SHAPE.OVAL, Inches(6.85), Inches(wy + 0.15), Inches(0.18), Inches(0.18))
        dot.fill.solid()
        dot.fill.fore_color.rgb = w_col
        dot.line.fill.background()

        tf_w = w_card.text_frame
        tf_w.word_wrap = True
        tf_w.margin_left = Inches(0.35)
        tf_w.margin_top = Inches(0.06)

        pw = tf_w.paragraphs[0]
        pw.text = w_name
        pw.font.name = FONT_HEAD
        pw.font.size = Pt(12)
        pw.font.bold = True
        pw.font.color.rgb = NAVY

        pwd = tf_w.add_paragraph()
        pwd.text = w_desc
        pwd.font.name = FONT_BODY
        pwd.font.size = Pt(10.5)
        pwd.font.color.rgb = SLATE
        pwd.space_before = Pt(2)

        wy += 0.95

    # Bottom takeaway
    takeaway = add_card(s3, Inches(6.7), Inches(6.8), Inches(5.8), Inches(0.48), fill_color=LIGHT_TEAL, border_color=TEAL)
    tf_t = takeaway.text_frame
    p_t = tf_t.paragraphs[0]
    p_t.text = "Key Clarification: Wards share a physical campus, but operate as disconnected data islands."
    p_t.font.name = FONT_BODY
    p_t.font.size = Pt(10)
    p_t.font.bold = True
    p_t.font.color.rgb = TEAL

    add_speaker_notes(s3,
        "It is crucial for technical evaluators to understand the domain ontology: a hospital ward is not a separate building or hospital. "
        "It is an internal operational division within one hospital, such as the Emergency Department, ICU, or Cardiology. "
        "Because these wards operate on legacy decentralized protocols, they become disconnected data islands, causing local imbalances."
    )

    # =============================================================
    # SLIDE 4: INFORMATION SILO
    # =============================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4, IVORY)
    add_header(s4, "03 / The Visibility Breakdown", "The Information Silo: Idle Surplus vs. Fatal Shortage", 
               "How a lack of real-time bilateral visibility turns manageable inventories into deadly stockouts")

    # Image in top half
    img4 = get_asset("oxygen_silo_split")
    if img4:
        s4.shapes.add_picture(img4, Inches(0.8), Inches(1.9), Inches(11.73), Inches(3.3))
        border4 = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.9), Inches(11.73), Inches(3.3))
        border4.fill.background()
        border4.line.color.rgb = BORDER_COL
        border4.line.width = Pt(1)

    # Overlay editable comparison cards in bottom half
    # Ward A (Donor)
    card_a = add_card(s4, Inches(0.8), Inches(5.35), Inches(3.7), Inches(1.8), fill_color=WHITE, border_color=GREEN)
    tf_a = card_a.text_frame
    tf_a.word_wrap = True
    p_a1 = tf_a.paragraphs[0]
    p_a1.text = "WARD A — POTENTIAL DONOR"
    p_a1.font.name = FONT_HEAD
    p_a1.font.size = Pt(12)
    p_a1.font.bold = True
    p_a1.font.color.rgb = GREEN

    p_a2 = tf_a.add_paragraph()
    p_a2.text = "• On-Hand Inventory: 10 Oxygen Cylinders\n• Mandatory Safety Baseline: 6 Cylinders\n• Safe Verified Surplus: +4 Cylinders"
    p_a2.font.name = FONT_BODY
    p_a2.font.size = Pt(11)
    p_a2.font.color.rgb = SLATE
    p_a2.space_before = Pt(4)

    p_a3 = tf_a.add_paragraph()
    p_a3.text = "Status: Over-resourced & idle"
    p_a3.font.name = FONT_HEAD
    p_a3.font.size = Pt(10.5)
    p_a3.font.bold = True
    p_a3.font.color.rgb = GREEN
    p_a3.space_before = Pt(3)

    # The Silo Gap
    card_gap = add_card(s4, Inches(4.8), Inches(5.35), Inches(3.7), Inches(1.8), fill_color=LIGHT_AMBER, border_color=AMBER)
    tf_g = card_gap.text_frame
    tf_g.word_wrap = True
    p_g1 = tf_g.paragraphs[0]
    p_g1.text = "THE INFORMATION SILO"
    p_g1.font.name = FONT_HEAD
    p_g1.font.size = Pt(12)
    p_g1.font.bold = True
    p_g1.font.color.rgb = AMBER

    p_g2 = tf_g.add_paragraph()
    p_g2.text = "• No Shared Operational Dashboard\n• Telemetry Trapped in Siloed Systems\n• Dependent on Slow Manual Phone Calls"
    p_g2.font.name = FONT_BODY
    p_g2.font.size = Pt(11)
    p_g2.font.color.rgb = SLATE
    p_g2.space_before = Pt(4)

    p_g3 = tf_g.add_paragraph()
    p_g3.text = "Failure: Zero Awareness of Neighbor Surplus"
    p_g3.font.name = FONT_HEAD
    p_g3.font.size = Pt(10.5)
    p_g3.font.bold = True
    p_g3.font.color.rgb = RED
    p_g3.space_before = Pt(3)

    # Ward C (Receiver)
    card_c = add_card(s4, Inches(8.8), Inches(5.35), Inches(3.73), Inches(1.8), fill_color=WHITE, border_color=RED)
    tf_c2 = card_c.text_frame
    tf_c2.word_wrap = True
    p_c1 = tf_c2.paragraphs[0]
    p_c1.text = "WARD C — ACUTE DEFICIT"
    p_c1.font.name = FONT_HEAD
    p_c1.font.size = Pt(12)
    p_c1.font.bold = True
    p_c1.font.color.rgb = RED

    p_c2 = tf_c2.add_paragraph()
    p_c2.text = "• On-Hand Inventory: 3 Oxygen Cylinders\n• Mandatory Safety Baseline: 10 Cylinders\n• Acute System Deficit: -7 Cylinders"
    p_c2.font.name = FONT_BODY
    p_c2.font.size = Pt(11)
    p_c2.font.color.rgb = SLATE
    p_c2.space_before = Pt(4)

    p_c3 = tf_c2.add_paragraph()
    p_c3.text = "Status: Critical Life-Threatening Shortage"
    p_c3.font.name = FONT_HEAD
    p_c3.font.size = Pt(10.5)
    p_c3.font.bold = True
    p_c3.font.color.rgb = RED
    p_c3.space_before = Pt(3)

    add_speaker_notes(s4,
        "Here is the core real-world dilemma: on the left, Ward A has 10 cylinders with a safety requirement of 6, creating an idle surplus "
        "of 4. On the right, Ward C is down to 3 cylinders with 10 needed, facing a life-threatening deficit of 7. "
        "Between them lies a total communication blackout—no shared dashboard, no telemetry exchange. "
        "ResourcePulse AI breaks this wall and bridges the gap automatically."
    )

    # =============================================================
    # SLIDE 5: PROPOSED SOLUTION
    # =============================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5, IVORY)
    add_header(s5, "04 / The Unified Platform Solution", "The Solution: Centralized Telemetry & Coordination Cockpit", 
               "Consolidating ambulances, life support, oxygen, and generators into a real-time explainable coordination grid")

    # Left visual
    img5 = get_asset("cockpit_solution_hub")
    if img5:
        s5.shapes.add_picture(img5, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.8))
        border5 = s5.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.8))
        border5.fill.background()
        border5.line.color.rgb = BORDER_COL
        border5.line.width = Pt(1)

    # Right side: 4 pillars
    pillars = [
        ("1. Unified Telemetry Cockpit", 
         "Ingests vehicles, ventilators, oxygen supplies, and generator metrics into a live single-pane operational view with live polling.", 
         TEAL),
        ("2. Deterministic Anomaly & Shortage Detection", 
         "Strict mathematical threshold rules flag critical deficits and sudden demand spikes without statistical noise or guesswork.", 
         AMBER),
        ("3. Bilateral Minimax Redistribution Engine", 
         "Automatically pairs deficit facilities with qualified surplus peers, mathematically ensuring the donor is never drained into deficit.", 
         GREEN),
        ("4. Explainable Gemini AI Incident Directives", 
         "Generates structured, human-readable coordination summaries with audited evidence drawers for incident commander sign-off.", 
         PURPLE)
    ]

    py = 2.0
    for p_title, p_desc, p_col in pillars:
        p_card = add_card(s5, Inches(6.7), Inches(py), Inches(5.8), Inches(1.12), fill_color=WHITE, border_color=BORDER_COL)
        bar = s5.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.7), Inches(py), Inches(0.16), Inches(1.12))
        bar.fill.solid()
        bar.fill.fore_color.rgb = p_col
        bar.line.fill.background()

        tf = p_card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.3)
        tf.margin_top = Inches(0.08)

        p1 = tf.paragraphs[0]
        p1.text = p_title
        p1.font.name = FONT_HEAD
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = NAVY

        p2 = tf.add_paragraph()
        p2.text = p_desc
        p2.font.name = FONT_BODY
        p2.font.size = Pt(11)
        p2.font.color.rgb = SLATE
        p2.space_before = Pt(3)

        py += 1.22

    add_speaker_notes(s5,
        "Our proposed solution is ResourcePulse AI. As visualized on the left, all five operational units—the ambulance fleet, "
        "ICU ward, emergency department, oxygen depot, and emergency generators—feed real-time telemetry into a unified command terminal. "
        "The architecture is anchored on four pillars: continuous telemetry, deterministic anomaly detection, minimax bilateral redistribution, "
        "and explainable AI summaries."
    )

    # =============================================================
    # SLIDE 6: HYBRID ARCHITECTURE
    # =============================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6, IVORY)
    add_header(s6, "05 / System Design & Technical Pipeline", "Hybrid Architecture: Deterministic Rigor + Generative AI", 
               "Clear separation of concerns: mathematical algorithms compute safe quantities; Gemini AI generates human directives")

    # 7-Step Horizontal Pipeline Flowchart
    pipeline_steps = [
        ("Telemetry Ingestion", "Live units, buffers & sensors", TEAL, WHITE),
        ("Deterministic Rules", "Threshold & anomaly checks", NAVY, WHITE),
        ("Shortage & Surplus", "Deficit vs safe buffer math", RED, WHITE),
        ("Safe Transfer Engine", "Bilateral minimax pairing", GREEN, WHITE),
        ("Explainable Math", "Auditable algebraic proof", MUTED, WHITE),
        ("Gemini AI Summary", "Structured JSON directive", PURPLE, WHITE),
        ("Incident Commander", "Human review & dispatch", AMBER, WHITE)
    ]

    box_w = Inches(1.58)
    box_h = Inches(1.8)
    spacing = Inches(0.12)
    start_x = Inches(0.8)

    for i, (p_name, p_sub, col_bg, col_txt) in enumerate(pipeline_steps):
        x = start_x + i * (box_w + spacing)
        box = add_card(s6, x, Inches(2.1), box_w, box_h, fill_color=col_bg, border_color=None)
        
        # Step number pill inside box
        num_pill = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x + Inches(0.15), Inches(2.22), Inches(0.45), Inches(0.24))
        num_pill.fill.solid()
        num_pill.fill.fore_color.rgb = WHITE
        num_pill.line.fill.background()
        p_num = num_pill.text_frame.paragraphs[0]
        p_num.text = f"0{i+1}"
        p_num.alignment = PP_ALIGN.CENTER
        p_num.font.name = FONT_HEAD
        p_num.font.size = Pt(8.5)
        p_num.font.bold = True
        p_num.font.color.rgb = col_bg

        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_top = Inches(0.42)
        tf.margin_left = tf.margin_right = Inches(0.1)

        p1 = tf.paragraphs[0]
        p1.text = p_name
        p1.font.name = FONT_HEAD
        p1.font.size = Pt(11)
        p1.font.bold = True
        p1.font.color.rgb = col_txt
        p1.alignment = PP_ALIGN.CENTER

        p2 = tf.add_paragraph()
        p2.text = p_sub
        p2.font.name = FONT_BODY
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = RGBColor(230, 240, 250) if col_txt == WHITE else SLATE
        p2.alignment = PP_ALIGN.CENTER
        p2.space_before = Pt(4)

        # Draw connector arrow if not last
        if i < len(pipeline_steps) - 1:
            arr = s6.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, x + box_w + Inches(0.01), Inches(2.9), Inches(0.1), Inches(0.18))
            arr.fill.solid()
            arr.fill.fore_color.rgb = MUTED
            arr.line.fill.background()

    # Core Architectural Invariant Cards Below
    arch_notes = [
        ("Mathematical Separation of Responsibilities", 
         "The generative model is never asked to perform arithmetic calculations or invent transfer quantities. "
         "All supply redistribution numbers are calculated by deterministic algorithms beforehand.", 
         TEAL),
        ("Strict Human-in-the-Loop Governance", 
         "Crucial Safety Principle: AI does NOT independently execute or authorize transfers. "
         "The incident commander reviews the plain-language brief alongside the algebraic evidence before physical dispatch.", 
         AMBER)
    ]

    ny = 4.25
    for n_title, n_desc, n_col in arch_notes:
        n_card = add_card(s6, Inches(0.8), Inches(ny), Inches(11.73), Inches(1.3), fill_color=WHITE, border_color=BORDER_COL)
        bar = s6.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(ny), Inches(0.18), Inches(1.3))
        bar.fill.solid()
        bar.fill.fore_color.rgb = n_col
        bar.line.fill.background()

        tf = n_card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.35)
        tf.margin_top = Inches(0.1)

        p1 = tf.paragraphs[0]
        p1.text = n_title
        p1.font.name = FONT_HEAD
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = NAVY

        p2 = tf.add_paragraph()
        p2.text = n_desc
        p2.font.name = FONT_BODY
        p2.font.size = Pt(11.5)
        p2.font.color.rgb = SLATE
        p2.space_before = Pt(4)

        ny += 1.45

    add_speaker_notes(s6,
        "Here is our system architecture pipeline. Please observe the strict separation of concerns: telemetry passes into "
        "deterministic threshold rules, which compute safe bilateral minimax transfers and algebraic proofs. "
        "Only this pre-computed summary is passed to Gemini 3.8 Flash to synthesize natural language directives. "
        "Most importantly, the AI does not authorize transfers—the human incident commander retains total decision control."
    )

    # =============================================================
    # SLIDE 7: DASHBOARD OVERVIEW
    # =============================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7, IVORY)
    add_header(s7, "06 / Real-Time Cockpit & Telemetry View", "Operations Dashboard: Real-Time Fleet & Inventory Triage", 
               "Single-pane operational cockpit displaying live resource status, utilization load, and rapid triage filters")

    # Scenario Bar
    scen_bar = add_card(s7, Inches(0.8), Inches(1.9), Inches(11.73), Inches(0.45), fill_color=NAVY, border_color=None)
    tf_sb = scen_bar.text_frame
    tf_sb.vertical_anchor = MSO_ANCHOR.MIDDLE
    p_sb = tf_sb.paragraphs[0]
    p_sb.text = "ACTIVE DEMO SCENARIO: Metro Emergency Surge [Mass Casualty Incident]  |  Status: ⟳ Live Polling (Updated Just Now)"
    p_sb.font.name = FONT_HEAD
    p_sb.font.size = Pt(10.5)
    p_sb.font.bold = True
    p_sb.font.color.rgb = WHITE

    # 4 Pillar KPI Dashboard Cards
    kpis = [
        ("TOTAL RESOURCES", "142", "Tracked across 4 Wards", TEAL, LIGHT_TEAL),
        ("IN ACTIVE USE", "105", "Deployed in emergency care", AMBER, LIGHT_AMBER),
        ("AVAILABLE BUFFER", "37", "Immediate deployable reserves", GREEN, LIGHT_GREEN),
        ("UTILIZATION RATE", "74%", "Threshold: Critical at 85%", RED, LIGHT_RED)
    ]

    kw = Inches(2.78)
    for i, (k_label, k_val, k_sub, k_col, k_tint) in enumerate(kpis):
        kx = Inches(0.8) + i * Inches(2.98)
        k_card = add_card(s7, kx, Inches(2.5), kw, Inches(1.5), fill_color=WHITE, border_color=BORDER_COL)
        
        # Color accent stripe
        c_str = s7.shapes.add_shape(MSO_SHAPE.RECTANGLE, kx, Inches(2.5), kw, Inches(0.08))
        c_str.fill.solid()
        c_str.fill.fore_color.rgb = k_col
        c_str.line.fill.background()

        tf = k_card.text_frame
        tf.word_wrap = True
        tf.margin_top = Inches(0.12)
        tf.margin_left = Inches(0.18)

        p1 = tf.paragraphs[0]
        p1.text = k_label
        p1.font.name = FONT_HEAD
        p1.font.size = Pt(10)
        p1.font.bold = True
        p1.font.color.rgb = MUTED

        p2 = tf.add_paragraph()
        p2.text = k_val
        p2.font.name = FONT_HEAD
        p2.font.size = Pt(30)
        p2.font.bold = True
        p2.font.color.rgb = NAVY
        p2.space_before = Pt(1)

        p3 = tf.add_paragraph()
        p3.text = k_sub
        p3.font.name = FONT_BODY
        p3.font.size = Pt(9.5)
        p3.font.color.rgb = k_col
        p3.space_before = Pt(2)

    # Middle Section: Trend Chart Representation + Active Deficit Summary Table
    # Trend Chart Mockup Box
    trend_box = add_card(s7, Inches(0.8), Inches(4.2), Inches(6.8), Inches(2.8), fill_color=WHITE, border_color=BORDER_COL)
    tf_tr = trend_box.text_frame
    tf_tr.margin_left = tf_tr.margin_top = Inches(0.2)
    p_tr1 = tf_tr.paragraphs[0]
    p_tr1.text = "NETWORK UTILIZATION TRAJECTORY (VECTOR SVG)"
    p_tr1.font.name = FONT_HEAD
    p_tr1.font.size = Pt(11)
    p_tr1.font.bold = True
    p_tr1.font.color.rgb = NAVY

    # Visual simulated trend metrics inside chart box
    # Baseline line, warning line at 85%
    warn_line = s7.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.1), Inches(4.9), Inches(6.2), Inches(0.03))
    warn_line.fill.solid()
    warn_line.fill.fore_color.rgb = RED
    warn_line.line.fill.background()

    lbl_warn = s7.shapes.add_textbox(Inches(5.2), Inches(4.68), Inches(2.2), Inches(0.3))
    lbl_warn.text_frame.paragraphs[0].text = "Critical Threshold: 85%"
    lbl_warn.text_frame.paragraphs[0].font.size = Pt(9)
    lbl_warn.text_frame.paragraphs[0].font.bold = True
    lbl_warn.text_frame.paragraphs[0].font.color.rgb = RED

    # Trend stats
    chart_stat = add_card(s7, Inches(1.1), Inches(5.3), Inches(6.2), Inches(1.4), fill_color=LIGHT_TEAL, border_color=TEAL)
    tf_cs = chart_stat.text_frame
    tf_cs.word_wrap = True
    p_cs1 = tf_cs.paragraphs[0]
    p_cs1.text = "Surge Analysis Milestones:"
    p_cs1.font.name = FONT_HEAD
    p_cs1.font.size = Pt(11)
    p_cs1.font.bold = True
    p_cs1.font.color.rgb = TEAL

    p_cs2 = tf_cs.add_paragraph()
    p_cs2.text = "• T-04h Baseline: 42% Load (Normal steady state across all wards)\n• T-02h Mass Incident Inflow: Spiked to 88% (Triggered automated anomaly engine)\n• Present T-0: Stabilized at 74% (Awaiting bilateral fleet redistribution)"
    p_cs2.font.name = FONT_BODY
    p_cs2.font.size = Pt(10)
    p_cs2.font.color.rgb = SLATE
    p_cs2.space_before = Pt(3)

    # Right Side: Triage Filter & Deficit Table
    triage_box = add_card(s7, Inches(7.8), Inches(4.2), Inches(4.73), Inches(2.8), fill_color=WHITE, border_color=BORDER_COL)
    tf_tb = triage_box.text_frame
    tf_tb.margin_left = tf_tb.margin_top = Inches(0.18)
    p_tb1 = tf_tb.paragraphs[0]
    p_tb1.text = "ACTIVE TRIAGE SUMMARY"
    p_tb1.font.name = FONT_HEAD
    p_tb1.font.size = Pt(11)
    p_tb1.font.bold = True
    p_tb1.font.color.rgb = NAVY

    triage_items = [
        ("Critical Shortage (2)", "-5 Ambulances | -7 O2 Cylinders", RED, LIGHT_RED),
        ("Overutilized Units (1)", "ICU Ventilators (94% Load)", AMBER, LIGHT_AMBER),
        ("Adequate Stock (5)", "Generators & Cardiology Wards", GREEN, LIGHT_GREEN)
    ]
    ty = 4.7
    for t_tit, t_sub, t_col, t_tint in triage_items:
        t_c = add_card(s7, Inches(8.0), Inches(ty), Inches(4.33), Inches(0.65), fill_color=t_tint, border_color=t_col)
        tf_tc = t_c.text_frame
        tf_tc.margin_left = Inches(0.12)
        tf_tc.margin_top = Inches(0.04)
        p_t1 = tf_tc.paragraphs[0]
        p_t1.text = t_tit
        p_t1.font.name = FONT_HEAD
        p_t1.font.size = Pt(10.5)
        p_t1.font.bold = True
        p_t1.font.color.rgb = t_col
        p_t2 = tf_tc.add_paragraph()
        p_t2.text = t_sub
        p_t2.font.name = FONT_BODY
        p_t2.font.size = Pt(9.5)
        p_t2.font.color.rgb = SLATE
        ty += 0.72

    add_speaker_notes(s7,
        "This slide depicts our live operational cockpit. The upper KPI strip breaks resources into total tracked, deployed, "
        "available buffers, and network load. In this Metro Emergency Surge demo scenario, overall utilization is at 74%, "
        "having peaked at 88% above our critical safety threshold. The triage panel immediately surfaces two critical shortages: "
        "rapid-response ambulances in Ward C and oxygen cylinders in North Pavilion."
    )

    # =============================================================
    # SLIDE 8: ALERTS & RISK SUMMARY
    # =============================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8, IVORY)
    add_header(s8, "07 / Anomaly & Triage Detection", "Operational Alerts Feed & Mathematical Risk Matrix", 
               "Real-time rule engine evaluating incoming telemetry against four distinct failure rules")

    # 4 Large Visual Alert Cards
    alerts = [
        ("Critical Shortage Alert", 
         "TRIGGER: Available stock < 25% of baseline or absolute buffer <= 0\n"
         "IMPACT: Metro South - Ward C (Ambulances at -5 deficit)\n"
         "URGENCY: Priority 1 (Immediate Bilateral Reallocation Required)", 
         RED, LIGHT_RED),
        ("Overutilization Alert", 
         "TRIGGER: Facility operational load > 90% continuous capacity\n"
         "IMPACT: Central ICU Ward (Mechanical Ventilators at 94% load)\n"
         "URGENCY: Priority 2 (Preemptive Diversion Recommended)", 
         AMBER, LIGHT_AMBER),
        ("Stale Data Warning", 
         "TRIGGER: Telemetry timestamp has not updated in > 15 minutes\n"
         "IMPACT: Substation West - Standby Generators\n"
         "URGENCY: Priority 3 (Sensor Heartbeat Polling Required)", 
         MUTED, RGBColor(241, 245, 249)),
        ("Demand Spike Anomaly", 
         "TRIGGER: Unit demand exceeds regional peer average by > 140%\n"
         "IMPACT: Regional Trauma Pavilion (Sudden influx surge)\n"
         "URGENCY: Priority 2 (Dynamic Buffer Recalibration Triggered)", 
         PURPLE, LIGHT_PURP)
    ]

    card_w = Inches(5.7)
    card_h = Inches(2.1)
    
    # 2x2 Grid
    grid_coords = [
        (Inches(0.8), Inches(2.0)),
        (Inches(6.8), Inches(2.0)),
        (Inches(0.8), Inches(4.35)),
        (Inches(6.8), Inches(4.35))
    ]

    for (gx, gy), (a_title, a_body, a_col, a_tint) in zip(grid_coords, alerts):
        card = add_card(s8, gx, gy, card_w, card_h, fill_color=WHITE, border_color=BORDER_COL)
        # Top banner
        top_bar = s8.shapes.add_shape(MSO_SHAPE.RECTANGLE, gx, gy, card_w, Inches(0.38))
        top_bar.fill.solid()
        top_bar.fill.fore_color.rgb = a_col
        top_bar.line.fill.background()
        p_bar = top_bar.text_frame.paragraphs[0]
        p_bar.text = a_title.upper()
        p_bar.alignment = PP_ALIGN.CENTER
        p_bar.font.name = FONT_HEAD
        p_bar.font.size = Pt(11)
        p_bar.font.bold = True
        p_bar.font.color.rgb = WHITE

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_top = Inches(0.48)
        tf.margin_left = tf.margin_right = Inches(0.2)
        
        for line in a_body.split("\n"):
            p = tf.add_paragraph() if tf.paragraphs[0].text else tf.paragraphs[0]
            p.text = line
            p.font.name = FONT_BODY
            p.font.size = Pt(11)
            p.font.color.rgb = SLATE
            p.space_before = Pt(3)

    # Bottom Net Network Deficit Card
    net_card = add_card(s8, Inches(0.8), Inches(6.65), Inches(11.73), Inches(0.55), fill_color=LIGHT_RED, border_color=RED)
    tf_net = net_card.text_frame
    tf_net.vertical_anchor = MSO_ANCHOR.MIDDLE
    p_net = tf_net.paragraphs[0]
    p_net.text = "NET NETWORK DEFICIT: -17 Critical Units  |  High-Risk Focus: Metro South (Ward C) & North Trauma Pavilion"
    p_net.alignment = PP_ALIGN.CENTER
    p_net.font.name = FONT_HEAD
    p_net.font.size = Pt(11)
    p_net.font.bold = True
    p_net.font.color.rgb = RED

    add_speaker_notes(s8,
        "Here we see the four-tier alert matrix. Rather than relying on arbitrary thresholds, each rule is strictly defined: "
        "Critical Shortage triggers when stock is under 25% of baseline; Overutilization triggers at 90% capacity; "
        "Stale Data flags communication drops past 15 minutes; and Demand Spike flags unusual surges over 140% of regional peers. "
        "The bottom banner calculates total net network deficit to immediately focus incident commanders."
    )

    # =============================================================
    # SLIDE 9: DONOR AND RECEIVER
    # =============================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_background(s9, IVORY)
    add_header(s9, "08 / Bilateral Redistribution Logistics", "Donor & Receiver Matching: Precision Inter-Facility Logistics", 
               "Automated pairing of qualified surplus donors with acute deficit facilities along safe transport corridors")

    # Left visual: route diagram
    img9 = get_asset("facility_transfer_route")
    if img9:
        s9.shapes.add_picture(img9, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.8))
        border9 = s9.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.8))
        border9.fill.background()
        border9.line.color.rgb = BORDER_COL
        border9.line.width = Pt(1)

    # Right side: Donor and Receiver specification cards
    # Donor Card (Hospital A)
    donor_card = add_card(s9, Inches(6.7), Inches(2.0), Inches(5.8), Inches(1.9), fill_color=WHITE, border_color=GREEN)
    d_bar = s9.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.7), Inches(2.0), Inches(5.8), Inches(0.32))
    d_bar.fill.solid()
    d_bar.fill.fore_color.rgb = GREEN
    d_bar.line.fill.background()
    d_bar.text_frame.paragraphs[0].text = "HOSPITAL A — VERIFIED DONOR FACILITY"
    d_bar.text_frame.paragraphs[0].font.name = FONT_HEAD
    d_bar.text_frame.paragraphs[0].font.size = Pt(10.5)
    d_bar.text_frame.paragraphs[0].font.bold = True
    d_bar.text_frame.paragraphs[0].font.color.rgb = WHITE
    d_bar.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER

    tf_d = donor_card.text_frame
    tf_d.margin_top = Inches(0.4)
    tf_d.margin_left = Inches(0.2)
    p_d1 = tf_d.paragraphs[0]
    p_d1.text = "• Location: Central Hub (Ward A)\n• Total On-Hand Ambulances: 10 Vehicles\n• Mandatory Safety Requirement: 6 Vehicles\n• Calculated Safe Surplus: +4 Vehicles"
    p_d1.font.name = FONT_BODY
    p_d1.font.size = Pt(11)
    p_d1.font.color.rgb = SLATE

    # Middle Transfer Action Arrow Card
    trans_card = add_card(s9, Inches(6.7), Inches(4.05), Inches(5.8), Inches(0.75), fill_color=TEAL, border_color=None)
    tf_tr = trans_card.text_frame
    tf_tr.vertical_anchor = MSO_ANCHOR.MIDDLE
    p_tr = tf_tr.paragraphs[0]
    p_tr.text = "TRANSFER MANDATE: Reallocate 4 Ambulances (Minimax Safe Match)"
    p_tr.font.name = FONT_HEAD
    p_tr.font.size = Pt(12)
    p_tr.font.bold = True
    p_tr.font.color.rgb = WHITE
    p_tr.alignment = PP_ALIGN.CENTER

    # Receiver Card (Hospital B)
    rec_card = add_card(s9, Inches(6.7), Inches(4.95), Inches(5.8), Inches(1.85), fill_color=WHITE, border_color=RED)
    r_bar = s9.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.7), Inches(4.95), Inches(5.8), Inches(0.32))
    r_bar.fill.solid()
    r_bar.fill.fore_color.rgb = RED
    r_bar.line.fill.background()
    r_bar.text_frame.paragraphs[0].text = "HOSPITAL B — CRITICAL RECEIVER FACILITY"
    r_bar.text_frame.paragraphs[0].font.name = FONT_HEAD
    r_bar.text_frame.paragraphs[0].font.size = Pt(10.5)
    r_bar.text_frame.paragraphs[0].font.bold = True
    r_bar.text_frame.paragraphs[0].font.color.rgb = WHITE
    r_bar.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER

    tf_r = rec_card.text_frame
    tf_r.margin_top = Inches(0.4)
    tf_r.margin_left = Inches(0.2)
    p_r1 = tf_r.paragraphs[0]
    p_r1.text = "• Location: Metro South (Ward C)\n• Total On-Hand Ambulances: 3 Vehicles\n• Mandatory Safety Requirement: 8 Vehicles\n• Acute System Deficit: -5 Vehicles (Critical Stockout)"
    p_r1.font.name = FONT_BODY
    p_r1.font.size = Pt(11)
    p_r1.font.color.rgb = SLATE

    add_speaker_notes(s9,
        "Here is the bilateral pairing in action. Hospital A has 10 ambulances with a baseline requirement of 6, leaving a safe surplus of 4. "
        "Hospital B has 3 ambulances but requires 8, experiencing a deficit of 5. "
        "Our redistribution algorithm matches these complementary nodes along a secure logistics corridor, transferring exactly 4 vehicles "
        "to slash Hospital B's deficit without threatening Hospital A's operational integrity."
    )

    # =============================================================
    # SLIDE 10: SAFETY INVARIANT
    # =============================================================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_background(s10, IVORY)
    add_header(s10, "09 / Formal Verification & Audit Proof", "The Mathematical Safety Invariant: Provably Safe Redistribution", 
               "Rigorous arithmetic constraints guarantee that donor facilities are never pushed into secondary crises")

    # Mathematical Steps Layout - 3 Horizontal Cards
    eq_cards = [
        ("Step 1: Donor Safe Surplus", 
         "Surplus_donor = Available - Required\n"
         "Surplus_donor = 10 - 6 = +4\n\n"
         "Defines maximum transferable volume without violating local clinical mandate.", 
         GREEN, LIGHT_GREEN),
        ("Step 2: Receiver Net Deficit", 
         "Deficit_receiver = Required - Available\n"
         "Deficit_receiver = 8 - 3 = +5\n\n"
         "Defines recipient emergency shortfall required to stabilize trauma admissions.", 
         RED, LIGHT_RED),
        ("Step 3: Minimax Transfer", 
         "Quantity = min(Surplus_donor, Deficit_receiver)\n"
         "Quantity = min(4, 5) = 4\n\n"
         "Takes the safe lower bound to preserve donor integrity at all times.", 
         TEAL, LIGHT_TEAL)
    ]

    cw = Inches(3.75)
    for i, (title, content, col, tint) in enumerate(eq_cards):
        cx = Inches(0.8) + i * Inches(4.0)
        card = add_card(s10, cx, Inches(2.0), cw, Inches(2.5), fill_color=WHITE, border_color=BORDER_COL)
        # Header banner
        hbar = s10.shapes.add_shape(MSO_SHAPE.RECTANGLE, cx, Inches(2.0), cw, Inches(0.35))
        hbar.fill.solid()
        hbar.fill.fore_color.rgb = col
        hbar.line.fill.background()
        hbar.text_frame.paragraphs[0].text = title
        hbar.text_frame.paragraphs[0].font.name = FONT_HEAD
        hbar.text_frame.paragraphs[0].font.size = Pt(11)
        hbar.text_frame.paragraphs[0].font.bold = True
        hbar.text_frame.paragraphs[0].font.color.rgb = WHITE
        hbar.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_top = Inches(0.48)
        tf.margin_left = tf.margin_right = Inches(0.2)
        for line in content.split("\n"):
            p = tf.add_paragraph() if tf.paragraphs[0].text else tf.paragraphs[0]
            p.text = line
            p.font.name = FONT_HEAD if "=" in line else FONT_BODY
            p.font.size = Pt(12) if "=" in line else Pt(10.5)
            p.font.bold = "=" in line
            p.font.color.rgb = NAVY if "=" in line else SLATE
            p.space_before = Pt(2)

    # Verification & Invariant Proof Box
    proof_box = add_card(s10, Inches(0.8), Inches(4.7), Inches(11.73), Inches(2.2), fill_color=DARK_CARD, border_color=TEAL)
    tf_pb = proof_box.text_frame
    tf_pb.word_wrap = True
    tf_pb.margin_left = tf_pb.margin_top = Inches(0.25)

    p_pb1 = tf_pb.paragraphs[0]
    p_pb1.text = "FORMAL POST-TRANSFER AUDIT & INVARIANT CHECK"
    p_pb1.font.name = FONT_HEAD
    p_pb1.font.size = Pt(13)
    p_pb1.font.bold = True
    p_pb1.font.color.rgb = RGBColor(120, 205, 195)

    p_pb2 = tf_pb.add_paragraph()
    p_pb2.text = "Donor Post-Transfer Stock: Available_donor - Quantity = 10 - 4 = 6 Vehicles"
    p_pb2.font.name = FONT_HEAD
    p_pb2.font.size = Pt(13)
    p_pb2.font.bold = True
    p_pb2.font.color.rgb = WHITE
    p_pb2.space_before = Pt(4)

    p_pb3 = tf_pb.add_paragraph()
    p_pb3.text = "Invariant Formula: Post-Transfer Stock >= Required Baseline  ==>  6 >= 6"
    p_pb3.font.name = FONT_HEAD
    p_pb3.font.size = Pt(14)
    p_pb3.font.bold = True
    p_pb3.font.color.rgb = RGBColor(100, 230, 150)
    p_pb3.space_before = Pt(4)

    # Big Green Stamp / Badge
    stamp = s10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.5), Inches(5.1), Inches(3.7), Inches(1.4))
    stamp.fill.solid()
    stamp.fill.fore_color.rgb = GREEN
    stamp.line.color.rgb = WHITE
    stamp.line.width = Pt(2)
    tf_st = stamp.text_frame
    tf_st.vertical_anchor = MSO_ANCHOR.MIDDLE
    p_st1 = tf_st.paragraphs[0]
    p_st1.text = "✓ SAFETY INVARIANT: TRUE"
    p_st1.font.name = FONT_HEAD
    p_st1.font.size = Pt(16)
    p_st1.font.bold = True
    p_st1.font.color.rgb = WHITE
    p_st1.alignment = PP_ALIGN.CENTER
    p_st2 = tf_st.add_paragraph()
    p_st2.text = "Donor Baseline Guaranteed Protected"
    p_st2.font.name = FONT_BODY
    p_st2.font.size = Pt(11)
    p_st2.font.color.rgb = RGBColor(220, 255, 230)
    p_st2.alignment = PP_ALIGN.CENTER

    add_speaker_notes(s10,
        "This is the intellectual cornerstone of ResourcePulse AI: the mathematical safety invariant. "
        "Before proposing any transfer, the system evaluates: Donor Surplus = 10 - 6 = 4; Receiver Deficit = 8 - 3 = 5. "
        "The transfer quantity is strictly calculated as the minimum of the two, which is 4. "
        "After the transfer, the donor retains exactly 6 ambulances, satisfying the invariant condition 6 >= 6 as TRUE. "
        "This provides zero risk of secondary donor collapse."
    )

    # =============================================================
    # SLIDE 11: COORDINATION BOARD
    # =============================================================
    s11 = prs.slides.add_slide(blank_layout)
    set_slide_background(s11, IVORY)
    add_header(s11, "10 / Execution & Human-in-the-Loop", "Coordination Board: Actionable Kanban & Audit Drawers", 
               "Interactive incident management cards with lifecycle tracking and expandable mathematical proof drawers")

    # Kanban Card 1: Primary Urgent Transfer
    k1 = add_card(s11, Inches(0.8), Inches(2.0), Inches(5.7), Inches(4.8), fill_color=WHITE, border_color=BORDER_COL)
    # Header bar
    k1_bar = s11.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(2.0), Inches(5.7), Inches(0.42))
    k1_bar.fill.solid()
    k1_bar.fill.fore_color.rgb = TEAL
    k1_bar.line.fill.background()
    k1_bar.text_frame.paragraphs[0].text = "TRANSFER ORDER #TR-1049  |  PRIORITY 1 CRITICAL"
    k1_bar.text_frame.paragraphs[0].font.name = FONT_HEAD
    k1_bar.text_frame.paragraphs[0].font.size = Pt(11)
    k1_bar.text_frame.paragraphs[0].font.bold = True
    k1_bar.text_frame.paragraphs[0].font.color.rgb = WHITE

    tf_k1 = k1.text_frame
    tf_k1.margin_top = Inches(0.55)
    tf_k1.margin_left = tf_k1.margin_right = Inches(0.2)
    p1 = tf_k1.paragraphs[0]
    p1.text = "Resource: Rapid Response Ambulances"
    p1.font.name = FONT_HEAD
    p1.font.size = Pt(13)
    p1.font.bold = True
    p1.font.color.rgb = NAVY

    p2 = tf_k1.add_paragraph()
    p2.text = "Origin: Central Hub (Ward A)  ──▶  Destination: Metro South (Ward C)\nReallocation Quantity: 4 Vehicles"
    p2.font.name = FONT_BODY
    p2.font.size = Pt(11)
    p2.font.color.rgb = SLATE
    p2.space_before = Pt(4)

    # Lifecycle Status Pills
    p_pills = [("Pending", SLATE, WHITE), ("In-Transit [ACTIVE]", TEAL, WHITE), ("Coordinated", GREEN, WHITE)]
    px = 1.0
    for p_name, p_bg, p_fg in p_pills:
        pill = s11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(px), Inches(3.3), Inches(1.65), Inches(0.32))
        pill.fill.solid()
        pill.fill.fore_color.rgb = p_bg
        pill.line.fill.background()
        p_p = pill.text_frame.paragraphs[0]
        p_p.text = p_name
        p_p.alignment = PP_ALIGN.CENTER
        p_p.font.name = FONT_HEAD
        p_p.font.size = Pt(9)
        p_p.font.bold = True
        p_p.font.color.rgb = p_fg
        px += 1.75

    # Expandable Evidence & Math Drawer inside Card 1
    drawer = add_card(s11, Inches(1.0), Inches(3.8), Inches(5.3), Inches(2.8), fill_color=LIGHT_TEAL, border_color=TEAL)
    tf_dr = drawer.text_frame
    tf_dr.margin_left = tf_dr.margin_top = Inches(0.18)
    p_dr1 = tf_dr.paragraphs[0]
    p_dr1.text = "▾ INSPECT EVIDENCE & ARITHMETIC PROOF"
    p_dr1.font.name = FONT_HEAD
    p_dr1.font.size = Pt(11)
    p_dr1.font.bold = True
    p_dr1.font.color.rgb = TEAL

    proof_lines = [
        "• Recipient Need Equation: 8 Required - 3 Available = 5 Deficit",
        "• Donor Capacity Equation: 10 Available - 6 Required = 4 Surplus",
        "• Enforced Minimax: Quantity = min(4, 5) = 4 Units",
        "• Safety Invariant Check: 10 - 4 = 6 >= 6 (Preserved)",
        "• Algorithmic Justification: Relieves 80% of Ward C's deficit while preserving Ward A's primary trauma readiness."
    ]
    for pl in proof_lines:
        p_pl = tf_dr.add_paragraph()
        p_pl.text = pl
        p_pl.font.name = FONT_BODY
        p_pl.font.size = Pt(9.5)
        p_pl.font.color.rgb = NAVY
        p_pl.space_before = Pt(3)

    # Right Side: Secondary Actions & Dispatch Controls
    k2 = add_card(s11, Inches(6.8), Inches(2.0), Inches(5.7), Inches(2.3), fill_color=WHITE, border_color=BORDER_COL)
    k2_bar = s11.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.8), Inches(2.0), Inches(5.7), Inches(0.42))
    k2_bar.fill.solid()
    k2_bar.fill.fore_color.rgb = PURPLE
    k2_bar.line.fill.background()
    k2_bar.text_frame.paragraphs[0].text = "TRANSFER ORDER #TR-1050  |  PRIORITY 2 HIGH"
    k2_bar.text_frame.paragraphs[0].font.name = FONT_HEAD
    k2_bar.text_frame.paragraphs[0].font.size = Pt(11)
    k2_bar.text_frame.paragraphs[0].font.bold = True
    k2_bar.text_frame.paragraphs[0].font.color.rgb = WHITE

    tf_k2 = k2.text_frame
    tf_k2.margin_top = Inches(0.55)
    tf_k2.margin_left = Inches(0.2)
    p_k2_1 = tf_k2.paragraphs[0]
    p_k2_1.text = "Resource: High-Flow O2 Canisters"
    p_k2_1.font.name = FONT_HEAD
    p_k2_1.font.size = Pt(13)
    p_k2_1.font.bold = True
    p_k2_1.font.color.rgb = NAVY

    p_k2_2 = tf_k2.add_paragraph()
    p_k2_2.text = "Origin: General Ward B  ──▶  Destination: North Pavilion (Ward C)\nQuantity: 4 Canisters (Status: [Pending Commander Approval])"
    p_k2_2.font.name = FONT_BODY
    p_k2_2.font.size = Pt(11)
    p_k2_2.font.color.rgb = SLATE
    p_k2_2.space_before = Pt(3)

    # Human-in-the-Loop Governance Box
    gov_box = add_card(s11, Inches(6.8), Inches(4.5), Inches(5.7), Inches(2.3), fill_color=DARK_CARD, border_color=AMBER)
    tf_gb = gov_box.text_frame
    tf_gb.margin_left = tf_gb.margin_top = Inches(0.2)
    p_gb1 = tf_gb.paragraphs[0]
    p_gb1.text = "HUMAN-IN-THE-LOOP DISPATCH GOVERNANCE"
    p_gb1.font.name = FONT_HEAD
    p_gb1.font.size = Pt(12)
    p_gb1.font.bold = True
    p_gb1.font.color.rgb = AMBER

    p_gb2 = tf_gb.add_paragraph()
    p_gb2.text = "1. Coordinator Inspects Arithmetic Drawer: Verifies mathematical proofs.\n" \
                "2. One-Click Dispatch Trigger: Sets status to 'In-Transit' with audit timestamp.\n" \
                "3. Real-Time Telemetry Reconciliation: Automatically updates destination inventory upon vehicle arrival."
    p_gb2.font.name = FONT_BODY
    p_gb2.font.size = Pt(10.5)
    p_gb2.font.color.rgb = WHITE
    p_gb2.space_before = Pt(4)

    add_speaker_notes(s11,
        "On the Coordination Board, recommendations become interactive execution cards. "
        "Each card moves through three explicit lifecycle stages: Pending, In-Transit, and Coordinated. "
        "Crucially, the coordinator can expand the 'Evidence & Math' drawer to view the exact algebraic breakdown and verify "
        "why 4 units were chosen. No dispatch occurs automatically—the incident commander retains total oversight."
    )

    # =============================================================
    # SLIDE 12: GEMINI AI LAYER
    # =============================================================
    s12 = prs.slides.add_slide(blank_layout)
    set_slide_background(s12, IVORY)
    add_header(s12, "11 / Machine Intelligence & Security", "The Gemini AI Layer: Zero-Trust Server Architecture", 
               "Strict server-side isolation, zero API key client exposure, and structured JSON schema enforcement")

    # 3-Column Architecture Layout
    arch_cols = [
        ("Client Browser (Vite/React)", 
         "• User initiates 'Generate Insight'\n"
         "• Sends POST /api/recommendation\n"
         "• Carries only sanitized telemetry state\n"
         "• ZERO API keys or credentials exposed in client-side bundle", 
         TEAL),
        ("Secure Server (Express/Node)", 
         "• Hosts isolated backend route\n"
         "• Ingests GEMINI_API_KEY from .env\n"
         "• Enforces Type.OBJECT JSON schema\n"
         "• Formats compact prompt payload to maximize speed & credit efficiency", 
         NAVY),
        ("Google Gemini 3.8 Flash", 
         "• Evaluates pre-computed math\n"
         "• Synthesizes executive directive\n"
         "• Guarantees 100% structured JSON\n"
         "• Output: severity, action, reason, confidence, affected_location", 
         PURPLE)
    ]

    col_w = Inches(3.75)
    for i, (title, desc, col) in enumerate(arch_cols):
        cx = Inches(0.8) + i * Inches(4.0)
        card = add_card(s12, cx, Inches(2.0), col_w, Inches(2.6), fill_color=WHITE, border_color=BORDER_COL)
        # Top banner
        cbar = s12.shapes.add_shape(MSO_SHAPE.RECTANGLE, cx, Inches(2.0), col_w, Inches(0.38))
        cbar.fill.solid()
        cbar.fill.fore_color.rgb = col
        cbar.line.fill.background()
        cbar.text_frame.paragraphs[0].text = title
        cbar.text_frame.paragraphs[0].font.name = FONT_HEAD
        cbar.text_frame.paragraphs[0].font.size = Pt(11)
        cbar.text_frame.paragraphs[0].font.bold = True
        cbar.text_frame.paragraphs[0].font.color.rgb = WHITE
        cbar.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_top = Inches(0.48)
        tf.margin_left = tf.margin_right = Inches(0.18)
        for line in desc.split("\n"):
            p = tf.add_paragraph() if tf.paragraphs[0].text else tf.paragraphs[0]
            p.text = line
            p.font.name = FONT_BODY
            p.font.size = Pt(10.5)
            p.font.color.rgb = SLATE
            p.space_before = Pt(3)

        # Connector arrow
        if i < 2:
            arr = s12.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, cx + col_w + Inches(0.05), Inches(3.15), Inches(0.15), Inches(0.25))
            arr.fill.solid()
            arr.fill.fore_color.rgb = TEAL
            arr.line.fill.background()

    # Bottom Structured JSON Contract Sample Box
    json_box = add_card(s12, Inches(0.8), Inches(4.8), Inches(11.73), Inches(2.1), fill_color=NAVY, border_color=PURPLE)
    tf_j = json_box.text_frame
    tf_j.margin_left = tf_j.margin_top = Inches(0.2)
    p_j1 = tf_j.paragraphs[0]
    p_j1.text = "STRICT SERVER-SIDE JSON SCHEMA CONTRACT (Type.OBJECT via @google/genai)"
    p_j1.font.name = FONT_HEAD
    p_j1.font.size = Pt(11)
    p_j1.font.bold = True
    p_j1.font.color.rgb = RGBColor(190, 150, 255)

    p_j2 = tf_j.add_paragraph()
    p_j2.text = '{\n' \
                '  "severity": "critical",\n' \
                '  "recommended_action": "Reassign 4 ambulances from Central Hub (Ward A) to Metro South (Ward C)",\n' \
                '  "reason": "Ward C exhibits -5 vehicle deficit; Ward A maintains a verified +4 surplus preserving safety invariants",\n' \
                '  "confidence": 0.94,\n' \
                '  "affected_location": "Metro South - Ward C"\n' \
                '}'
    p_j2.font.name = "Consolas"
    p_j2.font.size = Pt(9.5)
    p_j2.font.color.rgb = RGBColor(130, 230, 190)
    p_j2.space_before = Pt(2)

    add_speaker_notes(s12,
        "Our AI architecture is enterprise-grade and secure. The browser never communicates directly with Gemini. "
        "Instead, it calls POST /api/recommendation on our Express backend. "
        "The API key remains permanently inside the server environment. "
        "Furthermore, we enforce responseMimeType as application/json with a formal Type.OBJECT schema. "
        "This prevents loose conversational rambling and delivers calibrated confidence scores."
    )

    # =============================================================
    # SLIDE 13: OFFLINE FALLBACK
    # =============================================================
    s13 = prs.slides.add_slide(blank_layout)
    set_slide_background(s13, IVORY)
    add_header(s13, "12 / High Availability & Resilience", "Offline Fallback: Zero Downtime During Disaster Blackouts", 
               "Guaranteed mission-critical continuity when cloud APIs fail, quotas expire, or network lines collapse")

    # Dual Path Architecture Box
    # Path A: Gemini Cloud Available
    p_a = add_card(s13, Inches(0.8), Inches(2.0), Inches(5.7), Inches(2.4), fill_color=WHITE, border_color=PURPLE)
    pa_bar = s13.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(2.0), Inches(5.7), Inches(0.38))
    pa_bar.fill.solid()
    pa_bar.fill.fore_color.rgb = PURPLE
    pa_bar.line.fill.background()
    pa_bar.text_frame.paragraphs[0].text = "PATH A: PRIMARY CLOUD ROUTE (GEMINI AVAILABLE)"
    pa_bar.text_frame.paragraphs[0].font.name = FONT_HEAD
    pa_bar.text_frame.paragraphs[0].font.size = Pt(11)
    pa_bar.text_frame.paragraphs[0].font.bold = True
    pa_bar.text_frame.paragraphs[0].font.color.rgb = WHITE
    pa_bar.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER

    tf_pa = p_a.text_frame
    tf_pa.margin_top = Inches(0.48)
    tf_pa.margin_left = tf_pa.margin_right = Inches(0.2)
    p_pa1 = tf_pa.paragraphs[0]
    p_pa1.text = "• Telemetry passed to Gemini 3.8 Flash model\n" \
                 "• Returns high-fidelity synthesized executive brief\n" \
                 "• Produces calibrated confidence metric (e.g. 94%)\n" \
                 "• Seamlessly integrated with rich markdown cards"
    p_pa1.font.name = FONT_BODY
    p_pa1.font.size = Pt(11)
    p_pa1.font.color.rgb = SLATE

    # Path B: Offline Local Fallback
    p_b = add_card(s13, Inches(6.8), Inches(2.0), Inches(5.7), Inches(2.4), fill_color=WHITE, border_color=TEAL)
    pb_bar = s13.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.8), Inches(2.0), Inches(5.7), Inches(0.38))
    pb_bar.fill.solid()
    pb_bar.fill.fore_color.rgb = TEAL
    pb_bar.line.fill.background()
    pb_bar.text_frame.paragraphs[0].text = "PATH B: DETERMINISTIC OFFLINE FALLBACK (LOCAL ENGINE)"
    pb_bar.text_frame.paragraphs[0].font.name = FONT_HEAD
    pb_bar.text_frame.paragraphs[0].font.size = Pt(11)
    pb_bar.text_frame.paragraphs[0].font.bold = True
    pb_bar.text_frame.paragraphs[0].font.color.rgb = WHITE
    pb_bar.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER

    tf_pb2 = p_b.text_frame
    tf_pb2.margin_top = Inches(0.48)
    tf_pb2.margin_left = tf_pb2.margin_right = Inches(0.2)
    p_pb2 = tf_pb2.paragraphs[0]
    p_pb2.text = "• Triggered automatically if API key is missing or network times out\n" \
                 "• Local engine in server.ts runs bilateral minimax matching\n" \
                 "• Generates IDENTICAL JSON schema contract with 'Fallback' badge\n" \
                 "• Zero application crashes; UI continues without interruption"
    p_pb2.font.name = FONT_BODY
    p_pb2.font.size = Pt(11)
    p_pb2.font.color.rgb = SLATE

    # Converged Unified Output Card Below
    conv_card = add_card(s13, Inches(0.8), Inches(4.65), Inches(11.73), Inches(2.2), fill_color=DARK_CARD, border_color=GREEN)
    tf_cc = conv_card.text_frame
    tf_cc.margin_left = tf_cc.margin_top = Inches(0.25)
    p_cc1 = tf_cc.paragraphs[0]
    p_cc1.text = "CONVERGED OUTPUT: UNINTERRUPTED INCIDENT COMMANDER DIRECTIVES"
    p_cc1.font.name = FONT_HEAD
    p_cc1.font.size = Pt(13)
    p_cc1.font.bold = True
    p_cc1.font.color.rgb = RGBColor(120, 205, 195)

    p_cc2 = tf_cc.add_paragraph()
    p_cc2.text = "Regardless of cloud connectivity, the incident commander receives the exact same actionable output structure. " \
                 "In extreme disaster circumstances where regional cell towers collapse or internet cables sever, " \
                 "ResourcePulse AI operates completely standalone on local edge infrastructure."
    p_cc2.font.name = FONT_BODY
    p_cc2.font.size = Pt(11.5)
    p_cc2.font.color.rgb = WHITE
    p_cc2.space_before = Pt(4)

    p_cc3 = tf_cc.add_paragraph()
    p_cc3.text = "Key Academic Differentiator: Eliminates the fragile single-point-of-failure inherent in typical cloud AI wrappers."
    p_cc3.font.name = FONT_HEAD
    p_cc3.font.size = Pt(11)
    p_cc3.font.bold = True
    p_cc3.font.color.rgb = RGBColor(100, 230, 150)
    p_cc3.space_before = Pt(4)

    add_speaker_notes(s13,
        "In emergency and disaster scenarios, external internet connections and cloud APIs frequently drop. "
        "A platform that crashes when the cloud is offline is useless in real-world crisis operations. "
        "ResourcePulse AI solves this with an integrated local rule engine in server.ts. "
        "If the Gemini API key is missing or calls time out, the system automatically falls back to deterministic local matching, "
        "returning the exact same JSON schema. Zero downtime, zero crashes."
    )

    # =============================================================
    # SLIDE 14: END-TO-END WORKFLOW & CONCLUSION
    # =============================================================
    s14 = prs.slides.add_slide(blank_layout)
    set_slide_background(s14, NAVY)
    add_header(s14, "13 / Lifecycle Journey & Defense Summary", "End-to-End Operational Workflow & Key Defense Takeaways", 
               "From initial sensor anomaly detection to human-authorized life-saving dispatch", dark_mode=True)

    # 6-Step Visual Journey Flow
    steps = [
        ("1. Monitor", "Live telemetry ingestion", TEAL),
        ("2. Spot Deficit", "Rule flags -5 ambulance deficit", RED),
        ("3. Pair Donor", "Matches Ward A +4 surplus", GREEN),
        ("4. Audit Math", "Commander verifies 6 >= 6", SLATE),
        ("5. AI Insight", "Gemini outputs structured brief", PURPLE),
        ("6. Dispatch", "Human authorizes vehicle movement", AMBER)
    ]

    sw = Inches(1.85)
    for i, (s_title, s_desc, s_col) in enumerate(steps):
        sx = Inches(0.8) + i * Inches(1.98)
        scard = add_card(s14, sx, Inches(2.0), sw, Inches(1.6), fill_color=DARK_CARD, border_color=s_col)
        
        # Step tag
        c_tag = s14.shapes.add_shape(MSO_SHAPE.RECTANGLE, sx, Inches(2.0), sw, Inches(0.3))
        c_tag.fill.solid()
        c_tag.fill.fore_color.rgb = s_col
        c_tag.line.fill.background()
        c_tag.text_frame.paragraphs[0].text = s_title.upper()
        c_tag.text_frame.paragraphs[0].font.name = FONT_HEAD
        c_tag.text_frame.paragraphs[0].font.size = Pt(9.5)
        c_tag.text_frame.paragraphs[0].font.bold = True
        c_tag.text_frame.paragraphs[0].font.color.rgb = WHITE
        c_tag.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER

        tf = scard.text_frame
        tf.word_wrap = True
        tf.margin_top = Inches(0.4)
        tf.margin_left = tf.margin_right = Inches(0.12)
        p = tf.paragraphs[0]
        p.text = s_desc
        p.font.name = FONT_BODY
        p.font.size = Pt(10)
        p.font.color.rgb = RGBColor(210, 225, 240)
        p.alignment = PP_ALIGN.CENTER

    # 4 Key Viva Takeaways
    takeaways = [
        ("Deterministic Safety", "Zero hallucinated quantities. All reallocations are mathematically bounded by verified surpluses."),
        ("Defensible Explainability", "Every single recommendation features an arithmetic audit drawer proving the donor remains safe."),
        ("Fault-Tolerant Resilience", "100% operational offline fallback ensures zero interruption during disaster network outages."),
        ("Production Architecture", "Strict server-side proxy, zero API key client leakage, and type-safe modular TypeScript.")
    ]

    tw = Inches(5.7)
    th = Inches(1.15)
    t_coords = [
        (Inches(0.8), Inches(3.85)),
        (Inches(6.8), Inches(3.85)),
        (Inches(0.8), Inches(5.15)),
        (Inches(6.8), Inches(5.15))
    ]

    for (tx, ty), (t_tit, t_desc) in zip(t_coords, takeaways):
        tcard = add_card(s14, tx, ty, tw, th, fill_color=DARK_CARD, border_color=TEAL)
        tf_t = tcard.text_frame
        tf_t.word_wrap = True
        tf_t.margin_left = Inches(0.2)
        tf_t.margin_top = Inches(0.08)

        p1 = tf_t.paragraphs[0]
        p1.text = "✓ " + t_tit
        p1.font.name = FONT_HEAD
        p1.font.size = Pt(12)
        p1.font.bold = True
        p1.font.color.rgb = RGBColor(120, 205, 195)

        p2 = tf_t.add_paragraph()
        p2.text = t_desc
        p2.font.name = FONT_BODY
        p2.font.size = Pt(10)
        p2.font.color.rgb = WHITE
        p2.space_before = Pt(3)

    # Concluding Banner
    end_banner = add_card(s14, Inches(0.8), Inches(6.45), Inches(11.73), Inches(0.65), fill_color=TEAL, border_color=None)
    tf_eb = end_banner.text_frame
    tf_eb.vertical_anchor = MSO_ANCHOR.MIDDLE
    p_eb = tf_eb.paragraphs[0]
    p_eb.text = "“Safe deterministic coordination, supported by explainable AI.”"
    p_eb.alignment = PP_ALIGN.CENTER
    p_eb.font.name = FONT_HEAD
    p_eb.font.size = Pt(15)
    p_eb.font.bold = True
    p_eb.font.color.rgb = WHITE

    add_speaker_notes(s14,
        "To summarize our technical capstone defense: ResourcePulse AI unites real-time telemetry observation with verifiable "
        "mathematical safety. From initial anomaly detection to the final human authorization, every transfer is audited, "
        "provably safe, and clearly explained. We deliver deterministic safety, defensible explainability, "
        "and complete disaster resilience. Thank you, and I now welcome questions from the viva panel."
    )

    # -------------------------------------------------------------
    # SAVE PRESENTATION
    # -------------------------------------------------------------
    output_filename = "ResourcePulse-AI-Presentation.pptx"
    output_path = os.path.join(r"d:\OpsPulse", output_filename)
    prs.save(output_path)
    print(f"Presentation successfully created and saved to: {output_path}")

if __name__ == "__main__":
    create_presentation()
