import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTemplateFilters, useActivitiesBySubsystemAndFrequency } from '@/hooks/useTemplates';
import { useCreateWorkReportMutation } from '@/hooks/useWorkReports';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/ui/Button';
import { MultiSelect } from '@/shared/ui/MultiSelect';
import { SignaturePad } from '@/shared/ui/SignaturePad';
import { ImageUpload } from '@/shared/ui/ImageUpload';
import { WorkReportPreview } from '../components/WorkReportPreview'; // We might need to update preview too, but focusing on form first
import { workReportSchema, WorkReportFormValues } from '../schemas/workReportSchema';
import { Save, Loader2, AlertCircle, Check, X } from 'lucide-react';
import Image from 'next/image';

const mockWorkers = [
  { value: 'ana_garcia', label: 'Ana García' },
  { value: 'carlos_ruiz', label: 'Carlos Ruiz' },
  { value: 'luis_perez', label: 'Luis Pérez' },
  { value: 'maria_lopez', label: 'María López' },
  { value: 'jose_hernandez', label: 'José Hernández' },
];

const mockTools = [
  { value: 'llave_ajustable', label: 'Llave ajustable' },
  { value: 'taladro', label: 'Taladro' },
  { value: 'multimetro', label: 'Multímetro' },
  { value: 'escalera', label: 'Escalera' },
  { value: 'equipo_seguridad', label: 'Equipo de seguridad' },
];

const mockSpareParts = [
  { value: 'cable_utp', label: 'Cable UTP' },
  { value: 'conector_rj45', label: 'Conector RJ45' },
  { value: 'cinta_aislante', label: 'Cinta aislante' },
  { value: 'tornillos', label: 'Tornillos' },
];

