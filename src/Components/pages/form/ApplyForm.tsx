import { Fragment, Key, SetStateAction, useEffect, useRef, useState } from "react";
import { supabase } from "../../../services/supabase";
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { HomeIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import Cleave from 'cleave.js/react';
import 'cleave.js/dist/addons/cleave-phone.tr';
import logo from '../../../assets/logo/trawostIconHD.png';
import PassportScanUpload from '../PassportScan';
import PassportImageUpload from "../PassportImageUpload";
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline'; 
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';
import toast from "react-hot-toast";
import ReactCountryFlag from "react-country-flag";
import CitySelectRemote from "../CitySelect"
import { DateInput, TimeInput } from '@mantine/dates';
import { Button, Card, Group, Loader, Text, Textarea } from "@mantine/core";


import { IconCurrencyDollar, IconMoneybag, IconMoneybagHeart } from "@tabler/icons-react"; 


export default function ApplyForm({ value, onChange }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  const [selectedCountry, setSelectedCountry] = useState('Danimarka')
  const [hasSchengen, setHasSchengen] = useState<boolean[]>([]);
  const [workStatus, setWorkStatus] = useState<WorkStatus[]>([])
  const [passportImage, setPassportImage] = useState<string[]>([]);

  const [capturedPhotos, setCapturedPhotos] = useState<(string | null)[]>([]);
  const [passportFileName, setPassportFileName] = useState<string[]>([]);
  const [maritalStatuse, setMaritalStatuse] = useState<MaritalStatus[]>([]);
  const [schengenImages, setSchengenImages] = useState<string[][]>([]);
  const [schengenFileNames, setSchengenFileNames] = useState<string[][]>([]);
  const [selectedVisaType, setSelectedVisaType] = useState<VisaType | ''>('');
  const [schengenLoading, setSchengenLoading] = useState<boolean[]>([]);
  const [scanMode, setScanMode] = useState<"upload" | "camera" | null>(null);
  const [selectedPeople, setSelectedPeople] = useState('1 Kişi')
  const [email, setEmail] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
const [emailError, setEmailError] = useState('');
const [showTooltip, setShowTooltip] = useState(false);
const [showScanner, setShowScanner] = useState(false);
const [phone, setPhone] = useState<string[]>([]);
const [travelHistory, setTravelHistory] = useState<string[]>([]);

// const [travelStart, setTravelStart] = useState<string[]>([]);

// const [travelEnd, setTravelEnd] = useState<string[]>([]);

const [homeStatus, setHomeStatus] = useState<string[]>([]);

const [homeSince, setHomeSince] = useState<string[]>([]);

const [currencyMonth, setCurrencyMonth] = useState<string[]>([]);

const [currencyBalance, setCurrencyBalance] = useState<string[]>([]);
const [currentBalance, setCurrentBalance] = useState<string[]>([]);

const [currencyForEngland, setCurrencyForEngland] = useState<string[]>([]);
const [currencyMonthAmount, setCurrencyMonthAmount] = useState<string[]>([]);

const [travelSchengenSegmentCount, setTravelSchengenSegmentCount] = useState<number[]>([]);

const [previousAddress, setPreviousAddress] = useState<string[]>([]);
// const [travelHistorySchengen, settravelHistorySchengen] = useState<string[]>([]);
const [travelHistorySchengen, setTravelHistorySchengen] = useState<string[]>([]);


const [maidenNames, setMaidenNames] = useState<string[]>([]);
const [passportError, setPassportError]= useState<string[]>([]);
const [genders, setGenders] = useState<Gender[]>([]);

// const [address, setAddress] = useState('');
const [address, setAddress] = useState<string[]>([]);
const [hasInvitation, setHasInvitation] = useState<boolean[]>([]);

const [fileName, setFileName] = useState<string | null>(null);

const [invitationFiles, setInvitationFiles] = useState<string[][]>([]);
const [invitationFileNames, setInvitationFileNames] = useState<string[][]>([]);
const [isSubmitting, setIsSubmitting] = useState(false);
const [visaError, setVisaError] = useState<string>('');
const visaBtnRef = useRef<HTMLButtonElement>(null);

const [firstName, setFirstName] = useState<string[]>([]);
const [lastName, setLastName] = useState<string[]>([]);

const [passportLoading, setPassportLoading] = useState<boolean[]>([]);

const [selectedJobTitle, setSelectedJobTitle]  = useState<string[]>([]);
const [companyName, setCompanyName] = useState<string[]>([]);
const [companyAddress, setCompanyAddress] = useState<string[]>([]);
const [companyPhone, setCompanyPhone] = useState<string[]>([]);


const [city, setCity] = useState<string[]>([]);


const [monthlyExpense, setMonthlyExpense] = useState<string[]>([]);

const [note, setNote] = useState("");

const [saving, setSaving] = useState(false);
const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
const [highlighted, setHighlighted] = useState(false);
const [schoolName, setSchoolName]= useState<string[]>([]);
const [schoolAddress, setSchoolAddress] = useState<string[]>([]);
const [schoolPhone, setSchoolPhone] = useState<string[]>([]);
const [schengenPaths, setSchengenPaths] = useState<string[][]>([]); 
const [invitationPaths, setInvitationPaths] = useState<string[][]>([]); 
const [monthlyIncome, setMonthlyIncome] = useState<string[]>([]);


// const [travelCountry, setTravelCountry] = useState<string[]>([]);
// const [travelEndForSchengen, setTravelEndForSchengen] = useState<string[]>([]);

// const [travelStartForSchengen, setTravelStartForSchengen] = useState<string[]>([]);
const [travelStartForSchengen, setTravelStartForSchengen] = useState<string[][]>([]);
const [travelEndForSchengen,   setTravelEndForSchengen]   = useState<string[][]>([]);

const [plannedSpending, setPlannedSpending] = useState<string[]>([]);
const [tripStart, setTripStart] = useState<string>('');
const [tripEnd, setTripEnd] = useState<string>('');


const [visaRefusal, setVisaRefusal] = useState<string[]>([]);       
const [visaRefusalCountry, setVisaRefusalCountry] = useState<string[]>([]);
const [visaRefusalDate, setVisaRefusalDate] = useState<string[]>([]);

// const [travelSchengenCountry, setTravelSchengen] = useState<string[]>([]);
const [travelSchengenCountry, setTravelSchengen] = useState<string[][]>([]);
const [motherName, setMotherName] = useState<string[]>([]);
const [motherDob, setMotherDob] = useState<string[]>([]);
const [fatherName, setFatherName] = useState<string[]>([]);
const [fatherDob, setFatherDob] = useState<string[]>([]);




const maxChars = 250;




type FormErrors =  {
  firstName: string[];
  lastName: string[];
  gender: string[];
  maritalStatus: string[];
  workStatus: string[];
  address: string[];
  email: string[];
  phone: string[];
  maidenName:string[]
  passport: string[];
  schengen?: string[];
  city?: string[];
  tripStart?: string;
  tripEnd?: string;
  monthlyIncome:string[]
  plannedSpending:string[]
  homeSince:string[]
  previousAddress:string[]
  homeStatus:string[]
  visaRefusal?: string[];
  visaRefusalCountry?: string[];
  visaRefusalDate?: string[];
  monthlyExpense:string[]
  travelStart:string[][]
  travelEnd:string[][]
  motherName:string[]
  motherDob:string[]
  fatherName:string[]
  fatherDob:string[]
  currentBalance:string[]
  travelCountry:string[][]
  travelSchengenCountry:string[][]
  travelStartForSchengen:string[]
  travelEndForSchengen:string[]
  biometricPhoto:string[]
}


  

  const navigate = useNavigate();


  // const jobTitles = [
  //   'Yazılım Mühendisi',
  //   'Doktor',
  //   'Avukat',
  //   'Öğretmen',
  //   'Mimar',
  //   'Muhasebeci',
  //   'Polis',
  //   'Hemşire',
  //   'Mühendis',
  //   'Teknisyen',
  // ];
  



  // type JobTitle = typeof jobTitles[number];
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
  // type Applicant = {
  //   firstName: string;
  //   lastName: string;
  //   gender: Gender | '';
  //   maritalStatus: MaritalStatus | '';
  //   workStatus: WorkStatus | '';
  //   // jobTitle?: JobTitle | '';
  //   companyName?: string;
  //   companyAddress?: string;
  //   companyPhone?: string;
  //   school_name?: string[];  
  //   school_address?: string[];
  //   school_phone?: string[];
  // };

  const COUNTRY_OPTIONS = ['Amerika', 'Kanada', 'İngiltere'];

  const COUNTRY_OPTIONS_SCHENGEN = [
    'Almanya', 'Avusturya', 'Belçika', 'Çekya', 'Danimarka', 'Estonya',
    'Finlandiya', 'Fransa', 'Hırvatistan', 'Hollanda', 'İspanya', 'İsveç',
    'İtalya', 'İzlanda', 'Letonya', 'Lihtenştayn', 'Litvanya', 'Lüksemburg',
    'Macaristan', 'Malta', 'Norveç', 'Polonya', 'Portekiz', 'Slovakya',
    'Slovenya', 'Yunanistan', 'İsviçre'
  ];
  const totalForms = parseInt(selectedPeople);
  useEffect(() => {
    setSelectedJobTitle(prev => {
      const next = prev.slice(0, totalForms);
      while (next.length < totalForms) next.push('');
      return next;
    });
  }, [totalForms]);
  
  const [errors, setErrors] = useState<FormErrors>({
    firstName: [],
    lastName: [],
    gender: [],
    maritalStatus: [],
    workStatus: [],
    address: [],
    email: [],
    phone: [],
    maidenName:[],
    passport: [],
    schengen: [],
    city: [],
    tripStart: '',
    tripEnd: '',
    monthlyIncome:[],
    plannedSpending:[],
    homeSince:[],
    previousAddress:[],
    homeStatus:[],
    monthlyExpense:[],
    travelStart: Array(totalForms).fill(null).map(()=>['']),
    travelEnd:Array(totalForms).fill(null).map(()=>['']),
    motherName:[],
    motherDob:[],
    fatherName:[],
    fatherDob:[],
    currentBalance:[],
    travelCountry:[],
    travelSchengenCountry:[],
    travelStartForSchengen:[],
    travelEndForSchengen:[],
    biometricPhoto:[]
  });

  const [travelSegmentCount, setTravelSegmentCount] = useState<number[]>(
    Array(totalForms).fill(1)
  );
  

  const [travelCountry, setTravelCountry] = useState<string[][]>(
    Array(totalForms).fill(null).map(() => ['']) 
  );
  const [travelStart, setTravelStart] = useState<string[][]>(
    Array(totalForms).fill(null).map(() => [''])
  );
  const [travelEnd, setTravelEnd] = useState<string[][]>(
    Array(totalForms).fill(null).map(() => [''])
  );

  const [biometricLoading, setBiometricLoading] = useState<boolean[]>(
    Array(totalForms).fill(false)
  );

  const [biometricFileName, setBiometricFileName] = useState<string[]>(
    Array(totalForms).fill('')
  );
  const [biometricUrl, setBiometricUrl] = useState<string[]>(
    Array(totalForms).fill('')
  );

  const handleInvitationUpload = async (formIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
  
    try {
      const uploaded = await Promise.all(files.map(async (file) => {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
        const path = `invitations/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  
        const { error: upErr } = await supabase.storage.from('invitations').upload(path, file);
        if (upErr) throw upErr;
  
        const { data: pub } = supabase.storage.from('invitations').getPublicUrl(path);
        if (!pub?.publicUrl) throw new Error('Public URL alınamadı');
  
        return { name: file.name, url: pub.publicUrl, mime: file.type, path };

      }));
  
      const urls  = uploaded.map(x => x.url);
      const names = uploaded.map(x => x.name);
      const paths = uploaded.map(x => x.path); 

      
      setInvitationFiles(prev => {
        const next = [...prev];
        const cur  = next[formIndex] ?? [];
        next[formIndex] = [...cur, ...urls];  
        return next;
      });
  
      setInvitationFileNames(prev => {
        const next = [...prev];
        const cur  = next[formIndex] ?? [];
        next[formIndex] = [...cur, ...names]; 
        return next;
      });
  
      setInvitationPaths(prev => {
        const next = [...prev];
        next[formIndex] = [...(next[formIndex] ?? []), ...paths]; 
        return next;
      });

    } catch (err) {
      console.error(err);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleDeleteInvitation = async (formIndex: number, fileIndex: number) => {
    const path = invitationPaths[formIndex]?.[fileIndex]; 
  
    try {
      if (path) {
        const { error } = await supabase.storage.from('invitations').remove([path]);
        if (error) console.error('Remove error:', error);
      }
    } finally {
     
      setInvitationFiles(prev => {
        const n = [...prev];
        n[formIndex] = (n[formIndex] ?? []).filter((_, i) => i !== fileIndex);
        return n;
      });
      setInvitationFileNames(prev => {
        const n = [...prev];
        n[formIndex] = (n[formIndex] ?? []).filter((_, i) => i !== fileIndex);
        return n;
      });
      setInvitationPaths(prev => {
        const n = [...prev];
        n[formIndex] = (n[formIndex] ?? []).filter((_, i) => i !== fileIndex);
        return n;
      });
    }
  };


  const toggleHasSchengen = (index: number, checked: boolean) => {
    setHasSchengen(prev => {
      const next = [...prev];
      next[index] = checked;
      return next;
    });
  };

 
  const hasFiles = (schengenImages[0]?.length ?? 0) > 0;
  const total = schengenImages[0]?.length ?? 0;
  
  const toggleHasInvitation = (index: number, checked: boolean) => {
    setHasInvitation(prev => {
      const next = [...prev];
      next[index] = checked;
      return next;
    });
  };
  const handleFileUpload = (i: number) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    setPassportLoading(prev => { const next=[...prev]; next[i]=true; return next; });
  
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}.${ext}`;
      const filePath = `passports/${fileName}`;
  
      const { error: upErr } = await supabase.storage.from('passports').upload(filePath, file);
      if (upErr) throw upErr;
  
      const { data: pub } = supabase.storage.from('passports').getPublicUrl(filePath);
      const url = pub?.publicUrl;
      if (!url) throw new Error('Public URL alınamadı');
  
      setPassportFileName(prev => { const n=[...prev]; n[i]=file.name; return n; });
      setPassportImage(prev => { const n=Array.isArray(prev)?[...prev]:[]; n[i]=url; return n; });
      setErrors(prev => {
        const next = { ...prev, passport: [...(prev.passport || [])] };
        next.passport[i] = '';
        return next;
      });
    } catch (err:any) {
      console.error(err);
      setErrors(prev => {
        const next = { ...prev, passport: [...(prev.passport || [])] };
        next.passport[i] = err?.message || 'Dosya yüklenemedi';
        return next;
      });
    } finally {
      setPassportLoading(prev => { const n=[...prev]; n[i]=false; return n; });
   
      e.target.value = '';
    }
  };




  const handleBiometricUpload = (i: number) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  

    setBiometricLoading(prev => { const next=[...prev]; next[i]=true; return next; });
  
    try {
  
      const ext = file.name.split('.').pop();

      const fileName = `${Date.now()}-bio.${ext}`;




      const filePath = `biometric/${fileName}`;
  
      const { error: upErr } = await supabase.storage.from('biometric').upload(filePath, file);


      if (upErr) throw upErr;
  
      const { data: pub } = supabase.storage.from('biometric').getPublicUrl(filePath);
      const url = pub?.publicUrl;




      if (!url) throw new Error('Public URL alınamadı');
  

      setBiometricFileName(prev => { const next=[...prev]; next[i]=file.name; return next; });
      setBiometricUrl(prev => { const next=[...prev]; next[i]=url; return next; });
  
      // hata temizle
      setErrors(prev => {
        const next = { ...prev, biometricPhoto: [...(prev.biometricPhoto || [])] };
        next.biometricPhoto[i] = '';
        return next;
      });
  
   
    } catch (err: any) {
      console.error(err);
      setErrors(prev => {
        const next = { ...prev, biometricPhoto: [...(prev.biometricPhoto || [])] };
        next.biometricPhoto[i] = err?.message || 'Biyometrik fotoğraf yüklenemedi';
        return next;
      });
    } finally {

      setBiometricLoading(prev => { const next=[...prev]; next[i]=false; return next; });
      e.target.value = '';
    }
  };






  const hasInvitationFiles = (invitationFiles[0]?.length ?? 0) > 0;



  const handleDeleteSchengen = async (formIndex: number, fileIndex: number) => {
    const path = schengenPaths[formIndex]?.[fileIndex];
    setSchengenLoading(p => { const n=[...p]; n[formIndex]=true; return n; });
  
  
    try {
      if (path) {
        await supabase.storage.from('schengen').remove([path]); 
      }
    } catch (e) {
      console.error('Silme hatası:', e);
    } finally {
    
      setSchengenImages(prev => {
        const n = prev.map(a => [...(a||[])]);
        n[formIndex] = (n[formIndex] || []).filter((_, i) => i !== fileIndex);
        return n;
      });
      setSchengenFileNames(prev => {
        const n = prev.map(a => [...(a||[])]);
        n[formIndex] = (n[formIndex] || []).filter((_, i) => i !== fileIndex);
        return n;
      });
      setSchengenPaths(prev => {
        const n = prev.map(a => [...(a||[])]);
        n[formIndex] = (n[formIndex] || []).filter((_, i) => i !== fileIndex);
        return n;
      });
      setSchengenLoading(p => { const n=[...p]; n[formIndex]=false; return n; });
    }
  };


  const handleSchengenUpload = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    (async () => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
  
     
      setSchengenLoading(prev => {
        const next = [...prev];
        next[idx] = true;
        return next;
      });
  
      try {
        const urls: string[] = [];
        const names: string[] = [];
        const paths: string[] = [];
        for (const file of Array.from(files)) {
          const ext = file.name.split('.').pop();
          const fileName = `${crypto.randomUUID()}.${ext}`;
          const filePath = `schengen/${fileName}`;
  
          const { error: upErr } = await supabase.storage
            .from('schengen')
            .upload(filePath, file);
  
          if (upErr) throw upErr;
  
          const { data: pub } = supabase.storage.from('schengen').getPublicUrl(filePath);
          const url = pub?.publicUrl;
          if (!url) throw new Error('Public URL alınamadı');
  
          urls.push(url);
          names.push(file.name);
          paths.push(filePath);
        }
  
  
        setSchengenImages(prev => {
          const next = prev.map(arr => [...arr]);
          next[idx] = [...(next[idx] || []), ...urls];
          return next;
        });
  
        setSchengenFileNames(prev => {
          const next = prev.map(arr => [...arr]);
          next[idx] = [...(next[idx] || []), ...names];
          return next;
        });
        setSchengenPaths(prev => {
          const next = prev.map(a => [...a]);
          next[idx] = [...(next[idx] || []), ...paths];     
          return next;
        });
  
      } catch (err: any) {
        console.error(err);
        alert('❌ Schengen dosyası yüklenemedi: ' + (err?.message || 'Bilinmeyen hata'));
      } finally {
       
        setSchengenLoading(prev => {
          const next = [...prev];
          next[idx] = false;
          return next;
        });
      
        e.target.value = '';
      }
    })();
  };
  const validateEmail = (value: string) => {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    setEmailError(isValid ? '' : 'Geçerli bir e-posta girin');
    setShowTooltip(!isValid);
  };



  const countriesWithFlags = [
    { name: 'Almanya', code: 'DE' },
    { name: 'Avusturya', code: 'AT' },
    { name: 'Amerika', code: 'US' },
    { name: 'Belçika', code: 'BE' },
    { name: 'Çekya', code: 'CZ' },
    { name: 'Danimarka', code: 'DK' },
    { name: 'Estonya', code: 'EE' },
    { name: 'Bulgaristan', code: 'BG' },
    { name: 'Finlandiya', code: 'FI' },
    { name: 'Fransa', code: 'FR' },
    { name: 'Hollanda', code: 'NL' },
    { name: 'Hırvatistan', code: 'HR' },
    { name: 'İspanya', code: 'ES' },
    { name: 'İsveç', code: 'SE' },
    { name: 'İtalya', code: 'IT' },
    { name: 'Letonya', code: 'LV' },
    { name: 'Litvanya', code: 'LT' },
    { name: 'Lüksemburg', code: 'LU' },
    { name: 'Macaristan', code: 'HU' },
    { name: 'Malta', code: 'MT' },
    { name: 'Polonya', code: 'PL' },
    { name: 'Portekiz', code: 'PT' },
    { name: 'Slovakya', code: 'SK' },
    { name: 'Slovenya', code: 'SI' },
    { name: 'Yunanistan', code: 'GR' },
    { name: 'İzlanda', code: 'IS' },
    { name: 'Lihtenştayn', code: 'LI' },
    { name: 'Norveç', code: 'NO' },
    { name: 'İsviçre', code: 'CH' },
    { name: 'İngiltere', code: 'GB' },
  ];



  const ensure2D = (arr: string[][], outerIdx: number, newLen: number) => {
    const n = arr.map(a => Array.isArray(a) ? [...a] : []);
    while (n.length <= outerIdx) n.push([]);
    while (n[outerIdx].length < newLen) n[outerIdx].push('');
    n[outerIdx] = n[outerIdx].slice(0, newLen);
    return n;
  };

  const MAX_SEG = 3;

  const syncLen = <T,>(arr: T[][], i: number, len: number, fill: T): T[][] => {
    const next = arr.map(a => [...a]);
    while (next.length <= i) next.push([]);
    while (next[i].length < len) next[i].push(fill);
    if (next[i].length > len) next[i] = next[i].slice(0, len);
    return next;
  };
  
  const ensureSegCount = (countArr: number[], i: number, nextCount: number) => {
    const next = [...countArr];
    while (next.length <= i) next.push(1);
    next[i] = Math.min(Math.max(nextCount, 1), MAX_SEG);
    return next;
  };


  const validateForm = () => {
    
    const get = (arr: string[] | undefined, i: number) =>
      Array.isArray(arr) && typeof arr[i] === 'string' ? arr[i] : '';
  
    const at = <T,>(arr: T[] | undefined, i: number, fallback: any = ''): T | any =>
      Array.isArray(arr) && i in arr ? arr[i] : fallback;
  
    const make2D = (rows: number, cols = 1, fill = '') =>
      Array.from({ length: rows }, () => Array(cols).fill(fill));
    

    const ensure2D = <T,>(arr: T[][], i: number, cols = 1, fill: T) => {
      while (arr.length <= i) arr.push(Array(cols).fill(fill));
      while (arr[i].length < cols) arr[i].push(fill);
      return arr;
    };

    const nextErrors: any = {
      firstName: Array<string>(totalForms).fill(''),
      lastName: Array<string>(totalForms).fill(''),
      gender: Array<string>(totalForms).fill(''),
      maidenName: Array<string>(totalForms).fill(''),
      maritalStatus: Array<string>(totalForms).fill(''),
      workStatus: Array<string>(totalForms).fill(''),
      address: Array<string>(totalForms).fill(''),
      email: Array<string>(totalForms).fill(''),
      phone: Array<string>(totalForms).fill(''),
      passport: Array<string>(totalForms).fill(''),
      schengen: Array<string>(totalForms).fill(''),
      monthlyIncome: Array<string>(totalForms).fill(''),  
      plannedSpending: Array<string>(totalForms).fill(''),  
      monthlyExpense: Array<string>(totalForms).fill(''),  
      motherName: Array<string>(totalForms).fill(''),
      motherDob: Array<string>(totalForms).fill(''),
      fatherName: Array<string>(totalForms).fill(''),
      fatherDob: Array<string>(totalForms).fill(''),
      biometricLoading:Array<string>(totalForms).fill(''),
      biometricFileName:Array<string>(totalForms).fill(''),

      biometricUrl:Array<string>(totalForms).fill(''),

      currentBalance: Array<string>(totalForms).fill(''),

      travelCountry: make2D(totalForms),          
      travelStart:   make2D(totalForms),
      travelEnd:     make2D(totalForms),
    
      travelSchengenCountry: make2D(totalForms),  
      travelStartForSchengen: make2D(totalForms),
      travelEndForSchengen:   make2D(totalForms),
    };
  
    let isValid = true;
  
    for (let i = 0; i < totalForms; i++) {
      

      nextErrors.firstName[i] = get(firstName, i).trim() ? '' : 'Ad zorunludur.';
      if (nextErrors.firstName[i]) isValid = false;
  
      nextErrors.lastName[i] = get(lastName, i).trim() ? '' : 'Soyad zorunludur.';
      if (nextErrors.lastName[i]) isValid = false;
  
  
      nextErrors.gender[i] = get(genders as unknown as string[], i) ? '' : 'Cinsiyet seçimi zorunludur.';
      if (nextErrors.gender[i]) isValid = false;
  
      nextErrors.maritalStatus[i] = get(maritalStatuse as unknown as string[], i) ? '' : 'Medeni durum seçimi zorunludur.';
      if (nextErrors.maritalStatus[i]) isValid = false;
  
      nextErrors.workStatus[i] = get(workStatus as unknown as string[], i) ? '' : 'Çalışma durumu seçimi zorunludur.';
      if (nextErrors.workStatus[i]) isValid = false;
  

      nextErrors.biometricPhoto = Array<string>(totalForms).fill('');

if (selectedCountry === 'İspanya') {
  nextErrors.biometricPhoto[i] = biometricUrl[i] ? '' : 'Biyometrik fotoğraf zorunludur.';
  if (nextErrors.biometricPhoto[i]) isValid = false;
}
    
      const isFemaleMarried =
        (genders?.[i] === 'Kadın') && (maritalStatuse?.[i] === 'Evli');
      nextErrors.maidenName[i] = isFemaleMarried
        ? (get(maidenNames, i).trim() ? '' : 'Kızlık soyadı zorunludur.')
        : '';
      if (nextErrors.maidenName[i]) isValid = false;
  
   
      nextErrors.address[i] = get(address, i).trim() ? '' : 'Adres zorunludur.';
      if (nextErrors.address[i]) isValid = false;
  
   
      const em = get(email, i).trim();
      if (!em) {
        nextErrors.email[i] = 'E-posta zorunludur.';
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
        nextErrors.email[i] = 'Geçerli bir e-posta giriniz.';
        isValid = false;
      } else {
        nextErrors.email[i] = '';
      }
  
 
      if (selectedCountry === 'İngiltere' || selectedCountry === 'Amerika') {
   
        const incomeRaw = get(monthlyIncome, i).replace(/[^\d]/g, '');
        const incomeNum = Number(incomeRaw);
    
        nextErrors.monthlyIncome[i] =
          incomeNum > 0 ? '' : 'Aylık belgelendirilebilir maaş zorunludur.';
        if (nextErrors.monthlyIncome[i]) isValid = false;
    
        if (travelHistory?.[i] === 'yes') {
          const segCount = Math.max(1, travelSegmentCount?.[i] ?? 1); 
      
          ensure2D(nextErrors.travelCountry, i, segCount, '');
          ensure2D(nextErrors.travelStart,   i, segCount, '');
          ensure2D(nextErrors.travelEnd,     i, segCount, '');
      
          for (let seg = 0; seg < segCount; seg++) {
            const country = travelCountry?.[i]?.[seg]?.trim() ?? '';
            const start   = travelStart?.[i]?.[seg] ?? '';
            const end     = travelEnd?.[i]?.[seg] ?? '';
      
            // ülke zorunlu
            nextErrors.travelCountry[i][seg] = country ? '' : 'Ülke zorunludur.';
            if (!country) isValid = false;
      
            // tarihler zorunlu
            nextErrors.travelStart[i][seg] = start ? '' : 'Gidiş tarihi zorunludur.';
            nextErrors.travelEnd[i][seg]   = end   ? '' : 'Dönüş tarihi zorunludur.';
            if (!start || !end) isValid = false;
      
            // start <= end
            if (start && end && new Date(start) > new Date(end)) {
              nextErrors.travelEnd[i][seg] = 'Dönüş tarihi gidişten önce olamaz.';
              isValid = false;
            }
          }
        } else {
          // "no" ise o satırdaki hataları sıfırla (opsiyonel)
          nextErrors.travelCountry[i] = [''];
          nextErrors.travelStart[i]   = [''];
          nextErrors.travelEnd[i]     = [''];
        }
      
        // ====== 2) Avrupa/Schengen seyahati (travelHistorySchengen[i] === 'yes') ======
        if (travelHistorySchengen?.[i] === 'yes') {
          const segCountSch = Math.max(1, travelSegmentCount?.[i] ?? 1);
      
          ensure2D(nextErrors.travelSchengenCountry,  i, segCountSch, '');
          ensure2D(nextErrors.travelStartForSchengen, i, segCountSch, '');
          ensure2D(nextErrors.travelEndForSchengen,   i, segCountSch, '');
      
          for (let seg = 0; seg < segCountSch; seg++) {
            const country = travelSchengenCountry?.[i]?.[seg]?.trim() ?? '';
            const start   = travelStartForSchengen?.[i]?.[seg] ?? '';
            const end     = travelEndForSchengen?.[i]?.[seg] ?? '';
      
            nextErrors.travelSchengenCountry[i][seg] = country ? '' : 'Ülke zorunludur.';
            if (!country) isValid = false;
      
            nextErrors.travelStartForSchengen[i][seg] = start ? '' : 'Gidiş tarihi zorunludur.';
            nextErrors.travelEndForSchengen[i][seg]   = end   ? '' : 'Dönüş tarihi zorunludur.';
            if (!start || !end) isValid = false;
      
            if (start && end && new Date(start) > new Date(end)) {
              nextErrors.travelEndForSchengen[i][seg] = 'Dönüş tarihi gidişten önce olamaz.';
              isValid = false;
            }
          }
        } else {
          nextErrors.travelSchengenCountry[i]  = [''];
          nextErrors.travelStartForSchengen[i] = [''];
          nextErrors.travelEndForSchengen[i]   = [''];
        }
    




      
        nextErrors.currentBalance[i] = currentBalance[i]?.trim() ?  '' : 'Anlık bakiyeniz zorunludur.';
        if (nextErrors.currentBalance[i]) isValid = false;
        nextErrors.monthlyIncome[i] = monthlyIncome[i]?.trim() ? '' : 'Aylık gelir zorunludur.';
        if (nextErrors.monthlyIncome[i]) isValid = false;
      
        nextErrors.plannedSpending[i] = plannedSpending[i]?.trim() ? '' : 'Planlanan harcama zorunludur.';
        if (nextErrors.plannedSpending[i]) isValid = false;

        nextErrors.monthlyExpense[i] = (monthlyExpense[i] || '').trim()
  ? ''
  : 'Aylık harcama zorunludur.';
if (nextErrors.monthlyExpense[i]) isValid = false;



nextErrors.motherName[i] = get(motherName, i).trim() ? '' : 'Anne adı soyadı zorunludur.';
if (nextErrors.motherName[i]) isValid = false;

{
  const dob = get(motherDob, i).trim();
  nextErrors.motherDob[i] = dob ? '' : 'Anne doğum tarihi zorunludur.';
  if (nextErrors.motherDob[i]) isValid = false;
}

nextErrors.fatherName[i] = get(fatherName, i).trim() ? '' : 'Baba adı soyadı zorunludur.';
if (nextErrors.fatherName[i]) isValid = false;

{
  const dob = get(fatherDob, i).trim();
  nextErrors.fatherDob[i] = dob ? '' : 'Baba doğum tarihi zorunludur.';
  if (nextErrors.fatherDob[i]) isValid = false;
}
  
      }

      const ph = get(phone, i);
      const digits = ph.replace(/\D/g, '');
      if (!ph.trim()) {
        nextErrors.phone[i] = 'Telefon numarası zorunludur.';
        isValid = false;
      } else if (digits.length !== 11) {
        nextErrors.phone[i] = 'Geçerli bir telefon numarası giriniz.';
        isValid = false;
      } else {
        nextErrors.phone[i] = '';
      }
  
   
      const wantsSchengen = Boolean(at(hasSchengen as boolean[] | undefined, i, false));
      const imgs = at(schengenImages as string[][] | undefined, i, []) as string[];
      nextErrors.schengen[i] = wantsSchengen
        ? (imgs.length > 0 ? '' : 'Schengen vizesi dosyası zorunludur.')
        : '';
      if (nextErrors.schengen[i]) isValid = false;
  
   
      const hasPassport = Array.isArray(passportImage)
        ? Boolean(passportImage[i])
        : Boolean(passportImage);
      nextErrors.passport[i] = hasPassport ? '' : 'Pasaport görseli zorunludur.';
      if (nextErrors.passport[i]) isValid = false;
    }
    
    if (!tripStart?.trim()) {
      nextErrors.tripStart = 'Başlangıç tarihi zorunludur.';
      isValid = false;
    } else {
      nextErrors.tripStart = '';
    }
    
    if (!tripEnd?.trim()) {
      nextErrors.tripEnd = 'Bitiş tarihi zorunludur.';
      isValid = false;
    } else {
      nextErrors.tripEnd = '';
    }
   
  
    if (tripStart && tripEnd) {
      const start = new Date(tripStart);
      const end = new Date(tripEnd);
      if (isFinite(start.getTime()) && isFinite(end.getTime()) && start > end) {
        nextErrors.tripEnd = 'Bitiş tarihi başlangıç tarihinden önce olamaz.';
        isValid = false;
      }
    }
  

    setErrors(nextErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    setLoading(true);
    e.preventDefault();
    setIsSubmitting(true);
    const groupId = uuidv4();
  
    
    if (!selectedVisaType) {
      setVisaError('Lütfen bir vize tipi seçin.');
      document.getElementById('visa-type-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      visaBtnRef.current?.focus();
      setIsSubmitting(false);
      setLoading(false);
      return;
    }
     
    
  
  
    if (!validateForm()) {
     
      setIsSubmitting(false);
      setLoading(false);
      return;
    }
    if (!passportImage || (Array.isArray(passportImage) && passportImage.length === 0)) {
      
      setIsSubmitting(false);
      setLoading(false);
      return;
    }
    
    const schengenUrls = Array.isArray(schengenImages) && schengenImages.length
      ? (schengenImages.filter(Boolean) as unknown as string[])
      : null;
  
    

    const raw: unknown = invitationFiles;

    const invitationUrls: string[] = Array.isArray(raw)
      ? raw
          .flat()
          .filter((v): v is string => typeof v === "string") 
          .map(s => s.trim())
          .filter(s => s.length > 0)
      : [];
    
    const firstUrlLower = invitationUrls[0]?.toLowerCase(); 




  
    const pickAt = <T,>(val: T | T[] | undefined, i: number, fallback: T): T => {
      if (Array.isArray(val)) return (val[i] ?? fallback) as T;
      return (val ?? fallback) as T;
    };
  



    const baseData: Pick<ApplicationData, 'basvuru_grup_kodu' | 'country' | 'visa_type' | 'previous_schengen_url' | 'invitation_letter_url'> = {
      basvuru_grup_kodu: groupId,
      country: selectedCountry,
      visa_type: selectedVisaType as VisaType,
      previous_schengen_url: schengenUrls,     
      invitation_letter_url: firstUrlLower,   
    };
  
    const kisiSayisi = parseInt(selectedPeople.split(' ')[0] || '1', 10);
    const applications: ApplicationData[] = [];
  
    for (let i = 0; i < kisiSayisi; i++) {
      const ws = pickAt(workStatus as any, i, '') as WorkStatus;
  
      const currentData: ApplicationData = {
        ...baseData,
        
        full_name: pickAt(firstName as any, i, '').trim(),
        surname: pickAt(lastName as any, i, '').trim(),
        gender: pickAt(genders as any, i, '') as Gender,
        maiden_surname: pickAt(maidenNames as any, i, '').trim(),
        marital_status: pickAt(maritalStatuse as any, i, '') as MaritalStatus,
        work_status: ws,
        address: pickAt(address as any, i, ''),
        email: pickAt(email as any, i, ''),
        phone: pickAt(phone as any, i, ''),
        city:pickAt(city as any , i,'') ,
        tripEnd:pickAt(tripEnd as any,i,''),
      
        tripStart:pickAt(tripStart as any,i,''),

        monthlyIncome: pickAt(monthlyIncome as any ,i,''),
        monthlyExpense: pickAt(monthlyExpense as any ,i,''),
        plannedSpending:pickAt(plannedSpending as any ,i,''),

        travelStart:pickAt(travelStart as any ,i,''),
        travelEnd:pickAt(travelEnd as any ,i,''),



        travelStartForSchengen:pickAt(travelStartForSchengen as any ,i,''),
        travelEndForSchengen:pickAt(travelEndForSchengen as any ,i,''),



        motherName:pickAt(motherName as any ,i,''),
        motherDob:pickAt(motherDob as any ,i,''),
        fatherName:pickAt(fatherName as any ,i,''),
        fatherDob:pickAt(fatherDob as any ,i,''),

        homeStatus:pickAt(homeStatus as any ,i,''),
        homeSince:pickAt(homeSince as any ,i,''),

        visaRefusalCountry:pickAt(visaRefusalCountry as any ,i,''),
        visaRefusalDate:pickAt(visaRefusalDate as any ,i,''),
        
        previousAddress:pickAt(previousAddress as any ,i,''),


        currencyMonth:pickAt(currencyMonth as any ,i,''),
        currentBalance:pickAt(currentBalance as any ,i,''),
        currencyForEngland:pickAt(currencyForEngland as any ,i,''),

        currencyBalance:pickAt(currencyBalance as any ,i,''),
        
        currencyMonthAmount:pickAt(currencyMonthAmount as any ,i,''),
        travelCountry:pickAt(travelCountry as any ,i,''),
        travelSchengenCountry:pickAt(travelSchengenCountry as any ,i,''),


        appointment_status:'Randevu Alınacak',
        passport_file_url: Array.isArray(passportImage)
          ? (passportImage[i] ?? null)
          : (passportImage ?? null),
  
        
          biometric_photo_url: Array.isArray(biometricUrl)
          ? (biometricUrl[i] ?? null)
          : (biometricUrl ?? null),


        form_note:note,
        ...(ws === 'Çalışıyor' && {
          job_title :pickAt(selectedJobTitle as any , i,''),
          company_name: pickAt(companyName as any , i,'') ,
          company_address: pickAt(companyAddress as any , i,'') ,
          company_phone:pickAt(companyPhone as any , i,'') 
        }),
        ...(ws === 'Öğrenci' && {
          school_name:pickAt(schoolName as any , i,''),
          school_address: pickAt(schoolAddress as any , i,''),
          school_phone: pickAt(schoolPhone as any , i,'')
        }),

      };
     
      applications.push(currentData);
      setLoading(false);
    }
  
    try {
      const { error } = await supabase.from('applications').insert(applications);
      if (error) {
        toast.error('Hata: ' + error.message);
        return;
      }
      navigate('/thanks', { replace: true });
    } catch (err: any) {
      toast.error('Beklenmeyen hata: ' + (err?.message || String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };



  
  return (
    
    <div className="min-h-screen text-white font-sans px-0 sm:px-4 py-8"
    style={{
      background: 'linear-gradient(to bottom, rgb(255, 255, 255), rgba(210, 210, 210, 0.9))',
    }}>
      <div className="max-w-4xl mx-auto bg-white text-black p-3 rounded-xl shadow-lg">
        <div className="relative flex items-center justify-center mb-6">
        <img
  src={logo}
  alt="Trawost Logo"
  className="absolute left-0 h-24 w-24 hidden md:block"
/>
          <div className="text-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#E50914] to-black text-transparent bg-clip-text sm:truncate sm:text-3xl sm:tracking-tight">Trawost Vize Başvuru Formu</h1>
            <p className="mt-2 text-gray-600 text-base sm:text-m italic">
Schengen vize başvurunuzu kolayca tamamlayın</p>
          </div>
        </div>
       
        <div className="mt-10 max-w-4xl mx-auto bg-white p-4 rounded-xl border-2 border-gray-100">
  <div className="flex items-center gap-3 mb-6">
    <DocumentTextIcon className="w-8 h-8 text-gray-400" />
    <h2
  className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E50914] via-[#8b060f] to-black sm:truncate sm:text-3xl sm:tracking-tight"
  style={{ backgroundSize: '300% 100%', backgroundPosition: 'left center' }}
>
  Genel Bilgiler
</h2>
  </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
   
      <div>
      <label className="block mb-2 text-m font-semibold text-gray-600">
          Başvuru Yapılacak Ülke <span className="text-red-500">*</span>
        </label>
        <Menu as="div" className="relative inline-block w-full">
          <MenuButton className="inline-flex w-full justify-between items-center rounded-lg bg-white px-4 py-3 text-base  text-gray-800 border border-red-500 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500">
            {selectedCountry}
            <ChevronDownIcon className="w-5 h-5 text-gray-500" aria-hidden="true" />
          </MenuButton>
        <Transition
    as={Fragment}
    enter="transition ease-out duration-100"
    enterFrom="transform opacity-0 scale-95"
    enterTo="transform opacity-100 scale-100"
    leave="transition ease-in duration-75"
    leaveFrom="transform opacity-100 scale-100"
    leaveTo="transform opacity-0 scale-95"
  >
        <MenuItems
  className="absolute z-10 mt-2 w-full rounded-lg bg-white text-black shadow-lg ring-1 ring-black/10 focus:outline-none max-h-64 overflow-y-auto"
>
  <div className="py-1">
  {countriesWithFlags.map(({ name, code }) => (
  <MenuItem key={name}>
    {({ active }) => (
      <button
        onClick={() => setSelectedCountry(name)}
        className={`${
          active ? "bg-red-100 text-red-800" : "text-gray-900"
        } flex items-center gap-2 w-full text-left px-4 py-2 text-base font-medium`}
      >
        <ReactCountryFlag
          countryCode={code}
          svg
          style={{
            fontSize: "1.5em",
            lineHeight: "1.5em",
          }}
        />
        {name}
      </button>
    )}
  </MenuItem>
))}
  </div>
</MenuItems>
          </Transition>
        </Menu>
      </div>
      <div id="visa-type-wrap" className="mt-0">
  <label className="block mb-2 text-m font-semibold text-gray-600">
    Vize Tipi <span className="text-red-600">*</span>
  </label>

  <Menu as="div" className="relative inline-block w-full">
    <MenuButton
      ref={visaBtnRef}
      className={`inline-flex w-full justify-between items-center rounded-lg px-4 py-3 text-base text-gray-800 border shadow-sm ring-1 ring-inset focus:outline-none
        ${visaError
          ? 'bg-white border-red-500 ring-red-500 focus:ring-2 focus:ring-red-500'
          : 'bg-white border-gray-300 ring-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-red-500'}`}
    >
       {selectedVisaType || 'Vize tipi seçin'}
      <ChevronDownIcon className="w-5 h-5 text-gray-500" aria-hidden="true" />
    </MenuButton>

    <Transition
      as={Fragment}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      <MenuItems className="absolute z-10 mt-2 w-full rounded-lg bg-white text-black shadow-lg ring-1 ring-black/10 focus:outline-none">
        <div className="py-1">
          {['Turistik', 'Eğitim', 'Ticari'].map((type:any) => (
            <MenuItem key={type}>
              {({ active }) => (
                <button
                  onClick={() => {
                    setSelectedVisaType(type);
                    setVisaError(''); 
                  }}
                  className={`${active ? 'bg-red-100 text-red-800' : 'text-gray-900'} block w-full text-left px-4 py-2 text-base font-medium`}
                >
                  {type}
                </button>
              )}
            </MenuItem>
          ))}
        </div>
      </MenuItems>
    </Transition>
  </Menu>

  {!!visaError && (
    <p className="mt-2 text-sm text-red-600">{visaError}</p>
  )}
</div>
    
      <div>
      <label className="block mb-2 text-m font-semibold text-gray-600">
          Kaç Kişi Başvuruyor? <span className="text-red-600">*</span>
      </label>
      <div className="mt-8">
        <Menu as="div" className="relative inline-block w-full">
  <MenuButton className="inline-flex w-full justify-between items-center rounded-lg bg-white px-4 py-3 text-base text-gray-800 border border-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500">
    {selectedPeople}
    <ChevronDownIcon className="w-5 h-5 text-gray-500" aria-hidden="true" />
  </MenuButton>

  <Transition
    as={Fragment}
    enter="transition ease-out duration-100"
    enterFrom="transform opacity-0 scale-95"
    enterTo="transform opacity-100 scale-100"
    leave="transition ease-in duration-75"
    leaveFrom="transform opacity-100 scale-100"
    leaveTo="transform opacity-0 scale-95"
  >
    <MenuItems className="absolute z-10 mt-2 w-full rounded-lg bg-white text-black shadow-lg ring-1 ring-black/10 focus:outline-none">
      <div className="py-1">
        {['1 Kişi', '2 Kişi','3 Kişi', '4 Kişi','5 Kişi', '6 Kişi',].map((option) => (
          <MenuItem key={option}>
            {({ active }) => (
              <button
                onClick={() => setSelectedPeople(option)}
                className={`${
                  active ? 'bg-red-100 text-red-800' : 'text-gray-900'
                } block w-full text-left px-4 py-2 text-base font-medium`}
              >
                {option}
              </button>
            )}
          </MenuItem>
        ))}
      </div>
    </MenuItems>
  </Transition>
</Menu>
      </div>
      </div>
      <div className="mt-0">
  <label className="block mb-2 text-m font-semibold text-gray-600">
    Seyahat Planlaması <span className="text-red-600">*</span>
  </label>
 


  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

  <div>
    <label className="block mb-1 text-sm font-medium text-gray-700">
      Gidiş Tarihi
    </label>
    <input
      type="date"
      value={tripStart}
      onChange={(e) => setTripStart(e.target.value)}
      max={tripEnd || undefined}
      className={`block w-full h-13 rounded-lg px-4 py-3 text-base text-gray-800 placeholder:text-gray-400 border shadow-sm ring-1 ring-inset
        ${
          errors.tripStart
            ? 'border-red-500 ring-red-500 bg-red-50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500'
            : 'bg-white border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500'
        }`}
    />
    {errors.tripStart && (
      <p className="mt-2 text-sm text-red-600">{errors.tripStart}</p>
    )}
  </div>


  <div>
    <label className="block mb-1 text-sm font-medium text-gray-700">
      Dönüş Tarihi
    </label>
    <input
      type="date"
      value={tripEnd}
      onChange={(e) => setTripEnd(e.target.value)}
      min={tripEnd || undefined}
      className={`block w-full h-13 rounded-lg px-4 py-3 text-base text-gray-800 placeholder:text-gray-400 border shadow-sm ring-1 ring-inset
        ${
          errors.tripEnd
            ? 'border-red-500 ring-red-500 bg-red-50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500'
            : 'bg-white border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500'
        }`}
    />
    {errors.tripEnd && (
      <p className="mt-2 text-sm text-red-600">{errors.tripEnd}</p>
    )}
  </div>
</div>

</div>





    </div>
    </div>

  

        {Array.from({ length: totalForms }).map((_, index) => (
  <div key={index} className="mt-10 max-w-4xl mx-auto bg-white p-4 rounded-xl border-2 border-gray-100" >
   <h2 className="text-2xl font-bold bg-gradient-to-r from-[#E50914] to-black text-transparent bg-clip-text text-[#E50914] sm:truncate sm:text-3xl sm:tracking-tight mb-6 flex items-center gap-2">

   <PaperAirplaneIcon className="w-9 h-9 text-gray-400 rotate-45" />
  {totalForms > 1 ? `${index + 1}.` : ''} Başvuru 
</h2>

<div   className="mt-8 rounded-xl bg-white p-0 shadow-sm"
  style={{ border: "none" }}
>
        <div className="flex items-center gap-3 mb-6" >
    <UserCircleIcon className="w-8 h-8 text-gray-400" />
    
    <h2 className="text-2xl font-bold bg-gradient-to-r from-[#E50914] to-black text-transparent bg-clip-text text-[#E50914] sm:truncate sm:text-2xl sm:tracking-tight"  style={{ backgroundSize: '500% 100%', backgroundPosition: 'left center' }}>
    Başvuru Sahibi
    </h2>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6" >

  <div className="sm:col-span-1">
  <label htmlFor={`first-name-${index}`} className="block text-m font-semibold text-gray-600">
    Ad <span className="text-red-500">*</span>
  </label>
  <div className="mt-2">
    
  <input
  id={`first-name-${index}`}
  value={firstName[index] ?? ''}
  onChange={(e) => {
    const next = [...firstName];
    next[index] = e.target.value;
    setFirstName(next);

    if (errors.firstName?.[index]) {
      setErrors(prev => {
        const n = { ...prev, firstName: [...prev.firstName] };
        n.firstName[index] = '';
        return n;
      });
    }
  }}
  placeholder="Ad giriniz"
  aria-invalid={!!errors.firstName?.[index]}
  className={`block w-full rounded-lg px-4 py-3 text-base text-gray-800 placeholder:text-gray-400 border shadow-sm ring-1 ring-inset
    ${errors.firstName?.[index]
      ? 'border-red-500 ring-red-500 bg-red-50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-0'
      : 'bg-white border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-0'
    }`}
/>
{errors.firstName?.[index] && (
  <p className="mt-1 text-sm text-red-600">{errors.firstName[index]}</p>
)}
  </div>
</div>


  <div className="sm:col-span-1">
    <label htmlFor="last-name" className="block text-m font-semibold text-gray-600">
      Soyad <span className="text-red-500">*</span>
    </label>
    <div className="mt-2">
    <input
  id={`last-name-${index}`}
  value={lastName[index] || ''} 
  onChange={(e) => {
    const value = e.target.value;
    setLastName((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (errors.lastName[index]) {
      setErrors((prev) => {
        const nextErrors = { ...prev };
        nextErrors.lastName[index] = '';
        return nextErrors;
      });
    }
  }}
  type="text"
  placeholder="Soyadınızı giriniz"
  aria-invalid={!!errors.lastName[index]}
  className={`block w-full rounded-lg px-4 py-3 text-base text-gray-800 placeholder:text-gray-400 border shadow-sm ring-1 ring-inset
    ${errors.lastName?.[index]
      ? 'border-red-500 ring-red-500 bg-red-50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-0'
      : 'bg-white border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-0'}`}
/>
{errors.lastName[index] && (
  <p className="mt-1 text-sm text-red-600">{errors.lastName[index]}</p>
)}
</div>
  </div>
</div>
<fieldset className="mt-6">
  <label className="block mb-2 text-m font-semibold text-gray-600">
    Cinsiyet <span className="text-red-500">*</span>
  </label>
  <p className="mt-1 text-sm/6 text-gray-600">Lütfen cinsiyetinizi seçiniz.</p>

  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 p-2 rounded-lg">
    {['Erkek', 'Kadın'].map((genderOption: any) => (
      <div key={genderOption} className="flex items-center gap-x-2">
        <input
          id={`gender-${index}-${genderOption}`}
          type="radio"
          name={`gender-${index}`}
          value={genderOption}
          checked={genders[index] === genderOption}
          onChange={() => {
           
            setGenders(prev => {
              const next = [...prev];
              next[index] = genderOption as Gender;
              return next;
            });
           
            if (errors.gender?.[index]) {
              setErrors(prev => {
                const arr = [...(prev.gender || [])];
                arr[index] = '';
                return { ...prev, gender: arr };
              });
            }
          }}
          className="relative size-4 appearance-none rounded-full border border-gray-300 bg-white
            checked:border-red-600 checked:bg-white
            before:absolute before:inset-1 before:rounded-full
            before:bg-red-600 before:scale-0 checked:before:scale-100
            transition-all duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-red-600"
        />
        <label
          htmlFor={`gender-${index}-${genderOption}`}
          className="block text-sm/6 font-medium text-gray-900"
        >
          {genderOption}
        </label>
      </div>
    ))}
  </div>


  {errors.gender[index] && (
    <p className="mt-1 text-sm text-red-600">{errors.gender[index]}</p>
  )}
</fieldset>



<fieldset className="mt-6">
  <legend className="text-m font-semibold text-gray-600 mb-2">
    Medeni Durum <span className="text-red-500">*</span>
  </legend>
  <p className="mt-1 text-sm/6 text-gray-600">Lütfen medeni durumunuzu seçiniz.</p>
  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 p-2 rounded-lg">
    {(['Bekar','Evli','Boşanmış','Dul'] as MaritalStatus[]).map((status) => (
      <label key={status} className="inline-flex items-center gap-2 text-sm text-gray-700">
        <input
          type="radio"
          name={`maritalStatus-${index}`}       
          value={status}
          checked={maritalStatuse[index] === status}
          onChange={() => {
            setMaritalStatuse((prev: any) => {
              const next = [...prev];
              next[index] = status;
              return next;
            });
            if (errors.maritalStatus[index]) {
              setErrors(prev => {
                const next = { ...prev };
                next.maritalStatus = [...next.maritalStatus];
                next.maritalStatus[index] = '';
                return next;
              });
            }
          }}
          className={`relative size-4 appearance-none rounded-full border border-gray-300 bg-white
          
            checked:border-red-600 checked:bg-white
            before:absolute before:inset-1 before:rounded-full
            before:bg-red-600 before:scale-0 checked:before:scale-100
            transition-all duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-red-600`}
        />
          
           
           
         
           
        
        {status}
      </label>
    ))}
  </div>

  {errors.maritalStatus[index] && (
    <p className="mt-1 text-sm text-red-600">{errors.maritalStatus[index]}</p>

  )}
</fieldset>
{genders[index] === "Kadın" && maritalStatuse[index]=== "Evli"  &&(
  <fieldset className="mt-4 w-full md:w-1/2">
    <label className="block mb-2 text-m font-semibold text-gray-600">
      Kızlık Soyadı <span className="text-red-500">*</span>
    </label>
    <input
  type="text"
  value={maidenNames[index] || ""}
  onChange={(e) => {
    setMaidenNames((prev) => {
      const next = [...prev];
      next[index] = e.target.value;
      return next;
    });
    if (errors.maidenName?.[index]) {
      setErrors((prev) => {
        const next = { ...prev, maidenName: [...(prev.maidenName || [])] };
        next.maidenName[index] = '';
        return next;
      });
    }
  }}
  placeholder="Kızlık soyadınızı girin"
  className={`block w-full rounded-lg px-4 py-3 text-base text-gray-800 placeholder:text-gray-400 border shadow-sm ring-1 ring-inset
    ${errors.maidenName?.[index]
      ? 'border-red-500 ring-red-500 bg-red-50'
      : 'bg-white border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500'}`}
/>

{errors.maidenName?.[index] && (
  <p className="mt-1 text-sm text-red-600">{errors.maidenName[index]}</p>
)}
  </fieldset>
)}
<fieldset className="mt-6">
  <legend className="text-m font-semibold text-gray-600">
    Çalışma Durumu <span className="text-red-500">*</span>
  </legend>
  <p className="mt-2 text-sm/6 text-gray-600">
    Lütfen mevcut çalışma durumunuzu seçiniz.
  </p>

  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 p-2 rounded-lg">
    {(['Çalışıyor', 'Emekli', 'Öğrenci', 'Çalışmıyor'] as WorkStatus[]).map((status) => (
      <div key={status} className="flex items-center gap-x-3">
        <input
          id={`work-${status}-${index}`}              
          type="radio"
          name={`work-status-${index}`}                
          value={status}
          checked={workStatus[index] === status}
          onChange={() => {
            setWorkStatus(prev => {
              const next = [...prev];
              next[index] = status;
              return next;
            });
            if (errors.workStatus[index]) {
              setErrors(prev => {
                const next = { ...prev };
                next.workStatus = [...next.workStatus];
                next.workStatus[index] = '';
                return next;
              });
            }
          }}
          className={`relative size-4 appearance-none rounded-full border border-gray-300 bg-white
          
            checked:border-red-600 checked:bg-white
            before:absolute before:inset-1 before:rounded-full
            before:bg-red-600 before:scale-0 checked:before:scale-100
            transition-all duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-red-600`}
        />
        <label
          htmlFor={`work-${status}-${index}`}
          className="block text-sm/6 font-medium text-gray-900"
        >
          {status}
        </label>
      </div>
    ))}
  </div>

  {errors.workStatus[index] && (
    <p className="mt-1 text-sm text-red-600">{errors.workStatus[index]}</p>
  )}
</fieldset>
{workStatus[index] === 'Çalışıyor' && (
  <div
    className="p-6 mt-6 rounded-xl"
    style={{ background: 'linear-gradient(to right, rgba(229, 9, 20, 0.91), rgba(34, 2, 4, 0.79))' }}
  >
    <h3 className="text-white font-semibold mb-4">İş Bilgileri</h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <input
  type="text"
  value={selectedJobTitle[index] || ''}
  onChange={(e) => {
    setSelectedJobTitle(prev => {
      const next = [...prev];
      next[index] = e.target.value;
      return next;
    });
  }}
  placeholder="Lütfen çalıştığınız pozisyonu girin"
  className="h-12 w-full rounded-lg bg-white px-4 text-base text-gray-800 border border-red-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
/>
 
<input
  id={`company-name-${index}`}
  value={companyName[index] || ""}
  onChange={(e) => {
    const updated = [...companyName];
    updated[index] = e.target.value;
    setCompanyName(updated);
  }}
  type="text"
  placeholder="Firma adını girin"
  className="h-12 px-4 py-3 rounded-lg w-full border border-gray-300 bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
/>

<textarea
  id={`company-address-${index}`}
  value={companyAddress[index] || ""}
  onChange={(e) => {
    const updated = [...companyAddress];
    updated[index] = e.target.value;
    setCompanyAddress(updated);
  }}
  placeholder="Firma adresini girin"
  className="h-12 px-4 py-3 rounded-lg w-full border border-gray-300 bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
/>


<input
  id={`company-phone-${index}`}
  value={companyPhone[index] || ""}
  onChange={(e) => {
    let v = e.target.value.replace(/\D/g, ""); 

  
    if (v && v[0] !== "0") {
      v = "0" + v;
    }

    let formatted = v;
    if (v.length > 1) {
      const first = v[0];      
      const area = v.slice(1, 4); 
      const rest = v.slice(4);   
      formatted = rest
        ? `${first} (${area}) ${rest}`
        : `${first} (${area})`;
    }

    const updated = [...companyPhone];
    updated[index] = formatted;
    setCompanyPhone(updated);
  }}
  type="text"
  inputMode="tel"
  placeholder="Firma telefon numarasını girin"
  className="h-12 px-4 py-3 rounded-lg w-full border border-gray-300 bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
/>

{(selectedCountry === 'İngiltere' || selectedCountry === 'Amerika'|| selectedCountry === 'Kanada') && (

 <div className="mt-0 overflow-hidden">
 <div
   className={
  selectedCountry === 'İngiltere' || selectedCountry === 'Amerika'|| selectedCountry === 'Kanada'
     ? 'opacity-100 max-h-40'
     : 'opacity-0 max-h-0 pointer-events-none'}
   style={{ transition: 'max-height .3s ease, opacity .2s ease' }}
 >
   <label className="block mb-2 text-sm font-semibold text-white ml-1">
   Aylık Belgelendirilebilir Maaş <span className="text-red-500">*</span>
   </label>
   <div className="flex items-center w-full relative">
   <div className="relative w-1/2">
  <input
    id={`monthly-income-${index}`}
    inputMode="numeric"
    placeholder="20,000"
    value={monthlyIncome[index] || ''}
    onChange={(e) => {
      const raw = e.target.value.replace(/[^\d]/g, '');
      const withThousands = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      const next = [...monthlyIncome];
      next[index] = withThousands;
      setMonthlyIncome(next);
    }}
    className="h-12 px-4 pr-10 py-3 rounded-lg w-full border border-gray-300 bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
  />

 
  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">
    ₺
  </span>


</div>

{errors.monthlyIncome?.[index] && (
  <p className="mt-1 text-sm text-white ml-3">{errors.monthlyIncome[index]}</p>
)}
 </div>
 </div>

</div>
)}
    </div>
  </div>
)}
{workStatus[index] === 'Öğrenci' && (
  <div
    className="p-6 mt-6 rounded-xl"
    style={{
      background: 'linear-gradient(to right, rgba(229, 9, 20, 0.91), rgba(34, 2, 4, 0.79))',
    }}
  >
    <h3 className="text-white font-semibold mb-4">Eğitim Bilgileri</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      
      <input
        id={`school-name-${index}`}
        value={schoolName[index] || ""}
        onChange={(e) => {
          const updated = [...schoolName];
          updated[index] = e.target.value;
          setSchoolName(updated);
        }}
        type="text"
        placeholder="Okul adını girin"
        className="h-12 px-4 py-3 rounded-lg w-full border border-gray-300 bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-0"
      />

   <Cleave
      id={`school-phone-${index}`}
      options={{ phone: true, phoneRegionCode: 'TR' }}
      value={schoolPhone[index] || ''}
      onChange={(e: any) => {
        let v = e.target.value as string;


        if (v && !v.startsWith('0')) {
          v = '0' + v;
        }

        const updated = [...schoolPhone];
        updated[index] = v;
        setSchoolPhone(updated);
      }}
      inputMode="tel"
      placeholder="(xxx) xxx xx xx"
      className="h-12 px-4 py-3 rounded-lg w-full border border-gray-300 bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-0"
      />
      <textarea
        id={`school-address-${index}`}
        value={schoolAddress[index] || ""}
        onChange={(e) => {
          const updated = [...schoolAddress];
          updated[index] = e.target.value;
          setSchoolAddress(updated);
        }}
        placeholder="Okul adresini girin"
        className="h-12 px-4 py-3 rounded-lg w-full md:col-span-2 border border-gray-300 bg-white text-gray-800 placeholder-gray-500 resize-none focus:outline-none focus:ring-0"
      />
    </div>
  </div>
)}

{(selectedCountry === 'İngiltere' || selectedCountry === 'Amerika') && 
   (
  <div className="mt-4">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-3 gap-y-2">
    {workStatus[index] !== 'Çalışıyor' && (
  <div>
    
  <legend className="text-m font-semibold text-gray-600 mb-1 flex items-center gap-1 flex-wrap">
  <span>Aylık Geliriniz</span>
  <span className="text-red-500">*</span>
</legend>
    

    <div className="relative w-full max-w-[240px] mt-7">
      <input
        id={`monthly-income-${index}`}
        inputMode="numeric"
        placeholder="20,000"
        value={monthlyIncome[index] || ''}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d]/g, '');
          const withThousands = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          const next = [...monthlyIncome];
          next[index] = withThousands;
          setMonthlyIncome(next);
        }}
        className={`block w-full rounded-lg px-4 pr-10 py-3 text-base text-gray-800 placeholder:text-gray-400 border shadow-sm ring-1 ring-inset mt-1
          ${errors.monthlyIncome?.[index]
            ? 'border-red-500 ring-red-500 bg-red-50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500'
            : 'bg-white border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500'}`}
      />
       <select
    value={currencyMonth[index] || '₺'}
    onChange={(e) => {
      const next = [...currencyMonth];
      next[index] = e.target.value;
      setCurrencyMonth(next);
    }}
    className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-gray-600 font-semibold focus:outline-none"
  >
   <option value="₺">₺</option>    
    <option value="£">£ </option>
    <option value="$">$</option>
  </select>
    </div>

    {errors.monthlyIncome?.[index] && (
      <p className="mt-1 text-sm text-red-600">{errors.monthlyIncome[index]}</p>
    )}

  </div>
)}

  <div>
  <legend className="text-m font-semibold text-gray-600 mb-1">
  {selectedCountry === "Amerika"
    ? "Amerika'da harcamayı düşündüğünüz tutar"
    : "İngiltere'de harcamayı düşündüğünüz tutar"}{" "}
  <span className="text-red-500">*</span>
</legend>

    <div className="relative w-full max-w-[240px]">
      <input
        id={`planned-spending-${index}`}
        inputMode="numeric"
        placeholder="1,500"
        value={plannedSpending[index] || ''}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d]/g, '');
          const withThousands = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          const next = [...plannedSpending];
          next[index] = withThousands;
          setPlannedSpending(next);
        }}
        className={`block w-full rounded-lg px-4 pr-10 py-3 text-base text-gray-800 placeholder:text-gray-400 border shadow-sm ring-1 ring-inset mt-1
          ${errors.plannedSpending?.[index]
            ? 'border-red-500 ring-red-500 bg-red-50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500'
            : 'bg-white border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500'}`}
      />
      <select
    value={currencyForEngland[index] || '₺'}
    onChange={(e) => {
      const next = [...currencyForEngland];
      next[index] = e.target.value;
      setCurrencyForEngland(next);
    }}
    className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-gray-600 font-semibold focus:outline-none"
  >
    <option value="₺">₺</option>    
    <option value="£">£ </option>
    <option value="$">$</option>
  </select>
    </div>

    {errors.plannedSpending?.[index] && (
      <p className="mt-1 text-sm text-red-600">{errors.plannedSpending[index]}</p>
    )}
  </div>

  <div>
  <legend className="text-m font-semibold text-gray-600 mb-1">
    Aylık harcama tutarınız <span className="text-red-500">*</span>
  </legend>

  <div className="relative w-full max-w-[240px] mt-7">
    <input
      id={`monthly-expense-${index}`}   
      inputMode="numeric"
      placeholder="1,500"
      value={monthlyExpense[index] || ''}   
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d]/g, '');
        const withThousands = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        const next = [...monthlyExpense];
        next[index] = withThousands;
        setMonthlyExpense(next);  
      }}
      className={`block w-full rounded-lg px-4 pr-10 py-3 text-base text-gray-800 placeholder:text-gray-400 border shadow-sm ring-1 ring-inset mt-1
        ${errors.monthlyExpense?.[index]
          ? 'border-red-500 ring-red-500 bg-red-50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500'
          : 'bg-white border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500'}`}
    />
    <select
    value={currencyMonthAmount[index] || '₺'}
    onChange={(e) => {
      const next = [...currencyMonthAmount];
      next[index] = e.target.value;
      setCurrencyMonthAmount(next);
    }}
    className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-gray-600 font-semibold focus:outline-none"
  >
    <option value="₺">₺</option>    
    <option value="£">£ </option>
    <option value="$">$</option>
  </select>
  </div>

  {errors.monthlyExpense?.[index] && (
    <p className="mt-1 text-sm text-red-600">{errors.monthlyExpense[index]}</p>
  )}
</div>
<div>
<legend className="text-m font-semibold text-gray-600 mb-1">
  Anlık Bakiyeniz <span className="text-red-500">*</span>
</legend>

<div className="relative w-full max-w-[240px] mt-1">
  <input
    id={`current-balance-${index}`}   
    inputMode="numeric"
    placeholder="1,500"
    value={currentBalance[index] || ''}   
    onChange={(e) => {
      const raw = e.target.value.replace(/[^\d]/g, '');
      const withThousands = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      const next = [...currentBalance];
      next[index] = withThousands;
      setCurrentBalance(next);  
    }}
    className={`block w-full rounded-lg px-4 pr-16 py-3 text-base text-gray-800 placeholder:text-gray-400 border shadow-sm ring-1 ring-inset mt-1
      ${errors.currentBalance?.[index]
        ? 'border-red-500 ring-red-500 bg-red-50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500'
        : 'bg-white border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500'}`}
  />

  <select
    value={currencyBalance[index] || '₺'}
    onChange={(e) => {
      const next = [...currencyBalance];
      next[index] = e.target.value;
      setCurrencyBalance(next);
    }}
    className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-gray-600 font-semibold focus:outline-none"
  >
    <option value="₺">₺</option>    
    <option value="£">£ </option>
    <option value="$">$</option>
  </select>
</div>

{errors.currentBalance?.[index] && (
  <p className="mt-1 text-sm text-red-600">{errors.currentBalance[index]}</p>
)}

</div>




</div>
<div>
  <legend className="text-m font-semibold text-gray-600 mb-1 mt-5">
    Son 10 yıl içinde 
    <span className="font-bold text-black"> Amerika</span>&nbsp;, 
    <span className="font-bold text-black"> Kanada</span> , 
    <span className="font-bold text-black"> İngiltere</span> 
    &nbsp; seyahatleriniz oldu mu? <span className="text-red-500">*</span>
  </legend>


  <div className="flex items-center gap-6 mt-2">
    <label className="flex items-center gap-2">
      <input
        type="radio"
        name={`travelHistory-${index}`}
        value="yes"
        checked={travelHistory[index] === "yes"}
        onChange={() => {
          const next = [...travelHistory];
          next[index] = "yes";
          setTravelHistory(next);
        }}
        className={`relative size-4 appearance-none rounded-full border border-gray-300 bg-white
          
          checked:border-red-600 checked:bg-white
          before:absolute before:inset-1 before:rounded-full
          before:bg-red-600 before:scale-0 checked:before:scale-100
          transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-red-600`}
      />
      <span>Evet</span>
    </label>

    <label className="flex items-center gap-2">
      <input
        type="radio"
        name={`travelHistory-${index}`}
        value="no"
        checked={travelHistory[index] === "no"}
        onChange={() => {
          const next = [...travelHistory];
          next[index] = "no";
          setTravelHistory(next);
        }}
        className={`relative size-4 appearance-none rounded-full border border-gray-300 bg-white
          
          checked:border-red-600 checked:bg-white
          before:absolute before:inset-1 before:rounded-full
          before:bg-red-600 before:scale-0 checked:before:scale-100
          transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-red-600`}
      />
      <span>Hayır</span>
    </label>
  </div>


  {travelHistory[index] === "yes" && (
  <div className="mt-3">

    {Array.from({ length: travelSegmentCount[index] }).map((_, segIdx) => (
      <div key={`seg-${index}-${segIdx}`} className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">

  
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Ülke ({segIdx + 1})
          </label>

          <Menu as="div" className="relative inline-block w-full">
            <Menu.Button
              className={[
                "inline-flex w-full justify-between items-center rounded-lg px-4 py-3 text-base shadow-sm ring-1 ring-inset",
                travelCountry[index]?.[segIdx]
                  ? "bg-white text-gray-800 border border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                  : (errors.travelCountry?.[index]?.[segIdx]
                      ? "bg-red-50 text-gray-800 border border-red-500 ring-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                      : "bg-white text-gray-500 border border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500")
              ].join(" ")}
            >
              <span className={travelCountry[index]?.[segIdx] ? "text-gray-800" : "text-gray-500"}>
                {travelCountry[index]?.[segIdx] || "— Ülke seçin —"}
              </span>
              <ChevronDownIcon className="w-5 h-5 text-gray-500" aria-hidden="true" />
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute z-10 mt-2 w-full rounded-lg bg-white text-black shadow-lg ring-1 ring-black/10 focus:outline-none">
                <div className="py-1 max-h-64 overflow-auto">
                  {COUNTRY_OPTIONS.map((opt) => (
                    <Menu.Item key={opt}>
                      {({ active }) => (
                        <button
                          type="button"
                          onClick={() => {
                            setTravelCountry(prev => {
                              const next = prev.map(arr => [...arr]);
                              next[index][segIdx] = opt;
                              return next;
                            });
                            if (errors.travelCountry?.[index]?.[segIdx]) {
                              setErrors(p => {
                                const n = { ...p };
                                n.travelCountry = n.travelCountry.map((arr: string[]) => arr ? [...arr] : []);
                                n.travelCountry[index][segIdx] = "";
                                return n;
                              });
                            }
                          }}
                          className={`${active ? 'bg-red-100 text-red-800' : 'text-gray-900'} block w-full text-left px-4 py-2 text-base font-medium`}
                        >
                          {opt}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {errors.travelCountry?.[index]?.[segIdx] && (
            <p className="mt-1 text-sm text-red-600">{errors.travelCountry[index][segIdx]}</p>
          )}
        </div>

 
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Gidiş Tarihi</label>
          <input
            type="date"
            value={travelStart[index]?.[segIdx] || ""}
            onChange={(e) => {
              const v = e.target.value;
              setTravelStart(prev => {
                const next = prev.map(arr => [...arr]);
                next[index][segIdx] = v;
                return next;
              });
              if (errors.travelStart?.[index]?.[segIdx]) {
                setErrors(p => {
                  const n = { ...p };
                  n.travelStart = n.travelStart.map((arr: string[]) => [...arr]);
                  n.travelStart[index][segIdx] = "";
                  return n;
                });
              }
            }}
            className={`block w-full rounded-lg px-4 py-3 text-base text-gray-800 border shadow-sm ring-1 ring-inset mt-1
              ${errors.travelStart?.[index]?.[segIdx]
                ? 'border-red-500 ring-red-500 bg-red-50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500'
                : 'bg-white border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500'}`}
          />
        </div>

       
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Dönüş Tarihi</label>
          <input
            type="date"
            value={travelEnd[index]?.[segIdx] || ""}
            onChange={(e) => {
              const v = e.target.value;
              setTravelEnd(prev => {
                const next = prev.map(arr => [...arr]);
                next[index][segIdx] = v;
                return next;
              });
              if (errors.travelEnd?.[index]?.[segIdx]) {
                setErrors(p => {
                  const n = { ...p };
                  n.travelEnd = n.travelEnd.map((arr: string[]) => [...arr]);
                  n.travelEnd[index][segIdx] = "";
                  return n;
                });
              }
            }}
            className={`block w-full rounded-lg px-4 py-3 text-base text-gray-800 border shadow-sm ring-1 ring-inset mt-1
              ${errors.travelEnd?.[index]?.[segIdx]
                ? 'border-red-500 ring-red-500 bg-red-50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500'
                : 'bg-white border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500'}`}
          />
        </div>
      </div>
    ))}


<div className="mt-3 flex items-center gap-3">
  <button
    type="button"
    onClick={() => {
      setTravelSegmentCount(prev => {
        const next = [...prev];
        const cur = Math.max(1, next[index] ?? 1);
        const newCount = Math.min(3, cur + 1);
        next[index] = newCount;

        setTravelCountry(tc => ensure2D(tc, index, newCount));
        setTravelStart(ts => ensure2D(ts, index, newCount));
        setTravelEnd(te => ensure2D(te, index, newCount));

        return next;
      });
    }}
    disabled={(travelSegmentCount[index] ?? 1) >= 3}
   className="px-3 py-1 rounded bg-red-600 text-white disabled:opacity-40"
  >
    + Yeni ülke
  </button>

  <button
    type="button"
    onClick={() => {
      setTravelSegmentCount(prev => {
        const next = [...prev];
        const cur = Math.max(1, next[index] ?? 1);
        const newCount = Math.max(1, cur - 1);
        next[index] = newCount;

        setTravelCountry(tc => ensure2D(tc, index, newCount));
        setTravelStart(ts => ensure2D(ts, index, newCount));
        setTravelEnd(te => ensure2D(te, index, newCount));

        return next;
      });
    }}
    disabled={(travelSegmentCount[index] ?? 1) <= 1}
    className="px-3 py-1 rounded bg-gray-200 text-gray-800 disabled:opacity-40"
  >
    − Kaldır
  </button>

  <span className="text-xs text-gray-500">
    ({Math.max(1, travelSegmentCount[index] ?? 1)}/3)
  </span>
</div>
  </div>
)}
</div>
<div>
  <legend className="text-m font-semibold text-gray-600 mb-1 mt-5">
    Son 10 yıl içinde <span className="font-bold text-black">Avrupa</span> seyahatiniz oldu mu?
    <span className="text-red-500"> *</span>
  </legend>

  <div className="flex items-center gap-6 mt-2">
    <label className="flex items-center gap-2">
      <input
        type="radio"
        name={`travelHistorySchengen-${index}`}
        value="yes"
        checked={travelHistorySchengen[index] === "yes"}
        onChange={() => {
          const next = [...travelHistorySchengen]; next[index] = "yes";
          setTravelHistorySchengen(next);

          // kişi için en az 1 segment hazırla
          const newCountArr = ensureSegCount(travelSchengenSegmentCount, index, travelSchengenSegmentCount[index] ?? 1);
          setTravelSchengenSegmentCount(newCountArr);
          const segs = newCountArr[index] ?? 1;

          setTravelSchengen(p => syncLen(p, index, segs, ""));
          setTravelStartForSchengen(p => syncLen(p, index, segs, ""));
          setTravelEndForSchengen(p   => syncLen(p, index, segs, ""));
        }}
        className="relative size-4 appearance-none rounded-full border border-gray-300 bg-white
                   checked:border-red-600 checked:bg-white
                   before:absolute before:inset-1 before:rounded-full
                   before:bg-red-600 before:scale-0 checked:before:scale-100
                   transition-all duration-200 ease-in-out
                   focus:outline-none focus:ring-2 focus:ring-red-600"
      />
      <span>Evet</span>
    </label>

    <label className="flex items-center gap-2">
      <input
        type="radio"
        name={`travelHistorySchengen-${index}`}
        value="no"
        checked={travelHistorySchengen[index] === "no"}
        onChange={() => {
          const next = [...travelHistorySchengen]; next[index] = "no";
          setTravelHistorySchengen(next);
        }}
        className="relative size-4 appearance-none rounded-full border border-gray-300 bg-white
                   checked:border-red-600 checked:bg-white
                   before:absolute before:inset-1 before:rounded-full
                   before:bg-red-600 before:scale-0 checked:before:scale-100
                   transition-all duration-200 ease-in-out
                   focus:outline-none focus:ring-2 focus:ring-red-600"
      />
      <span>Hayır</span>
    </label>
  </div>

  {travelHistorySchengen[index] === "yes" && (
    <>
    

      {/* Segmentler */}
      {Array.from({ length: travelSchengenSegmentCount[index] ?? 1 }).map((_, segIdx) => (
        <div key={segIdx} className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
          
          {/* Ülke */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Ülke</label>

            <Menu as="div" className="relative inline-block w-full">
              <Menu.Button
                className={[
                  "inline-flex w-full justify-between items-center rounded-lg px-4 py-3 text-base shadow-sm ring-1 ring-inset mt-1",
                  (travelSchengenCountry[index]?.[segIdx])
                    ? "bg-white text-gray-800 border border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                    : (errors.travelSchengenCountry?.[index]?.[segIdx]
                        ? "bg-red-50 text-gray-800 border border-red-500 ring-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                        : "bg-white text-gray-500 border border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500")
                ].join(" ")}
              >
                <span className={travelSchengenCountry[index]?.[segIdx] ? "text-gray-800" : "text-gray-500"}>
                  {travelSchengenCountry[index]?.[segIdx] || "— Ülke seçin —"}
                </span>
                <ChevronDownIcon className="w-5 h-5 text-gray-500" aria-hidden="true" />
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute z-10 mt-2 w-full rounded-lg bg-white text-black shadow-lg ring-1 ring-black/10 focus:outline-none">
                  <div className="py-1 max-h-64 overflow-auto">
                    {COUNTRY_OPTIONS_SCHENGEN.map((opt) => (
                      <Menu.Item key={opt}>
                        {({ active }) => (
                          <button
                            type="button"
                            onClick={() => {
                              setTravelSchengen(prev => {
                                const n = prev.map(a => [...a]);
                                while (n.length <= index) n.push([]);
                                while (n[index].length <= segIdx) n[index].push("");
                                n[index][segIdx] = opt;
                                return n;
                              });

                              if (errors.travelSchengenCountry?.[index]?.[segIdx]) {
                                setErrors(p => {
                                  const n = { ...p };
                                  n.travelSchengenCountry = n.travelSchengenCountry.map((arr: string[]) => arr ? [...arr] : []);
                                  n.travelSchengenCountry[index][segIdx] = "";
                                  return n;
                                });
                              }
                            

                            }}
                            className={`${active ? 'bg-red-100 text-red-800' : 'text-gray-900'} block w-full text-left px-4 py-2 text-base font-medium`}
                          >
                            {opt}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>

            {errors.travelSchengenCountry?.[index]?.[segIdx] && (
              <p className="mt-1 text-sm text-red-600">{errors.travelSchengenCountry[index][segIdx]}</p>
            )}
          </div>

       
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Gidiş Tarihi</label>
            <input
              type="date"
              value={travelStartForSchengen[index]?.[segIdx] || ""}
              onChange={(e) => {
                setTravelStartForSchengen(prev => {
                  const n = prev.map(a => [...a]);
                  while (n.length <= index) n.push([]);
                  while (n[index].length <= segIdx) n[index].push("");
                  n[index][segIdx] = e.target.value;
                  return n;
                });
              }}
              className={`block w-full rounded-lg px-4 py-3 text-base text-gray-800 placeholder:text-gray-400 border shadow-sm ring-1 ring-inset mt-1
                ${errors.travelStartForSchengen?.[index]?.[segIdx]
                  ? 'border-red-500 ring-red-500 bg-red-50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500'
                  : 'bg-white border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500'}`}
            />
          </div>

        
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Dönüş Tarihi</label>
            <input
              type="date"
              value={travelEndForSchengen[index]?.[segIdx] || ""}
              onChange={(e) => {
                setTravelEndForSchengen(prev => {
                  const n = prev.map(a => [...a]);
                  while (n.length <= index) n.push([]);
                  while (n[index].length <= segIdx) n[index].push("");
                  n[index][segIdx] = e.target.value;
                  return n;
                });
              }}
              className={`block w-full rounded-lg px-4 py-3 text-base text-gray-800 placeholder:text-gray-400 border shadow-sm ring-1 ring-inset mt-1
                ${errors.travelEndForSchengen?.[index]?.[segIdx]
                  ? 'border-red-500 ring-red-500 bg-red-50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500'
                  : 'bg-white border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500'}`}
            />
          </div>


    
           
    
        </div>
        
      ))}
            
            <div className="flex items-center gap-2 mt-3">
        <button
          type="button"
          onClick={() => {
            const cur = travelSchengenSegmentCount[index] ?? 1;
            const nextCountArr = ensureSegCount(travelSchengenSegmentCount, index, cur + 1);
            setTravelSchengenSegmentCount(nextCountArr);
            const segs = nextCountArr[index];

            setTravelSchengen(p => syncLen(p, index, segs, ""));
            setTravelStartForSchengen(p => syncLen(p, index, segs, ""));
            setTravelEndForSchengen(p   => syncLen(p, index, segs, ""));
          }}
          disabled={(travelSchengenSegmentCount[index] ?? 1) >= MAX_SEG}
         className="px-3 py-1 rounded bg-red-600 text-white disabled:opacity-40"
        >
          + Yeni ülke
        </button>

        <button
          type="button"
          onClick={() => {
            const cur = travelSchengenSegmentCount[index] ?? 1;
            const nextCountArr = ensureSegCount(travelSchengenSegmentCount, index, cur - 1);
            setTravelSchengenSegmentCount(nextCountArr);
            const segs = nextCountArr[index];

            setTravelSchengen(p => syncLen(p, index, segs, ""));
            setTravelStartForSchengen(p => syncLen(p, index, segs, ""));
            setTravelEndForSchengen(p   => syncLen(p, index, segs, ""));
          }}
          disabled={(travelSchengenSegmentCount[index] ?? 1) <= 1}
           className="px-3 py-1 rounded bg-gray-200 text-gray-800 disabled:opacity-40"
        >
          − Kaldır
        </button>

        <span className="text-xs text-gray-500">
    ({Math.max(1, travelSchengenSegmentCount[index] ?? 1)}/3)
  </span>
      </div>
    </>
  )}
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
  <div>
    <legend className="text-m font-semibold text-gray-600 mb-1">
      Annenizin Adı Soyadı <span className="text-red-500">*</span>
    </legend>
    <input
      type="text"
      placeholder="Anne Adı Soyadı"
      value={motherName[index] || ""}   
      onChange={(e) => {
        const next = [...motherName];
        next[index] = e.target.value;
        setMotherName(next);


      }}
      className={`block w-full rounded-lg px-4 pr-10 py-3 text-base text-gray-800 placeholder:text-gray-400 border shadow-sm ring-1 ring-inset mt-1
        ${errors.motherName?.[index]
          ? 'border-red-500 ring-red-500 bg-red-50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500'
          : 'bg-white border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500'}`}
    />
  </div>

  <div>
    <legend className="text-m font-semibold text-gray-600 mb-1">
      Annenizin Doğum Tarihi <span className="text-red-500">*</span>
    </legend>
    <input
      type="date"
      value={motherDob[index] || ""}    
      onChange={(e) => {
        const next = [...motherDob];
        next[index] = e.target.value;
        setMotherDob(next);
      }}
      className={`block w-1/2 rounded-lg px-4 pr-10 py-3 text-base text-gray-800 placeholder:text-gray-400 border shadow-sm ring-1 ring-inset mt-1
        ${errors.motherDob?.[index]
          ? 'border-red-500 ring-red-500 bg-red-50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500'
          : 'bg-white border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500'}`}
    />
  </div>
</div>


<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
  <div>
    <legend className="text-m font-semibold text-gray-600 mb-1">
      Babanızın Adı Soyadı <span className="text-red-500">*</span>
    </legend>
    <input
      type="text"
      placeholder="Baba Adı Soyadı"
      value={fatherName[index] || ""}   
      onChange={(e) => {
        const next = [...fatherName];
        next[index] = e.target.value;
        setFatherName(next);
      }}
      className={`block w-full rounded-lg px-4 pr-10 py-3 text-base text-gray-800 placeholder:text-gray-400 border shadow-sm ring-1 ring-inset mt-1
        ${errors.fatherName?.[index]
          ? 'border-red-500 ring-red-500 bg-red-50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500'
          : 'bg-white border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500'}`}
    />
  </div>

  <div>
    <legend className="text-m font-semibold text-gray-600 mb-1">
      Babanızın Doğum Tarihi <span className="text-red-500">*</span>
    </legend>
    <input
      type="date"
      value={fatherDob[index] || ""}    
      onChange={(e) => {
        const next = [...fatherDob];
        next[index] = e.target.value;
        setFatherDob(next);
      }}
      className={`block w-1/2 rounded-lg px-4 pr-10 py-3 text-base text-gray-800 placeholder:text-gray-400 border shadow-sm ring-1 ring-inset mt-1
        ${errors.fatherDob?.[index]
          ? 'border-red-500 ring-red-500 bg-red-50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500'
          : 'bg-white border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500'}`}
    />
  </div>
</div>

  </div>
)}
</div>

<div className="mt-8 rounded-xl  bg-white p-0 shadow-sm">
<div className="flex items-center gap-3 mb-6">
  <HomeIcon className="w-8 h-8 text-gray-400" />
  <h2 className="text-2xl font-bold bg-gradient-to-r from-[#E50914] to-black text-transparent bg-clip-text text-[#E50914] sm:truncate sm:text-2xl sm:tracking-tight"  style={{ backgroundSize: '500% 100%', backgroundPosition: 'left center' }}>
    İletişim Bilgileri
  </h2>
</div>

<div className="sm:col-span-1 mb-6">

<div className="sm:col-span-1 mb-6 md:w-1/2">
<CitySelectRemote
  value={city[index] ?? ""}
  onChange={(c) => {
    setCity(prev => { const n = [...prev]; n[index] = c; return n; });
    if (errors.city?.[index]) {
      setErrors(p => { const arr = [...(p.city || [])]; arr[index] = ""; return { ...p, city: arr }; });
      
    }
  }}
  error={errors.city?.[index]}
  required
/>
</div>

  <label htmlFor={`address-${index}`} className="block text-m font-semibold text-gray-600">
    Ev Adresi <span className="text-red-500">*</span>
  </label>

  <div className="mt-2">
  <textarea
  id={`address-${index}`}
  name={`address-${index}`}
  placeholder="Adresinizi girin"
  rows={4}
  value={address[index] ?? ''}
  onChange={(e) => {
    const v = e.target.value;
    setAddress(prev => {
      const n = [...prev];
      n[index] = v;
      return n;
    });
    if (errors.address?.[index]) {
      setErrors(p => {
        const arr = [...(p.address || [])];
        arr[index] = '';
        return { ...p, address: arr };
      });
    }
  }}
  aria-invalid={!!errors.address?.[index]}
  className={`block w-full rounded-lg px-4 py-3 text-base text-gray-800 placeholder:text-gray-400 border shadow-sm ring-1 ring-inset
    ${errors.address?.[index]
      ? 'border-red-500 ring-red-500 bg-red-50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-0'
      : 'bg-white border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-300 focus:ring-offset-0'
    }`}
/>
{errors.address?.[index] && (
  <p className="mt-1 text-sm text-red-600">{errors.address[index]}</p>
)}
  </div>


  {(selectedCountry === 'İngiltere' || selectedCountry === 'Amerika') &&  (


  <><div className="mt-6">
                    <legend className="text-m font-semibold text-gray-600 mb-2">
                      Oturduğunuz Ev <span className="text-red-500">*</span>
                    </legend>

                    <div className="flex items-center gap-6">
               
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`home-${index}`} 
                          value="kira"
                          checked={homeStatus[index] === 'kira'}
                          onChange={() => setHomeStatus(prev => {
                            const next = [...prev];
                            next[index] = 'kira';
                            return next;
                          })}
                          className={`relative size-4 appearance-none rounded-full border border-gray-300 bg-white
          
          checked:border-red-600 checked:bg-white
          before:absolute before:inset-1 before:rounded-full
          before:bg-red-600 before:scale-0 checked:before:scale-100
          transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-red-600`} />
                        <span className="text-gray-700">Kira</span>
                      </label>

               
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`home-${index}`}
                          value="mulk"
                          checked={homeStatus[index] === 'mulk'}
                          onChange={() => setHomeStatus(prev => {
                            const next = [...prev];
                            next[index] = 'mulk';
                            return next;
                          })}
                          className={`relative size-4 appearance-none rounded-full border border-gray-300 bg-white
          
          checked:border-red-600 checked:bg-white
          before:absolute before:inset-1 before:rounded-full
          before:bg-red-600 before:scale-0 checked:before:scale-100
          transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-red-600`} />
                        <span className="text-gray-700">Mülk Sahibi</span>
                      </label>
                    </div>

                    {errors.homeStatus?.[index] && (
                      <p className="mt-1 text-sm text-red-600">{errors.homeStatus[index]}</p>
                    )}
                  </div><div className="mt-6">
                      <legend className="text-m font-semibold text-gray-600 mb-1">
                        Oturduğunuz evde ne zamandan beri ikamet ediyorsunuz? <span className="text-red-500">*</span>
                      </legend>

                      <div className="relative w-full max-w-[240px]">
                        <input
                          type="date"
                          value={homeSince[index] || ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            setHomeSince(prev => {
                              const next = [...prev];
                              next[index] = v;
                              return next;
                            });


                            if (errors.homeSince?.[index]) {
                              setErrors(prev => {
                                const n = { ...prev };
                                n.homeSince = [...(n.homeSince || [])];
                                n.homeSince[index] = '';
                                return n;
                              });
                            }
                          } }
                          max={new Date().toISOString().slice(0, 10)}
                          className={`block w-full rounded-lg px-4 py-3 text-base text-gray-800 placeholder:text-gray-400 border shadow-sm ring-1 ring-inset
        ${errors.homeSince?.[index]
                              ? 'border-red-500 ring-red-500 bg-red-50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500'
                              : 'bg-white border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500'}`} />
                      </div>

                      {errors.homeSince?.[index] && (
                        <p className="mt-1 text-sm text-red-600">{errors.homeSince[index]}</p>
                      )}


                      {homeSince[index] && (() => {
                        const selected = new Date(homeSince[index]);
                        const today = new Date();
                        const diffInMonths = (today.getFullYear() - selected.getFullYear()) * 12 +
                          (today.getMonth() - selected.getMonth());
                        return diffInMonths < 12;
                      })() && (
                          <div className="mt-4">
                            <label className="block mb-2 text-sm font-medium text-gray-700">
                              Son İkamet Adresiniz <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id={`previous-address-${index}`}
                              value={previousAddress[index] || ''}
                              onChange={(e) => {
                                const next = [...previousAddress];
                                next[index] = e.target.value;
                                setPreviousAddress(next);
                              } }
                              className={`block w-full rounded-lg px-4 py-3 text-base text-gray-800 placeholder:text-gray-400 border shadow-sm ring-1 ring-inset
          ${errors.previousAddress?.[index]
                                  ? 'border-red-500 ring-red-500 bg-red-50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-0'
                                  : 'bg-white border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-300 focus:ring-offset-0'}`}
                              placeholder="Son ikamet adresinizi girin" />
                            {errors.previousAddress?.[index] && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors.previousAddress[index]}
                              </p>
                            )}
                             {homeSince[index] && new Date(homeSince[index]) > new Date(new Date().setFullYear(new Date().getFullYear() - 1)) && (
    <p className="mt-1 text-sm text-gray-600 italic">
      Mevcut ikamet adresiniz bir yıldan az olduğu için buraya son ikamet adresinizi girmeniz zorunludur.*
    </p>
  )}
                          </div>
                        )}
                    </div><div className="mt-6">
                      <legend className="text-m font-semibold text-gray-600 mb-1">
                        Son 5 yıl içinde Schengen, Amerika, Kanada veya İngiltere vize reddi aldınız mı?
                        <span className="text-red-500"> *</span>
                      </legend>


                      <div className="mt-2 flex items-center gap-4">
                        {['Evet', 'Hayır'].map(opt => (
                          <label key={opt} className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`visa-refusal-${index}`}
                              value={opt}
                              checked={visaRefusal[index] === opt}
                              onChange={(e) => {
                                const v = e.target.value;

                                setVisaRefusal(prev => {
                                  const next = [...prev];
                                  next[index] = v;
                                  return next;
                                });

                                if (errors.visaRefusal?.[index]) {
                                  setErrors(prev => {
                                    const n = { ...prev };
                                    n.visaRefusal = [...(n.visaRefusal || [])];
                                    n.visaRefusal[index] = '';
                                    return n;
                                  });
                                }

                                if (v === 'Hayır') {
                                  setVisaRefusalCountry(prev => { const n = [...prev]; n[index] = ''; return n; });
                                  setVisaRefusalDate(prev => { const n = [...prev]; n[index] = ''; return n; });
                                  setErrors(prev => {
                                    const n = { ...prev };
                                    n.visaRefusalCountry = [...(n.visaRefusalCountry || [])];
                                    n.visaRefusalDate = [...(n.visaRefusalDate || [])];
                                    n.visaRefusalCountry[index] = '';
                                    n.visaRefusalDate[index] = '';
                                    return n;
                                  });
                                }
                              } }
                              className={`relative size-4 appearance-none rounded-full border border-gray-300 bg-white
          
                                checked:border-red-600 checked:bg-white
                                before:absolute before:inset-1 before:rounded-full
                                before:bg-red-600 before:scale-0 checked:before:scale-100
                                transition-all duration-200 ease-in-out
                                focus:outline-none focus:ring-2 focus:ring-red-600`} />
                            <span className="text-sm text-gray-800">{opt}</span>
                          </label>
                        ))}
                      </div>

                      {errors.visaRefusal?.[index] && (
                        <p className="mt-1 text-sm text-red-600">{errors.visaRefusal[index]}</p>
                      )}


                      {visaRefusal[index] === 'Evet' && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
  <legend className="text-m font-semibold text-gray-600 mb-1">
    Hangi Ülke <span className="text-red-500">*</span>
  </legend>

  <Menu as="div" className="relative inline-block w-full">
    <Menu.Button
      className={[
        "inline-flex w-full justify-between items-center rounded-lg px-4 py-3 text-base shadow-sm ring-1 ring-inset mt-1",
        visaRefusalCountry[index]
          ? "bg-white text-gray-800 border border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
          : (errors.visaRefusalCountry?.[index]
              ? "bg-red-50 text-gray-800 border border-red-500 ring-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              : "bg-white text-gray-500 border border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500")
      ].join(" ")}
    >
      <span className={visaRefusalCountry[index] ? "text-gray-800" : "text-gray-500"}>
        {visaRefusalCountry[index] || "— Ülke seçin —"}
      </span>
      <ChevronDownIcon className="w-5 h-5 text-gray-500" aria-hidden="true" />
    </Menu.Button>

    <Transition
      as={Fragment}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      <Menu.Items className="absolute z-10 mt-2 w-full rounded-lg bg-white text-black shadow-lg ring-1 ring-black/10 focus:outline-none">
        <div className="py-1 max-h-64 overflow-auto">
          {COUNTRY_OPTIONS.map((opt) => (
            <Menu.Item key={opt}>
              {({ active }) => (
                <button
                  type="button"
                  onClick={() => {
                    const next = [...visaRefusalCountry];
                    next[index] = opt;
                    setVisaRefusalCountry(next);

                    if (errors.visaRefusalCountry?.[index]) {
                      setErrors((p) => {
                        const n = { ...p };
                        n.visaRefusalCountry = [...(p.visaRefusalCountry || [])];
                        n.visaRefusalCountry[index] = "";
                        return n;
                      });
                    }
                  }}
                  className={`${
                    active ? 'bg-red-100 text-red-800' : 'text-gray-900'
                  } block w-full text-left px-4 py-2 text-base font-medium`}
                >
                  {opt}
                </button>
              )}
            </Menu.Item>
          ))}
        </div>
      </Menu.Items>
    </Transition>
  </Menu>

  {errors.visaRefusalCountry?.[index] && (
    <p className="mt-1 text-sm text-red-600">{errors.visaRefusalCountry[index]}</p>
  )}
</div>

                          <div>
                            <legend className="text-m font-semibold text-gray-600 mb-1">
                              Ret Tarihi <span className="text-red-500">*</span>
                            </legend>
                            <input
                              type="date"
                              value={visaRefusalDate[index] || ''}
                              onChange={(e) => {
                                const v = e.target.value;
                                setVisaRefusalDate(prev => { const n = [...prev]; n[index] = v; return n; });
                                if (errors.visaRefusalDate?.[index]) {
                                  setErrors(prev => {
                                    const n = { ...prev };
                                    n.visaRefusalDate = [...(n.visaRefusalDate || [])];
                                    n.visaRefusalDate[index] = '';
                                    return n;
                                  });
                                }
                              } }
                              max={new Date().toISOString().slice(0, 10)} // gelecek tarih olmasın
                              className={`block w-full rounded-lg px-4 py-3 text-base text-gray-800 placeholder:text-gray-400 border shadow-sm ring-1 ring-inset
            ${errors.visaRefusalDate?.[index]
                                  ? 'border-red-500 ring-red-500 bg-red-50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500'
                                  : 'bg-white border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500'}`} />
                            {errors.visaRefusalDate?.[index] && (
                              <p className="mt-1 text-sm text-red-600">{errors.visaRefusalDate[index]}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div></>
)}

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">


    <div className="relative sm:col-span-1">
      <label htmlFor={`email-${index}`} className="block text-m font-semibold text-gray-600 mb-1">
        E-posta <span className="text-red-500">*</span>
      </label>
      <div className="mt-2 relative">
      <input
  id={`email-${index}`}
  name={`email-${index}`}
  type="email"
  value={email[index] ?? ''}
  onChange={(e) => {
    const v = e.target.value;
    setEmail(prev => {
      const n = [...prev];
      n[index] = v;
      return n;
    });
    if (errors.email?.[index]) {
      setErrors(p => {
        const arr = [...(p.email || [])];
        arr[index] = '';
        return { ...p, email: arr };
      });
    }
  }}
  placeholder="ornek@eposta.com"
  aria-invalid={!!errors.email?.[index]}
  className={`block w-full rounded-lg px-4 py-3 text-base text-gray-800 placeholder:text-gray-400 border shadow-sm ring-1 ring-inset
    ${errors.email?.[index]
      ? 'border-red-500 ring-red-500 bg-red-50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-0'
      : 'bg-white border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-300 focus:ring-offset-0'
    }`}
/>
{errors.email?.[index] && (
  <p className="mt-1 text-sm text-red-600">{errors.email[index]}</p>
)}
      </div>
    </div>

    
    <div className="sm:col-span-1">
      <label htmlFor={`phone-${index}`} className="block text-m font-semibold text-gray-600">
        Telefon <span className="text-red-500">*</span>
      </label>
      <div className="mt-2">
     <Cleave
  id={`phone-${index}`}
  options={{ phone: true, phoneRegionCode: 'TR' }}
  value={phone[index] ?? ''}
  onChange={(e: any) => {
    let v = (e.target as HTMLInputElement).value;

 
    if (v === '0') {
      v = '0 ';
    }

   
    if (v.length === 1 && v === '5') {
      v = '05';
    }

   
    if (!v.startsWith('0')) {
      v = '0' + v;
    }

    setPhone(prev => {
      const n = [...prev];
      n[index] = v;
      return n;
    });

    if (errors.phone?.[index]) {
      setErrors(p => {
        const arr = [...(p.phone || [])];
        arr[index] = '';
        return { ...p, phone: arr };
      });
    }
  }}
  placeholder="05xx xxx xx xx"
  aria-invalid={!!errors.phone?.[index]}
  inputMode="tel"
  className={`block w-full rounded-lg px-4 py-3 text-base text-gray-800 placeholder:text-gray-400 border shadow-sm ring-1 ring-inset
    ${errors.phone?.[index]
      ? 'border-red-500 ring-red-500 bg-red-50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-0'
      : 'bg-white border-gray-300 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-300 focus:ring-offset-0'
    }`}
/>


{errors.phone?.[index] && (
  <p className="mt-1 text-sm text-red-600">{errors.phone[index]}</p>
)}
      </div>
    </div>

  </div>

</div>
<div className="mt-10 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

<div className="flex items-center gap-3 mb-6">
  <DocumentDuplicateIcon className="w-8 h-8 text-gray-400" />
  <h2
    className="text-2xl font-bold bg-gradient-to-r from-[#E50914] to-black text-transparent bg-clip-text sm:truncate sm:text-2xl sm:tracking-tight"
    style={{ backgroundSize: '300% 100%', backgroundPosition: 'left center' }}
  >
    Belgeler
  </h2>
</div>
 
  {selectedVisaType === 'Turistik' && (
  <div className="mb-6">
    <label className="block text-m font-semibold text-gray-900 mb-2">
      Daha önce Schengen vizesi aldınız mı?
    </label>

    <label
      htmlFor={`hasSchengen-${index}`}
      className="inline-flex items-center gap-2 text-sm text-gray-700"
    >
      <div className="group grid size-5 grid-cols-1">
        <input
          type="checkbox"
          id={`hasSchengen-${index}`}
          checked={!!hasSchengen[index]}
          onChange={(e) => toggleHasSchengen(index, e.target.checked)}
          className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white
          checked:border-red-600 checked:bg-red-600
          focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <svg
          fill="none"
          viewBox="0 0 14 14"
          className="pointer-events-none col-start-1 row-start-1 size-4 self-center justify-self-center stroke-white transition-opacity"
        >
          <path
            d="M3 8L6 11L11 3.5"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`${hasSchengen[index] ? 'opacity-100' : 'opacity-0'}`}
          />
        </svg>
      </div>
      Evet, daha önce Schengen vizesi aldım
    </label>
  </div>
)}

{['Eğitim', 'Ticari'].includes(selectedVisaType) && (
  <div className="mb-6">
    <label className="block text-m font-semibold text-gray-900 mb-2">
      Davet mektubunuz var mı?
    </label>

    <label
      htmlFor={`hasInvitation-${index}`}
      className="inline-flex items-center gap-2 text-sm text-gray-700"
    >
      <div className="group grid size-5 grid-cols-1">
        <input
          type="checkbox"
          id={`hasInvitation-${index}`}
          checked={!!hasInvitation[index]}
          onChange={(e) => toggleHasInvitation(index, e.target.checked)}
          className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white
          checked:border-red-600 checked:bg-red-600
          focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <svg
          fill="none"
          viewBox="0 0 14 14"
          className="pointer-events-none col-start-1 row-start-1 size-4 self-center justify-self-center stroke-white transition-opacity"
        >
          <path
            d="M3 8L6 11L11 3.5"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`${hasInvitation[index] ? 'opacity-100' : 'opacity-0'}`}
          />
        </svg>
      </div>
      Davet mektubum var
    </label>
  </div>
)}




  <div className="mb-6 flex flex-col md:flex-row gap-4">

  <div className="w-full">
    <label className="block text-sm font-semibold text-gray-900 mb-2">
      Pasaport Görseli <span className="text-red-500">*</span>
    </label>

    <div className="relative">
    <label
    htmlFor={`passport-${index}`}
    className={`rounded-lg p-6 text-center cursor-pointer transition block border-2 border-dashed
      ${passportLoading[index] ? 'pointer-events-none opacity-60' : 'border-blue-400 hover:bg-blue-50'}`}
  >
    <svg className="mx-auto mb-2 h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v9m0 0l-3-3m3 3l3-3M12 3v9" />
    </svg>
    <p className="text-sm text-gray-600">Dosya seçmek için tıklayın</p>
    <p className="text-xs text-gray-400 mt-1">JPG, PNG veya PDF • 10MB'a kadar</p>
    <input
      type="file"
      id={`passport-${index}`}
      name={`passport-${index}`}
      className="hidden"
      accept=".jpg,.jpeg,.png,.pdf"
      onChange={handleFileUpload(index)}
      disabled={passportLoading[index]}
    />
  </label>

      {passportLoading[index] && (
        <div className="absolute inset-0 rounded-lg bg-white/60 backdrop-blur-[2px] grid place-items-center">
          <Loader size="sm" color="red" />
        </div>
      )}
    </div>

    {passportFileName[index] && !passportLoading[index] && (
  <div className="flex items-center justify-between mt-2 bg-gray-50 border rounded px-3 py-2">
    <p className="text-sm text-gray-700 truncate">
      Yüklenen Dosya: {passportFileName[index]}
    </p>
   
  </div>
)}

{errors.passport?.[index] && (
  <p className="mt-2 text-sm text-red-600">{errors.passport[index]}</p>
)}
  </div>

 {selectedCountry === 'İspanya' && (
    <div className="w-full">
      <label className="block text-sm font-semibold text-gray-900 mb-2">
        Son 6 Aylık Biyometrik Fotoğraf <span className="text-red-500">*</span>
      </label>

      <div className="relative">
        <label
          htmlFor={`biometric-${index}`}
          className={`rounded-lg p-6 text-center cursor-pointer transition block border-2 border-dashed
            ${biometricLoading[index] ? 'pointer-events-none opacity-60' : 'border-blue-400 hover:bg-blue-50'}`}
        >
          <svg className="mx-auto mb-2 h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v9m0 0l-3-3m3 3l3-3M12 3v9" />
          </svg>
          <p className="text-sm text-gray-600">Biyometrik fotoğraf seçmek için tıklayın</p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG • 10MB'a kadar</p>
          <input
            type="file"
            id={`biometric-${index}`}
            name={`biometric-${index}`}
            className="hidden"
            accept=".jpg,.jpeg,.png"
            onChange={handleBiometricUpload(index)}
            disabled={biometricLoading[index]}
          />
        </label>

        {biometricLoading[index] && (
          <div className="absolute inset-0 rounded-lg bg-white/60 backdrop-blur-[2px] grid place-items-center">
            <Loader size="sm" color="red" />
          </div>
        )}
      </div>

      {biometricFileName[index] && !biometricLoading[index] && (
        <div className="flex items-center justify-between mt-2 bg-gray-50 border rounded px-3 py-2">
          <p className="text-sm text-gray-700 truncate">
            Yüklenen Dosya: {biometricFileName[index]}
          </p>
        </div>
      )}

      {errors.biometricPhoto?.[index] && (
        <p className="mt-2 text-sm text-red-600">{errors.biometricPhoto[index]}</p>
      )}
    </div>
  )}
</div>
<Transition
   show={!!hasSchengen?.[index]}
  enter="transition-all duration-600 ease-out"
  enterFrom="opacity-0 -translate-y-2 scale-y-95"
  enterTo="opacity-100 translate-y-0 scale-y-100"
  leave="transition-all duration-600 ease-in"
  leaveFrom="opacity-100 translate-y-0 scale-y-100"
  leaveTo="opacity-0 -translate-y-2 scale-y-95"
>
    
 <div className="mb-6">
 <label htmlFor={`schengen-${index}`} className="block text-sm font-semibold text-gray-900 mb-2">
   Son Schengen Vizesi <span className="text-red-500">*</span>
 </label>

 <div className="relative">
   <label
     htmlFor={`schengen-${index}`}
     className={`border-2 border-dashed border-red-400 rounded-lg p-6 text-center cursor-pointer transition block
       ${schengenLoading[index] ? 'pointer-events-none opacity-60' : 'hover:bg-red-50'}
        ${hasFiles ? 'border-gray-300' : 'border-red-400'}
       `}
   >
  {hasFiles ? (
 
    <svg
      className="mx-auto mb-2 h-6 w-6 text-red-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  ) : (
    
    <svg
      className="mx-auto mb-2 h-6 w-6 text-red-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v9m0 0l-3-3m3 3l3-3M12 3v9"
      />
    </svg>
  )}
     
   
  <p className="text-sm font-medium">
    {hasFiles ? 'Yeni dosya ekle' : 'Dosya(lar) seçmek için tıklayın'}
  </p>


  <p className="text-xs text-gray-500 mt-1">
    JPG, PNG veya PDF {hasFiles && `• Yüklü: ${total}`}
  </p>


  {hasFiles && (
    <p className="text-xs text-gray-400 mt-1">
      Daha fazla dosya eklemek için bu kutuya tekrar tıklayın.
    </p>
  )}
     <input
       type="file"
       id={`schengen-${index}`}
       multiple
       className="hidden"
       accept=".jpg,.jpeg,.png,.pdf"
       onChange={(e) => handleSchengenUpload(index, e)}
       disabled={schengenLoading[index]}
     />
   </label>
{errors.schengen?.[index] && (
  <p className="mt-2 text-sm text-red-600">{errors.schengen[index]}</p>
)}
   {schengenLoading[index] && (
     <div className="absolute inset-0 rounded-lg bg-white/60 backdrop-blur-[2px] grid place-items-center">
       <Loader size="sm" color="red" />
     </div>
   )}
 </div>

 {schengenImages[index]?.length > 0 && (
  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
    {schengenImages[index].map((img, i) => (
      <div key={i} className="relative border border-gray-300 rounded p-2 bg-white shadow-sm">
        <p className="text-xs text-gray-600 mb-1 pr-8 truncate">
          {schengenFileNames[index]?.[i]}
        </p>

     
        {img.endsWith('.pdf') ? (
          <iframe src={img} className="rounded w-full h-48" />
        ) : (
          <img src={img} alt={`Schengen ${i}`} className="rounded w-full max-h-48 object-contain" />
        )}

     
        <button
          type="button"
          onClick={() => handleDeleteSchengen(index, i)}
          className="absolute top-2 right-2 inline-flex items-center justify-center
          w-7 h-7 rounded-md border border-red-600 bg-red-600 text-white 
          hover:bg-red-700 text-xs"
          disabled={schengenLoading[index]}
          aria-label="Dosyayı sil"
        >
          Sil
        </button>
      </div>
    ))}
  </div>
)}
</div>

</Transition>

<Transition
  show={['Eğitim','Ticari'].includes(selectedVisaType) && !!hasInvitation[index]}
  enter="transition-all duration-600 ease-out"
  enterFrom="opacity-0 -translate-y-2 scale-y-95"
  enterTo="opacity-100 translate-y-0 scale-y-100"
  leave="transition-all duration-600 ease-in"
  leaveFrom="opacity-100 translate-y-0 scale-y-100"
  leaveTo="opacity-0 -translate-y-2 scale-y-95"
>

  <div className="mb-6">
  <label htmlFor={`invitation-${index}`} className="block text-sm font-semibold text-gray-900 mb-2">
    Davet Mektubu <span className="text-red-500">*</span>
  </label>

  <label
    htmlFor={`invitation-${index}`}
    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition block
      ${hasInvitationFiles ? 'border-red-300 hover:bg-red-50' : 'border-red-400 hover:bg-red-50'}
    `}
  >
    {hasInvitationFiles ? (
    
      <svg
        className="mx-auto mb-2 h-6 w-6 text-red-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        
      </svg>
    ) : (
     
      <svg
        className="mx-auto mb-2 h-6 w-6 text-red-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v9m0 0l-3-3m3 3l3-3M12 3v9"
       />
      </svg>
    )}

    <p className="text-sm text-gray-600">
      {hasInvitationFiles ? 'Yeni dosya ekle' : 'Dosya(lar) seçmek için tıklayın'}
    </p>
    <p className="text-xs text-gray-400 mt-1">
      JPG, PNG veya PDF {hasInvitationFiles && `• Yüklü: ${(invitationFiles[index]?.length ?? 0)}`}
    </p>
    {hasInvitationFiles && (
    <p className="text-xs text-gray-400 mt-1">
      Daha fazla dosya eklemek için bu kutuya tekrar tıklayın.
    </p>
  )}
    <input
      type="file"
      id={`invitation-${index}`}
      multiple
      className="hidden"
      accept=".jpg,.jpeg,.png,.pdf"
      onChange={(e) => handleInvitationUpload(index, e)}
    />
  </label>

  {hasInvitationFiles && (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {invitationFiles[index].map((img, i) => (
        <div
          key={i}
          className="relative border border-green-300 rounded p-2 bg-white shadow-sm"
        >
          <p className="text-xs text-gray-600 mb-1">{invitationFileNames[index][i]}</p>
          <iframe src={img} className="rounded w-full" />
          
          <button
          type="button"
          onClick={() => handleDeleteInvitation(index, i)}
          className="absolute top-0 right-2 inline-flex items-center justify-center
                     w-7 h-7 rounded-md border border-red-600 bg-red-600 text-white
                     hover:bg-red-700 text-xs"
        >
          Sil
        </button>
      
        </div>
      ))}
      
    </div>
  )}
  
</div>

</Transition>

<Text size="sm" fw={800} c="black" mt="sm" mb="xs">
  Müşteri Notu 
</Text>

    
    <div className="flex items-center gap-2">
      {saving ? (
        <Text size="xs" c="dimmed">Kaydediliyor…</Text>
      ) : lastSavedAt ? (
        <Text size="xs" c="dimmed">Kaydedildi: {lastSavedAt}</Text>
      ) : null}
    </div>

    <div className="relative">

  <Textarea
      placeholder="Bu başvuruya özel notunuzu yazın…"
      autosize
      minRows={5}
      value={note}
      onChange={(e) => setNote(e.currentTarget.value.slice(0, maxChars))} 
      onFocus={() => setHighlighted(false)}  
      onBlur={() => {
        if (note.trim()) setHighlighted(true); 
      }}
     
      styles={{
        input: {
          fontSize: 14,
         
          fontFamily:'sans-serif',
          backgroundColor: highlighted ? "#d1fae5" : "white",
          transition: "background-color 0.3s ease",
        },
      }}
   ></Textarea>
<Text
        size="xs"
        c={note.length >= maxChars ? "red" : "dimmed"}
        className="absolute bottom-2 right-3"
      >
        {maxChars - note.length}
      </Text>
      </div>
</div>
</div>


      
      </div>
      
      ))}
        <form onSubmit={handleSubmit}>
        <div className="mt-4 text-center">
        <button
  type="submit"
  disabled={loading}
  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#E50914] px-6 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-[#c40811] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed"
>
  {loading ? (
    <Loader size="sm" color="white" /> 
  ) : (
    <>
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={4}
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Başvuruyu Gönder
    </>
  )}
</button>
</div>
</form>
    </div>

    </div>
  );
}