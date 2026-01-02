// api/applications.ts
import { supabase } from "../../../services/supabase";

type Gender = 'Erkek' | 'Kadın';
type MaritalStatus = 'Bekar' | 'Evli' | 'Boşanmış' | 'Dul';
type WorkStatus = 'Çalışıyor' | 'Emekli' | 'Öğrenci' | 'Çalışmıyor';
type VisaType = 'Turistik' | 'Eğitim' | 'Ticari';



interface ApplicationData {
    full_name: string;
    surname: string;
    basvuru_grup_kodu: string;
    country: string;
    visa_type: 'Turistik' | 'Eğitim' | 'Ticari';
    gender: Gender;
    marital_status: MaritalStatus;
    work_status: WorkStatus;
    address: string;
    email: string;
    phone: string;
    maiden_surname:string
    passport_file_url: string | null;
    biometric_photo_url: string | null;
    previous_schengen_url: any | null;
    invitation_letter_url: any | null;
   city:string
    appointment_status:string
    company_name?: string[];
    company_address?: string[];
    company_phone?: string[];
    job_title?:string[];
    form_note?:string
    tripStart:string,
    tripEnd:string
    monthlyIncome?:string[]
    plannedSpending?:string[]
    monthlyExpense?:string[]
    travelStart?:string[]
    travelEnd?:string[]
    travelStartForSchengen?:string[]
    travelEndForSchengen?:string[]
    motherName:string[]
    motherDob:string[]
  fatherName:string[]
  fatherDob:string[]
  homeStatus:string[]
  homeSince:string[]
  visaRefusalCountry:string[]
  visaRefusalDate:string[]
  previousAddress:string[]
  currencyBalance:string[]
  currentBalance:string[]
  currencyMonth:string[]

  currencyForEngland:string[]
  currencyMonthAmount:string[]
  travelCountry:string[]
  travelSchengenCountry:string[]


  }
export const insertApplications = async (applications: ApplicationData[]) => {
  const { error } = await supabase
    .from("applications")
    .insert(applications);

  if (error) {
    throw new Error(error.message);
  }

  return true;
};
export const fetchApplications = async () => {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
  
    if (error) throw new Error(error.message);
    return data;
  };
  export const deleteApplication = async (id: string) => {
    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("id", id);
  
    if (error) throw new Error(error.message);
  };