import { Alert, Badge, Card, Divider, Group, Modal, SimpleGrid, Text, Title } from '@mantine/core';
import { IconMapPin, IconMail, IconPhone, IconUser, IconCheck, IconEye } from '@tabler/icons-react';
import { useState } from 'react';

export default function ApplicationDetailModal({ app }: { app: any }) {

    const [hovered, setHovered] = useState(false);
    const [hovered2, setHovered2] = useState(false);

    const [showPasaportModal, setShowPasaportModal] = useState(false);
const [showSchengenModal, setShowSchengenModal] = useState(false);
const [passportUrl, setPassportUrl] = useState<string | null>(null);
const [schengenUrl, setSchengenUrl] = useState<string | null>(null);

const [hoveredInvitation, setHoveredInvitation] = useState(false);
const [showInvitationModal, setShowInvitationModal] = useState(false);
const [invitationUrls, setInvitationUrls] = useState<string[]>([]);
  return (
    <div
  style={{
    maxHeight: '80vh', 
    overflowY: 'auto', 
    padding: '1rem',   
  }}
>
    <Card
  withBorder
  radius="md"
  p="md"
  shadow="sm"
  bg="white"
  className="w-full"
  style={{ maxWidth: '100%' }}
>
     
      <Group justify="space-between" mb="lg">
  <Title order={2} className="text-red-600 flex items-center gap-2">
    <IconUser size={28} /> Başvuru Detayları
  </Title>
  
  <Group gap="m">
    <Badge
        color="blue"
        variant="light"
        size="xl" 
        leftSection={<IconMapPin size={20} />}
        className="px-3 py-1 text-[14px]" 
    >
      {app.country}
    </Badge>

    <Badge
      color="green"
      variant="light"
      size="xl"
      leftSection={<IconCheck size={20} />}
      className="px-3 py-1 text-[14px]" 

    >
      {app.appointment_status}
    </Badge>
  </Group>
</Group>

   
      <Title order={5} mb="xs" className="text-red-600">1. Başvuru Sahibi</Title>

      <Divider my="xs" />
      <Text size="sm" fw={900} c="dimmed" mb="xs">Kişisel Bilgiler</Text>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="sm">
        <Card shadow="xs" withBorder radius="md" padding="xs">
          <Text size="xs" c="dimmed">Ad Soyad</Text>
          <Text fw={900}>{app.name} {app.surname}</Text>
        </Card>
        <Card shadow="xs" withBorder radius="md" padding="xs">
          <Text size="xs" c="dimmed">Cinsiyet</Text>
          <Text fw={900} >{app.gender}</Text>
        </Card>
        <Card shadow="xs" withBorder radius="md" padding="xs">
          <Text size="xs" c="dimmed">Medeni Durum</Text>
          <Text fw={900} >{app.marital_status}</Text>
        </Card>
      </SimpleGrid>

      <Text size="sm" fw={600} c="dimmed" mt="sm" mb="xs">İletişim Bilgileri</Text>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="sm">
        <Card shadow="xs" withBorder radius="md" padding="xs">
          <Text size="xs" c="dimmed">E-posta</Text>
          <Text fw={900} >{app.email}</Text>
        </Card>
        <Card shadow="xs" withBorder radius="md" padding="xs">
          <Text size="xs" c="dimmed">Telefon</Text>
          <Text fw={900} >{app.phone}</Text>
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
  <Text fw={900} >{app.address}</Text>
</Card>

      <Text size="sm" fw={600} c="dimmed" mt="sm" mb="xs">Çalışma Durumu</Text>
<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md" mb="sm">
  <Card shadow="xs" withBorder radius="md" padding="xs">
    <Text size="xs" c="dimmed">Durum</Text>
    <Text fw={900} >{app.work_status}</Text>
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
          const urls = Array.isArray(app.passport_file_url)
            ? app.passport_file_url.filter(Boolean)
            : JSON.parse(app.passport_file_url || "[]").filter(Boolean);
      
          return urls.length > 0 ? "#BBF7D0" : "#FCA5A5";
        } catch {
          return app.passport_file_url ? "#BBF7D0" : "#FCA5A5";
        }
      })(),
  }}
>
  <Group justify="space-between" mb="sm">
    <Text fw={600} size="sm">Pasaport Fotoğrafı</Text>
    <Badge color="gray" variant="light">
  {(() => {
    try {
      const urls = Array.isArray(app.passport_file_url)
        ? app.passport_file_url.filter(Boolean)
        : JSON.parse(app.passport_file_url || "[]").filter(Boolean);

      return `${urls.length} dosya`;
    } catch {
      return app.passport_file_url ? "1 dosya" : "0 dosya";
    }
  })()}
</Badge>
  </Group>
  <Text size="sm">
  {(() => {
    try {
      const urls = Array.isArray(app.passport_file_url)
        ? app.passport_file_url.filter(Boolean)
        : JSON.parse(app.passport_file_url || "[]").filter(Boolean);

      return urls.length > 0 ? "Görsel mevcut" : "Görsel mevcut Değil";
    } catch {
      return app.passport_file_url ? "Görsel mevcut" : "Görsel mevcut Değil";
    }
  })()}
