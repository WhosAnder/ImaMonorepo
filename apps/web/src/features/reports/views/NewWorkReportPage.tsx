"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTemplateFilters, useActivitiesBySubsystemAndFrequency } from '@/hooks/useTemplates';
import { useCreateWorkReportMutation } from '@/hooks/useWorkReports';
import { useWarehouseItems } from '@/hooks/useWarehouse';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useWorkers } from '@/hooks/useWorkers';
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
import { Save, Plus, Trash2, Wrench } from 'lucide-react';
import { Template } from '@/types/template';
import { WorkReportPreview } from '../components/WorkReportPreview';
import { useAuth } from '@/auth/AuthContext';
import type { WarehouseItem } from "@/api/warehouseClient";



const WORK_REPORT_DRAFT_KEY = 'work_report_draft';

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

const convertSignatureToBase64 = async (signatureUrl: string | null): Promise<string | null> => {
  if (!signatureUrl) return null;
  if (signatureUrl.startsWith('data:image')) return signatureUrl;
  
  try {
    const response = await fetch(signatureUrl);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting signature:', error);
    return null;
  }
};

const prepareActivityEvidence = async (activities: any[]) => {
  return Promise.all(activities.map(async (act) => {
    const evidencias = await Promise.all(act.evidencias.map(async (file: File | string) => {
      if (typeof file === 'string') return file;
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }));
    return {
      ...act,
      evidencias
    };
  }));
};

