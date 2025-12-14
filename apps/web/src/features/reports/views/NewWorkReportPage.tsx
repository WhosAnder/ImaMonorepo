import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTemplateFilters, useActivitiesBySubsystemAndFrequency } from '@/hooks/useTemplates';
import { useCreateWorkReportMutation } from '@/hooks/useWorkReports';
import { useWarehouseItems } from '@/hooks/useWarehouse';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// shadcn components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Custom components
import { MultiSelect } from '@/shared/ui/MultiSelect';
import { SignaturePad } from '@/shared/ui/SignaturePad';
import { ImageUpload } from '@/shared/ui/ImageUpload';
import { workReportSchema, WorkReportFormValues } from '../schemas/workReportSchema';
import { Save } from 'lucide-react';
import { Template } from '@/types/template';
import { WorkReportPreview } from '../components/WorkReportPreview';

const mockWorkers = [
  { value: 'ana_garcia', label: 'Ana García' },
  { value: 'carlos_ruiz', label: 'Carlos Ruiz' },
  { value: 'luis_perez', label: 'Luis Pérez' },
  { value: 'maria_lopez', label: 'María López' },
  { value: 'jose_hernandez', label: 'José Hernández' },
];

const WORK_REPORT_DRAFT_KEY = 'ima-work-report-draft';

interface ActivityWithDetails {
  id: string;
  name: string;
  code?: string;
  template: Template;
  isSelected: boolean;
  observaciones: string;
  evidencias: File[];
  expanded: boolean;
}

