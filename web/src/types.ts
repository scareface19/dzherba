export interface Plant {
  id: number;
  scientific_name: string;
  vernacular_names: string[];
  vernacular_raw: string;
  taxonomy: {
    kingdom: string;
    order: string;
    family: string;
    genus: string;
    species: string;
  };
  distribution: {
    habitat_description: string;
    flowering_harvesting: string;
    regions: string[];
  };
  traditional_medicine: {
    uses: string;
    parts_used: string;
    dosage: string;
  };
  pharmacology: {
    activities: string;
    phytochemical_profile: string;
  };
  scientific_data: {
    experimental: string;
    clinical: string;
  };
  safety_profile: {
    toxicity: string;
    contraindications: string;
    drug_interactions: string;
    plant_interactions: string;
  };
  references: string;
  images?: string[];
  excel_row?: number;
}

export interface LicenseStatus {
  status: 'trial' | 'expired' | 'activated';
  isExpired: boolean;
  trialActive: boolean;
  isActivated: boolean;
  daysRemaining: number;
  totalTrialDays: number;
  firstRunDate?: string;
  expiresAt?: string;
  licenseKey?: string;
  message?: string;
}

export type Language = 'fr' | 'ar' | 'en';

export type UserRole = 'guest' | 'free' | 'student' | 'researcher' | 'institution' | 'admin';

export type ViewTab = 
  | 'home' 
  | 'catalog' 
  | 'map' 
  | 'identify' 
  | 'assistant' 
  | 'pricing' 
  | 'admin'
  | 'workspace'     // Mon Espace & Herbier Personnel
  | 'history'       // Historique Global d'Activité
  | 'interactions'; // Vérificateur d'Interactions & Sécurité (PharmaCheck)

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization?: string;
  created_at?: string;
  status?: string;
  subscription?: {
    plan: string;
    expiresAt: string;
    status: 'active' | 'expired';
  };
}

export interface SubscriptionRecord {
  id: string;
  userName: string;
  userEmail: string;
  organization?: string;
  plan: 'free' | 'student' | 'researcher_monthly' | 'researcher_annual' | 'institution';
  status: 'active' | 'expired' | 'pending';
  startDate: string;
  endDate: string;
  amountDZD: number;
  paymentMethod: 'Edahabia' | 'CIB' | 'Convention_Univ' | 'Gratuit';
  transactionRef: string;
}

export interface UserHistoryItem {
  id: number;
  user_id: string;
  type: 'search' | 'view' | 'scan' | 'assistant';
  title: string;
  query_text?: string;
  plant_id?: number | null;
  metadata?: Record<string, any>;
  created_at: string;
  scientific_name?: string;
  vernacular_raw?: string;
}

export interface UserFavoriteItem {
  fav_id: number;
  personal_notes?: string;
  added_at: string;
  plant: Plant;
}

export interface FieldObservation {
  id: number;
  user_id: string;
  user_name: string;
  plant_name: string;
  wilaya: string;
  locality?: string;
  observation_date: string;
  photo_url?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  nameAr?: string;
  badge: string;
  priceDZD: number;
  period: 'monthly' | 'annual' | 'one_time';
  role: 'free' | 'student' | 'researcher' | 'institution';
  features: string[];
  featuresAr?: string[];
  highlighted?: boolean;
}
