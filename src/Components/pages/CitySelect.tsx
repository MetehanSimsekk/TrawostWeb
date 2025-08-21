import { useEffect, useState, Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon, MagnifyingGlassIcon, MapPinIcon } from "@heroicons/react/24/outline";

export default function CitySelectRemote({ value, onChange, error, required }: {
  value?: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
}) {
  const [all, setAll] = useState<string[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("https://turkiyeapi.dev/api/v1/provinces");
        const j = await r.json();
        setAll((j?.data ?? []).map((x: any) => x.name));
      } catch { /* istersen local fallback koy */ }
    })();
  }, []);

  const filtered = q
    ? all.filter((c) => c.toLowerCase().includes(q.toLowerCase()))
    : all;

  return (
    <div className="sm:col-span-1">
    
      <label className="block text-m font-semibold text-gray-600 mb-1">
        Şehir {required && <span className="text-red-500">*</span>}
      </label>
      <div className="sm:col-span-1 mb-6"> 
    
      <Menu as="div" className="relative inline-block w-full text-left">
        <Menu.Button
          className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-base shadow-sm ring-1 ring-inset
            ${error ? "border-red-500 ring-red-500 bg-red-50" : "bg-white border-gray-300 ring-gray-300 hover:bg-gray-50"}`}
        >
          <span className={`flex items-center gap-2 ${value ? "text-gray-900" : "text-gray-400"}`}>
          
            {value || "Şehir seçiniz"}
          </span>
          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
        </Menu.Button>

        <Transition as={Fragment}
          enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
          <Menu.Items className="absolute z-20 mt-2 w-full origin-top-left rounded-lg bg-white p-2 shadow-lg ring-1 ring-black/5 focus:outline-none">
            <div className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              <input className="w-full outline-none text-sm" placeholder="Şehir ara…"
                     value={q} onChange={(e) => setQ(e.target.value)} />
            </div>

            <div className="mt-2 max-h-64 overflow-y-auto rounded-md">
              {filtered.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">Sonuç yok</div>
              )}
              {filtered.map((c) => (
                <Menu.Item key={c}>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={() => { onChange(c); setQ(""); }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md ${active ? "bg-red-100 text-red-800" : "text-gray-900"}`}>
                      {c}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}