import zipfile
import xml.etree.ElementTree as ET
import json
import re

WILAYAS_DZ = [
    "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Bejaia", "Biskra", 
    "Béchar", "Bechar", "Blida", "Bouira", "Tamanrasset", "Tébessa", "Tebessa", "Tlemcen", 
    "Tiaret", "Tizi Ouzou", "Alger", "Algiers", "Djelfa", "Jijel", "Sétif", "Setif", "Saïda", 
    "Saida", "Skikda", "Sidi Bel Abbès", "Sidi Bel Abbes", "Annaba", "Guelma", "Constantine", 
    "Médéa", "Medea", "Mostaganem", "M'Sila", "Msila", "Mascara", "Ouargla", "Oran", 
    "El Bayadh", "Illizi", "Bordj Bou Arréridj", "Bordj Bou Arreridj", "Boumerdès", "Boumerdes", 
    "El Tarf", "Tindouf", "Tissemsilt", "El Oued", "Khenchela", "Souk Ahras", "Tipaza", 
    "Mila", "Aïn Defla", "Ain Defla", "Naâma", "Naama", "Aïn Témouchent", "Ain Temouchent", 
    "Ghardaïa", "Ghardaia", "Relizane", "Timimoun", "Bordj Badji Mokhtar", "Ouled Djellal", 
    "Béni Abbès", "Beni Abbes", "In Salah", "In Guezzam", "Touggourt", "Djanet", "El M'Ghair", "El Meniaa",
    # Biomes and historic regions
    "Kabylie", "Aurès", "Aures", "Sahara", "Atlas", "Hauts Plateaux", "Tell", "Mitidja", "Dahra", "Hoggar", "Tassili"
]

