import React from 'react';
import { useForm } from '@inertiajs/react';
import { format } from 'date-fns';

interface FiltersProps {
  onFilterChange: (filters: any) => void;
  sites: string[];
  clients: string[];
  supervisors: string[];
}

export default function ScanTagFilters({ onFilterChange, sites, clients, supervisors }: FiltersProps) {
  const { data, setData } = useForm({
    site: '',
    client: '',
    supervisor: '',
    dateFrom: '',
    dateTo: '',
    locationLat: '',
    locationLng: '',
    radius: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData(name as any, value);
    
    const filters: any = { ...data, [name]: value };
    onFilterChange({
      site: filters.site || undefined,
      client: filters.client || undefined,
      supervisor: filters.supervisor || undefined,
      dateRange: (filters.dateFrom || filters.dateTo) ? {
        start: filters.dateFrom,
        end: filters.dateTo
      } : undefined,
      locationRadius: (filters.locationLat && filters.locationLng && filters.radius) ? {
        lat: parseFloat(filters.locationLat),
        lng: parseFloat(filters.locationLng),
        radius: parseFloat(filters.radius)
      } : undefined
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <select
        name="site"
        value={data.site}
        onChange={handleChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
      >
        <option value="">All Sites</option>
        {sites.map(site => (
          <option key={site} value={site}>{site}</option>
        ))}
      </select>

      <select
        name="client"
        value={data.client}
        onChange={handleChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
      >
        <option value="">All Clients</option>
        {clients.map(client => (
          <option key={client} value={client}>{client}</option>
        ))}
      </select>

      <select
        name="supervisor"
        value={data.supervisor}
        onChange={handleChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
      >
        <option value="">All Supervisors</option>
        {supervisors.map(supervisor => (
          <option key={supervisor} value={supervisor}>{supervisor}</option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          name="dateFrom"
          value={data.dateFrom}
          onChange={handleChange}
          placeholder="From Date"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
        <input
          type="date"
          name="dateTo"
          value={data.dateTo}
          onChange={handleChange}
          placeholder="To Date"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <input
          type="number"
          step="any"
          name="locationLat"
          value={data.locationLat}
          onChange={handleChange}
          placeholder="Latitude"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
        <input
          type="number"
          step="any"
          name="locationLng"
          value={data.locationLng}
          onChange={handleChange}
          placeholder="Longitude"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
        <input
          type="number"
          name="radius"
          value={data.radius}
          onChange={handleChange}
          placeholder="Radius (km)"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>
    </div>
  );
}