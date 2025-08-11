import { Alert, Badge, Card, Divider, Group, Modal, SimpleGrid, Text, Title } from '@mantine/core';
import { IconMapPin, IconMail, IconPhone, IconUser, IconCheck, IconEye, IconClock, IconUsers } from '@tabler/icons-react';
import { useState } from 'react';

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
          <Text fw={900}>{props.app.name} {props.app.surname}</Text>
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
    <Text fw={600} size="sm">Pasaport Fotoğrafı</Text>
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

      return urls.length > 0 ? "Görsel mevcut" : "Görsel mevcut Değil";
    } catch {
      return props.app.passport_file_url ? "Görsel mevcut" : "Görsel mevcut Değil";
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
      <img
        src={passportUrl}
        alt="Pasaport Görseli"
        className="max-w-full max-h-[80vh] mx-auto rounded-md shadow"
      />
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
   <Badge color="green" variant="light">
     {(Array.isArray(props.app.invitation_letter_url) ? props.app.invitation_letter_url.length : props.app.invitation_letter_url ? 1 : 0) + ' dosya'}
   </Badge>
 </Group>
 <Text size="sm">
   {props.app.invitation_letter_url ? 'Dosya(lar) mevcut. Görüntülemek için üzerine gelin.' : 'Davet mektubu yüklenmedi'}
 </Text>

 {hoveredInvitation && props.app.invitation_letter_url && (
   <div
     className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-md"
     onClick={(e) => {
        e.stopPropagation();
    
        let urls: string[] = [];
        if (props.app.invitation_letter_url) {
          
          if (typeof props.app.invitation_letter_url === "string") {
            try {
              const parsed = JSON.parse(props.app.invitation_letter_url);
              urls = Array.isArray(parsed) ? parsed : [parsed];
            } catch {
              urls = [props.app.invitation_letter_url];
            }
          } else if (Array.isArray(props.app.invitation_letter_url)) {
            urls = props.app.invitation_letter_url;
          }
        }
    
        urls = urls.filter(Boolean);
    
        setInvitationUrls(urls);
        setShowInvitationModal(true);
      }}
   >
     <IconEye size={32} className="text-white cursor-pointer" />
   </div>
 )}

 <Modal
   opened={showInvitationModal}
   onClose={() => setShowInvitationModal(false)}
     size="68%"
   radius="md"
   centered
 >
   {invitationUrls.length === 0 ? (
     <Text c="dimmed">Davet mektubu bulunamadı.</Text>
   ) : invitationUrls.length === 1 ? (
     invitationUrls[0].toLowerCase().endsWith('.pdf') ? (
       <iframe
         src={invitationUrls[0]}
         title="Davet Mektubu"
         style={{ width: '100%', height: '80vh', border: 'none' }}
       />
     ) : (
       <img
         src={invitationUrls[0]}
         alt="Davet Mektubu"
         className="max-w-full max-h-[80vh] mx-auto rounded-md shadow"
       />
     )
   ) : (
     <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 max-h-[80vh] overflow-auto p-2">
       {invitationUrls.map((url, i) =>
         url.toLowerCase().endsWith('.pdf') ? (
           <iframe
             key={i}
             src={url}
             title={`Davet Mektubu ${i + 1}`}
             style={{ width: '100%', height: '70vh', border: 'none' }}
           />
         ) : (
           <img
             key={i}
             src={url}
             alt={`Davet Mektubu ${i + 1}`}
             className="w-full h-auto rounded-md shadow"
           />
         )
       )}
     </div>
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

      return urls.length > 0 ? "Görsel mevcut" : "Görsel mevcut Değil";
    } catch {
      return props.app.previous_schengen_url ? "Görsel mevcut" : "Görsel mevcut Değil";
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
        setSchengenUrl(urls[0]); // tüm listeyi state'e at
      } else {
        setSchengenUrl([]);   // boş liste
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

    return isPdf! ? (
      <iframe
        src={url}
        title="Schengen PDF"
        style={{ width: '100%', height: '80vh', border: 'none' }}
      />
    ) : (
      <img
        src={url}
        alt="Schengen Belgesi"
        className="max-w-[90%] max-h-[70vh] mx-auto rounded-md shadow-lg"
      />
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
    <Text fw={900} >07.08.2025 17:28</Text>
  </Card>
  <Card shadow="xs" withBorder radius="md" padding="xs">
    <Text size="xs" c="dimmed">Başvuru Sayısı</Text>
    <Text fw={900} >2 Kişi</Text>
  </Card>
  <Card shadow="xs" withBorder radius="md" padding="xs">
    <Text size="xs" c="dimmed">Hedef Ülke</Text>
    <Text fw={900} >Danimarka</Text>
  </Card>
</SimpleGrid>
    </Card>
</div>
</div>
  );
}