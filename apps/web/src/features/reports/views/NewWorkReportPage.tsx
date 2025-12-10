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

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const sectionHeaderClass = "flex items-center gap-3 mb-6";
  const numberBadgeClass = "w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm";
  const sectionTitleClass = "text-lg font-semibold text-gray-800";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-[1600px] mx-auto">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Formato de trabajo</h1>
          <p className="text-gray-500 mt-1">Llena el formato de trabajo para registrar la actividad realizada.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">

          {/* Left Column: Form */}
          <div className="space-y-6">

            {/* Phase 1: Selection */}
            {!selectedTemplate && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={sectionHeaderClass}>
                  <div className={numberBadgeClass}>1</div>
                  <h2 className={sectionTitleClass}>Selección de Actividad</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Subsistema</label>
                    <select
                      {...register('subsistema')}
                      className={inputClass}
                      disabled={isLoadingFilters}
                    >
                      <option value="">Seleccionar...</option>
                      {subsystems.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Frecuencia</label>
                    <select
                      {...register('frecuencia')}
                      className={inputClass}
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
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Actividades Disponibles</h3>
                    {isLoadingActivities ? (
                      <div className="text-center py-8 text-gray-500">Cargando actividades...</div>
                    ) : activities && activities.length > 0 ? (
                      <div className="grid gap-3">
                        {activities.map((activity) => (
                          <button
                            key={activity.id}
                            type="button"
                            onClick={() => handleSelectActivity(activity)}
                            className="text-left w-full p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group bg-white shadow-sm"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-800 group-hover:text-blue-700">{activity.name}</span>
                              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">{activity.code}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{activity.template.tipoMantenimiento}</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
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

                <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="ghost" size="sm" onClick={handleBackToSelection} className="text-gray-500 hover:text-gray-900">
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                      <span className="block text-xs text-gray-500 uppercase tracking-wide">Actividad seleccionada</span>
                      <span className="font-bold text-gray-900">{selectedTemplate.nombreCorto || selectedTemplate.descripcion}</span>
                    </div>
                  </div>
                </div>

                {/* 1. Datos Generales */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className={sectionHeaderClass}>
                    <div className={numberBadgeClass}>1</div>
                    <h2 className={sectionTitleClass}>Datos generales</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>Subsistema</label>
                      <div className="relative">
                        <select {...register('subsistema')} className={`${inputClass} appearance-none bg-gray-50`} disabled>
                          <option value={subsistema}>{subsistema}</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Ubicación</label>
                      <input type="text" {...register('ubicacion')} className={inputClass} placeholder="Ej. Estación A - Andén 2" />
                    </div>
                    <div>
                      <label className={labelClass}>Fecha y hora de inicio</label>
                      <input type="datetime-local" {...register('fechaHoraInicio')} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Turno</label>
                      <input type="text" {...register('turno')} readOnly className={`${inputClass} bg-gray-50`} />
                    </div>
                    <div>
                      <label className={labelClass}>Frecuencia</label>
                      <select {...register('frecuencia')} className={`${inputClass} appearance-none bg-gray-50`} disabled>
                        <option value={frecuencia}>{frequencies.find(f => f.code === frecuencia)?.label || frecuencia}</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Trabajadores</label>
                      <Controller
                        name="trabajadores"
                        control={control}
                        render={({ field }) => (
                          <MultiSelect
                            options={mockWorkers}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Seleccionar..."
                            className="border-gray-300 rounded-lg"
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Actividad */}
                {selectedTemplate.secciones?.actividad?.enabled && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className={sectionHeaderClass}>
                      <div className={numberBadgeClass}>2</div>
                      <h2 className={sectionTitleClass}>Actividad</h2>
                    </div>

                    <div className="space-y-6">
                      {fields.map((field, index) => (
                        <div key={field.id} className="space-y-4">
                          <div className="flex items-center gap-3">
                            <Controller
                              name={`actividadesRealizadas.${index}.realizado`}
                              control={control}
                              render={({ field: { value, onChange } }) => (
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    id={`check-${index}`}
                                    checked={value}
                                    onChange={(e) => onChange(e.target.checked)}
                                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                  />
                                  <label htmlFor={`check-${index}`} className="text-gray-700 font-medium cursor-pointer">
                                    Inspección realizada
                                  </label>
                                </div>
                              )}
                            />
                          </div>

                          {/* Observaciones & Evidencias (Conditional on checked? Or always visible? Let's keep always visible for now but maybe styled cleaner) */}
                          <div className="pl-8 space-y-4">
                            <div>
                              <label className={labelClass}>Observaciones</label>
                              <textarea
                                {...register(`actividadesRealizadas.${index}.observaciones`)}
                                className={inputClass}
                                rows={3}
                                placeholder="Escribe tus observaciones aquí..."
                              />
                            </div>
                            <div>
                              <Controller
                                name={`actividadesRealizadas.${index}.evidencias`}
                                control={control}
                                render={({ field }) => (
                                  <ImageUpload label="Evidencias adjuntas" onChange={field.onChange} compact />
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Herramientas y refacciones */}
                {(selectedTemplate.secciones?.herramientas?.enabled || selectedTemplate.secciones?.refacciones?.enabled) && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className={sectionHeaderClass}>
                      <div className={numberBadgeClass}>3</div>
                      <h2 className={sectionTitleClass}>Herramientas y refacciones</h2>
                    </div>

                    <div className="space-y-6">
                      {selectedTemplate.secciones?.herramientas?.enabled && (
                        <div>
                          <label className={labelClass}>Herramientas utilizadas</label>
                          <Controller
                            name="herramientas"
                            control={control}
                            render={({ field }) => (
                              <MultiSelect
                                options={toolsOptions}
                                value={field.value || []}
                                onChange={field.onChange}
                                placeholder="Seleccionar herramientas..."
                                className="border-gray-300 rounded-lg"
                              />
                            )}
                          />
                        </div>
                      )}
                      {selectedTemplate.secciones?.refacciones?.enabled && (
                        <div>
                          <label className={labelClass}>Refacciones utilizadas</label>
                          <Controller
                            name="refacciones"
                            control={control}
                            render={({ field }) => (
                              <MultiSelect
                                options={partsOptions}
                                value={field.value || []}
                                onChange={field.onChange}
                                placeholder="Seleccionar refacciones..."
                                className="border-gray-300 rounded-lg"
                              />
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Cierre */}
                {(selectedTemplate.secciones?.observacionesGenerales?.enabled || selectedTemplate.secciones?.firmas?.enabled) && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className={sectionHeaderClass}>
                      <div className={numberBadgeClass}>4</div>
                      <h2 className={sectionTitleClass}>Cierre del reporte</h2>
                    </div>

                    <div className="space-y-6">
                      {selectedTemplate.secciones?.observacionesGenerales?.enabled && (
                        <div>
                          <label className={labelClass}>Observaciones Generales</label>
                          <textarea
                            {...register('observacionesGenerales')}
                            rows={3}
                            className={inputClass}
                            placeholder="Comentarios generales..."
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selectedTemplate.secciones?.firmas?.enabled && (
                          <div>
                            <label className={labelClass}>Nombre del Supervisor</label>
                            <input
                              type="text"
                              {...register('nombreResponsable')}
                              className={inputClass}
                              placeholder="Nombre completo"
                            />
                            <div className="mt-4">
                              <Controller
                                name="firmaResponsable"
                                control={control}
                                render={({ field }) => (
                                  <SignaturePad label="Firma del Supervisor" onChange={field.onChange} />
                                )}
                              />
                            </div>
                          </div>
                        )}
                        {selectedTemplate.secciones?.fechas?.enabled && (
                          <div>
                            <label className={labelClass}>Fecha y Hora de Término</label>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center text-gray-500 text-sm">
                              Se registrará automáticamente al guardar el reporte.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    className="w-full md:w-auto px-8 py-3 text-base font-medium bg-blue-900 hover:bg-blue-800 text-white rounded-lg shadow-md transition-all"
                    isLoading={isSubmitting}
                  >
                    <Save className="w-5 h-5 mr-2" />
                    Guardar Reporte
                  </Button>
                </div>

              </form>
            )}
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
