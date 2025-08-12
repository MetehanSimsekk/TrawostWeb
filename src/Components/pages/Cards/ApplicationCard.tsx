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
  } from '@mantine/core';
  import { IconUser, IconCalendar, IconCalendarCheck, IconGlobe, IconSearch, IconEye, IconTrash, IconClock, IconUsers } from '@tabler/icons-react';
  import { JSX, useState } from 'react';
  import { IconCheck, IconPlaneTilt } from '@tabler/icons-react';
  import { DatePickerInput, DateTimePicker } from '@mantine/dates';
import ApplicationDetailModal from './ApplicationDetailModal';
import { supabase } from '../../../services/supabase';
import { notifications } from '@mantine/notifications';

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
    const [ticketStatus, setTicketStatus] = useState<boolean>(app.flight_ticket ?? false);

    
    const [appointmentDate, setAppointmentDate] = useState<Date | any>(app.appointment_date);

    const [opened, setOpened] = useState(false);
    const [selectedApp, setSelectedApp] = useState<any>(null);
// const [selectedApp, setSelectedApp] = useState(null);

const [statusById, setStatusById] = useState<Record<string, string>>({});



async function handleAppointmentStatusChange(newStatus: any) {
    if (!newStatus) return;
  
    const prevStatus = appointmentStatus;
    setAppointmentStatus(newStatus); 
  
    const { error } = await supabase
      .from('applications')
      .update({ appointment_status: newStatus })
      .eq('id', app.id);
      notifications.show({
        title: 'Bilgi',
        message: (
            <>
              Randevu durumu <strong className="font-bold">{newStatus}</strong> olarak güncellendi.
            </>
          ),
        color: 'red',
        autoClose: 3000,
      });
    if (error) {
      console.error('Güncelleme hatası:', error.message);
      setAppointmentStatus(prevStatus); 
    }
 
  }
 

  async function handleAppointmentDateChange(newDate: Date | null) {
  
    if (!newDate) return;
  
    const prevDate = appointmentDate;
    setAppointmentDate(newDate); 
  
 
    
  
    const { error } = await supabase
      .from('applications')
      .update({ appointment_date: newDate })  
      .eq('id', app.id);
  
    if (error) {
      console.error('Randevu tarihi güncellenemedi:', error.message);
      setAppointmentDate(prevDate); 
    }
  }

  async function handleDeleteApplication(id: string) {
    
  
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

  async function handleTicketToggle() {
    const newStatus = !ticketStatus;
    setTicketStatus(newStatus); 
  
    const { error } = await supabase
      .from("applications")
      .update({ flight_ticket: newStatus })
      .eq("id", app.id);
  
    if (error) {
      console.error("Uçak bileti güncelleme hatası:", error.message);
      setTicketStatus(!newStatus); 
    }
    const statusText = newStatus ? 'Alındı' : 'Alınmadı';

    notifications.show({
      title: 'Bilgi',
      message: (
        <span className="text-lg">
          Uçak bileti <strong className="font-bold">{statusText}</strong> olarak güncellendi.
        </span>
      ),
      color: 'red',
      autoClose: 3000,
    });
  }


    return (
      <Card  className="transition-transform"
       withBorder shadow="sm" radius="md" mb="lg" p="lg">
        
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
        color={status === 'Randevu Alınacak' ? 'red' : 'green'}
        variant="light"
        size="lg"
        radius="xl"
        leftSection={status === 'Randevu Alınacak' ? <IconClock size={14}/> : <IconCheck size={14}/>}
      >
        {status}
      </Badge>
            </Group>
  
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              <Card withBorder radius="md" padding="md" bg="blue.0">
                <Group gap="xs">
                  <IconGlobe size={16} color="blue" />
                  <div>
                    <Text size="xs" c="dimmed">Ülke</Text>
                    <Text fw={500} c="blue">{app.country}</Text>
                  </div>
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
                    <Text fw={500} c="violet">1</Text>
                  </div>
                </Group>
              </Card>
            </SimpleGrid>
          </div>
  
       
          <div className="min-w-[230px] flex flex-col gap-3 mt-16">
          <Button
  onClick={() => {
   
    setSelectedApp({
      ...app,
      appointment_status: status 
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
  />

  {isFamily &&
    relatedApps.map((rel, i) => (
      <ApplicationDetailModal
        key={rel.id}
        title={`${i + 2}. Başvuru Sahibi`}
        app={rel}
        isFamily={true}
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
    
    <Text size="m" c="violet" fw={600} className="flex items-center gap-2 mb-2">
  <span className="text-violet-900 text-xl">●</span> Uçak Bileti
</Text>
<Button
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
</Button>
  </>
)}
  
           
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