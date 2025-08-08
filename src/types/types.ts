export interface Application {
    id: string;
    name: string;
    surname: string;
    gender: string;
    marital_status: string;
    work_status: string;
    address: string;
    email: string;
    phone: string;
    country: string;
    appointment_status: string;
    created_at: string;
    
    // Opsiyonel alanlar
   
    company_name?: string;
    company_address?: string;
    company_phone?: string;
    school_name?: string;
    school_address?: string;
    school_phone?: string;
    
    // Belgeler
    passport_file_url?: string;
    previous_schengen_url?: string;
    invitation_letter_url?: string;
    
    // Grup başvuruları için
    basvuru_grup_kodu?: string;
  }

