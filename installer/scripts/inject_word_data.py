# -*- coding: utf-8 -*-
"""
DzHerba - Scientific Monograph & References Injector from Word Docx
"""
import zipfile
import re
import json
import io
import os
import xml.etree.ElementTree as ET

DOCX_PATH = r'D:\DzHerba\Medicinal_Plants_Table__final_numbered (1) (1).docx'
JSON_PATH = r'D:\DzHerba\data\plants.json'

print u"[*] Lecture et extraction du document Word : %s" % DOCX_PATH

with zipfile.ZipFile(DOCX_PATH) as z:
    xml_content = z.read('word/document.xml')
    tree = ET.fromstring(xml_content)

namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
tables = tree.findall('.//w:tbl', namespaces)
if not tables:
    raise Exception("Aucun tableau trouve dans le fichier docx !")

rows = tables[0].findall('.//w:tr', namespaces)
print u"[+] %d lignes detectees dans le tableau Word." % len(rows)

def clean_txt(t):
    if not t:
        return u""
    t = re.sub(r'[\r\n\t]+', u' ', t)
    t = re.sub(r'\s+', u' ', t)
    return t.strip()

# Charger les 773 plantes actuelles
with io.open(JSON_PATH, 'r', encoding='utf-8') as f:
    plants_list = json.load(f)

print u"[+] %d plantes chargees depuis %s." % (len(plants_list), JSON_PATH)

# Indexer par ID et par nom scientifique normalise
plants_by_id = {p.get('id'): p for p in plants_list}
plants_by_sciname = {}
for p in plants_list:
    sn = clean_txt(p.get('scientific_name', '')).lower()
    if sn:
        plants_by_sciname[sn] = p
        # Indexer aussi sur 'genre espece'
        parts = sn.split()
        if len(parts) >= 2:
            plants_by_sciname[u"%s %s" % (parts[0], parts[1])] = p

updated_count = 0