export const NewWorkReportPage: React.FC = () => {
  const router = useRouter();
  const [activitiesState, setActivitiesState] = useState<ActivityWithDetails[]>([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
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

  const fechaHoraInicio = watch('fechaHoraInicio');
  const subsistema = watch('subsistema');
  const frecuencia = watch('frecuencia');

  const { data: filtersData, isLoading: isLoadingFilters } = useTemplateFilters('work');
  const subsystems = filtersData?.subsistemas || [];

  const { data: freqData, isLoading: isLoadingFreq } = useTemplateFilters('work', subsistema || undefined);
  const frequencies = freqData?.frecuencias || [];

  const { data: activities, isLoading: isLoadingActivities } = useActivitiesBySubsystemAndFrequency({
    tipoReporte: 'work',
    subsistema: subsistema || undefined,
    frecuenciaCodigo: frecuencia || undefined,
  });

  const { data: inventoryItems } = useWarehouseItems({ status: 'active' });
  const toolsOptions = inventoryItems?.filter(i => i.category?.toLowerCase() === 'herramientas').map(i => ({ value: i.name, label: i.name })) || [];
  const partsOptions = inventoryItems?.filter(i => i.category?.toLowerCase() === 'refacciones').map(i => ({ value: i.name, label: i.name })) || [];

  useEffect(() => {
    setValue('fechaHoraInicio', new Date().toISOString().slice(0, 16));
  }, [setValue]);

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

  useEffect(() => {
    setActivitiesState([]);
  }, [subsistema, frecuencia]);

  useEffect(() => {
    if (activities && activities.length > 0) {
      setActivitiesState(activities.map(act => ({
        id: act.id,
        name: act.name,
        code: act.code,
        template: act.template,
        isSelected: false,
        observaciones: '',
        evidencias: [],
        expanded: false,
      })));
    }
  }, [activities]);

  useEffect(() => {
    const selected = activitiesState.filter(a => a.isSelected);
    const formActivities = selected.map(a => ({
      templateId: a.template._id || a.id,
      nombre: a.name,
      realizado: true,
      observaciones: a.observaciones,
      evidencias: a.evidencias,
    }));
    setValue('actividadesRealizadas', formActivities);
    setValue('templateIds', selected.map(a => a.template._id || a.id));
  }, [activitiesState, setValue]);

  const toggleActivity = (id: string) => {
    setActivitiesState(prev => prev.map(a => 
      a.id === id ? { ...a, isSelected: !a.isSelected, expanded: !a.isSelected } : a
    ));
  };

  const toggleExpanded = (id: string) => {
    setActivitiesState(prev => prev.map(a => 
      a.id === id ? { ...a, expanded: !a.expanded } : a
    ));
  };

  const updateActivityObservaciones = (id: string, value: string) => {
    setActivitiesState(prev => prev.map(a => 
      a.id === id ? { ...a, observaciones: value } : a
    ));
  };

  const updateActivityEvidencias = (id: string, files: any[]) => {
    const fileObjects = files.map(f => f.file).filter(Boolean) as File[];
    setActivitiesState(prev => prev.map(a => 
      a.id === id ? { ...a, evidencias: fileObjects } : a
    ));
  };

  const createReportMutation = useCreateWorkReportMutation();

  const onSubmit = async (data: WorkReportFormValues) => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
    data.fechaHoraTermino = localISOTime;

    const selectedActivitiesData = activitiesState.filter(a => a.isSelected);
    const actividadesConEvidencias = await Promise.all(
      selectedActivitiesData.map(async (act) => {
        const evidencias = await Promise.all(act.evidencias.map(async (file: File) => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        }));
        return {
          templateId: act.template._id || act.id,
          nombre: act.name,
          realizado: true,
          observaciones: act.observaciones,
          evidencias,
        };
      })
    );

    const payload = {
      ...data,
      actividadesRealizadas: actividadesConEvidencias,
      templateIds: selectedActivitiesData.map(a => a.template._id || a.id),
      tipoMantenimiento: selectedActivitiesData[0]?.template.tipoMantenimiento || 'Preventivo'
    };

    try {
      console.log('Creating report...', payload);
      
      const result = await createReportMutation.mutateAsync(payload as any);
      const reportId = (result as any)._id;
      console.log('Report created:', reportId);
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem(WORK_REPORT_DRAFT_KEY);
      }
      alert('Reporte generado exitosamente');
      router.push(`/reports/${(result as any)._id}`);
    } catch (error) {
      console.error("Error creating report:", error);
      alert('Error al generar el reporte');
    }
  };

  const watchedValues = watch();
  const selectedActivities = activitiesState.filter(a => a.isSelected);
  
  const previewValues = {
    ...watchedValues,
    actividadesRealizadas: selectedActivities.map(a => ({
      nombre: a.name,
      realizado: true,
      observaciones: a.observaciones,
      evidenciasCount: a.evidencias.length,
    })),
    herramientas: watchedValues.herramientas,
    refacciones: watchedValues.refacciones,
  };

  const hasSelectedActivities = selectedActivities.length > 0;

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Formato de trabajo proyecto AEROTREN AICM</h1>
          <p className="text-muted-foreground mt-1">Selecciona las actividades realizadas y registra observaciones y evidencias.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">

          {/* Left Column: Form */}
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">

            {/* 1. Datos Generales */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#153A7A] text-white flex items-center justify-center text-sm font-bold">1</div>
                  <CardTitle>Datos generales</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subsistema">Subsistema</Label>
                    <Controller
                      name="subsistema"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingFilters}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            {subsystems.map(sub => (
                              <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frecuencia">Frecuencia</Label>
                    <Controller
                      name="frecuencia"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} disabled={!subsistema || isLoadingFreq}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={subsistema ? 'Seleccionar...' : 'Selecciona un subsistema'} />
                          </SelectTrigger>
                          <SelectContent>
                            {frequencies.map(freq => (
                              <SelectItem key={freq.code} value={freq.code}>{freq.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ubicacion">Ubicación</Label>
                    <Input {...register('ubicacion')} placeholder="Ej. Centro de Operación T2 PK N/A" className="w-full" />
                  </div>
                  <div className="space-y-2">
                    <Label>Trabajadores Involucrados</Label>
                    <Controller
                      name="trabajadores"
                      control={control}
                      render={({ field }) => (
                        <MultiSelect
                          options={mockWorkers}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Seleccionar..."
                        />
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Actividades */}
            {subsistema && frecuencia && (
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#153A7A] text-white flex items-center justify-center text-sm font-bold">2</div>
                    <CardTitle>Actividades</CardTitle>
                    {hasSelectedActivities && (
                      <Badge className="ml-auto bg-[#F0493B] hover:bg-[#F0493B]/90 text-white">
                        {selectedActivities.length} seleccionada(s)
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingActivities ? (
                    <div className="text-center py-8 text-muted-foreground">Cargando actividades...</div>
                  ) : activitiesState.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      {/* Table Header */}
                      <div className="grid grid-cols-[auto_1fr_80px_100px_80px] bg-[#153A7A] text-white text-xs font-semibold uppercase">
                        <div className="p-3 flex items-center justify-center">
                          <span className="sr-only">Seleccionar</span>
                        </div>
                        <div className="p-3">Actividad</div>
                        <div className="p-3 text-center">SI/NO</div>
                        <div className="p-3 text-center">Observaciones</div>
                        <div className="p-3 text-center">Evidencias</div>
                      </div>

                      {/* Table Rows */}
                      {activitiesState.map((activity) => (
                        <div key={activity.id} className="border-t">
                          <div className={`grid grid-cols-[auto_1fr_80px_100px_80px] items-center ${
                            activity.isSelected ? 'bg-blue-50' : 'bg-card hover:bg-muted/50'
                          } transition-colors`}>
                            <div className="p-3 flex items-center justify-center">
                              <Checkbox
                                checked={activity.isSelected}
                                onCheckedChange={() => toggleActivity(activity.id)}
                              />
                            </div>
                            <div className="p-3">
                              <span className="text-sm">{activity.name}</span>
                              {activity.code && (
                                <span className="ml-2 text-xs text-muted-foreground">({activity.code})</span>
                              )}
                            </div>
                            <div className="p-3 text-center">
                              <Badge className={activity.isSelected ? 'bg-green-600 hover:bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}>
                                {activity.isSelected ? 'SÍ' : 'NO'}
                              </Badge>
                            </div>
                            <div className="p-3 text-center">
                              {activity.isSelected && (
                                <Button
                                  type="button"
                                  variant="link"
                                  size="sm"
                                  onClick={() => toggleExpanded(activity.id)}
                                  className="text-xs h-auto p-0"
                                >
                                  {activity.observaciones ? 'Editar' : 'Agregar'}
                                </Button>
                              )}
                            </div>
                            <div className="p-3 text-center">
                              {activity.isSelected && (
                                <span className="text-xs text-muted-foreground">
                                  {activity.evidencias.length} / 5
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Expanded Detail Row */}
                          {activity.isSelected && activity.expanded && (
                            <div className="bg-blue-50 border-t border-blue-100 p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Observaciones</Label>
                                  <Textarea
                                    value={activity.observaciones}
                                    onChange={(e) => updateActivityObservaciones(activity.id, e.target.value)}
                                    placeholder="Escribe observaciones para esta actividad..."
                                    rows={3}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Evidencias (máx. 5)</Label>
                                  <ImageUpload
                                    label=""
                                    onChange={(files) => updateActivityEvidencias(activity.id, files)}
                                    compact
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      No se encontraron actividades para esta selección.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 3. Herramientas y refacciones */}
            {hasSelectedActivities && (
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#153A7A] text-white flex items-center justify-center text-sm font-bold">3</div>
                    <CardTitle>Herramientas y refacciones</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Herramientas utilizadas</Label>
                      <Controller
                        name="herramientas"
                        control={control}
                        render={({ field }) => (
                          <MultiSelect
                            options={toolsOptions}
                            value={field.value || []}
                            onChange={field.onChange}
                            placeholder="Seleccionar herramientas..."
                          />
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Refacciones utilizadas</Label>
                      <Controller
                        name="refacciones"
                        control={control}
                        render={({ field }) => (
                          <MultiSelect
                            options={partsOptions}
                            value={field.value || []}
                            onChange={field.onChange}
                            placeholder="Seleccionar refacciones..."
                          />
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 4. Cierre */}
            {hasSelectedActivities && (
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#153A7A] text-white flex items-center justify-center text-sm font-bold">4</div>
                    <CardTitle>Cierre del reporte</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Observaciones Generales</Label>
                    <Textarea
                      {...register('observacionesGenerales')}
                      placeholder="Comentarios generales del trabajo realizado..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre del Supervisor</Label>
                    <Input
                      {...register('nombreResponsable')}
                      placeholder="Nombre completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Controller
                      name="firmaResponsable"
                      control={control}
                      render={({ field }) => (
                        <SignaturePad label="Firma del Supervisor" onChange={field.onChange} />
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            {hasSelectedActivities && (
              <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" disabled={isSubmitting} className="bg-[#153A7A] hover:bg-[#153A7A]/90 text-white">
                  <Save className="w-5 h-5 mr-2" />
                  {isSubmitting ? 'Guardando...' : 'Guardar Reporte'}
                </Button>
              </div>
            )}

          </form>

          {/* Right Column: Preview */}
          <div className="hidden lg:block">
            <div className="sticky top-8">
              <WorkReportPreview values={previewValues as any} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