def parse_docx_plants(docx_path):
    with zipfile.ZipFile(docx_path) as z:
        xml_content = z.read('word/document.xml')
    
    tree = ET.fromstring(xml_content)
    tbl = tree.find('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tbl')
    if tbl is None:
        return []
    
    rows = tbl.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tr')
    plants = []
    
    for r_idx, row in enumerate(rows[1:], start=1):
        cells = row.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tc')
        if len(cells) < 7:
            continue
        
        cell_lines = []
        for c in cells:
            ps = c.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p')
            lines = [' '.join(''.join([t.text for t in p.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if t.text]).split()) for p in ps]
            lines = [l for l in lines if l]
            cell_lines.append(lines)
        
        # 1. Number
        num = r_idx
        if cell_lines[0]:
            try:
                num = int(re.sub(r'[^\d]', '', cell_lines[0][0]))
            except:
                num = r_idx

        # 2. Taxonomy & Names (Cell 1)
        c1_text = '\n'.join(cell_lines[1]) if len(cell_lines) > 1 else ''
        c1_lines = cell_lines[1] if len(cell_lines) > 1 else []
        
        scientific_name = c1_lines[0] if c1_lines else f"Plante #{num}"
        # clean scientific name if it has Vernacular glued to it
        if "Vernacular name" in scientific_name:
            scientific_name = scientific_name.split("Vernacular name")[0].strip()
        
        vernacular_names = []
        kingdom = "Plantae"
        order = ""
        family = ""
        genus = ""
        species = ""
        
        # parse vernacular
        m_vern = re.search(r'Vernacular name:\s*(.*?)(?=(Kingdom:|Order:|Family:|Genus:|Species:|$))', c1_text, re.DOTALL | re.IGNORECASE)
        vernacular_raw = ""
        if m_vern:
            vernacular_raw = m_vern.group(1).strip()
            # split by comma, Arabic comma, semicolon
            v_split = re.split(r'[,،؛;\n]+', vernacular_raw)
            vernacular_names = [v.strip() for v in v_split if v.strip() and not v.strip().lower().startswith(('kingdom', 'order', 'family', 'genus', 'species'))]
        
        m_order = re.search(r'Order:\s*([^\n\r]+)', c1_text, re.IGNORECASE)
        if m_order:
            order = m_order.group(1).strip()
            
        m_fam = re.search(r'Family:\s*([^\n\r]+)', c1_text, re.IGNORECASE)
        if m_fam:
            family = m_fam.group(1).strip()
            
        m_genus = re.search(r'Genus:\s*([^\n\r]+)', c1_text, re.IGNORECASE)
        if m_genus:
            genus = m_genus.group(1).strip()
            
        m_sp = re.search(r'Species:\s*([^\n\r]+)', c1_text, re.IGNORECASE)
        if m_sp:
            species = m_sp.group(1).strip()
        
        # 3. Distribution, Flowering & Harvesting (Cell 2)
        c2_text = '\n'.join(cell_lines[2]) if len(cell_lines) > 2 else ''
        distrib_match = re.search(r'Distribution\s*:\s*(.*?)(?=(-Flowering Stage|Flowering Stage|Harvesting|$))', c2_text, re.DOTALL | re.IGNORECASE)
        distrib_raw = distrib_match.group(1).strip() if distrib_match else c2_text
        
        flowering_match = re.search(r'(-Flowering Stage.*?$|Flowering Stage.*?$)', c2_text, re.DOTALL | re.IGNORECASE)
        flowering_raw = flowering_match.group(1).strip() if flowering_match else ""
        
        # Find wilayas / regions mentioned
        matched_regions = []
        for reg in WILAYAS_DZ:
            pattern = r'\b' + re.escape(reg) + r'\b'
            if re.search(pattern, c2_text, re.IGNORECASE):
                # normalize name
                norm_reg = reg.replace("Bejaia", "Béjaïa").replace("Bechar", "Béchar").replace("Setif", "Sétif")
                norm_reg = norm_reg.replace("Ain ", "Aïn ").replace("Medea", "Médéa").replace("Algiers", "Alger")
                if norm_reg not in matched_regions:
                    matched_regions.append(norm_reg)

        # 4. Traditional Uses, Parts Used, Dosage (Cell 3)
        c3_text = '\n'.join(cell_lines[3]) if len(cell_lines) > 3 else ''
        m_uses = re.search(r'Traditional uses:\s*(.*?)(?=(Parts used\s*:|Dosage\s*:|$))', c3_text, re.DOTALL | re.IGNORECASE)
        uses_str = m_uses.group(1).strip() if m_uses else c3_text
        
        m_parts = re.search(r'Parts used\s*:\s*(.*?)(?=(Dosage\s*:|$))', c3_text, re.DOTALL | re.IGNORECASE)
        parts_str = m_parts.group(1).strip() if m_parts else ""
        
        m_dosage = re.search(r'Dosage\s*:\s*(.*?)$', c3_text, re.DOTALL | re.IGNORECASE)
        dosage_str = m_dosage.group(1).strip() if m_dosage else ""

        # 5. Pharmacological activities & Phytochemical profile (Cell 4)
        c4_text = '\n'.join(cell_lines[4]) if len(cell_lines) > 4 else ''
        m_pharma = re.search(r'Pharmacological activities:\s*(.*?)(?=(Phytochemical profile:|$))', c4_text, re.DOTALL | re.IGNORECASE)
        pharma_str = m_pharma.group(1).strip() if m_pharma else ""
        
        m_phyto = re.search(r'Phytochemical profile:\s*(.*?)$', c4_text, re.DOTALL | re.IGNORECASE)
        phyto_str = m_phyto.group(1).strip() if m_phyto else ""
        if not pharma_str and not phyto_str:
            pharma_str = c4_text

        # 6. Experimental & Clinical Data (Cell 5)
        c5_text = '\n'.join(cell_lines[5]) if len(cell_lines) > 5 else ''
        m_exp = re.search(r'Experimental data:\s*(.*?)(?=(Clinical data\s*:|$))', c5_text, re.DOTALL | re.IGNORECASE)
        exp_str = m_exp.group(1).strip() if m_exp else ""
        
        m_clin = re.search(r'Clinical data\s*:\s*(.*?)$', c5_text, re.DOTALL | re.IGNORECASE)
        clin_str = m_clin.group(1).strip() if m_clin else ""
        if not exp_str and not clin_str:
            exp_str = c5_text

        # 7. Toxicity / Safety / Drug Interactions (Cell 6)
        c6_text = '\n'.join(cell_lines[6]) if len(cell_lines) > 6 else ''
        m_tox = re.search(r'Toxicity\s*/\s*Safety\s*:\s*(.*?)(?=(Contraindications:|Drug-Plant interactions:|Plant-Plant interactions:|$))', c6_text, re.DOTALL | re.IGNORECASE)
        tox_str = m_tox.group(1).strip() if m_tox else ""
        
        m_contra = re.search(r'Contraindications:\s*(.*?)(?=(Drug-Plant interactions:|Plant-Plant interactions:|$))', c6_text, re.DOTALL | re.IGNORECASE)
        contra_str = m_contra.group(1).strip() if m_contra else ""
        
        m_drug = re.search(r'Drug-Plant interactions:\s*(.*?)(?=(Plant-Plant interactions:|$))', c6_text, re.DOTALL | re.IGNORECASE)
        drug_str = m_drug.group(1).strip() if m_drug else ""
        
        m_plant_int = re.search(r'Plant-Plant interactions:\s*(.*?)$', c6_text, re.DOTALL | re.IGNORECASE)
        plant_int_str = m_plant_int.group(1).strip() if m_plant_int else ""
        if not tox_str and not drug_str and not contra_str:
            tox_str = c6_text

        # 8. Key References (Cell 7)
        c7_text = '\n'.join(cell_lines[7]) if len(cell_lines) > 7 else ''

        plant_obj = {
            "id": num,
            "scientific_name": scientific_name,
            "vernacular_names": vernacular_names,
            "vernacular_raw": vernacular_raw,
            "taxonomy": {
                "kingdom": kingdom,
                "order": order,
                "family": family,
                "genus": genus,
                "species": species
            },
            "distribution": {
                "habitat_description": distrib_raw,
                "flowering_harvesting": flowering_raw,
                "regions": matched_regions
            },
            "traditional_medicine": {
                "uses": uses_str,
                "parts_used": parts_str,
                "dosage": dosage_str
            },
            "pharmacology": {
                "activities": pharma_str,
                "phytochemical_profile": phyto_str
            },
            "scientific_data": {
                "experimental": exp_str,
                "clinical": clin_str
            },
            "safety_profile": {
                "toxicity": tox_str,
                "contraindications": contra_str,
                "drug_interactions": drug_str,
                "plant_interactions": plant_int_str
            },
            "references": c7_text
        }
        plants.append(plant_obj)
        
    return plants

if __name__ == '__main__':
    docx_file = 'Medicinal_Plants_Table__final_numbered (1) (1).docx'
    print(f"Parsing {docx_file}...")
    plants = parse_docx_plants(docx_file)
    print(f"Successfully extracted {len(plants)} plants.")
    
    with open('data/plants.json', 'w', encoding='utf-8') as f:
        json.dump(plants, f, ensure_ascii=False, indent=2)
    print("Saved to data/plants.json")