for r_idx in range(1, len(rows)):
    cells = rows[r_idx].findall('.//w:tc', namespaces)
    row_vals = [u''.join([t.text for t in c.findall('.//w:t', namespaces) if t.text]).strip() for c in cells]
    
    num_str = row_vals[0] if len(row_vals) > 0 else unicode(r_idx)
    num = int(num_str) if num_str.isdigit() else r_idx
    col1 = row_vals[1] if len(row_vals) > 1 else u""
    distrib = row_vals[2] if len(row_vals) > 2 else u""
    trad = row_vals[3] if len(row_vals) > 3 else u""
    pharm = row_vals[4] if len(row_vals) > 4 else u""
    exp_clin = row_vals[5] if len(row_vals) > 5 else u""
    tox = row_vals[6] if len(row_vals) > 6 else u""
    refs_col = row_vals[7] if len(row_vals) > 7 else u""
    
    # Nettoyer les eventuels points ou chiffres initiaux
    clean_col1 = re.sub(r'^[0-9\.\s\-]+', u'', col1).strip()
    
    # 1. Nom Scientifique
    sciname = clean_col1
    for marker in [u'Vernacular', u'Kingdom', u'Order', u'Family', u'Genus', u'Species']:
        if marker in sciname:
            sciname = sciname.split(marker)[0].strip()
    sciname = clean_txt(sciname)
    
    # 2. Noms Vernaculaires
    vernacular = u""
    if u'Vernacular name:' in clean_col1:
        vern_part = clean_col1.split(u'Vernacular name:')[1]
        for marker in [u'Kingdom', u'Order', u'Family', u'Genus', u'Species']:
            if marker in vern_part:
                vern_part = vern_part.split(marker)[0]
        vernacular = clean_txt(vern_part)
        
    # 3. Taxonomie
    family = u""
    m = re.search(r'Family:\s*([A-Za-z]+?)(?=Genus|Order|Species|$)', clean_col1)
    if m:
        family = m.group(1).strip()
    
    order = u""
    m = re.search(r'Order:\s*([A-Za-z]+?)(?=Family|Genus|Species|$)', clean_col1)
    if m:
        order = m.group(1).strip()
    
    genus = u""
    m = re.search(r'Genus:\s*([A-Za-z]+?)(?=Species|Family|Order|$)', clean_col1)
    if m:
        genus = m.group(1).strip()
    
    species = u""
    m = re.search(r'Species:\s*([^\n\r]+)', clean_col1)
    if m:
        species = clean_txt(m.group(1))

    # 4. Distribution & Floraison
    distrib_clean = clean_txt(distrib)
    flowering_info = u""
    habitat_info = distrib_clean
    if u'Flowering Stage and Plant Harvesting:' in distrib_clean:
        parts_d = distrib_clean.split(u'Flowering Stage and Plant Harvesting:')
        habitat_info = clean_txt(parts_d[0].replace(u'Distribution :', u'').replace(u'Distribution:', u''))
        flowering_info = clean_txt(parts_d[1])
    elif u'Distribution :' in distrib_clean or u'Distribution:' in distrib_clean:
        habitat_info = clean_txt(distrib_clean.replace(u'Distribution :', u'').replace(u'Distribution:', u''))

    # 5. Medecine Traditionnelle
    trad_clean = clean_txt(trad)
    trad_uses = trad_clean
    trad_parts = u""
    trad_dosage = u""
    if u'Parts used :' in trad_clean or u'Parts used:' in trad_clean:
        p_split = re.split(r'Parts used\s*:', trad_clean)
        trad_uses = clean_txt(p_split[0].replace(u'Traditional uses:', u'').replace(u'Traditional uses :', u''))
        if len(p_split) > 1:
            rest = p_split[1]
            if u'Dosage :' in rest or u'Dosage:' in rest:
                d_split = re.split(r'Dosage\s*:', rest)
                trad_parts = clean_txt(d_split[0])
                trad_dosage = clean_txt(d_split[1])
            else:
                trad_parts = clean_txt(rest)
    elif u'Traditional uses:' in trad_clean or u'Traditional uses :' in trad_clean:
        trad_uses = clean_txt(trad_clean.replace(u'Traditional uses:', u'').replace(u'Traditional uses :', u''))

    # 6. Phytochimie & Pharmacologie
    pharm_clean = clean_txt(pharm)
    phyto_profile = u""
    pharm_activities = pharm_clean
    if u'Phytochemical profile:' in pharm_clean or u'Phytochemical profile :' in pharm_clean:
        ph_split = re.split(r'Phytochemical profile\s*:', pharm_clean)
        if len(ph_split) > 1:
            if u'Pharmacological activities:' in ph_split[1] or u'Pharmacological activities :' in ph_split[1]:
                sub_ph = re.split(r'Pharmacological activities\s*:', ph_split[1])
                phyto_profile = clean_txt(sub_ph[0])
                pharm_activities = clean_txt(sub_ph[1])
            else:
                phyto_profile = clean_txt(ph_split[1])
    elif u'Pharmacological activities:' in pharm_clean or u'Pharmacological activities :' in pharm_clean:
        pharm_activities = clean_txt(pharm_clean.replace(u'Pharmacological activities:', u'').replace(u'Pharmacological activities :', u''))

    # 7. Donnees Experimentales & Cliniques
    exp_clean = clean_txt(exp_clin)
    exp_data = exp_clean
    clin_data = u""
    if u'Clinical data:' in exp_clean or u'Clinical data :' in exp_clean:
        cl_split = re.split(r'Clinical data\s*:', exp_clean)
        exp_data = clean_txt(cl_split[0].replace(u'Experimental data:', u'').replace(u'Experimental data :', u''))
        clin_data = clean_txt(cl_split[1])
    elif u'Experimental data:' in exp_clean or u'Experimental data :' in exp_clean:
        exp_data = clean_txt(exp_clean.replace(u'Experimental data:', u'').replace(u'Experimental data :', u''))

    # 8. Securite & Toxicite
    tox_clean = clean_txt(tox)
    toxicity = tox_clean
    contraindications = u""
    drug_interactions = u""
    plant_interactions = u""
    
    if u'Drug-Plant interactions:' in tox_clean or u'Drug-Plant interactions :' in tox_clean:
        parts_dp = re.split(r'Drug-Plant interactions\s*:', tox_clean)
        toxicity = clean_txt(parts_dp[0].replace(u'Toxicity/Safety:', u'').replace(u'Toxicity/Safety :', u'').replace(u'Toxicity:', u''))
        if len(parts_dp) > 1:
            rest_dp = parts_dp[1]
            if u'Plant-Plant interactions:' in rest_dp or u'Plant-Plant interactions :' in rest_dp:
                p_inter = re.split(r'Plant-Plant interactions\s*:', rest_dp)
                drug_interactions = clean_txt(p_inter[0])
                plant_interactions = clean_txt(p_inter[1])
            else:
                drug_interactions = clean_txt(rest_dp)
    elif u'Toxicity/Safety:' in tox_clean or u'Toxicity/Safety :' in tox_clean:
        toxicity = clean_txt(tox_clean.replace(u'Toxicity/Safety:', u'').replace(u'Toxicity/Safety :', u''))

    # 9. Assemblage des References Bibliographiques
    full_text_corpus = u"%s %s %s %s %s" % (trad_clean, distrib_clean, pharm_clean, exp_clean, tox_clean)
    citations = re.findall(r'\(([A-Z][a-zA-Z\s\.,&]+(?:et\s*al\.?)?,\s*\d{4}[a-z]?)\)', full_text_corpus)
    unique_cits = []
    for c in citations:
        if c not in unique_cits and len(c) < 55:
            unique_cits.append(c)

    ref_sections = []
    clean_refs_col = clean_txt(refs_col)
    if clean_refs_col and clean_refs_col != u'Key studies:' and clean_refs_col != u'K' and len(clean_refs_col) > 3:
        ref_sections.append(u"[Etudes & Publications Cles]\n%s" % clean_refs_col)
    
    if unique_cits:
        cits_formatted = u"\n".join([u"• %s" % c for c in unique_cits])
        ref_sections.append(u"[Citations & Travaux Academiques du Dossier]\n%s" % cits_formatted)
        
    ref_sections.append(
        u"[Flores Fondamentales d'Algerie & Maghreb]\n"
        u"• Quezel, P. & Santa, S. (1962-1963). Nouvelle flore de l'Algerie et des regions desertiques meridionales. CNRS, Paris.\n"
        u"• Ozenda, P. (1977). Flore du Sahara (2e ed.). CNRS, Paris.\n"
        u"• Baba Aissa, F. (2000). Encyclopedie des plantes medicinales au Maghreb et en Algerie. EDIF 2000, Alger.\n"
        u"• Bellakhdar, J. (1997). La pharmacopee marocaine et maghrebine traditionnelle. Ibis Press."
    )
    final_references_text = u"\n\n".join(ref_sections)

    # Recherche de la plante existante correspondante
    target_plant = None
    # 1. Match par ID
    if num in plants_by_id:
        target_plant = plants_by_id[num]
    # 2. Match par nom scientifique
    if not target_plant and sciname:
        sn_clean = sciname.lower()
        if sn_clean in plants_by_sciname:
            target_plant = plants_by_sciname[sn_clean]
        else:
            sn_parts = sn_clean.split()
            if len(sn_parts) >= 2:
                genus_sp = u"%s %s" % (sn_parts[0], sn_parts[1])
                if genus_sp in plants_by_sciname:
                    target_plant = plants_by_sciname[genus_sp]

    if target_plant:
        # Enrichir la plante en preservant ses photos et son id
        if sciname and not target_plant.get('scientific_name'):
            target_plant['scientific_name'] = sciname
            
        if vernacular:
            target_plant['vernacular_raw'] = vernacular
            existing_vn = target_plant.get('vernacular_names', [])
            v_items = [v.strip() for v in re.split(r'[,،/]+', vernacular) if v.strip()]
            for vi in v_items:
                if vi not in existing_vn:
                    existing_vn.append(vi)
            target_plant['vernacular_names'] = existing_vn

        # Taxonomie
        tax = target_plant.get('taxonomy', {})
        if family: tax['family'] = family
        if order: tax['order'] = order
        if genus: tax['genus'] = genus
        if species: tax['species'] = species
        target_plant['taxonomy'] = tax

        # Distribution
        dist = target_plant.get('distribution', {})
        if habitat_info: dist['habitat_description'] = habitat_info
        if flowering_info: dist['flowering_harvesting'] = flowering_info
        target_plant['distribution'] = dist

        # Medecine traditionnelle
        tm = target_plant.get('traditional_medicine', {})
        if trad_uses: tm['uses'] = trad_uses
        if trad_parts: tm['parts_used'] = trad_parts
        if trad_dosage: tm['dosage'] = trad_dosage
        target_plant['traditional_medicine'] = tm

        # Pharmacologie
        pharm_obj = target_plant.get('pharmacology', {})
        if phyto_profile: pharm_obj['phytochemical_profile'] = phyto_profile
        if pharm_activities: pharm_obj['activities'] = pharm_activities
        target_plant['pharmacology'] = pharm_obj

        # Donnees scientifiques
        sd = target_plant.get('scientific_data', {})
        if exp_data: sd['experimental'] = exp_data
        if clin_data: sd['clinical'] = clin_data
        target_plant['scientific_data'] = sd

        # Profil de securite
        sp = target_plant.get('safety_profile', {})
        if toxicity: sp['toxicity'] = toxicity
        if contraindications: sp['contraindications'] = contraindications
        if drug_interactions: sp['drug_interactions'] = drug_interactions
        if plant_interactions: sp['plant_interactions'] = plant_interactions
        target_plant['safety_profile'] = sp

        # References
        target_plant['references'] = final_references_text

        updated_count += 1

print u"[+] %d / %d plantes du Word ont ete enrichies avec succes !" % (updated_count, len(rows)-1)

# Sauvegarde dans data/plants.json
import codecs
with codecs.open(JSON_PATH, 'w', encoding='utf-8') as f:
    json.dump(plants_list, f, ensure_ascii=False, indent=2)

print u"[OK] data/plants.json sauvegarde avec succes (%d especes au total)." % len(plants_list)
