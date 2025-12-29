import {
    Card,
    Container,
    Group,
    Text,
    Title,
    Button,
    SimpleGrid,
    Badge,
    Select,
    TextInput,
    ScrollArea,
    rem,
    Radio,
    Modal,
    ActionIcon,
    SegmentedControl,
    Checkbox,
    Textarea,
  } from '@mantine/core';
  import { IconUser, IconCalendar, IconCalendarCheck, IconGlobe, IconSearch, IconEye, IconTrash, IconClock, IconUsers, IconNote, IconX, IconEdit, IconPencil } from '@tabler/icons-react';
  import { JSX, useEffect, useState } from 'react';
  import { IconCheck, IconPlaneTilt } from '@tabler/icons-react';
  import { DatePickerInput, DateTimePicker } from '@mantine/dates';
import ApplicationDetailModal from './ApplicationDetailModal';
import { supabase } from '../../../services/supabase';
import { notifications, showNotification } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { Switch } from '@mantine/core';
import toast from 'react-hot-toast';
export function ApplicationCard({
  app,
  onDelete,
  isFamily,
  relatedApps = [],
  status,                      
  setStatus,                 
  onOpen,                      
}: {
  app: any;
  onDelete?: (id: string) => void;
  isFamily?: boolean;
  relatedApps?: any[];
  status: string;
  setStatus: (v: string) => void;
  onOpen?: (payload: any) => void;
})
{
    
    const [appointmentStatus, setAppointmentStatus] = useState(app.appointment_status);
    const [salesStatus, setSalesStatus] = useState<boolean>(app.sales_status ?? false);
    const [kisiSayisi, setKisiSayisi] = useState<number>(0);

    const [selectedSeller, setSelectedSeller] = useState<string>();
    const [appointmentDate, setAppointmentDate] = useState<Date | any>(app.appointment_date);
    const [sellerNote, setsellerNote] = useState("");
    const [opened, setOpened] = useState(false);
    const [selectedApp, setSelectedApp] =  useState<string | null>(null);
    const [operationStarted, setOperationStarted] = useState<boolean>(app.operation_started ?? false);
// const [selectedApp, setSelectedApp] = useState(null);
const [isEditing, setIsEditing] = useState(false);
const [country, setCountry] = useState(app.country);
const [statusById, setStatusById] = useState<Record<string, string>>({});
const [saving, setSaving] = useState(false);
const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
const [highlighted, setHighlighted] = useState(false);
const [noteModalOpen, setNoteModalOpen] = useState(false);
const [sellerNoteModalOpen, setSellerNoteModalOpen] = useState(false);
const [sellerNoteModalOpens, setSellerNoteModalOpens] = useState(false);
const maxChars = 250;

async function handleAppointmentStatusChange(newStatus: string | null) {
  if (!newStatus) return;

  const prevStatus = appointmentStatus;
  const prevDate = appointmentDate;


  if (newStatus === "Randevu Alındı" && !appointmentDate) {
    alert("Lütfen önce randevu tarihi seçiniz.");
    return;
  }

  setAppointmentStatus(newStatus);


  let dbUpdate: any = {};
  if (newStatus === "Randevu Alınacak") {
    dbUpdate = { appointment_status: newStatus, appointment_date: null };
    setAppointmentDate(null);
  } 
  if(newStatus === "Randevu Alındı") {
    dbUpdate = { appointment_status: newStatus, appointment_date: appointmentDate };
    setAppointmentDate(null);
  } 
  else {
    dbUpdate = { appointment_status: newStatus };
  }

  const { error: errA } = await supabase
    .from("applications")
    .update(dbUpdate)
    .eq("id", app.id);

  if (errA) {
    console.error("Güncelleme hatası:", errA.message);
    setAppointmentStatus(prevStatus);
    setAppointmentDate(prevDate);
    return;
  }


  if (newStatus === "Randevu Alınacak") {
    const payload = { action: "delete_calendar", user_id: app.id };
    const { error: errFn } = await supabase.functions.invoke("bridge-to-b", { body: payload });
    if (errFn) {
      console.error("Takvim silme hatası:", errFn.message);
     
    }
  }

  notifications.show({
    title: "Bilgi",
    message:(
    <span className="text-lg">
    Randevu durumu <strong className="font-bold">{newStatus}</strong> olarak güncellendi.</span>
)
    ,
    color: "red",
    autoClose: 3000,
  });
}

async function handleSellerChange(newSeller: string | null) {
  if (!newSeller) return;

  const prevSeller = selectedSeller;

  setSelectedSeller(newSeller);

  const dbUpdate = { sales_owner: newSeller }; 

  const { error } = await supabase
    .from("applications")
    .update(dbUpdate)
    .eq("id", app.id);

  if (error) {
    console.error("Güncelleme hatası:", error.message);
  
    setSelectedSeller(prevSeller);
    return;
  }

  notifications.show({
    title: "Bilgi",
    message: (
      <span className="text-lg">
        Satış sorumlusu <strong className="font-bold">{newSeller}</strong> olarak güncellendi.
      </span>
    ),
    color: "red",
    autoClose: 3000,
  });
}


  useEffect(() => {
    const kisiSayisiCount = isFamily ? (relatedApps.length + 1) : 1;
    setKisiSayisi(kisiSayisiCount);
  }, [isFamily, relatedApps]);

 




  const handleSaveSellerNote = async () => {
    if (!sellerNote.trim()) return;
  
    setSaving(true);
    try {
      const { error } = await supabase
        .from("applications")
        .update({ seller_note: sellerNote })
        .eq("id", app.id);
  
      if (error) throw error;
  
      const savedAt = new Date().toLocaleString("tr-TR");
      setLastSavedAt(savedAt);
  
    
      setSellerNoteModalOpen(false);
  
 
      notifications.show({
        title: "Başarılı",
        message: (
          <span className="text-sm">
            Satışçı notu başarıyla kaydedildi.
          </span>
        ),
        color: "green",
        autoClose: 3000,
      });
  
    } catch (err) {
      console.error("Satışçı notu kaydedilemedi", err);
  
      notifications.show({
        title: "Hata",
        message: (
          <span className="text-sm">
            Satışçı notu kaydedilirken bir hata oluştu.
          </span>
        ),
        color: "red",
        autoClose: 4000,
      });
    } finally {
      setSaving(false);
    }
  };


  
  async function handleAppointmentDateChange(newDate: any) {
    if (!newDate) return;
  
    const prevDate = appointmentDate;
    setAppointmentDate(newDate);
   
    try {
     
  
    
      const { error: errA } = await supabase
        .from("applications")
        .update({ appointment_date: newDate ,appointment_status:'Randevu Alındı'})
        .eq("id", app.id);
      if (errA) throw new Error(errA.message);
  

     
      const payload = {
        user_id: app.id,            
        first_name: app.full_name,
        last_name: app.surname,
        city:app.city+'-'+app.country,
      person_count:kisiSayisi,
        date: newDate,
             
      };
  
 
      const { data, error: errFn } = await supabase.functions.invoke("bridge-to-b", {
        body: payload,
      });
      if (errFn) throw new Error(errFn.message);
  


      notifications.show({
        title: 'Bilgi',
        message: (
          <span className="text-lg">
            Randevu sistemi Tarihi <strong className="font-bold">{newDate}</strong> olarak güncellendi.
          </span>
        ),
        color: 'green',
        autoClose: 3000,
      });
      console.log("B’ye sync ok:");
    } catch (e: any) {
      console.error("Sync hatası:", e.message ?? e);
      setAppointmentDate(prevDate);
    }
  }
  function confirm(title: string, body: React.ReactNode) {
    return new Promise<boolean>((resolve) => {
      modals.openConfirmModal({
        title, centered: true, children: body,
        labels: { confirm: "Evet", cancel: "Vazgeç" },
        confirmProps: { color: "red" },
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  }
  async function handleDeleteApplication(id: string) {
    const ok = await confirm("Başvuru Sil", <Text size="sm">Geri alınamaz. Emin misiniz?</Text>);
    if (!ok) return;
  
  
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id);
  
    if (error) {
      console.error('Silme hatası:', error.message);
    } else {
      onDelete?.(id);
    }
  }
  async function handleOperationStatusUpdate(newStatus: boolean) {
 
  
    // UI state
    setOperationStarted(newStatus);
  
    // DB update
    const { error } = await supabase
      .from('applications')
      .update({ operation_started: newStatus })
      .eq('id', app.id);
  
    if (error) {
      console.error('Operasyon durumu güncellenemedi:', error.message);
  
      // rollback
      setOperationStarted(!newStatus);
  
      showNotification({
        title: 'Hata',
        message: 'Operasyon durumu güncellenemedi.',
        color: 'red',
      });
    } else {
      showNotification({
        title: 'Başarılı',
        message: newStatus
          ? 'Operasyon süreci başlatıldı.'
          : 'Operasyon süreci durduruldu.',
        color: 'green',
      });
    }
  }

  async function handleSalesStatusUpdate(newStatus: boolean) {
   
    const ok = await confirm(
      newStatus ? 'Ödeme Onayı' : 'Ödeme Yapılmadı Geri Al',
      <Text size="sm">
        {newStatus
          ? 'Bu başvuruda ödeme yapıldığını onaylıyor musunuz?'
          : 'Ödeme bilgisini geri almak istediğinize emin misiniz?'}
      </Text>
    );
  
    if (!ok) return; 
    setSalesStatus(newStatus);
  
    const { error } = await supabase
      .from('applications')
      .update({ sales_status: newStatus })
      .eq('id', app.id);
  
    if (error) {
      console.error('Satış durumu güncellenemedi:', error.message);
      showNotification({
        title: 'Hata',
        message: 'Ödeme durumu güncellenemedi.',
        color: 'red',
      });
    } else {
      showNotification({
        title: 'Başarılı',
        message: newStatus
          ? 'Ödeme durumu "Yapıldı" olarak güncellendi.'
          : 'Ödeme durumu "Yapılmadı" olarak güncellendi.',
        color: 'green',
      });
    }
  }
  // async function handleTicketToggle() {
  //   const newStatus = !ticketStatus;
  //   setTicketStatus(newStatus); 
  
  //   const { error } = await supabase
  //     .from("applications")
  //     .update({ flight_ticket: newStatus })
  //     .eq("id", app.id);
  


  //   if (error) {
  //     console.error("Uçak bileti güncelleme hatası:", error.message);
  //     setTicketStatus(!newStatus); 
  //   }

  //   const { data, error: errFn } = await supabase.functions.invoke("bridge-to-b", {
  //     body: {
  //       action: "update_ticket",
  //       user_id: app.id,
  //       flight_booked: !ticketStatus,
  //       date: appointmentDate,
  //     },
  //   });
  //   if (errFn) throw new Error(errFn.message);


    

  //   const statusText = newStatus ? 'Alındı' : 'Alınmadı';
  useEffect(() => {
    if (app?.sales_owner) {
      setSelectedSeller(app.sales_owner);
    }
  }, [app?.sales_owner]);


  //   notifications.show({
  //     title: 'Bilgi',
  //     message: (
  //       <span className="text-lg">
  //         Uçak bileti <strong className="font-bold">{statusText}</strong> olarak güncellendi.
  //       </span>
  //     ),
  //     color: newStatus ? 'green' : 'red',
  //     autoClose: 3000,
  //   });
  // }


  const handleSave = async () => {
    setIsEditing(false);
   

    try {
      const { error } = await supabase
        .from("applications")
        .update({ country })        // country alanını güncelle
        .eq("id", app.id);          // id'ye göre filtrele

      if (error) throw error;
      showNotification({
        title: 'Başarılı',
        message: 'Ülke başarıyla güncellendi',
        color: 'green',
      });
    
    } catch (err) {
      showNotification({
        title: 'Hata',
        message: 'Güncelleme Hatası',
        color: 'red',
      });
    } finally {
    
    }
  };

    return (
      <Card  className="transition-transform"
       withBorder shadow="sm" radius="md" mb="lg" p="lg"   style={{
        backgroundColor: operationStarted ? "#dcfce7" : "white", 
      }}>
        
        <Group justify="space-between" align="flex-start" wrap="nowrap">
         
          <div style={{ flex: 1 }}>
            <Group justify="space-between" mb="xl">
            <Group gap="xs">
  <IconUser size={22} stroke={2} color="#333" />
  <Text fw={900} fz="xl">
    {app.full_name} {app.surname?.toUpperCase()}
  </Text>
  {isFamily && <IconUsers size={20} stroke={2} color="#555" />}

</Group>
<Badge
        color={appointmentStatus === 'Randevu Alınacak' ? 'red' : 'green'}
        variant="light"
        size="lg"
        radius="xl"
        leftSection={appointmentStatus === 'Randevu Alınacak' ? <IconClock size={14}/> : <IconCheck size={14}/>}
      >
        {appointmentStatus}
      </Badge>
            </Group>
  
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <Card withBorder radius="md" padding="md" bg="blue.0">
      <Group gap="xs" justify="space-between" align="center">
        <Group gap="xs">
          <IconGlobe size={16} color="blue" />
          <div>
            <Text size="xs" c="dimmed">Ülke</Text>
            {isEditing ? (
              <TextInput
                value={country}
                onChange={(e) => setCountry(e.currentTarget.value)}
                onBlur={handleSave}
                size="xs"
                autoFocus
              />
            ) : (
              <Text fw={500} c="blue">{country}</Text>
            )}
          </div>
        </Group>

    
        <ActionIcon
          variant="subtle"
          color={isEditing ? 'green' : 'blue'}
          onClick={() => {
            if (isEditing) handleSave();
            else setIsEditing(true);
          }}
        >
          {isEditing ? <IconCheck size={20} /> : <IconEdit size={20} />}
        </ActionIcon>
      </Group>
    </Card>
  
              <Card withBorder radius="md" padding="md" bg="green.0">
                <Group gap="xs">
                  <IconCalendarCheck size={16} color="green" />
                  <div>
                    <Text size="xs" c="dimmed">Başvuru Tarihi</Text>
                    <Text fw={500} c="green">{new Date(app.created_at).toLocaleString('tr-TR')}</Text>
                  </div>
                </Group>
              </Card>
  
              <Card withBorder radius="md" padding="md" bg="violet.0">
                <Group gap="xs">
                  <IconUser size={16} color="violet" />
                  <div>
                    <Text size="xs" c="dimmed">Başvuru Sayısı</Text>
                    <Text fw={500} c="violet">{kisiSayisi}</Text>
                  </div>
                </Group>
              </Card>

              <Card withBorder radius="md" padding="md" bg="blue.0">
                <Group gap="xs">
                  <IconUser size={16} color="blue" />
                  <div>
                    <Text size="xs" c="dimmed">Şehir</Text>
                    <Text fw={500} c="blue">{app.city}</Text>
                  </div>
                </Group>
              </Card>

              <Card withBorder radius="md" padding="md" bg="yellow.0">
              <Group gap="md">
  <div>
    <Text size="xs" c="dimmed">Seyahat Başlangıç</Text>
    <Text fw={500} c="blue">{app.tripStart || "-"}</Text>
  </div>
  <div>
    <Text size="xs" c="dimmed">Seyahat Bitiş</Text>
    <Text fw={500} c="blue">{app.tripEnd || "-"}</Text>
  </div>
</Group>
              </Card>
              <Card withBorder radius="md" padding="md" bg="violet.0">
                <Group gap="xs">
                  <IconUser size={16} color="violet" />
                  <div>
                    <Text size="xs" c="dimmed">Başvuru Sayısı</Text>
                    <Text fw={500} c="violet">{app.visa_type}</Text>
                  </div>
                </Group>
              </Card>
              <>
     
          {/* Sol taraf */}
          

          {/* Sağ taraf: Note ikonu */}
          {app.form_note && (
  <Card
    onClick={() => setNoteModalOpen(true)}
    withBorder
    radius="md"
    padding="md"
    bg="red.0"
    style={{ gridColumn: "span 0" }}
    // ✅ SimpleGrid item'inde width verme, grid zaten yönetiyor
  >
    <Group gap="xs" justify="space-between">
      <ActionIcon variant="subtle" color="red" title="Müşteri Notunu Gör">
        <IconNote size={50} />
      </ActionIcon>
     
    <div style={{ flex: 1, textAlign: "left" }}>
        <Text fw={500} c="dimmed">Note !</Text>
      </div>
    </Group>
  </Card>
)}

<Card
   onClick={() => {
    if (!app.seller_note) {
      setSellerNoteModalOpen(true);
    }
    else
    {
      setSellerNoteModalOpens(true)
    }
  }}
  withBorder
  radius="md"
  padding="md"
  bg="orange.0"
  style={{ gridColumn: "span 1" }}
>
  <Group gap="xs" justify="space-between">
    <ActionIcon
      variant="subtle"
      color="orange"
      title="Satışçı Notu"
    >
      <IconPencil size={50} />
    </ActionIcon>

    <div style={{ flex: 1, textAlign: "left" }}>
      <Text fw={500} c="dimmed">Satışçı Notu</Text>

      {app.seller_note?.trim() ? (
        <Text size="sm" c="green" fw={500}>
          Not Mevcut
        </Text>
      ) : (
        <Text size="sm" c="gray">
          Not bırakmak ister misiniz?
        </Text>
      )}
    </div>
  </Group>
</Card>


<Modal
  opened={sellerNoteModalOpen}
  onClose={() => setSellerNoteModalOpen(false)}
  title="Satışçı Notu"
  centered
>


  <div className="flex items-center gap-2">
    {saving ? (
      <Text size="xs" c="dimmed">Kaydediliyor…</Text>
    ) : lastSavedAt ? (
      <Text size="xs" c="dimmed">Kaydedildi: {lastSavedAt}</Text>
    ) : null}
  </div>

  <div className="relative mt-2">
    <Textarea
      placeholder="Bu başvuruya özel satışçı notunuzu yazın…"
      autosize
      minRows={5}
      value={sellerNote}
      onChange={(e) =>
        setsellerNote(e.currentTarget.value.slice(0, maxChars))
      }
      onFocus={() => setHighlighted(false)}
      onBlur={() => {
        if (sellerNote.trim()) setHighlighted(true);
        // İstersen blur’da otomatik kaydet:
        // handleSaveSellerNote();
      }}
      styles={{
        input: {
          fontSize: 14,
          fontFamily: "sans-serif",
          backgroundColor: highlighted ? "#d1fae5" : "white",
          transition: "background-color 0.3s ease",
        },
      }}
    />

    <Text
      size="xs"
      c={sellerNote.length >= maxChars ? "red" : "dimmed"}
      className="absolute bottom-2 right-3"
    >
      {maxChars - sellerNote.length}
    </Text>
  </div>

  {/* Opsiyonel: Kaydet butonu */}
  <Group justify="flex-end" mt="sm">
    <Button
      size="xs"
      loading={saving}
      onClick={handleSaveSellerNote}
    >
      Gönder
    </Button>
  </Group>
</Modal>
      {/* Modal */}
      <Modal
        opened={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        title="Müşteri Notu"
        centered
      >
        <Text size="sm">{app.form_note || "Not bulunamadı."}</Text>
      </Modal>
      <Modal
        opened={sellerNoteModalOpens}
        onClose={() => setSellerNoteModalOpens(false)}
        title="Satışçı Notu"
        centered
      >
        <Text size="sm">{app.seller_note || "Not bulunamadı."}</Text>
      </Modal>
    </>

            </SimpleGrid>
            
          </div>
  
          <div className="min-w-[210px] flex flex-col gap-3 mt-16">
          <Button
  onClick={() => {
   
    setSelectedApp({
      ...app,
      appointment_status: appointmentStatus 
    });
    setOpened(true);
  }}
  leftSection={<IconEye size={16} />}
  color="blue"
  fullWidth
  radius="md"
  className="transition-transform duration-200 hover:scale-[1.03] hover:shadow-md"
>
  Detay
</Button>

            <Modal
  opened={opened}
  onClose={() => setOpened(false)}
  size="75%"
  radius="md"
  padding={0}
  centered
  withCloseButton={false} 

  styles={{
    content: {
      background: "transparent",
      boxShadow: "none",
    },
    body: {
      padding: 0,
    },
  }}
>

  <div
    style={{
      background: "rgba(255, 255, 255, 0.47)",
      backdropFilter: "blur(10px)",
      padding: "25px",
      borderRadius: "12px",
      position: "relative",
    }}
  >
    <button
      onClick={() => setOpened(false)}
      style={{
        position: "absolute",
        top: 5,
        right: 10,
        background: "transparent",
        border: "none",
        fontSize: 20,
        cursor: "pointer",
      }}
    >
      ✕
    </button>

    <Card withBorder shadow="sm" radius="md" p="lg">
 
  <ApplicationDetailModal
    title="1. Başvuru Sahibi"
    app={selectedApp}
    isFamily={isFamily}
    personIndex={0} 
  />

  {isFamily &&
    relatedApps.map((rel, i) => (
      <ApplicationDetailModal
        key={rel.id}
        title={`${i + 2}. Başvuru Sahibi`}
        app={rel}
        isFamily={true}
        personIndex={i + 1}
      />
  ))}
</Card>
    
  </div>
</Modal>

  
            <Text size="m" c="red"  fw={600} className="flex items-center gap-2 mb-2">
  <span className="text-red-500 text-xl">●</span>
  Randevu Durumu
</Text>

<Select
  data={['Randevu Alındı', 'Randevu Alınacak']}
  value={appointmentStatus}
  onChange={(val) => handleAppointmentStatusChange(val || '')}
  size="sm"
  radius="md"
/>
  
<Text size="m" c="green" fw={600} className="flex items-center gap-2 mb-2">
  <span className="text-green-500 text-xl">●</span> Randevu Tarihi
</Text>

<DatePickerInput
  placeholder="Tarih seçin"
  value={appointmentDate}
  onChange={(val:any) =>handleAppointmentDateChange(val)}
  valueFormat="DD.MM.YYYY"
  locale="tr"
  leftSection={<IconCalendar size={16} />}
  size="sm"
  radius="md"
/>
  {appointmentStatus === 'Randevu Alındı' && (
  <>
    
    {/* <Text size="m" c="violet" fw={600} className="flex items-center gap-2 mb-2">
  <span className="text-violet-900 text-xl">●</span> Uçak Bileti
</Text> */}
{/* <Button
  fullWidth
  variant="outline"
  color={ticketStatus ? "green" : "violet"}
  radius="md"
  leftSection={
    ticketStatus ? <IconCheck size={16} /> : <IconPlaneTilt size={16} />
  }
  onClick={handleTicketToggle}
>
  {ticketStatus ? "Uçak bileti alındı" : "Uçak bileti alınacak"}
</Button> */}
  </>
)}
  <Text size="m" c="blue" fw={600} className="flex items-center gap-2 mb-2 mt-4">
  <span className="text-blue-500 text-xl">●</span> Ödeme Durumu
</Text>

<Switch
  size="md"
  color="green"
  onLabel={<IconCheck size={14} />}
  offLabel={<IconX size={14} />}
  label={salesStatus ? 'Ödeme Yapıldı' : 'Ödeme Yapılmadı'}
  checked={salesStatus}
  onChange={(e) => handleSalesStatusUpdate(e.currentTarget.checked)}
  radius="md"
/>
<Text
  size="m"
  fw={600}
  className="flex items-center gap-2 mb-2 mt-4"
  c={operationStarted ? "yellow" : "yellow"}
>
  <span
    className={`text-xl ${
      operationStarted ? "text-green-500" : "text-yellow-500"
    }`}
  >
    ●
  </span>
  Operasyon Ne Durumda
</Text>
<div
  className={`p-3 rounded-lg transition-all duration-300 ${
    operationStarted
      ? "bg-green-500/15 border border-green-500/30"
      : "bg-red-500/15 border border-red-500/30"
  }`}
>
  <Switch
    size="md"
    color={operationStarted ? "green" : "red"}
    onLabel={<IconCheck size={14} />}
    offLabel={<IconX size={14} />}
    label={operationStarted ? "Başladı" : "Başlamadı"}
    checked={operationStarted}
    onChange={(e) =>
      handleOperationStatusUpdate(e.currentTarget.checked)
    }
    radius="md"
  />
</div>
<Text size="m" c="black" fw={600} className="flex items-center gap-2 mb-2 mt-4">
  <span className="text-black-500 text-xl">●</span> Satış Sorumlusu
</Text>
<Radio.Group
  mt="sm"
  value={selectedSeller ?? ""}
  onChange={(val) => handleSellerChange(val || null)}
>
  <div className="flex flex-col gap-3 -mt-3 mb-2">
    <Radio value="İbrahim Hatipoğlu" label="İbrahim Hatipoğlu" />
    <Radio value="Seren Yakut" label="Seren Yakut" />
    <Radio value="Melike Sözer" label="Melike" />
  </div>
</Radio.Group>


           
  <Button
  variant="outline"
  color="red"
  fullWidth
  leftSection={<IconTrash size={16} />}
  size="sm"
  radius="md"
  onClick={() => handleDeleteApplication(app.id)}
>
  Sil
</Button>
          </div>
        </Group>
      </Card>
    );
  }