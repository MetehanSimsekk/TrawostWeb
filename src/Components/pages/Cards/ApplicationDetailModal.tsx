import { notifications } from "@mantine/notifications";
import { supabase } from "../../../services/supabase";
import { Alert, Badge, Card, Divider, Group, Modal, SimpleGrid, Text, Title } from '@mantine/core';
import { IconMapPin, IconMail, IconPhone, IconUser, IconCheck, IconEye, IconClock, IconUsers, IconDownload } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

export default function ApplicationDetailModal(props: { app: any; title: string; isFamily?: boolean, personIndex:any, }) {
  const MAX_FILES_PER_PERSON = 10;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
  const MAX_SIZE_MB = 10;
  
const [hovered, setHovered] = useState(false);
const [hovered2, setHovered2] = useState(false);

const [showPasaportModal, setShowPasaportModal] = useState(false);
const [showSchengenModal, setShowSchengenModal] = useState(false);
const [passportUrl, setPassportUrl] = useState<string | null>(null);
const [schengenUrl, setSchengenUrl] = useState<string[]>([]);
const [schengenIndex, setSchengenIndex] = useState(0);
const [hoveredInvitation, setHoveredInvitation] = useState(false);
const [showInvitationModal, setShowInvitationModal] = useState(false);
const [invitationUrls, setInvitationUrls] = useState<string[]>([]);
const [rotation, setRotation] = useState(0);
const [kisiSayisi, setKisiSayisi] = useState<number>(0);
const [schengenImages, setSchengenImages] = useState<string[][]>([]);

const [schengenLoading, setSchengenLoading] = useState<boolean[]>([]);
const [schengenFileNames, setSchengenFileNames] = useState<string[][]>([]);
const [uploadingSchengen, setUploadingSchengen] = useState(false);
const [uploadingPasaport, setUploadingPasaport] = useState(false);
const [selectedForDelete, setSelectedForDelete] = useState<number | null>(null);

const [passportImage, setPassportImage] = useState<string[]>([]);

const [passportLoading, setPassportLoading] = useState<boolean[]>([]);
const [schengenPaths, setSchengenPaths] = useState<string[][]>([]); 

const [passportFileName, setPassportFileName] = useState<string[]>([]);


const [hoveredBio, setHoveredBio] = useState(false);
const [showBiometricModal, setShowBiometricModal] = useState(false);
const [biometricUrl, setBiometricUrl]= useState<string | null>(null);
const [uploadingBiometric, setUploadingBiometric] = useState(false);
const [biometricLoading, setBiometricLoading] = useState<boolean[]>([]);

const [biometricFileName,setBiometricFileName]= useState<string[]>([]);
type UploadResult = { url: string; name: string; path: string };







const isStringNonEmpty = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;


const toArray = (v: unknown): string[] => {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean) as string[];
  if (typeof v === 'string') {
    try { const p = JSON.parse(v); return toArray(p); } catch { return [v]; }
  }
  return [];
};

const inviteUrls = toArray(props.app.invitation_letter_url);
const inviteNames = toArray((props.app as any).invitation_letter_names); 



useEffect(() => {
  const fetchKisiSayisi = async () => {
    const { data, error } = await supabase
      .from("applications")
      .select("id")
      .eq("basvuru_grup_kodu", props.app.basvuru_grup_kodu);

    if (!error) {
      setKisiSayisi(data?.length || 0);
    }
  };

  fetchKisiSayisi();
}, [props.app.basvuru_grup_kodu]);


function ensureIndex<T>(arr: T[], idx: number, factory: () => T) {
  const copy = [...arr];
  while (copy.length <= idx) copy.push(factory());
  return copy;
}

async function uploadOneToSchengen(file: File): Promise<UploadResult> {
  // doğrulama
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Sadece JPG, PNG veya PDF yükleyebilirsiniz.');
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`Dosya ${MAX_SIZE_MB}MB sınırını aşıyor.`);
  }

  const ext = file.name.split('.').pop() || 'bin';
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const filePath = `schengen/${fileName}`;

  const { error: upErr } = await supabase.storage
    .from('schengen')
    .upload(filePath, file);
  if (upErr) throw upErr;

  const { data: pub } = supabase.storage.from('schengen').getPublicUrl(filePath);
  const url = pub?.publicUrl;
  if (!url) throw new Error('Public URL alınamadı');

  return { url, name: file.name, path: filePath };
}


function parsePrevSchengen(val: unknown): string[][] {
 
  if (!val) return [];






  if (Array.isArray(val)) {
    if (val.length === 0) return [];
    if (Array.isArray(val[0])) return val as string[][];
    return [val as string[]]; 

    
  }
  if (typeof val === 'string') {
    const s = val.trim();
    if (!s) return [];
  
    if (s.startsWith('[')) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) {



          if (Array.isArray(parsed[0])) return parsed as string[][];
          return [parsed as string[]];
        }
      } catch {
       
        return [[s]];
      }
    }
  






    return [[s]];
  }
  return [];
}



const handleDeleteSchengenFile = async (index: number) => {
  try {
    const updatedUrls = schengenUrl.filter((_, i) => i !== index);
    setSchengenUrl(updatedUrls);

 
    await supabase
      .from("applications")
      .update({ previous_schengen_url: JSON.stringify(updatedUrls) })
      .eq("id", props.app.id);

    setSelectedForDelete(null);
    setSchengenIndex(0);
    notifications.show({
      title: "Bilgi",
      message:(
        <span>
        <strong className="font-bold">{props.title + ' '}</strong>
        {props.app.full_name} - {props.app.surname }
       
          <span className="ml-2 text-red-600 text-sm font-medium">
            — Görsel Silindi
          </span>
        
      </span>
  )
      ,
      color: "red",
      autoClose: 3000,
    });
  } catch (err) {
    console.error("Silme hatası:", err);
    alert("❌ Dosya silinemedi");
  }
};


