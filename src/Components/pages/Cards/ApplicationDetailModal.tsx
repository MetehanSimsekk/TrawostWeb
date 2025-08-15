import { supabase } from "../../../services/supabase";
import { Alert, Badge, Card, Divider, Group, Modal, SimpleGrid, Text, Title } from '@mantine/core';
import { IconMapPin, IconMail, IconPhone, IconUser, IconCheck, IconEye, IconClock, IconUsers } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

export default function ApplicationDetailModal(props: { app: any; title: string; isFamily?: boolean }) {

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

const [kisiSayisi, setKisiSayisi] = useState<number>(0);
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
    <div className="w-full px-0">
    <div className="bg-white rounded-xl shadow-lg p-6">
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
  {passportUrl ? (
    passportUrl.endsWith(".pdf") ? (
     
      <iframe
        src={passportUrl}
        title="Pasaport PDF"
        style={{ width: "100%", height: "80vh", border: "none" }}
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
        
        <div className="flex gap-2 justify-end">
  <button onClick={() => zoomOut()} className="px-3 py-1 rounded bg-gray-200">−</button>
  <button onClick={() => zoomIn()} className="px-3 py-1 rounded bg-gray-200">+</button>
  <button onClick={() => resetTransform()} className="px-3 py-1 rounded bg-gray-200">Sıfırla</button>
</div>

            <TransformComponent
                wrapperStyle={{ width:'100%', height:'80vh', background:'#000' }}  
                contentStyle={{
                  width:'100%', height:'100%',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background:'white'
                }}
            >
              <img
                src={passportUrl}
                alt="Pasaport Görseli"
                className="max-w-full max-h-[80vh] mx-auto rounded-md shadow select-none"
                draggable={false}
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    )
  ) : (
    <Text c="dimmed">Pasaport dosyası bulunamadı.</Text>
  )}
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
     
      const urls = Array.isArray(props.app.previous_schengen_url)
        ? props.app.previous_schengen_url.filter(Boolean)
      
        : JSON.parse(props.app.previous_schengen_url || "[]").filter(Boolean);

      return `${urls.length} dosya`;
    } catch {
   
      return props.app.previous_schengen_url ? "1 dosya" : "0 dosya";
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
  
      let urls: any[] = [];
  
      if (props.app.previous_schengen_url) {
        if (typeof props.app.previous_schengen_url === "string") {
          try {
            const parsed = JSON.parse(props.app.previous_schengen_url);
            urls = Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            urls = [props.app.previous_schengen_url];
          }
        } else if (Array.isArray(props.app.previous_schengen_url)) {
          urls = props.app.previous_schengen_url;
        }
      }
  
       urls = normalizeToUrls(props.app.previous_schengen_url);
       if (urls.length > 0) {
        setSchengenUrl(urls[0]);
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

<Modal
  opened={showSchengenModal}
  onClose={() => setShowSchengenModal(false)}
  size="75%"
  radius="md"
  centered
>
  {(() => {
    const url = schengenUrl[schengenIndex];
    if (typeof url !== 'string' || !url) {
      return <Text c="dimmed">Schengen dosyası bulunamadı.</Text>;
    }

    const isPdf = url.toLowerCase().endsWith('.pdf');

    return isPdf ? (
      <iframe
        src={url}
        title="Schengen PDF"
        style={{ width: '100%', height: '80vh', border: 'none' }}
      />
    ) : (
      <TransformWrapper
        initialScale={1}
        minScale={1}
        maxScale={5}
        wheel={{ step: 0.15 }}
        doubleClick={{ disabled: false, step: 1.3 }}
        pinch={{ step: 5 }}
        limitToBounds={true}
        centerOnInit={true}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="flex gap-2 justify-end mb-2">
            <button onClick={() => zoomOut()} className="px-3 py-1 rounded bg-gray-200">−</button>
  <button onClick={() => zoomIn()} className="px-3 py-1 rounded bg-gray-200">+</button>
  <button onClick={() => resetTransform()} className="px-3 py-1 rounded bg-gray-200">Sıfırla</button>
            </div>

            <TransformComponent
              wrapperStyle={{ width:'100%', height:'80vh', background:'#000' }}  
              contentStyle={{
                width:'100%', height:'100%',
                display:'flex', alignItems:'center', justifyContent:'center',
                background:'white'
              }}
            >
              <img
                src={url}
                alt="Schengen Belgesi"
                className="max-w-full max-h-[70vh] mx-auto rounded-md shadow-lg select-none"
                draggable={false}
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    );
  })()}

  {schengenUrl.length > 1 && (
    <div className="mt-4 flex gap-2 flex-wrap">
      {schengenUrl.map((u, i) => (
        <button
          key={i}
          type="button"
          className={`border rounded p-1 ${i === schengenIndex ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => setSchengenIndex(i)}
          title={`Dosya ${i + 1}`}
        >
          {u.toLowerCase().endsWith('.pdf') ? (
            <span className="text-xs px-2">PDF</span>
          ) : (
            <img src={u} alt={`thumb-${i}`} className="w-16 h-16 object-cover rounded" />
          )}
        </button>
      ))}
    </div>
  )}
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