export const NewWorkReportPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [activitiesState, setActivitiesState] = useState<ActivityWithDetails[]>([]);
  const [draftStatus, setDraftStatus] = useState<'empty' | 'loaded'>('empty');
  const draftRestorationGuardRef = useRef(false);

  const initialFormValues: WorkReportFormValues = {
    fechaHoraInicio: new Date().toISOString().slice(0, 16),
    turno: '',
    trabajadores: [],
    actividadesRealizadas: [],
    herramientas: [],
    refacciones: [],
    nombreResponsable: user?.name || '',
    firmaResponsable: undefined,
    templateIds: [],
  };

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WorkReportFormValues>({
    resolver: zodResolver(workReportSchema) as any,
    defaultValues: initialFormValues
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

  // Fetch workers
  const { data: workers = [] } = useWorkers();
  const workerOptions = useMemo(() => 
    workers
      .filter(w => w.active)
      .map(w => ({ value: w.name, label: w.name })),
    [workers]
  );

  // Fetch inventory
  const { data: warehouseItems = [], isLoading: loadingInventory } = useWarehouseItems({ status: 'active' });
  
  const { herramientasOptions, refaccionesOptions } = useMemo(() => {
    const toOption = (item: WarehouseItem) => {
      const stockInfo =
        typeof item.quantityOnHand === "number"
          ? ` · Stock: ${item.quantityOnHand}${item.unit ? ` ${item.unit}` : ""}`
          : "";
      return {
        value: item.name,
        label: `${item.name}${stockInfo}`,
      };
    };

    const filterByCategory = (category: string) =>
      warehouseItems
        .filter((item) => item.category?.toLowerCase() === category)
        .map(toOption);

    const baseOptions = warehouseItems.map(toOption);
    const herramientas = filterByCategory("herramientas");
    const refacciones = filterByCategory("refacciones");

    return {
      herramientasOptions: herramientas.length > 0 ? herramientas : baseOptions,
      refaccionesOptions: refacciones.length > 0 ? refacciones : baseOptions,
    };
  }, [warehouseItems]);

  useEffect(() => {
    if (user?.name) {
      setValue('nombreResponsable', user.name);
    }
  }, [user, setValue]);

  useEffect(() => {
    if (draftStatus === 'empty') {
      setValue('fechaHoraInicio', new Date().toISOString().slice(0, 16));
    }
  }, [draftStatus, setValue]);

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
    if (draftRestorationGuardRef.current) return;
    setActivitiesState([]);
  }, [subsistema, frecuencia]);

  useEffect(() => {
    if (draftRestorationGuardRef.current) return;
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

  // Load draft on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedDraft = localStorage.getItem(WORK_REPORT_DRAFT_KEY);
    if (savedDraft) {
      const shouldLoad = window.confirm('Se encontró un borrador guardado. ¿Deseas cargarlo?');
      if (shouldLoad) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed.formValues) {
            draftRestorationGuardRef.current = true;
            reset(parsed.formValues);
            // Restore activities state logic would be complex here, keeping it simple for now
            // Ideally we would match IDs and restore observations
            setTimeout(() => {
                draftRestorationGuardRef.current = false;
            }, 500);
          }
          setDraftStatus('loaded');
        } catch (e) {
          console.error('Error loading draft', e);
        }
      } else {
        localStorage.removeItem(WORK_REPORT_DRAFT_KEY);
      }
    }
  }, [reset]);

  const toggleActivity = (id: string) => {
    setActivitiesState(prev => prev.map(a => 
      a.id === id ? { ...a, isSelected: !a.isSelected, expanded: !a.isSelected } : a
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

  const handleSaveDraft = async () => {
    if (typeof window === 'undefined') return;

    try {
      const currentValues = getValues();
      const actividadesConEvidencias = await prepareActivityEvidence(currentValues.actividadesRealizadas || []);
      const firmaResponsable = await convertSignatureToBase64(currentValues.firmaResponsable || null);
      
      const draftPayload = {
        formValues: {
          ...currentValues,
          actividadesRealizadas: actividadesConEvidencias,
          firmaResponsable,
        },
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem(WORK_REPORT_DRAFT_KEY, JSON.stringify(draftPayload));
      alert('Borrador guardado correctamente');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('No se pudo guardar el borrador');
    }
  };

  const createReportMutation = useCreateWorkReportMutation();

  const onSubmit = async (data: WorkReportFormValues) => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
    data.fechaHoraTermino = localISOTime;

    const selectedActivitiesData = activitiesState.filter(a => a.isSelected);
    
    // Process activity evidences
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
      tipoMantenimiento: selectedActivitiesData[0]?.template.tipoMantenimiento || 'Preventivo',
      // Legacy fields required by backend
      inspeccionRealizada: actividadesConEvidencias[0]?.realizado ?? false,
      observacionesActividad: actividadesConEvidencias[0]?.observaciones ?? '',
    };

    try {
      console.log('Creating report...', payload);
      
      const result = await createReportMutation.mutateAsync(payload as any);
      
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

        <div className="space-y-8">

          {/* Form */}
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
                          options={workerOptions}
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
                    <div className="space-y-4">
                      {activitiesState.map((activity) => (
                        <div 
                          key={activity.id} 
                          className={`border rounded-lg transition-all duration-200 ${
                            activity.isSelected 
                              ? 'bg-blue-50/50 border-blue-200 shadow-sm' 
                              : 'bg-card hover:bg-muted/50 border-border'
                          }`}
                        >
                          {/* Header: Checkbox + Name */}
                          <div className="p-4 flex items-start gap-3">
                            <Checkbox
                              checked={activity.isSelected}
                              onCheckedChange={() => toggleActivity(activity.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className={`text-sm font-medium ${activity.isSelected ? 'text-blue-900' : 'text-foreground'}`}>
                                  {activity.name}
                                </span>
                                {activity.isSelected && (
                                  <Badge className="bg-green-600 hover:bg-green-600 text-white ml-2">
                                    SÍ
                                  </Badge>
                                )}
                              </div>
                              {activity.code && (
                                <p className="text-xs text-muted-foreground mt-0.5">{activity.code}</p>
                              )}
                            </div>
                          </div>

                          {/* Expanded Content (Visible when selected) */}
                          {activity.isSelected && (
                            <div className="px-4 pb-4 pt-0 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                              {/* Observations - Full Width */}
                              <div className="space-y-2">
                                <Label className="text-xs font-semibold text-blue-900">Observaciones</Label>
                                <Textarea
                                  value={activity.observaciones}
                                  onChange={(e) => updateActivityObservaciones(activity.id, e.target.value)}
                                  placeholder="Escribe observaciones para esta actividad..."
                                  className="bg-white min-h-[80px]"
                                />
                              </div>

                              {/* Evidences - Bottom */}
                              <div className="space-y-2">
                                <Label className="text-xs font-semibold text-blue-900">Evidencias Fotográficas (máx. 5)</Label>
                                <div className="bg-white p-3 rounded-lg border border-blue-100">
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

            {/* 3. Herramientas y refacciones (OLD LOGIC - MultiSelect) */}
            {hasSelectedActivities && (
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#153A7A] text-white flex items-center justify-center text-sm font-bold">3</div>
                    <CardTitle>Herramientas y refacciones</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Herramientas */}
                  <div className="space-y-2">
                    <Label>Herramientas utilizadas</Label>
                    <Controller
                      name="herramientas"
                      control={control}
                      render={({ field }) => (
                        <MultiSelect
                          options={herramientasOptions}
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder="Seleccionar herramientas..."
                        />
                      )}
                    />
                  </div>

                  {/* Refacciones */}
                  <div className="space-y-2">
                    <Label>Refacciones utilizadas</Label>
                    <Controller
                      name="refacciones"
                      control={control}
                      render={({ field }) => (
                        <MultiSelect
                          options={refaccionesOptions}
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder="Seleccionar refacciones..."
                        />
                      )}
                    />
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
                      readOnly
                      className="bg-gray-100 text-gray-600 cursor-not-allowed"
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
              <div className="flex justify-end pt-4 gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleSaveDraft}
                  className="border-[#153A7A] text-[#153A7A] hover:bg-[#153A7A]/10"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Guardar Borrador
                </Button>
                <Button type="submit" size="lg" disabled={isSubmitting} className="bg-[#153A7A] hover:bg-[#153A7A]/90 text-white">
                  <Save className="w-5 h-5 mr-2" />
                  {isSubmitting ? 'Guardando...' : 'Guardar Reporte'}
                </Button>
              </div>
            )}

          </form>

          {/* Preview Section */}
          <div className="border-t pt-8">
            <h2 className="text-xl font-bold mb-4 text-foreground">Vista Previa del Reporte</h2>
            <WorkReportPreview values={previewValues as any} />
          </div>

        </div>
      </div>
    </div>
  );
};