const handleSchengenUpload = (idx: number, e: React.ChangeEvent<HTMLInputElement>, mode: 'append' | 'replace' = 'append') => {
  (async () => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

  
    setSchengenLoading(prev => {
      const next = ensureIndex(prev, idx, () => false);
      next[idx] = true;
      return next;
    });

    try {
  
      const currentCount = (schengenImages[idx]?.length ?? 0);
      if (currentCount + files.length > MAX_FILES_PER_PERSON) {
        throw new Error(`En fazla ${MAX_FILES_PER_PERSON} dosya yükleyebilirsiniz.`);
      }
    
    
      const results = await Promise.all(Array.from(files).map(uploadOneToSchengen));
      const newUrls  = results.map(r => r.url);
      const newNames = results.map(r => r.name);
      const newPaths = results.map(r => r.path);
    
     
      setSchengenImages(prev => {
        let next = ensureIndex(prev, idx, () => []);
        next[idx] = (mode === 'replace') ? newUrls : [...(next[idx] || []), ...newUrls];
        return [...next];
      });
    
      setSchengenFileNames(prev => {
        let next = ensureIndex(prev, idx, () => []);
        next[idx] = (mode === 'replace') ? newNames : [...(next[idx] || []), ...newNames];
        return [...next];
      });
    
      setSchengenPaths(prev => {
        let next = ensureIndex(prev, idx, () => []);
        next[idx] = (mode === 'replace') ? newPaths : [...(next[idx] || []), ...newPaths];
        return [...next];
      });
      setSchengenUrl(prev => {
        const next = [...prev, ...newUrls];
        return next;
      });
     
      const { data: existing, error: fetchError } = await supabase
        .from("applications")
        .select("previous_schengen_url")
        .eq("id", props.app.id)
        .single();
    
      if (fetchError) {
    
        console.warn("read previous_schengen_url error:", fetchError.message);
      }
    
      let parsed = parsePrevSchengen(existing?.previous_schengen_url);
   
      while (parsed.length <= idx) parsed.push([]);
 
      parsed[idx] = (mode === 'replace') ? newUrls : [...(parsed[idx] || []), ...newUrls];
    
      const { error: updateErr } = await supabase
        .from("applications")
        .update({ previous_schengen_url: JSON.stringify(parsed) })
        .eq("id", props.app.id);
    
      if (updateErr) throw updateErr;
     notifications.show({
        title: "Bilgi",
        message:(
          <span>
          <strong className="font-bold">{props.title + ' '}</strong>
          {props.app.full_name} - {props.app.surname }
          {props.app.passport_file_url ? (
            <span className="ml-2 text-green-600 text-sm font-medium">
              — Görsel yüklendi
            </span>
          ) : (
            <span className="ml-2 text-red-500 text-sm font-medium">
              — Görsel yok
            </span>
          )}
        </span>
    )
        ,
        color: "red",
        autoClose: 3000,
      });
    
    
    } catch (err: any) {
      console.error(err);
      alert('❌ Schengen dosyası yüklenemedi: ' + (err?.message || 'Bilinmeyen hata'));
    } finally {
      setSchengenLoading(prev => {
        const next = ensureIndex(prev, idx, () => false);
        next[idx] = false;
        return next;
      });
      e.target.value = '';
    }
  })();
};


const handlePassportUpload = (i: number, e: React.ChangeEvent<HTMLInputElement>) => async () => {
  const file = e.target.files?.[0];
  if (!file) return;

  setPassportLoading(prev => { 
    const next = ensureIndex(prev, i, () => false);
    next[i] = true; 
    return next; 
  });

  try {
    const ext = file.name.split('.').pop() || 'dat';
    const fileName = `${Date.now()}.${ext}`;
    const filePath = `passports/${fileName}`;

    // 1) Upload
    const { error: upErr } = await supabase.storage.from('passports').upload(filePath, file);
    if (upErr) throw upErr;

    // 2) Public URL
    const { data: pub } = supabase.storage.from('passports').getPublicUrl(filePath);
    const url = pub?.publicUrl;
    if (!url) throw new Error('Public URL alınamadı');

    // 3) Local state
    setPassportFileName(prev => { 
      const n = ensureIndex(prev, i, () => ''); 
      n[i] = file.name; 
      return [...n]; 
    });

    setPassportImage(prev => { 
      const n = Array.isArray(prev) ? [...prev] : []; 
      while (n.length <= i) n.push('');
      n[i] = url; 
      return n; 
    });

   

    const { error: dbErr } = await supabase
      .from('applications')
      .update({ passport_file_url: url })
      .eq('id', props.app.id); 

    if (dbErr) throw dbErr;

   
    notifications?.show?.({
      title: 'Bilgi',
      message: (
        <span>
          <strong className="font-bold">{(props?.title ?? '') + ' '}</strong>
          {props.app?.full_name} - {props.app?.surname}
          <span className="ml-2 text-green-600 text-sm font-medium"> — Pasaport görseli yüklendi</span>
        </span>
      ),
      color: 'red',
      autoClose: 3000,
    });

  } catch (err: any) {
    console.error(err);
  
    alert('❌ Pasaport yüklenemedi: ' + (err?.message || 'Bilinmeyen hata'));
  } finally {
    setPassportLoading(prev => { 
      const n = ensureIndex(prev, i, () => false); 
      n[i] = false; 
      return n; 
    });
    e.target.value = '';
  }
};