export const NewWorkReportPage: React.FC = () => {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<WorkReportFormValues>({
    resolver: zodResolver(workReportSchema) as any,
    defaultValues: {
      fechaHoraInicio: new Date().toISOString().slice(0, 16),
      turno: '',
      trabajadores: [],
      actividadesRealizadas: [],
      herramientas: [],
      refacciones: [],
      nombreResponsable: 'Juan Supervisor',
      firmaResponsable: undefined,
      templateIds: [],
    }
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "actividadesRealizadas"
  });

  const fechaHoraInicio = watch('fechaHoraInicio');
  const subsistema = watch('subsistema');
  const frecuencia = watch('frecuencia');

  // --- Dynamic Filtering Logic ---
  const { data: filtersData, isLoading: isLoadingFilters } = useTemplateFilters('work');
  const subsystems = filtersData?.subsistemas || [];

  const { data: freqData, isLoading: isLoadingFreq } = useTemplateFilters('work', subsistema || undefined);
  const frequencies = freqData?.frecuencias || [];

  const { data: activities, isLoading: isLoadingActivities } = useActivitiesBySubsystemAndFrequency({
    tipoReporte: 'work',
    subsistema: subsistema || undefined,
    frecuenciaCodigo: frecuencia || undefined,
  });

  // Auto-populate activities when they load
  useEffect(() => {
    if (activities && activities.length > 0) {
      const newActivities = activities.map(a => ({
        templateId: a.id,
        realizado: false,
        observaciones: '',
        evidencias: []
      }));
      replace(newActivities);
    } else {
      replace([]);
    }
  }, [activities, replace]);

  // Auto-calculate shift
  useEffect(() => {
    if (fechaHoraInicio) {
      const date = new Date(fechaHoraInicio);
      const hour = date.getHours();
      let shift = 'Nocturno';
      if (hour >= 6 && hour < 14) shift = 'Matutino';
      else if (hour >= 14 && hour < 22) shift = 'Vespertino';
      setValue('turno', shift);

      const endDate = new Date(date.getTime() + 60 * 60 * 1000);
      const offset = endDate.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(endDate.getTime() - offset)).toISOString().slice(0, 16);
      setValue('fechaHoraTermino', localISOTime);
    }
  }, [fechaHoraInicio, setValue]);

  // Auto-set start time on mount
  useEffect(() => {
    const currentStart = watch('fechaHoraInicio');
    if (!currentStart) {
      setValue('fechaHoraInicio', new Date().toISOString().slice(0, 16));
    }
  }, []);

  const createReportMutation = useCreateWorkReportMutation();
  const router = useRouter();

  const onSubmit = async (data: WorkReportFormValues) => {
    if (!data.actividadesRealizadas || data.actividadesRealizadas.length === 0) {
      alert('No hay actividades para reportar.');
      return;
    }

    // Convert evidences for each activity
    const actividadesConEvidencias = await Promise.all(
      data.actividadesRealizadas.map(async (act) => {
        const evidencias = await Promise.all((act.evidencias || []).map(async (file: any) => {
          if (file instanceof File) {
            return new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });
          }
          return file;
        }));
        return { ...act, evidencias };
      })
    );

    const payload = {
        ...data,
        actividadesRealizadas: actividadesConEvidencias,
        templateIds: data.actividadesRealizadas.map(a => a.templateId),
        tipoMantenimiento: 'Preventivo'
    };

    console.log('Form Data Submitted:', payload);
    
    try {
      const result = await createReportMutation.mutateAsync(payload as any);
      alert('Reporte generado exitosamente');
      router.push(`/reports/${(result as any)._id}`);
    } catch (error) {
      console.error("Error creating report:", error);
      alert('Error al generar el reporte');
    }
  };

  // Helper to get activity name by ID
  const getActivityName = (id: string) => {
    return activities?.find(a => a.id === id)?.name || 'Actividad desconocida';
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-[1200px] mx-auto bg-white rounded-lg shadow-xl overflow-hidden border-4 border-blue-900">
        
        {/* Header */}
        <div className="bg-white p-6 border-b-4 border-blue-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
             {/* Logo Placeholder */}
             <div className="w-48 h-16 bg-gray-200 flex items-center justify-center text-gray-400 font-bold italic">
                LOGO IMA
             </div>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-blue-900 uppercase tracking-wide">Formato de trabajo proyecto</h1>
            <h2 className="text-xl font-bold text-blue-900 uppercase tracking-wide">AEROTREN AICM</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit as any)} className="p-6 space-y-6">
          
          {/* Grid Layout for General Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            
            {/* Row 1 */}
            <div className="flex items-center">
              <label className="w-32 bg-blue-900 text-white font-bold py-2 px-3 rounded-l-md text-sm uppercase">Subsistema</label>
              <select
                {...register('subsistema')}
                className="flex-1 border-2 border-blue-200 rounded-r-md py-2 px-3 focus:outline-none focus:border-blue-500"
                disabled={isLoadingFilters}
              >
                <option value="">Seleccionar...</option>
                {subsystems.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <label className="w-32 bg-blue-900 text-white font-bold py-2 px-3 rounded-l-md text-sm uppercase">Fecha y Hora</label>
              <input
                type="datetime-local"
                {...register('fechaHoraInicio')}
                className="flex-1 border-2 border-blue-200 rounded-r-md py-2 px-3 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Row 2 */}
            <div className="flex items-center">
              <label className="w-32 bg-blue-900 text-white font-bold py-2 px-3 rounded-l-md text-sm uppercase">Ubicación</label>
              <input
                type="text"
                {...register('ubicacion')}
                className="flex-1 border-2 border-blue-200 rounded-r-md py-2 px-3 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center">
              <label className="w-32 bg-blue-900 text-white font-bold py-2 px-3 rounded-l-md text-sm uppercase">Turno</label>
              <input
                type="text"
                {...register('turno')}
                readOnly
                className="flex-1 border-2 border-blue-200 rounded-r-md py-2 px-3 bg-gray-50"
              />
            </div>

            {/* Row 3 */}
            <div className="flex flex-col gap-1">
               <label className="bg-blue-900 text-white font-bold py-1 px-3 rounded-t-md text-sm uppercase w-full">Frecuencia:</label>
               <select
                {...register('frecuencia')}
                className="w-full border-2 border-blue-200 rounded-b-md py-2 px-3 focus:outline-none focus:border-blue-500"
                disabled={!subsistema || isLoadingFreq}
              >
                <option value="">{subsistema ? 'Seleccionar...' : 'Selecciona un subsistema primero'}</option>
                {frequencies.map(freq => (
                  <option key={freq.code} value={freq.code}>{freq.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
               <label className="bg-blue-900 text-white font-bold py-1 px-3 rounded-t-md text-sm uppercase w-full">Trabajadores Involucrados:</label>
               <div className="border-2 border-blue-200 rounded-b-md">
                 <Controller
                    name="trabajadores"
                    control={control}
                    render={({ field }) => (
                      <MultiSelect
                        options={mockWorkers}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Seleccionar..."
                        className="border-0 shadow-none"
                      />
                    )}
                  />
               </div>
            </div>

          </div>

          {/* Activities Table */}
          <div className="mt-8">
            <div className="grid grid-cols-[2fr_0.5fr_1.5fr_1fr] gap-2 mb-2">
               <div className="bg-blue-900 text-white font-bold py-2 px-4 rounded-md uppercase text-center">Actividad</div>
               <div className="bg-blue-900 text-white font-bold py-2 px-4 rounded-md uppercase text-center">SI/NO</div>
               <div className="bg-blue-900 text-white font-bold py-2 px-4 rounded-md uppercase text-center">Observaciones</div>
               <div className="bg-blue-900 text-white font-bold py-2 px-4 rounded-md uppercase text-center">Evidencias</div>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-[2fr_0.5fr_1.5fr_1fr] gap-2 items-start">
                  {/* Activity Name */}
                  <div className="border-2 border-blue-200 rounded-md p-3 min-h-[100px] flex items-center bg-white">
                    <span className="font-medium text-gray-800">{getActivityName(field.templateId)}</span>
                  </div>

                  {/* SI/NO Toggle */}
                  <div className="border-2 border-blue-200 rounded-md p-3 min-h-[100px] flex items-center justify-center bg-white">
                    <Controller
                      name={`actividadesRealizadas.${index}.realizado`}
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <button
                          type="button"
                          onClick={() => onChange(!value)}
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${value ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}
                        >
                          {value ? <Check className="w-8 h-8" /> : <X className="w-8 h-8" />}
                        </button>
                      )}
                    />
                  </div>

                  {/* Observations */}
                  <div className="border-2 border-blue-200 rounded-md min-h-[100px] bg-white">
                    <textarea
                      {...register(`actividadesRealizadas.${index}.observaciones`)}
                      className="w-full h-full p-3 resize-none focus:outline-none rounded-md"
                      placeholder="Escriba observaciones..."
                    />
                  </div>

                  {/* Evidences */}
                  <div className="border-2 border-blue-200 rounded-md min-h-[100px] p-2 bg-white flex flex-col justify-center">
                     <Controller
                        name={`actividadesRealizadas.${index}.evidencias`}
                        control={control}
                        render={({ field }) => (
                          <ImageUpload
                            onChange={field.onChange}
                            compact
                          />
                        )}
                      />
                  </div>
                </div>
              ))}
              
              {fields.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-md">
                  Selecciona un subsistema y frecuencia para ver las actividades.
                </div>
              )}
            </div>
          </div>

          {/* Tools & Parts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div>
               <div className="bg-blue-900 text-white font-bold py-2 px-4 rounded-t-md uppercase text-center">Herramientas Utilizadas:</div>
               <div className="border-2 border-blue-200 rounded-b-md p-4 bg-white min-h-[150px]">
                  <Controller
                      name="herramientas"
                      control={control}
                      render={({ field }) => (
                        <MultiSelect
                          options={mockTools}
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder="Seleccionar..."
                          className="border-0 shadow-none"
                        />
                      )}
                    />
               </div>
            </div>
            <div>
               <div className="bg-blue-900 text-white font-bold py-2 px-4 rounded-t-md uppercase text-center">Refacciones Utilizadas:</div>
               <div className="border-2 border-blue-200 rounded-b-md p-4 bg-white min-h-[150px]">
                  <Controller
                      name="refacciones"
                      control={control}
                      render={({ field }) => (
                        <MultiSelect
                          options={mockSpareParts}
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder="Seleccionar..."
                          className="border-0 shadow-none"
                        />
                      )}
                    />
               </div>
            </div>
          </div>

          {/* General Observations */}
          <div className="mt-8">
             <div className="bg-blue-900 text-white font-bold py-2 px-4 rounded-t-md uppercase text-center">Observaciones Generales</div>
             <div className="border-2 border-blue-200 rounded-b-md bg-white">
                <textarea
                  {...register('observacionesGenerales')}
                  rows={4}
                  className="w-full p-4 resize-none focus:outline-none rounded-b-md"
                  placeholder="Comentarios generales del reporte..."
                />
             </div>
          </div>

          {/* Footer: Signatures & End Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
             <div>
                <div className="bg-blue-900 text-white font-bold py-2 px-4 rounded-t-md uppercase text-center">Nombre y Firma de Supervisor</div>
                <div className="border-2 border-blue-200 rounded-b-md p-4 bg-white">
                   <input
                      type="text"
                      {...register('nombreResponsable')}
                      className="w-full border-b border-gray-300 py-2 mb-4 focus:outline-none focus:border-blue-500"
                      placeholder="Nombre del supervisor"
                    />
                   <Controller
                      name="firmaResponsable"
                      control={control}
                      render={({ field }) => (
                        <SignaturePad
                          onChange={field.onChange}
                        />
                      )}
                    />
                </div>
             </div>
             <div>
                <div className="bg-blue-900 text-white font-bold py-2 px-4 rounded-t-md uppercase text-center">Fecha y Hora de Termino</div>
                <div className="border-2 border-blue-200 rounded-b-md p-4 bg-white flex items-center justify-center h-full">
                   <input
                      type="datetime-local"
                      {...register('fechaHoraTermino')}
                      className="w-full border-2 border-blue-200 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                    />
                </div>
             </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-8">
            <Button
              type="submit"
              className="w-full md:w-auto px-12 py-4 text-lg bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-md shadow-lg transform transition hover:scale-105"
              isLoading={isSubmitting}
            >
              <Save className="w-6 h-6 mr-2" />
              GUARDAR REPORTE
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};
