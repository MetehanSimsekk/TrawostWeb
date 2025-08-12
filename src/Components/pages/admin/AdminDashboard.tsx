
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
} from '@mantine/core';
import { IconUser, IconCalendar, IconCalendarCheck, IconGlobe, IconSearch, IconEye, IconTrash } from '@tabler/icons-react';
import { JSX, useEffect, useMemo, useState } from 'react';
import logo from '../../../assets/logo/trawostIconHD.png';
import { ApplicationCard } from '../Cards/ApplicationCard';
import { useNavigate } from 'react-router-dom';
import { supabase } from "../../../services/supabase";
import { Application } from '@/types/types';


export default function AdminDashboard() {
 

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('Tümü');
  const [country, setCountry] = useState('Tüm Ülkeler');
  const [applications, setApplications] = useState<Application[]>([]);
  const navigate = useNavigate();
  const [statusById, setStatusById] = useState<Record<string, string>>({});
  const [opened, setOpened] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);

  const stats = {
    total: applications.length, 
    confirmed: applications.filter(a => a.appointment_status === 'Randevu Alındı').length,
    pending: applications.filter(a => a.appointment_status === 'Randevu Alınacak').length,
    uniqueCountries: new Set(applications.map(a => a.country)).size
  };
  

  useEffect(() => {
    const fetchApplications = async () => {
    

      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });
   
      if (error) {
        console.error("Veri çekme hatası:", error.message);
      } else {
        setApplications(data || []);
      }

    
    };

    fetchApplications();
  }, []);



  const handleLogout = () => {
    console.log("logout");
     supabase.auth.signOut(); 
  
    localStorage.removeItem('isAdmin');
    navigate("/login");
  };


  const groupedByCode = useMemo(() => {
    const m = new Map<string, any[]>();
    applications.forEach(a => {
      const k = a.basvuru_grup_kodu || '';
      if (!k) return;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(a);
    });
    return m;
  }, [applications]);
  

  const groupCounts = useMemo(() => {
    const m = new Map<string, number>();
    applications.forEach((a: any) => {
      const k = a.basvuru_grup_kodu ?? "";
      if (!k) return;
      m.set(k, (m.get(k) || 0) + 1);
    });
    return m;
  }, [applications]);
  
  const filteredApplications = useMemo(() => {
    return applications.filter((app: any) => {
      const matchName =
        search.trim() === '' ||
        (app.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (app.surname || '').toLowerCase().includes(search.toLowerCase());
  
      const matchStatus =
        status === '' || status === 'Tümü' || app.appointment_status === status;
  
      const matchCountry =
        country === '' || country === 'Tüm Ülkeler' || app.country === country;
  
      return matchName && matchStatus && matchCountry;
    });
  }, [applications, search, status, country]);
  
  useEffect(() => {
    setStatusById(prev => {
      const next = { ...prev };
      applications.forEach(a => {
        if (!next[a.id]) next[a.id] = a.appointment_status ?? 'Randevu Alınacak';
      });
      return next;
    });
  }, [filteredApplications]);
  
  // const filteredApplications = applications.filter((app:any) => {
  
  //   const matchName =
  //   search.trim() === '' ||
  //   (app.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
  //   (app.surname || '').toLowerCase().includes(search.toLowerCase());
  
  
  //   const matchStatus =
  //     status === '' || status === 'Tümü' || app.appointment_status === status;
  

  //   const matchCountry =
  //     country === '' || country === 'Tüm Ülkeler' || app.country === country;
  
  //   return matchName && matchStatus && matchCountry;
  // });

  const handleRemoveFromList = (id: string) => {
    setApplications((prev) => prev.filter((app) => app.id !== id));
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-200">
    <Container   
    size="xl" py="xl"


    > 
     <Group justify="space-between" mb="xl">
  <Group gap="sm" align="center">
    <img
      src={logo}
      alt="Logo"
      style={{
        width: 90,
        height: 90,
        objectFit: "contain",
      }}
    />
    <div>
      <Title
        order={2}
        className="bg-gradient-to-r from-red-500 via-black-500 to-red-500 bg-clip-text text-transparent"
      >
        Trawost Vize Admin Panel
      </Title>
      <Text size="sm" c="dimmed">
        Vize başvurularını yönetin ve randevu durumlarını güncelleyin
      </Text>
    </div>
  </Group>

  <Button variant="outline" color="red" onClick={handleLogout}>
    Çıkış Yap
  </Button>
</Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" mb="xl">
      <StatBox
    icon={<IconUser size={18} />}
    label="Toplam Başvuru"
    value={stats.total}
    color="blue"
    onClick={() => {
      setStatus('Tümü');
    }}
  />
  <StatBox
    icon={<IconCalendarCheck size={18} />}
    label="Randevu Alındı"
    value={stats.confirmed}
    color="green"
    onClick={() => {
      setStatus('Randevu Alındı');
    }}
  />
  <StatBox
    icon={<IconCalendar size={18} />}
    label="Randevu Alınacak"
    value={stats.pending}
    color="red"
    onClick={() => {
      setStatus('Randevu Alınacak');
    }}
  />
  <StatBox
    icon={<IconGlobe size={18} />}
    label="Ülke Sayısı"
    value={stats.uniqueCountries}
    color="violet"
  />
      </SimpleGrid>
      <Card withBorder shadow="sm" mb="md" radius="md"> 
  <Title order={4} mb="md" className="text-red-600 flex items-center gap-2">
    <IconSearch size={20} /> Filtreler
  </Title>
  <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
  <TextInput
  label={
<Text size="sm" c="blue" fw={600} className="flex items-center gap-2 mb-2">
  <span className="text-blue-500 text-base">●</span> İsim Ara
</Text>
  }
  placeholder="Başvuru sahibi adı..."
  value={search}
  onChange={(e) => setSearch(e.currentTarget.value)}
  radius="md"
/>
<Select
  label={
    <Text size="sm" c="red" fw={600} className="flex items-center gap-2 mb-2">
      <span className="text-red-500 text-base">●</span> Randevu Durumu
    </Text>
  }
  data={['Tümü', 'Randevu Alındı', 'Randevu Alınacak']}
  value={status}
  onChange={(value) => setStatus(value || '')}
  radius="md"
/>

<Select
  label={
    <Text size="sm" c="violet" fw={600} className="flex items-center gap-2 mb-2">
      <span className="text-violet-500 text-base">●</span> Ülke
    </Text>
  }
  data={['Tüm Ülkeler', 'Danimarka']}
  value={country}
  onChange={(value) => setCountry(value || '')}
  radius="md"
/>
  </SimpleGrid>
</Card>

<Title
  order={4}
  mb="md"
  className="text-red-600 flex items-center gap-2"
>
  <IconUser size={20} /> Başvurular ({filteredApplications.length})
</Title>

{filteredApplications.map((app: any) => {
  const list = groupedByCode.get(app.basvuru_grup_kodu) || [];
  const relatedApps = list.filter(x => x.id !== app.id); // diğerleri
  return (
    <ApplicationCard
    key={app.id}
    app={app}
    isFamily={relatedApps.length > 0}
    relatedApps={relatedApps}
    onDelete={handleRemoveFromList}

    status={statusById[app.id] ?? 'Randevu Alınacak'}
    setStatus={(v) =>
      setStatusById(s => ({ ...s, [app.id]: v }))
    }
    onOpen={(payload) => {
      setSelectedApp({ ...payload, appointment_status: statusById[app.id] ?? payload.appointment_status });
      setOpened(true);
    }}
  />
  );
})}
    </Container>
    </div>
  );
}
function StatBox({
  icon,
  label,
  value,
  color,
  onClick,
}: {
  icon: JSX.Element;
  label: string;
  value: number;
  color: string;
  onClick?: () => void;
}) {
  return (
    <Card
    shadow="sm"
    padding="lg"
    radius="md"
    withBorder
    onClick={onClick}
    className="cursor-pointer hover:shadow-lg transition-transform duration-200 hover:scale-105"
  >
    <Group justify="center" gap="xs">
      {icon}
      <Text size="lg" fw={600} c={color}>
        {value}
      </Text>
    </Group>
    <Text size="sm" ta="center" c="dimmed">
      {label}
    </Text>
  </Card>
  );
}