const downloadFile = async (url: string, filename?: string) => {
  try {
    const guess = filename || url.split('?')[0].split('/').pop() || 'download';
    const res = await fetch(url, { credentials: 'omit' }); // CORS gerekli
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = guess;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (e) {
    // CORS yoksa fallback: yeni sekmede aç
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

const handleBiometricUpload = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
  (async () => {
    const file = e.target.files?.[0];
    if (!file) return;


    setBiometricLoading(prev => {
      const next = ensureIndex(prev, i, () => false);
      next[i] = true;
      return next;
    });

    try {
      const ext = (file.name.split('.').pop() || 'dat').toLowerCase();
      const fileName = `${Date.now()}.${ext}`;
      const filePath = `biometric/${fileName}`;

    
      const { error: upErr } = await supabase.storage.from('biometric').upload(filePath, file);
      if (upErr) throw upErr;

      
      const { data: pub } = supabase.storage.from('biometric').getPublicUrl(filePath);
      const url = pub?.publicUrl;
      if (!url) throw new Error('Public URL alınamadı');

      setBiometricFileName(prev => {
        const n = ensureIndex(prev, i, () => '');
        n[i] = file.name;
        return n;
      });

    

      const { error: dbErr } = await supabase
        .from('applications')
        .update({ biometric_photo_url: url })
        .eq('id', props.app.id);
      if (dbErr) throw dbErr;

      notifications?.show?.({
        title: 'Bilgi',
        message: (
          <span>
            <strong className="font-bold">{(props?.title ?? '') + ' '}</strong>
            {props.app?.full_name} - {props.app?.surname}
            <span className="ml-2 text-green-600 text-sm font-medium">
              — Biyometrik fotoğraf yüklendi
            </span>
          </span>
        ),
        color: 'red',
        autoClose: 3000,
      });
    } catch (err: any) {
      console.error(err);
      alert('❌ Biyometrik fotoğraf yüklenemedi: ' + (err?.message || 'Bilinmeyen hata'));
    } finally {
     
      setBiometricLoading(prev => {
        const n = ensureIndex(prev, i, () => false);
        n[i] = false;
        return n;
      });
      e.target.value = '';
    }
  })();
};


const showMoney = (amount: any, currency?: string) => {
  const txt = cleanText(amount);
  if (txt === "-") return "-";
  const sym = currency || "₺";
  return `${txt} ${sym}`;
};

const showDate = (d: any) => {
  const txt = cleanText(d);
  return txt === "-" ? "-" : txt;
};


const cleanText = (val: any): string => {
  if (val == null) return "-";

  if (Array.isArray(val)) {
    return val
      .flat(Infinity)
      .filter((x) => x && String(x).trim() !== "null")
      .map(String)
      .join(", ")
      || "-";
  }

  if (typeof val === "string") {
 
    try {
      const parsed = JSON.parse(val);
      return cleanText(parsed);
    } catch {
      
      const s = val
        .replace(/[\[\]"]+/g, "")
        .replace(/\s*,\s*,+/g, ",")
        .replace(/(^,|,$)/g, "")
        .trim();
      return s || "-";
    }
  }

  return String(val);
};



const safeParse = (x: any) => {
  if (typeof x !== "string") return x;
  try { return JSON.parse(x); } catch { return x; }
};





const parse1D = (raw: unknown): string[] => {
  if (!raw) return [];
  let x = raw as any;
  if (typeof x === "string") { try { x = JSON.parse(x); } catch {} }
  if (Array.isArray(x)) return x.map(v => String(v ?? "").trim());
  return [];
};
const fmt = (s?: string) => (s && s.trim()) ? s : "—";


const C = parse1D(props.app.travelCountry);
const S = parse1D(props.app.travelStart);
const E = parse1D(props.app.travelEnd);



const CS = parse1D(props.app.travelSchengenCountry);      
const SS = parse1D(props.app.travelStartForSchengen);     
const ES = parse1D(props.app.travelEndForSchengen);  

const toUrlArray = (input: unknown): string[] => {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter(isStringNonEmpty);
  if (typeof input === "string") {
   
    try {
      const parsed = JSON.parse(input);
      return toUrlArray(parsed);
    } catch {
      return isStringNonEmpty(input) ? [input] : [];
    }
  }
  return [];
};




function applyUrls(data: any) {
  const normalized = Array.isArray(data)
    ? data.flat().filter((u): u is string => typeof u === "string")
    : [];
  setSchengenUrl(normalized);
}


function normalizeField(value: any): string {
  if (!value) return "-";

  if (typeof value === "string" && value.trim().startsWith("[")) {
    
    
    try {
    
    
    
      const arr = JSON.parse(value);
      if (Array.isArray(arr)) {

        return arr.filter((x) => x && typeof x === "string").join(", ") || "-";
      }
    } catch {

      return value.replace(/[\[\]"]+/g, "") || "-";
    }
  }

  if (Array.isArray(value)) {
    return value.filter((x) => x && typeof x === "string").join(", ") || "-";


  }

  if (typeof value === "string") {
    
    
    
    
    return value.replace(/[\[\]"]+/g, "") || "-";
  }

  return String(value);
}

const flatUrls = Array.isArray(schengenUrl)




  ? (schengenUrl as any[]).flat(Infinity).filter((u): u is string => typeof u === "string" && u.trim() !== "")
  : [];


useEffect(() => {
  if (schengenIndex >= flatUrls.length) {




    
    setSchengenIndex(Math.max(0, flatUrls.length - 1));
  }
}, [flatUrls, schengenIndex]);








const url = flatUrls[schengenIndex] ?? "";
const isPdf = typeof url === "string" && url.toLowerCase().endsWith(".pdf");

function normalizeToUrls(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean) as string[];

  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return [];
    if (s.startsWith('[')) {
      try {
        const parsed = JSON.parse(s);
        return Array.isArray(parsed) ? (parsed.filter(Boolean) as string[]) : [];
      } catch {
        return [s];
      }
    }
    return [s];
  }
  return [];
}
  return (
<div className="w-full px-0 sm:px-4">
<div className="bg-white rounded-xl shadow-lg p-0 sm:p-6">
    <Card
  withBorder
  radius="md"
  p="md"
  shadow="sm"
  bg="white"
  className="w-full"
  style={{ maxWidth: '200%' }}
>
  <Group justify="space-between" mb="lg">

    <Title order={2} className="text-red-600 flex items-center gap-2">
        {props.isFamily ? (
          <IconUsers size={28} />
        ) : (
          <IconUser size={28} />
        )}
        {props.title}
    </Title>
  
  <Group gap="m">
    <Badge
        color="blue"
        variant="light"
        size="xl" 
        leftSection={<IconMapPin size={20} />}
        className="px-3 py-1 text-[14px]" 
    >
      {props.app.country}
    </Badge>

    <Badge
      color={props.app.appointment_status === "Randevu Alındı" ? "green" : "red"}

      variant="light"
      size="xl"
      leftSection={
        props.app.appointment_status === "Randevu Alındı"
          ? <IconCheck size={20} />
          : <IconClock size={20} /> }
      className="px-3 py-1 text-[14px]" 

    >
      {props.app.appointment_status}
    </Badge>
  </Group>
</Group>

   
   

      <Divider my="xs" />
      <Text size="sm" fw={900} c="dimmed" mb="xs">Kişisel Bilgiler</Text>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="sm">
        <Card shadow="xs" withBorder radius="md" padding="xs">
          <Text size="xs" c="dimmed">Ad Soyad</Text>
          <Text fw={900}>{props.app.full_name} {props.app.surname}</Text>
        </Card>
        <Card shadow="xs" withBorder radius="md" padding="xs">
          <Text size="xs" c="dimmed">Cinsiyet</Text>
          <Text fw={900} >{props.app.gender}</Text>
        </Card>
        <Card shadow="xs" withBorder radius="md" padding="xs">
          <Text size="xs" c="dimmed">Medeni Durum</Text>
          <Text fw={900} >{props.app.marital_status}</Text>
        </Card>
        
        {props.app.gender === "Kadın" && props.app.marital_status === "Evli" && (
    <Card shadow="xs" withBorder radius="md" padding="xs">
      <Text size="xs" c="dimmed">Kızlık Soyadı</Text>
      <Text fw={900}>{props.app.maiden_surname}</Text>
    </Card>
  )}
      </SimpleGrid>

      <Text size="sm" fw={600} c="dimmed" mt="sm" mb="xs">İletişim Bilgileri</Text>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="sm">
        <Card shadow="xs" withBorder radius="md" padding="xs">
          <Text size="xs" c="dimmed">E-posta</Text>
          <Text fw={900} >{props.app.email}</Text>
        </Card>
        <Card shadow="xs" withBorder radius="md" padding="xs">
          <Text size="xs" c="dimmed">Telefon</Text>
          <Text fw={900} >{props.app.phone}</Text>
        </Card>
      </SimpleGrid>

      <Card
  shadow="xs"
  withBorder
  radius="md"
  padding="xs"
  mb="sm"
  className="py-3 min-h-[100px]"
>
  <Text size="xs" c="dimmed">Ev Adresi</Text>
  <Text fw={900} >{props.app.address}</Text>
</Card>

      <Text size="sm" fw={600} c="dimmed" mt="sm" mb="xs">Çalışma Durumu</Text>
<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md" mb="sm">
  <Card shadow="xs" withBorder radius="md" padding="xs">
    <Text size="xs" c="dimmed">Durum</Text>
    <Text fw={900} >{props.app.work_status}</Text>
  </Card>
</SimpleGrid>
{props.app.work_status === "Çalışıyor" && (
  <div className="mt-6">
    <Text size="sm" fw={600} c="dimmed" mb="xs">İş Bilgileri</Text>
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
      <Card shadow="xs" withBorder radius="md" padding="xs">
        <Text size="xs" c="dimmed">Pozisyon</Text>
        <Text fw={900} >{props.app.job_title}</Text>
      
      </Card>
      <Card shadow="xs" withBorder radius="md" padding="xs">
        <Text size="xs" c="dimmed">Firma Adı</Text>
        <Text fw={900} >{props.app.company_name}</Text>
       
      </Card>
      <Card shadow="xs" withBorder radius="md" padding="xs">
        <Text size="xs" c="dimmed">Firma Adresi</Text>
        <Text fw={900} >{props.app.company_address}</Text>
       
      </Card>
      <Card shadow="xs" withBorder radius="md" padding="xs">
        <Text size="xs" c="dimmed">Firma Telefonu</Text>
        <Text fw={900} >{props.app.company_phone}</Text>
        
      </Card>
    </SimpleGrid>
  </div>
)}
{props.app.work_status === "Öğrenci" && (
  <div className="mt-6">
    <Text size="sm" fw={600} c="dimmed" mb="xs">Okul Bilgileri</Text>
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
      <Card shadow="xs" withBorder radius="md" padding="xs">
        <Text size="xs" c="dimmed">Okul Adı</Text>
        <Text fw={900} >{props.app.school_name}</Text>
        
      </Card>
      <Card shadow="xs" withBorder radius="md" padding="xs">
        <Text size="xs" c="dimmed">Okul Adresi</Text>
        <Text fw={900} >{props.app.school_address}</Text>
        
      </Card>
      <Card shadow="xs" withBorder radius="md" padding="xs">
        <Text size="xs" c="dimmed">Okul Telefonu</Text>
        <Text fw={900} >{props.app.school_phone}</Text>
  
      </Card>
    </SimpleGrid>
  </div>
)}

{props.app.country === "İngiltere" || props.app.country === "Amerika" && (
  <>

<div className="mt-6">
  <Text size="sm" fw={600} c="dimmed" mb="xs">Finansal Bilgiler</Text>
  <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">

    <Card shadow="xs" withBorder radius="md" padding="xs">
      <Text size="xs" c="dimmed">Aylık Gelir</Text>
      <Text fw={900}> {showMoney(
    props.app.monthlyIncome,
    props.app.currencyMonth && props.app.currencyMonth.trim() !== "" 
      ? props.app.currencyMonth 
      : "₺"
  )}</Text>
    </Card>
    <Card shadow="xs" withBorder radius="md" padding="xs">
      <Text size="xs" c="dimmed">İngiltere’de Planlanan Harcama</Text>
      <Text fw={900}>{showMoney(props.app.plannedSpending, props.app.currencyForEngland && props.app.currencyForEngland.trim() !=="" ? props.app.currencyForEngland :"₺")}</Text>
    </Card>
    <Card shadow="xs" withBorder radius="md" padding="xs">
      <Text size="xs" c="dimmed">Aylık Harcama Tutarı</Text>
      <Text fw={900}>{showMoney(props.app.monthlyExpense, props.app.currencyMonthAmount && props.app.currencyMonthAmount.trim() !=="" ? props.app.currencyMonthAmount :"₺")}</Text>
    </Card>
    <Card shadow="xs" withBorder radius="md" padding="xs">
      <Text size="xs" c="dimmed">Anlık Bakiyeniz</Text>
      <Text fw={900}>{showMoney(props.app.currentBalance, props.app.currencyBalance && props.app.currencyBalance.trim() !=="" ? props.app.currencyBalance :"₺")}</Text>
    </Card>
  </SimpleGrid>
</div>



<div className="mt-6">
  <Text size="sm" fw={600} c="dimmed" mb="xs">İkamet Bilgileri</Text>
  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
    <Card shadow="xs" withBorder radius="md" padding="xs">
      <Text size="xs" c="dimmed">Ev Durumu</Text>
      <Text fw={900}>{cleanText(props.app.homeStatus)}</Text>
    </Card>
    <Card shadow="xs" withBorder radius="md" padding="xs">
      <Text size="xs" c="dimmed">Bu Evde İkamet Başlangıcı</Text>
      <Text fw={900}>{showDate(props.app.homeSince)}</Text>
    </Card>
    {cleanText(props.app.previousAddress) !== "-" && (
      <Card shadow="xs" withBorder radius="md" padding="xs">
        <Text size="xs" c="dimmed">Son İkamet Adresi</Text>
        <Text fw={900}>{cleanText(props.app.previousAddress)}</Text>
      </Card>
    )}
  </SimpleGrid>
</div>


{/* Seyehat Planıo Bİlgiler İngiltere için */}
{(props.app.tripStart || props.app.tripEnd) && (
  <div className="mt-6">
    <Text size="sm" fw={600} c="dimmed" mb="xs">Seyahat Planı</Text>
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
      <Card shadow="xs" withBorder radius="md" padding="xs">
        <Text size="xs" c="dimmed">Başlangıç</Text>
        <Text fw={900}>{showDate(props.app.tripStart)}</Text>
      </Card>
      <Card shadow="xs" withBorder radius="md" padding="xs">
        <Text size="xs" c="dimmed">Bitiş</Text>
        <Text fw={900}>{showDate(props.app.tripEnd)}</Text>
      </Card>
    </SimpleGrid>
  </div>
)}

{/* Seyehat Planıo Son 10 yıl yine İngiltere için */}

{C.length > 0 && (
  <div className="mt-6">
    <Text size="sm" fw={600} c="dimmed" mb="xs">Seyahatler (Son 10 Yıl)</Text>
    <Card shadow="xs" withBorder radius="md" padding="xs">
      <div className="divide-y divide-gray-200">
        {C.map((country, i) => (
          <div key={i} className="grid grid-cols-3 gap-4 py-2">
            <div>
              <Text size="xs" c="dimmed">Ülke</Text>
              <Text fw={700}>{fmt(country)}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">Gidiş</Text>
              <Text fw={700}>{fmt(S[i])}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">Dönüş</Text>
              <Text fw={700}>{fmt(E[i])}</Text>
            </div>
          </div>
        ))}
      </div>
    </Card>
  </div>
)}


{/* Avrupa Seyehat  Planıo Son 10 yıl yine İngiltere için */}
{CS.length > 0 && (
  <div className="mt-6">
    <Text size="sm" fw={600} c="dimmed" mb="xs">
      Avrupa Seyahatleri (Son 10 Yıl)
    </Text>
    <Card shadow="xs" withBorder radius="md" padding="xs">
      <div className="divide-y divide-gray-200">
        {CS.map((country, i) => (
          <div key={i} className="grid grid-cols-3 gap-4 py-2">
            <div>
              <Text size="xs" c="dimmed">Ülke</Text>
              <Text fw={700}>{fmt(country)}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">Gidiş</Text>
              <Text fw={700}>{fmt(SS[i])}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">Dönüş</Text>
              <Text fw={700}>{fmt(ES[i])}</Text>
            </div>
          </div>
        ))}
      </div>
    </Card>
  </div>
)}

{/* Aile bilgileri l yine İngiltere için */}
{(() => {
  const momName = cleanText(props.app.motherName);
  const momDob  = showDate(props.app.motherDob);
  const dadName = cleanText(props.app.fatherName);
  const dadDob  = showDate(props.app.fatherDob);

  const hasMother = momName !== "-" || momDob !== "-";
  const hasFather = dadName !== "-" || dadDob !== "-";
  const showSection = hasMother || hasFather;

  if (!showSection) return null;

  return (
    <div className="mt-6">
      <Text size="sm" fw={600} c="dimmed" mb="xs">Aile Bilgileri</Text>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
      
        {hasMother && (
          <>
            <Card shadow="xs" withBorder radius="md" padding="xs">
              <Text size="xs" c="dimmed">Anne Adı Soyadı</Text>
              <Text fw={900}>{momName}</Text>
            </Card>
            <Card shadow="xs" withBorder radius="md" padding="xs">
              <Text size="xs" c="dimmed">Anne Doğum Tarihi</Text>
              <Text fw={900}>{momDob}</Text>
            </Card>
          </>
        )}

      
        {hasFather && (
          <>
            <Card shadow="xs" withBorder radius="md" padding="xs">
              <Text size="xs" c="dimmed">Baba Adı Soyadı</Text>
              <Text fw={900}>{dadName}</Text>
            </Card>
            <Card shadow="xs" withBorder radius="md" padding="xs">
              <Text size="xs" c="dimmed">Baba Doğum Tarihi</Text>
              <Text fw={900}>{dadDob}</Text>
            </Card>
          </>
        )}
      </SimpleGrid>
    </div>
  );
})()}

{/* Vize Reddi yine İngiltere için */}

{cleanText(props.app.visaRefusalCountry) !== "-" && (
  <div className="mt-6">
    <Text size="sm" fw={600} c="dimmed" mb="xs">Vize Reddi Bilgileri (Son 5 Yıl)</Text>
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
      <Card shadow="xs" withBorder radius="md" padding="xs">
        <Text size="xs" c="dimmed">Ülke</Text>
        <Text fw={900}>{cleanText(props.app.visaRefusalCountry)}</Text>
      </Card>
      <Card shadow="xs" withBorder radius="md" padding="xs">
        <Text size="xs" c="dimmed">Tarih</Text>
        <Text fw={900}>{showDate(props.app.visaRefusalDate)}</Text>
      </Card>
    </SimpleGrid>
  </div>
)}
</>
)}

      <Text size="sm" fw={600} c="dimmed" mt="sm" mb="xs">
  Belgeler
</Text>

<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">

{props.app.country === 'İspanya' && (
 

<Card
    withBorder
    radius="md"
    padding="lg"
    className={`relative transition-transform duration-300 ${hoveredBio ? 'scale-[1.03]' : ''}`}
    onMouseEnter={() => setHoveredBio(true)}
    onMouseLeave={() => setHoveredBio(false)}
    style={{
      minHeight: 160,
      backgroundColor: (() => {
        try {
          const url = props.app.biometric_photo_url as string | undefined;
          return url ? "#f9fca5" : "#FCA5A5";
        } catch { return "#FCA5A5"; }
      })(),
    }}
  >
    <Group justify="space-between" mb="sm">
      <Text fw={600} size="sm">Biyometrik Fotoğraf</Text>
      <Badge color="gray" variant="light">
        {props.app.biometric_photo_url ? "1 dosya" : "0 dosya"}
      </Badge>
    </Group>

    <Text size="sm">
      {props.app.biometric_photo_url ? "Görsel mevcut" : "Dosya mevcut değil"}
    </Text>

    {hoveredBio && (
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-md"
        onClick={(e) => {
          e.stopPropagation();
          setBiometricUrl(props.app.biometric_photo_url || null);
          setShowBiometricModal(true);
        }}
      >
        <IconEye size={32} className="text-white cursor-pointer" />
      </div>
    )}

    <Modal
      opened={showBiometricModal}
      onClose={() => setShowBiometricModal(false)}
      size="68%"
      radius="md"
      centered
    >
      <div className="max-h-[80vh] overflow-y-auto pr-2">
        {biometricUrl ? (
       
          biometricUrl.endsWith(".pdf") ? (
            <iframe src={biometricUrl} title="Biyometrik PDF" className="w-full h-[75vh] border-0" />
          ) : (
            <TransformWrapper initialScale={1} minScale={1} maxScale={10} wheel={{ step: 0.15 }} doubleClick={{ disabled: false, step: 1.3 }} pinch={{ step: 5 }} limitToBounds>
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div className="flex gap-2 justify-end mb-2 sticky top-0 bg-white/80 backdrop-blur z-10 p-1 rounded">
                  
                    <label
                      htmlFor="admin-biometric-upload"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-red-600 text-white text-sm font-medium cursor-pointer hover:bg-red-700 transition"
                    >
                      
                      {uploadingBiometric ? 'Yükleniyor…' : 'Yeni Görsel Ekle'}
                    </label>
                    <input
                      id="admin-biometric-upload"
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="hidden"
                      onChange={(e) => handleBiometricUpload(props.personIndex,e)}
                      disabled={uploadingBiometric}
                    />
                    {uploadingBiometric && <span className="text-sm text-gray-500">Lütfen bekleyin…</span>}

                    <button
  type="button"
  onClick={() => downloadFile(biometricUrl)}
  className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 transition"
  title="İndir"
  aria-label="İndir"
>
  <IconDownload size={18} />
</button>

                    <button onClick={() => zoomOut()} className="px-3 py-1 rounded bg-gray-200">−</button>
                    <button onClick={() => zoomIn()} className="px-3 py-1 rounded bg-gray-200">+</button>
                    <button onClick={() => setRotation(r => r - 90)} className="px-3 py-1 rounded bg-gray-200">⟲</button>
                    <button onClick={() => setRotation(r => r + 90)} className="px-3 py-1 rounded bg-gray-200">⟳</button>
                    <button onClick={() => resetTransform()} className="px-3 py-1 rounded bg-gray-200">Sıfırla</button>
                  </div>

                  <TransformComponent
                    wrapperStyle={{ width: '100%', height: '75vh', background: '#000' }}
                    contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}
                  >
                    <img
                      src={biometricUrl}
                      alt="Biyometrik Fotoğraf"
                      className="max-w-full max-h-[70vh] mx-auto rounded-md shadow select-none"
                      draggable={false}
                      style={{ transform: `rotate(${rotation}deg)` }}
                    />
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          )
        ) : (
          <Text c="dimmed">Biyometrik dosyası bulunamadı.</Text>
        )}
      </div>
    </Modal>
  </Card>

) }

<Card
  withBorder
  radius="md"
  padding="lg"
  className={`relative transition-transform duration-300 ${hovered ? 'scale-[1.03]' : ''}`}
  onMouseEnter={() => setHovered(true)}
  onMouseLeave={() => setHovered(false)}
  style={{
    minHeight: 160,
    backgroundColor: (() => {
        try {
          const urls = Array.isArray(props.app.passport_file_url)
            ? props.app.passport_file_url.filter(Boolean)
            : JSON.parse(props.app.passport_file_url || "[]").filter(Boolean);
      
          return urls.length > 0 ? "#BBF7D0" : "#FCA5A5";
        } catch {
          return props.app.passport_file_url ? "#BBF7D0" : "#FCA5A5";
        }
      })(),
  }}
>
  <Group justify="space-between" mb="sm">
    <Text fw={600} size="sm">Pasaport Görseli</Text>
    <Badge color="gray" variant="light">
  {(() => {
    try {
      const urls = Array.isArray(props.app.passport_file_url)
        ? props.app.passport_file_url.filter(Boolean)
        : JSON.parse(props.app.passport_file_url || "[]").filter(Boolean);

      return `${urls.length} dosya`;
    } catch {
      return props.app.passport_file_url ? "1 dosya" : "0 dosya";
    }
  })()}
</Badge>
  </Group>
  <Text size="sm">
  {(() => {
    try {
      const urls = Array.isArray(props.app.passport_file_url)
        ? props.app.passport_file_url.filter(Boolean)
        : JSON.parse(props.app.passport_file_url || "[]").filter(Boolean);

      return urls.length > 0 ? "Görsel mevcut" : "Dosya mevcut Değil";
    } catch {
      return props.app.passport_file_url
  ? (props.app.passport_file_url.toLowerCase().endsWith(".pdf")
      ? "PDF mevcut"
      : "Görsel mevcut")
  : "Dosya mevcut Değil";
    }
  })()}
</Text>

  {hovered && (
    <div
      className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-md"
      onClick={(e) => {
        e.stopPropagation(); 
        setPassportUrl(props.app.passport_file_url || null);
        setShowPasaportModal(true);
      }}
    >
      <IconEye size={32} className="text-white cursor-pointer" />
    </div>
  )}

<Modal
  opened={showPasaportModal}
  onClose={() => setShowPasaportModal(false)}
  size="68%"
  radius="md"
  centered
>
  <div className="max-h-[80vh] overflow-y-auto pr-2">
    {passportUrl ? (
      passportUrl.endsWith(".pdf") ? (
        <iframe
          src={passportUrl}
          title="Pasaport PDF"
          className="w-full h-[75vh] border-0"
        />
      ) : (
        <TransformWrapper
          initialScale={1}
          minScale={1}
          maxScale={10}
          wheel={{ step: 0.15 }}
          doubleClick={{ disabled: false, step: 1.3 }}
          pinch={{ step: 5 }}
          limitToBounds={true}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="flex gap-2 justify-end mb-2 sticky top-0 bg-white/80 backdrop-blur z-10 p-1 rounded">


              <label
      htmlFor="admin-passport-upload"
      className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-red-600 text-white text-sm font-medium cursor-pointer hover:bg-red-700 transition"
    >
    
      {uploadingPasaport ? 'Yükleniyor…' : 'Yeni Görsel Ekle'}
    </label>
    <input
      id="admin-passport-upload"
      type="file"
      multiple
      accept=".jpg,.jpeg,.png,.pdf"
      className="hidden"
      onChange={(e) => handlePassportUpload(props.personIndex, e)}
      disabled={uploadingPasaport}
    />
    {uploadingPasaport && (
      <span className="text-sm text-gray-500">Lütfen bekleyin…</span>
    )}

{/* <button
          type="button"
          onClick={() => downloadFile(passportUrl)}
          className="px-3 py-1 rounded bg-gray-200"
          title="Görseli indir"
        >
          İndir
        </button> */}
        <button
  type="button"
  onClick={() => downloadFile(passportUrl)}
  className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 transition"
  title="İndir"
  aria-label="İndir"
>
  <IconDownload size={18} />
</button>

                <button onClick={() => zoomOut()} className="px-3 py-1 rounded bg-gray-200">−</button>
                <button onClick={() => zoomIn()} className="px-3 py-1 rounded bg-gray-200">+</button>
                <button onClick={() => setRotation(r => r - 90)} className="px-3 py-1 rounded bg-gray-200">⟲</button>
                <button onClick={() => setRotation(r => r + 90)} className="px-3 py-1 rounded bg-gray-200">⟳</button>
                <button onClick={() => resetTransform()} className="px-3 py-1 rounded bg-gray-200">Sıfırla</button>
              </div>

              <TransformComponent
                wrapperStyle={{ width: '100%', height: '75vh', background: '#000' }}
                contentStyle={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'white'
                }}
              >
                <img
                  src={passportUrl}
                  alt="Pasaport Görseli"
                  className="max-w-full max-h-[70vh] mx-auto rounded-md shadow select-none"
                  draggable={false}
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      )
    ) : (
      <Text c="dimmed">Pasaport dosyası bulunamadı.</Text>
    )}
  </div>
</Modal>
</Card>



{['Eğitim', 'Ticari'].includes(props.app.visa_type) ? (
 <Card
 withBorder
 radius="md"
 padding="lg"
 className={`relative transition-transform duration-300 ${hoveredInvitation ? 'scale-[1.03]' : ''}`}
 onMouseEnter={() => setHoveredInvitation(true)}
 onMouseLeave={() => setHoveredInvitation(false)}
 style={{
    minHeight: 160,
    backgroundColor: (() => {
      try {
        const urls = Array.isArray(props.app.invitation_letter_url)
          ? props.app.invitation_letter_url.filter(Boolean)
          : JSON.parse(props.app.invitation_letter_url || "[]").filter(Boolean);
          return urls.length > 0 ?  "#FCA5A5":  "#BBF7D0"; 
      } catch {
        return props.app.invitation_letter_url ?  "#FCA5A5":  "#BBF7D0";
      }
    })(),
  }}
>


<Group justify="space-between" mb="sm">
  <Text fw={600} size="sm">Davet Mektubu</Text>
  <Badge color="green" variant="light">{inviteUrls.length} dosya</Badge>
</Group>



<div

  onMouseEnter={() => setHoveredInvitation(true)}
  onMouseLeave={() => setHoveredInvitation(false)}
>
  {hoveredInvitation && inviteUrls.length > 0 && (
    <div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-md"
      onClick={(e) => {
        e.stopPropagation();
        setInvitationUrls(inviteUrls);
        setShowInvitationModal(true);
      }}
      
    >
      <IconEye size={32} className="text-white cursor-pointer" />

    </div>
  )}
</div>

{inviteUrls.length === 0 ? (
  <Text size="sm">Davet mektubu yüklenmedi</Text>
) : (
  <Text size="sm">Dosya(lar) mevcut. Görüntülemek için üzerine gelin.</Text>
)}

<Modal opened={showInvitationModal} onClose={() => setShowInvitationModal(false)} size="68%" radius="md" centered>
{inviteUrls.length > 0 ? (
  <div className="space-y-4">
    {inviteUrls.map((url, i) => {
      const name = typeof (inviteNames[i] ?? url) === "string" 
        ? (inviteNames[i] ?? url).toLowerCase() 
        : String(inviteNames[i] ?? url).toLowerCase();

      const isPdf = name.endsWith(".pdf") || String(url).toLowerCase().endsWith(".pdf");

      return isPdf ? (
        <iframe
          key={url}
          src={url}
          title={`Davet Mektubu PDF ${i}`}
          style={{ width: "100%", height: "80vh", border: "none" }}
        />
      ) : (
        <img
          key={url}
          src={url}
          alt={`Davet Mektubu ${i}`}
          className="max-w-full max-h-[80vh] mx-auto rounded-md shadow"
        />
      );
    })}
  </div>
) : (
  <Text c="dimmed">Davet mektubu bulunamadı.</Text>
)}
</Modal>
</Card>

) : (


<Card
  withBorder
  radius="md"
  padding="lg"
  className={`relative transition-transform duration-300 ${hovered2 ? 'scale-[1.03]' : ''}`}
  onMouseEnter={() => setHovered2(true)}
  onMouseLeave={() => setHovered2(false)}
  style={{
    minHeight: 160,
    backgroundColor: (() => {
      try {
        const urls = Array.isArray(props.app.previous_schengen_url)
          ? props.app.previous_schengen_url.filter(Boolean)
          : JSON.parse(props.app.previous_schengen_url || "[]").filter(Boolean);
        return urls.length > 0 ?   "#BBF7D0" : "#FCA5A5"; 
      } catch {
        return props.app.previous_schengen_url ? "#BBF7D0" : "#FCA5A5";
      }
    })(),
  }}
>

  <Group justify="space-between" mb="sm">
    <Text fw={600} size="sm">Schengen Vize Görseli</Text>
    <Badge color="gray" variant="light">
  {(() => {
    try {
      let raw = props.app.previous_schengen_url;
      let urls: any = [];

      if (typeof raw === "string") {
        try {
          urls = JSON.parse(raw);
        } catch {
          urls = raw ? [raw] : [];
        }
      } else if (Array.isArray(raw)) {
        urls = raw;
      }

      let count = 0;
      if (Array.isArray(urls) && Array.isArray(urls[0])) {



        count = (urls[urls.length-1 - props.personIndex] as string[]).filter(Boolean).length;
      } else if (Array.isArray(urls)) {
  
        
        count = (urls as string[]).filter(Boolean).length;
      }

      return `${count} dosya`;
    } catch {
      return "0 dosya";
    }
  })()}
</Badge>
  </Group>
  <Text size="sm">
  {(() => {
    try {
      const urls = Array.isArray(props.app.previous_schengen_url)
        ? props.app.previous_schengen_url.filter(Boolean)
        : JSON.parse(props.app.previous_schengen_url || "[]").filter(Boolean);

      return urls.length > 0 ? "Dosya(lar) mevcut görüntüleyebilirsiniz" : "Dosya(lar) mevcut Değil";
    } catch {
      return props.app.previous_schengen_url ? "Dosya(lar) mevcut görüntüleyebilirsiniz" : "Dosya(lar) mevcut Değil";
    }
  })()}
</Text>

 {hovered2 && (
  <div
    className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-md"
    onClick={(e) => {
      e.stopPropagation();
    
      const raw = props.app.previous_schengen_url;
      let urls: string[] = [];
    
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            if (Array.isArray(parsed[0])) {
              urls = (parsed[parsed.length-1 - props.personIndex] || []).filter(Boolean);
            } else {
              urls = parsed.filter(Boolean);
            }
          } else if (typeof parsed === 'string') {
            urls = [parsed];
          }
        } catch {
          urls = raw ? [raw] : [];
        }
      } else if (Array.isArray(raw)) {
        if (Array.isArray(raw[0])) {
          urls = (raw[props.personIndex] || []).filter(Boolean);
        } else {
          urls = raw.filter(Boolean);
        }
      }

    

      if (urls.length > 0) {
        applyUrls(urls);
      } else {
        setSchengenUrl([]);
      }

      setSchengenIndex(0);
      setShowSchengenModal(true);
    }}
  >
    <IconEye size={32} className="text-white cursor-pointer" />
  </div>
)}
<Modal opened={showSchengenModal} onClose={() => setShowSchengenModal(false)} size="75%" radius="md" centered>




  <div className="max-h-[80vh] overflow-y-auto pr-2"> 
    {(() => {
      const url = schengenUrl[schengenIndex];
      if (typeof url !== 'string' || !url) return <Text c="dimmed">Schengen dosyası bulunamadı.</Text>;

      const isPdf = url.toLowerCase().endsWith('.pdf');

      return isPdf ? (
        <iframe src={url} title="Schengen PDF" className="w-full h-[75vh] border-0" />
      ) : (
        <TransformWrapper initialScale={1} minScale={1} maxScale={5} wheel={{ step: 0.15 }} doubleClick={{ disabled: false, step: 1.3 }} pinch={{ step: 5 }} limitToBounds centerOnInit>
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
             <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-200 px-2 py-2 rounded-t-md flex items-center justify-between">




  <div className="flex items-center gap-3">
  {schengenUrl.map((u, i) => (
    <div key={i} className="relative">
      <button
        type="button"
        className={`border rounded p-1 ${i === schengenIndex ? 'ring-2 ring-red-500' : ''}`}
        onClick={() => {
          setSchengenIndex(i);
          setSelectedForDelete(i); 


        }}
        title={`Dosya ${i + 1}`}
      >
        {u.toLowerCase().endsWith('.pdf') ? (
          <span className="text-xs px-2">PDF</span>
        ) : (
          <img src={u} alt={`thumb-${i}`} className="w-16 h-16 object-cover rounded" />
        )}
      </button>
      
       {selectedForDelete === i && (
       <button
       type="button"
       onClick={() => downloadFile(schengenUrl[i])}
      className="absolute top-1 right-10 bg-black text-white text-xs rounded px-1"
       title="Görseli indir"
     >
       İndir
     </button>
        
      )}
      {selectedForDelete === i && (
        <button
          onClick={() => handleDeleteSchengenFile(i)}
          className="absolute top-1 right-1 bg-red-600 text-white text-xs rounded px-1"
        >
          Sil
        </button>
        
      )}
    </div>
  ))}
  </div>


  <div className="flex gap-2 items-center">
  
    <label
      htmlFor="admin-schengen-upload"
      className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-red-600 text-white text-sm font-medium cursor-pointer hover:bg-red-700 transition"
    >
    
      {uploadingSchengen ? 'Yükleniyor…' : 'Yeni Görsel Ekle'}
    </label>
    <input
      id="admin-schengen-upload"
      type="file"
      multiple
      accept=".jpg,.jpeg,.png,.pdf"
      className="hidden"
      onChange={(e) => handleSchengenUpload(props.personIndex, e)}
      disabled={uploadingSchengen}
    />
    {uploadingSchengen && (
      <span className="text-sm text-gray-500">Lütfen bekleyin…</span>
    )}


    <button
      onClick={() => zoomOut()}
      className="px-3 py-1 rounded bg-gray-200"
    >
      −
    </button>
    <button
      onClick={() => zoomIn()}
      className="px-3 py-1 rounded bg-gray-200"
    >
      +
    </button>
    <button
      onClick={() => setRotation(r => r - 90)}
      className="px-3 py-1 rounded bg-gray-200"
    >
      ⟲
    </button>
    <button
      onClick={() => setRotation(r => r + 90)}
      className="px-3 py-1 rounded bg-gray-200"
    >
      ⟳
    </button>
    <button
      onClick={() => resetTransform()}
      className="px-3 py-1 rounded bg-gray-200"
    >
      Sıfırla
    </button>
  </div>
</div>

              <TransformComponent
                wrapperStyle={{ width: '100%', height: '75vh', background: '#000' }}
                contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}
              >
                <img
                  src={url}
                  alt="Schengen Belgesi"
                  className="max-w-full max-h-[70vh] mx-auto rounded-md shadow-lg select-none"
                  draggable={false}
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      );
    })()}
  </div>

</Modal>
</Card>
)}

</SimpleGrid>




      <Text size="sm" fw={600} c="dimmed" mt="lg" mb="xs">Başvuru Özeti</Text>
<SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
  <Card shadow="xs" withBorder radius="md" padding="xs">
    <Text size="xs" c="dimmed">Başvuru Tarihi</Text>
    <Text fw={900}>
  {dayjs(props.app.created_at).format("DD.MM.YYYY HH:mm:ss")}
</Text>
  </Card>
  <Card shadow="xs" withBorder radius="md" padding="xs">
    <Text size="xs" c="dimmed">Başvuru Sayısı</Text>
    <Text fw={900} >{kisiSayisi}</Text>
  </Card>
  <Card shadow="xs" withBorder radius="md" padding="xs">
    <Text size="xs" c="dimmed">Hedef Ülke</Text>
    <Text fw={900} >{props.app.country}</Text>
  </Card>
</SimpleGrid>
    </Card>
</div>
</div>
  );
}