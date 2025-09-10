import { notifications } from "@mantine/notifications";
import { supabase } from "../../../services/supabase";
import { Alert, Badge, Card, Divider, Group, Modal, SimpleGrid, Text, Title } from '@mantine/core';
import { IconMapPin, IconMail, IconPhone, IconUser, IconCheck, IconEye, IconClock, IconUsers } from '@tabler/icons-react';
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

   
    // 4) DB update (tek URL)
    const { error: dbErr } = await supabase
      .from('applications')
      .update({ passport_file_url: url })
      .eq('id', props.app.id); // <-- bulunduğun yerde 'app' erişilebilir olmalı

    if (dbErr) throw dbErr;

    // 5) Opsiyonel: başarı bildirimi
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
        {/* <Text fw={900}>
    {typeof props.app.job_title === "string"
      ? props.app.job_title.replace(/[\[\]"]+/g, "")
      : props.app.job_title || "-"}
  </Text> */}
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
      <Text size="sm" fw={600} c="dimmed" mt="sm" mb="xs">
  Belgeler
</Text>

<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
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
    <Text fw={600} size="sm">Schengen Vize Geçmişi</Text>
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