import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTemplateFilters, useActivitiesBySubsystemAndFrequency } from '@/hooks/useTemplates';
import { useCreateWorkReportMutation } from '@/hooks/useWorkReports';
import { useWarehouseItems } from '@/hooks/useWarehouse';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/ui/Button';
import { MultiSelect } from '@/shared/ui/MultiSelect';
import { SignaturePad } from '@/shared/ui/SignaturePad';
import { ImageUpload } from '@/shared/ui/ImageUpload';
import { workReportSchema, WorkReportFormValues } from '../schemas/workReportSchema';
import { Save, Check, X, ArrowLeft } from 'lucide-react';
import { Template } from '@/types/template';
import { WorkReportPreview } from '../components/WorkReportPreview';

const mockWorkers = [
  { value: 'ana_garcia', label: 'Ana García' },
  { value: 'carlos_ruiz', label: 'Carlos Ruiz' },
  { value: 'luis_perez', label: 'Luis Pérez' },
  { value: 'maria_lopez', label: 'María López' },
  { value: 'jose_hernandez', label: 'José Hernández' },
];

export const NewWorkReportPage: React.FC = () => {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // --- Form Setup ---
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
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

  const { fields, replace } = useFieldArray({
    control,
    name: "actividadesRealizadas"
  });

  // --- Watchers ---
  const fechaHoraInicio = watch('fechaHoraInicio');
  const subsistema = watch('subsistema');
  const frecuencia = watch('frecuencia');

  // --- Data Fetching ---
  // 1. Filters
  const { data: filtersData, isLoading: isLoadingFilters } = useTemplateFilters('work');
  const subsystems = filtersData?.subsistemas || [];

  const { data: freqData, isLoading: isLoadingFreq } = useTemplateFilters('work', subsistema || undefined);
  const frequencies = freqData?.frecuencias || [];

  // 2. Activities (Templates)
  const { data: activities, isLoading: isLoadingActivities } = useActivitiesBySubsystemAndFrequency({
    tipoReporte: 'work',
    subsistema: subsistema || undefined,
    frecuenciaCodigo: frecuencia || undefined,
  });

  // 3. Warehouse Items (Tools & Parts)
  const { data: inventoryItems } = useWarehouseItems({ status: 'active' });
  const toolsOptions = inventoryItems?.filter(i => i.category?.toLowerCase() === 'herramientas').map(i => ({ value: i.name, label: i.name })) || [];
  const partsOptions = inventoryItems?.filter(i => i.category?.toLowerCase() === 'refacciones').map(i => ({ value: i.name, label: i.name })) || [];

  // --- Effects ---

  // Auto-set start time on mount
  useEffect(() => {
    setValue('fechaHoraInicio', new Date().toISOString().slice(0, 16));
  }, [setValue]);

  // Auto-calculate shift
  useEffect(() => {
    if (fechaHoraInicio) {
      const date = new Date(fechaHoraInicio);
      const hour = date.getHours();
      let shift = 'Nocturno';
      if (hour >= 6 && hour < 14) shift = 'Matutino';
      else if (hour >= 14 && hour < 22) shift = 'Vespertino';
      setValue('turno', shift);
    }
  }, [fechaHoraInicio, setValue]);

  // Reset selection when subsistema changes
  useEffect(() => {
    setValue('frecuencia', '');
    setSelectedTemplate(null);
  }, [subsistema, setValue]);

  // Reset selection when frecuencia changes
  useEffect(() => {
    setSelectedTemplate(null);
  }, [frecuencia]);


  // --- Handlers ---

  const handleSelectActivity = (activity: any) => {
    const template = activity.template as Template;
    setSelectedTemplate(template);

    // Set template ID
    setValue('templateIds', [template._id]);

    // Set single activity in the list
    replace([{
      templateId: template._id,
      realizado: false,
      observaciones: '',
      evidencias: []
    }]);
  };

  const handleBackToSelection = () => {
    setSelectedTemplate(null);
    setValue('templateIds', []);
    replace([]);
  };

  const createReportMutation = useCreateWorkReportMutation();

  const onSubmit = async (data: WorkReportFormValues) => {
    // Auto-set end time
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
    data.fechaHoraTermino = localISOTime;

    // Process evidences
    const actividadesConEvidencias = await Promise.all(
      (data.actividadesRealizadas || []).map(async (act) => {
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
      templateIds: [selectedTemplate?._id],
      tipoMantenimiento: selectedTemplate?.tipoMantenimiento || 'Preventivo'
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

  // --- Render ---

  // Watch values for preview
  const watchedValues = watch();

  // Map form values to preview props
  const previewValues = {
    ...watchedValues,
    // Map the first activity's data to the preview fields
    inspeccionRealizada: watchedValues.actividadesRealizadas?.[0]?.realizado,
    observacionesActividad: watchedValues.actividadesRealizadas?.[0]?.observaciones,
    evidenciasCount: watchedValues.actividadesRealizadas?.[0]?.evidencias?.length || 0,
    // Map workers to string array if needed, or keep as is if Preview expects strings
    trabajadores: watchedValues.trabajadores,
    herramientas: watchedValues.herramientas,
    refacciones: watchedValues.refacciones,
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-[1600px] mx-auto">

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">

          {/* Left Column: Form */}
          <div className="bg-white rounded-lg shadow-xl overflow-hidden border-4 border-blue-900">
            {/* Header */}
            <div className="bg-white p-6 border-b-4 border-blue-900 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-48 h-16 bg-gray-200 flex items-center justify-center text-gray-400 font-bold italic">
                  LOGO IMA
                </div>
              </div>
              <div className="text-right">
                <h1 className="text-2xl font-bold text-blue-900 uppercase tracking-wide">Formato de trabajo proyecto</h1>
                <h2 className="text-xl font-bold text-blue-900 uppercase tracking-wide">AEROTREN AICM</h2>
              </div>
            </div>

            <div className="p-6 space-y-6">

              {/* Phase 1: Selection */}
              {!selectedTemplate && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Selección de Actividad</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subsistema</label>
                      <select
                        {...register('subsistema')}
                        className="w-full border-2 border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                        disabled={isLoadingFilters}
                      >
                        <option value="">Seleccionar...</option>
                        {subsystems.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
                      <select
                        {...register('frecuencia')}
                        className="w-full border-2 border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                        disabled={!subsistema || isLoadingFreq}
                      >
                        <option value="">{subsistema ? 'Seleccionar...' : 'Selecciona un subsistema'}</option>
                        {frequencies.map(freq => (
                          <option key={freq.code} value={freq.code}>{freq.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {subsistema && frecuencia && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Actividades Programadas</h3>
                      {isLoadingActivities ? (
                        <div className="text-center py-8 text-gray-500">Cargando actividades...</div>
                      ) : activities && activities.length > 0 ? (
                        <div className="grid gap-4">
                          {activities.map((activity) => (
                            <button
                              key={activity.id}
                              type="button"
                              onClick={() => handleSelectActivity(activity)}
                              className="text-left w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-lg text-gray-800 group-hover:text-blue-700">{activity.name}</span>
                                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{activity.code}</span>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">{activity.template.tipoMantenimiento}</p>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                          No se encontraron actividades para esta selección.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Phase 2: Form */}
              {selectedTemplate && (
                <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">

                  <div className="flex items-center justify-between mb-6">
                    <Button type="button" variant="ghost" onClick={handleBackToSelection} className="text-gray-600 hover:text-gray-900">
                      <ArrowLeft className="w-4 h-4 mr-2" /> Volver a selección
                    </Button>
                    <div className="text-right">
                      <span className="block text-sm text-gray-500">Actividad seleccionada:</span>
                      <span className="font-bold text-blue-900">{selectedTemplate.nombreCorto || selectedTemplate.descripcion}</span>
                    </div>
                  </div>

                  {/* General Info (Always Visible) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <div className="flex items-center">
                      <label className="w-32 bg-blue-900 text-white font-bold py-2 px-3 rounded-l-md text-sm uppercase">Subsistema</label>
                      <input type="text" value={subsistema} readOnly className="flex-1 border-2 border-blue-200 rounded-r-md py-2 px-3 bg-gray-50" />
                    </div>
                    <div className="flex items-center">
                      <label className="w-32 bg-blue-900 text-white font-bold py-2 px-3 rounded-l-md text-sm uppercase">Fecha Inicio</label>
                      <input type="datetime-local" {...register('fechaHoraInicio')} className="flex-1 border-2 border-blue-200 rounded-r-md py-2 px-3 focus:outline-none focus:border-blue-500" />
                    </div>
                    <div className="flex items-center">
                      <label className="w-32 bg-blue-900 text-white font-bold py-2 px-3 rounded-l-md text-sm uppercase">Ubicación</label>
                      <input type="text" {...register('ubicacion')} className="flex-1 border-2 border-blue-200 rounded-r-md py-2 px-3 focus:outline-none focus:border-blue-500" />
                    </div>
                    <div className="flex items-center">
                      <label className="w-32 bg-blue-900 text-white font-bold py-2 px-3 rounded-l-md text-sm uppercase">Turno</label>
                      <input type="text" {...register('turno')} readOnly className="flex-1 border-2 border-blue-200 rounded-r-md py-2 px-3 bg-gray-50" />
                    </div>
                    <div className="flex flex-col gap-1 md:col-span-2">
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

                  {/* Dynamic Sections based on Template */}

                  {/* Actividad Section */}
                  {selectedTemplate.secciones?.actividad?.enabled && (
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
                            <div className="border-2 border-blue-200 rounded-md p-3 min-h-[100px] flex items-center bg-white">
                              <span className="font-medium text-gray-800">{selectedTemplate.nombreCorto || selectedTemplate.descripcion}</span>
                            </div>
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
                            <div className="border-2 border-blue-200 rounded-md min-h-[100px] bg-white">
                              <textarea {...register(`actividadesRealizadas.${index}.observaciones`)} className="w-full h-full p-3 resize-none focus:outline-none rounded-md" placeholder="Observaciones..." />
                            </div>
                            <div className="border-2 border-blue-200 rounded-md min-h-[100px] p-2 bg-white flex flex-col justify-center">
                              <Controller
                                name={`actividadesRealizadas.${index}.evidencias`}
                                control={control}
                                render={({ field }) => (
                                  <ImageUpload onChange={field.onChange} compact />
                                )}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tools & Parts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    {selectedTemplate.secciones?.herramientas?.enabled && (
                      <div>
                        <div className="bg-blue-900 text-white font-bold py-2 px-4 rounded-t-md uppercase text-center">Herramientas Utilizadas:</div>
                        <div className="border-2 border-blue-200 rounded-b-md p-4 bg-white min-h-[150px]">
                          <Controller
                            name="herramientas"
                            control={control}
                            render={({ field }) => (
                              <MultiSelect
                                options={toolsOptions}
                                value={field.value || []}
                                onChange={field.onChange}
                                placeholder="Seleccionar..."
                                className="border-0 shadow-none"
                              />
                            )}
                          />
                        </div>
                      </div>
                    )}
                    {selectedTemplate.secciones?.refacciones?.enabled && (
                      <div>
                        <div className="bg-blue-900 text-white font-bold py-2 px-4 rounded-t-md uppercase text-center">Refacciones Utilizadas:</div>
                        <div className="border-2 border-blue-200 rounded-b-md p-4 bg-white min-h-[150px]">
                          <Controller
                            name="refacciones"
                            control={control}
                            render={({ field }) => (
                              <MultiSelect
                                options={partsOptions}
                                value={field.value || []}
                                onChange={field.onChange}
                                placeholder="Seleccionar..."
                                className="border-0 shadow-none"
                              />
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* General Observations */}
                  {selectedTemplate.secciones?.observacionesGenerales?.enabled && (
                    <div className="mt-8">
                      <div className="bg-blue-900 text-white font-bold py-2 px-4 rounded-t-md uppercase text-center">Observaciones Generales</div>
                      <div className="border-2 border-blue-200 rounded-b-md bg-white">
                        <textarea
                          {...register('observacionesGenerales')}
                          rows={4}
                          className="w-full p-4 resize-none focus:outline-none rounded-b-md"
                          placeholder="Comentarios generales..."
                        />
                      </div>
                    </div>
                  )}

                  {/* Footer: Signatures & End Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    {selectedTemplate.secciones?.firmas?.enabled && (
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
                              <SignaturePad onChange={field.onChange} />
                            )}
                          />
                        </div>
                      </div>
                    )}
                    {selectedTemplate.secciones?.fechas?.enabled && (
                      <div>
                        <div className="bg-blue-900 text-white font-bold py-2 px-4 rounded-t-md uppercase text-center">Fecha y Hora de Termino</div>
                        <div className="border-2 border-blue-200 rounded-b-md p-4 bg-white flex items-center justify-center h-full">
                          <div className="text-gray-500 italic">Se registrará automáticamente al guardar</div>
                        </div>
                      </div>
                    )}
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
              )}
            </div>
          </div>

          {/* Right Column: Preview */}
          <div className="hidden lg:block">
            <div className="sticky top-8">
              <WorkReportPreview values={previewValues} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
