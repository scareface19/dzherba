# -*- coding: utf-8 -*-
import json
import os
import mysql.connector

DB_CONFIG = {
    'host': '127.0.0.1',
    'port': 3306,
    'user': 'root',
    'password': '',
    'database': 'dzherba_db',
    'charset': 'utf8mb4'
}

TABLES = [
    """
    CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'researcher', 'institution', 'free') DEFAULT 'free',
        organization VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """,
    """
    CREATE TABLE IF NOT EXISTS plants (
        id INT PRIMARY KEY,
        scientific_name VARCHAR(255) NOT NULL,
        family VARCHAR(100),
        order_name VARCHAR(100),
        genus VARCHAR(100),
        species VARCHAR(100),
        vernacular_raw TEXT,
        vernacular_names JSON,
        habitat_description TEXT,
        flowering_harvesting TEXT,
        regions JSON,
        parts_used TEXT,
        dosage TEXT,
        uses TEXT,
        phytochemical_profile MEDIUMTEXT,
        activities MEDIUMTEXT,
        experimental_data MEDIUMTEXT,
        clinical_data MEDIUMTEXT,
        toxicity TEXT,
        contraindications TEXT,
        drug_interactions TEXT,
        plant_interactions TEXT,
        references_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FULLTEXT KEY ft_plant_search (scientific_name, vernacular_raw, family, uses)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """,
    """
    CREATE TABLE IF NOT EXISTS subscriptions (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50),
        user_name VARCHAR(255),
        user_email VARCHAR(255),
        organization VARCHAR(255),
        plan VARCHAR(50),
        status ENUM('active', 'expired', 'pending', 'cancelled') DEFAULT 'active',
        amount_dzd INT NOT NULL,
        payment_method VARCHAR(50),
        transaction_ref VARCHAR(100),
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """,
    """
    CREATE TABLE IF NOT EXISTS user_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        type ENUM('search', 'view', 'scan', 'assistant') NOT NULL,
        title VARCHAR(255) NOT NULL,
        query_text TEXT,
        plant_id INT NULL,
        metadata JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_type (user_id, type),
        INDEX idx_created (created_at DESC),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """,
    """
    CREATE TABLE IF NOT EXISTS user_favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        plant_id INT NOT NULL,
        personal_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_plant (user_id, plant_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """,
    """
    CREATE TABLE IF NOT EXISTS field_observations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        user_name VARCHAR(255),
        plant_name VARCHAR(255) NOT NULL,
        wilaya VARCHAR(100) NOT NULL,
        locality VARCHAR(255),
        observation_date DATE,
        photo_url VARCHAR(500),
        notes TEXT,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """,
    """
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(50),
        user_name VARCHAR(255),
        action VARCHAR(100) NOT NULL,
        target_entity VARCHAR(50) NOT NULL,
        target_id VARCHAR(50),
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
]

def setup_database():
    print("[1/4] Connecting to MySQL server...")
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    print("[2/4] Creating relational tables...")
    for q in TABLES:
        cursor.execute(q)
    conn.commit()

    # Import Plants from JSON FIRST
    print("[3/4] Importing all 279 plants from JSON into MySQL...")
    json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'plants.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        plants = json.load(f)

    plant_rows = []
    for p in plants:
        tax = p.get('taxonomy', {})
        dist = p.get('distribution', {})
        med = p.get('traditional_medicine', {})
        pharma = p.get('pharmacology', {})
        sci = p.get('scientific_data', {})
        saf = p.get('safety_profile', {})

        plant_rows.append((
            p.get('id'),
            p.get('scientific_name', ''),
            tax.get('family', ''),
            tax.get('order', ''),
            tax.get('genus', ''),
            tax.get('species', ''),
            p.get('vernacular_raw', ''),
            json.dumps(p.get('vernacular_names', []), ensure_ascii=False),
            dist.get('habitat_description', ''),
            dist.get('flowering_harvesting', ''),
            json.dumps(dist.get('regions', []), ensure_ascii=False),
            med.get('parts_used', ''),
            med.get('dosage', ''),
            med.get('uses', ''),
            pharma.get('phytochemical_profile', ''),
            pharma.get('activities', ''),
            sci.get('experimental', ''),
            sci.get('clinical', ''),
            saf.get('toxicity', ''),
            saf.get('contraindications', ''),
            saf.get('drug_interactions', ''),
            saf.get('plant_interactions', ''),
            p.get('references', '')
        ))

    insert_plant_sql = """
        INSERT INTO plants (
            id, scientific_name, family, order_name, genus, species,
            vernacular_raw, vernacular_names, habitat_description, flowering_harvesting,
            regions, parts_used, dosage, uses, phytochemical_profile,
            activities, experimental_data, clinical_data, toxicity,
            contraindications, drug_interactions, plant_interactions, references_text
        ) VALUES (
            %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s, %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s, %s, %s, %s
        ) ON DUPLICATE KEY UPDATE
            scientific_name=VALUES(scientific_name),
            family=VALUES(family),
            vernacular_raw=VALUES(vernacular_raw),
            uses=VALUES(uses),
            phytochemical_profile=VALUES(phytochemical_profile),
            activities=VALUES(activities)
    """

    cursor.executemany(insert_plant_sql, plant_rows)
    conn.commit()

    # Seed Default Users, Subscriptions, History & Favorites
    print("[4/4] Seeding core users, subscriptions, user history & favorites...")
    users_data = [
        ('USR-ADMIN', 'Dr. Reda Mansouri (Admin Master)', 'admin@dzherba.dz', 'admin123', 'admin', 'Direction Technique & Scientifique DzHerba'),
        ('USR-RES-01', 'Pr. Amina Benali', 'chercheur@univ-alger.dz', 'chercheur123', 'researcher', 'Faculté de Pharmacie - Université Alger 1'),
        ('USR-UNIV-02', 'Département de Biologie & Pharmacie', 'campus@univ-setif.dz', 'campus123', 'institution', 'Université Ferhat Abbas Sétif 1'),
        ('USR-CIT-03', 'Sofiane Cherif', 'citoyen@dzherba.dz', 'citoyen123', 'free', 'Grand Public & Herboristerie')
    ]
    cursor.executemany("""
        INSERT INTO users (id, name, email, password, role, organization)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), organization=VALUES(organization)
    """, users_data)

    subs_data = [
        ('SUB-1049', 'USR-RES-01', 'Pr. Amina Benali', 'chercheur@univ-alger.dz', 'Faculté de Pharmacie - Alger 1', 'researcher_annual', 'active', 9800, 'Edahabia', 'EDH-99238472', '2026-09-01', '2027-09-01'),
        ('SUB-1048', 'USR-UNIV-02', 'Centre CERIST', 'k.bouzid@cerist.dz', 'Centre de Recherche Scientifique (CERIST)', 'institution', 'active', 85000, 'Convention_Univ', 'CONV-DZ-2026-04', '2026-01-15', '2027-01-15'),
        ('SUB-1047', 'USR-RES-01', 'Yasmine Mansouri', 'y.mansouri@univ-setif.dz', 'Département de Biologie - Sétif', 'researcher_monthly', 'active', 1200, 'CIB', 'CIB-58291044', '2026-10-10', '2026-11-10'),
        ('SUB-1046', 'USR-CIT-03', 'Sofiane Cherif', 's.cherif@gmail.com', 'Herboristerie Constantine', 'researcher_annual', 'expired', 9800, 'Edahabia', 'EDH-88301928', '2025-10-01', '2026-10-01'),
        ('SUB-1045', 'USR-UNIV-02', 'Faculté de Médecine Tlemcen', 'biblio@univ-tlemcen.dz', 'Université Abou Bekr Belkaïd', 'institution', 'active', 85000, 'Convention_Univ', 'CONV-DZ-2026-12', '2026-03-01', '2027-03-01')
    ]
    cursor.executemany("""
        INSERT INTO subscriptions (id, user_id, user_name, user_email, organization, plan, status, amount_dzd, payment_method, transaction_ref, start_date, end_date)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE status=VALUES(status), amount_dzd=VALUES(amount_dzd)
    """, subs_data)

    # Seed Sample History
    history_data = [
        ('USR-ADMIN', 'search', 'Recherche multi-critères : Artemisia (الشيح)', 'Artemisia', 1, json.dumps({'results_count': 3})),
        ('USR-ADMIN', 'view', 'Consultation Monographie : Artemisia herba-alba', '', 1, json.dumps({'vernacular': 'الشيح'})),
        ('USR-ADMIN', 'scan', 'Identification IA Photo : Spécimen feuille de Sauge', 'photo_scan_101.jpg', 6, json.dumps({'confidence': 94.2})),
        ('USR-ADMIN', 'assistant', 'Question LLM : Plantes hypoglycémiantes en Algérie', 'diabète', None, json.dumps({'model': 'DzHerba-Bot'}))
    ]
    cursor.executemany("""
        INSERT INTO user_history (user_id, type, title, query_text, plant_id, metadata)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, history_data)

    # Seed Sample Favorites
    cursor.execute("""
        INSERT INTO user_favorites (user_id, plant_id, personal_notes)
        VALUES 
            ('USR-ADMIN', 1, 'Espèce phare des Hauts Plateaux (Chih), forte concentration en huiles essentielles.'),
            ('USR-ADMIN', 2, 'Ail cultivé - Excellent cardioprotecteur et antibactérien naturel.')
        ON DUPLICATE KEY UPDATE personal_notes=VALUES(personal_notes)
    """)

    # Seed Sample Field Observations
    cursor.execute("""
        INSERT INTO field_observations (user_id, user_name, plant_name, wilaya, locality, observation_date, photo_url, notes, status)
        VALUES 
            ('USR-RES-01', 'Pr. Amina Benali', 'Artemisia herba-alba (الشيح)', 'Djelfa', 'Steppes de Ain Oussera', '2026-10-15', 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600', 'Densité importante de peuplement en fin de floraison. Échantillons collectés pour GC-MS.', 'approved'),
            ('USR-CIT-03', 'Sofiane Cherif', 'Thymus algeriensis (زعتر بري)', 'Batna', 'Massif de Belezma', '2026-10-18', 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=600', 'Spécimen identifié en haute altitude (1400m). Arôme très prononcé.', 'pending')
    """)

    conn.commit()

    cursor.execute("SELECT COUNT(*) FROM plants;")
    count = cursor.fetchone()[0]
    print(f"SUCCESS! {count} plants successfully stored in MySQL database 'dzherba_db'!")

    cursor.close()
    conn.close()

if __name__ == '__main__':
    setup_database()