</Text>

  {hovered && (
    <div
      className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-md"
      onClick={(e) => {
        e.stopPropagation(); 
        setPassportUrl(app.passport_file_url || null);
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



{['Eğitim', 'Ticari'].includes(app.visa_type) ? (
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
        const urls = Array.isArray(app.invitation_letter_url)
          ? app.invitation_letter_url.filter(Boolean)
          : JSON.parse(app.invitation_letter_url || "[]").filter(Boolean);
          return urls.length > 0 ?  "#FCA5A5":  "#BBF7D0"; 
      } catch {
        return app.invitation_letter_url ?  "#FCA5A5":  "#BBF7D0";
      }
    })(),
  }}
>
 <Group justify="space-between" mb="sm">
   <Text fw={600} size="sm">Davet Mektubu</Text>
   <Badge color="green" variant="light">
     {(Array.isArray(app.invitation_letter_url) ? app.invitation_letter_url.length : app.invitation_letter_url ? 1 : 0) + ' dosya'}
   </Badge>
 </Group>
 <Text size="sm">
   {app.invitation_letter_url ? 'Dosya(lar) mevcut. Görüntülemek için üzerine gelin.' : 'Davet mektubu yüklenmedi'}
 </Text>

 {hoveredInvitation && app.invitation_letter_url && (
   <div
     className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-md"
     onClick={(e) => {
        e.stopPropagation();
    
        let urls: string[] = [];
    
        if (app.invitation_letter_url) {
          if (typeof app.invitation_letter_url === "string") {
            try {
              const parsed = JSON.parse(app.invitation_letter_url);
              urls = Array.isArray(parsed) ? parsed : [parsed];
            } catch {
              urls = [app.invitation_letter_url];
            }
          } else if (Array.isArray(app.invitation_letter_url)) {
            urls = app.invitation_letter_url;
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
        const urls = Array.isArray(app.previous_schengen_url)
          ? app.previous_schengen_url.filter(Boolean)
          : JSON.parse(app.previous_schengen_url || "[]").filter(Boolean);
        return urls.length > 0 ?   "#BBF7D0" : "#FCA5A5"; 
      } catch {
        return app.previous_schengen_url ? "#BBF7D0" : "#FCA5A5";
      }
    })(),
  }}
>

  <Group justify="space-between" mb="sm">
    <Text fw={600} size="sm">Schengen Vize Geçmişi</Text>
    <Badge color="gray" variant="light">
  {(() => {
    try {
     
      const urls = Array.isArray(app.previous_schengen_url)
        ? app.previous_schengen_url.filter(Boolean)
      
        : JSON.parse(app.previous_schengen_url || "[]").filter(Boolean);

      return `${urls.length} dosya`;
    } catch {
   
      return app.previous_schengen_url ? "1 dosya" : "0 dosya";
    }
  })()}
</Badge>
  </Group>
  <Text size="sm">
  {(() => {
    try {
      const urls = Array.isArray(app.previous_schengen_url)
        ? app.previous_schengen_url.filter(Boolean)
        : JSON.parse(app.previous_schengen_url || "[]").filter(Boolean);

      return urls.length > 0 ? "Görsel mevcut" : "Görsel mevcut Değil";
    } catch {
      return app.previous_schengen_url ? "Görsel mevcut" : "Görsel mevcut Değil";
    }
  })()}
</Text>

  {hovered2 && (
    <div
    className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-md"
    onClick={(e) => {
      e.stopPropagation();
  
      let urls: string[] = [];
  
      if (app.previous_schengen_url) {
        if (typeof app.previous_schengen_url === "string") {
          try {
            const parsed = JSON.parse(app.previous_schengen_url);
            urls = Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            urls = [app.previous_schengen_url];
          }
        } else if (Array.isArray(app.previous_schengen_url)) {
          urls = app.previous_schengen_url;
        }
      }
  
      urls = urls.filter(Boolean);
      setSchengenUrl(urls[0] || null); 
      setShowSchengenModal(true);
    }}
  >
    <IconEye size={32} className="text-white cursor-pointer" />
  </div>
  )}

<Modal
  opened={showSchengenModal}
  onClose={() => setShowSchengenModal(false)}
  size="68%"
  radius="md"
  centered
>
  {schengenUrl ? (
    schengenUrl.endsWith(".pdf") ? (
      <iframe
        src={schengenUrl}
        title="Schengen PDF"
        style={{ width: "100%", height: "80vh", border: "none" }}
      />
    ) : (
      <img
        src={schengenUrl}
        alt="Schengen Belgesi"
        className="max-w-[90%] max-h-[70vh] mx-auto rounded-md shadow-lg"

      />
    )
  ) : (
    <Text c="dimmed">Schengen dosyası bulunamadı.</Text>
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
  );
}