import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTemplateFilters, useActivitiesBySubsystemAndFrequency } from '@/hooks/useTemplates';
import { useCreateWorkReportMutation } from '@/hooks/useWorkReports';
import { useWarehouseItems } from '@/hooks/useWarehouse';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/ui/Button';
import { MultiSelect } from '@/shared/ui/MultiSelect';
import { SignaturePad } from '@/shared/ui/SignaturePad';
import { ImageUpload, type LocalEvidence } from '@/shared/ui/ImageUpload';
import { workReportSchema, WorkReportFormValues } from '../schemas/workReportSchema';
import { Save, ArrowLeft } from 'lucide-react';
import { Template } from '@/types/template';
import { WorkReportPreview } from '../components/WorkReportPreview';
import type { WarehouseItem } from '@/api/warehouseClient';
import { uploadEvidence } from '@/api/storageClient';
import { useAdminUsers } from '@/hooks/useAdminUsers';

const WORK_REPORT_DRAFT_KEY = 'ima-work-report-draft';

export const NewWorkReportPage: React.FC = () => {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const draftRestorationGuardRef = useRef(false);

  const initialFormValues = useMemo<Partial<WorkReportFormValues>>(
    () => ({
      fechaHoraInicio: new Date().toISOString().slice(0, 16),
      turno: '',
      trabajadores: [],
      actividadesRealizadas: [],
      herramientas: [],
      refacciones: [],
      nombreResponsable: 'Juan Supervisor',
      firmaResponsable: undefined,
      templateIds: [],
    }),
    []
  );

  // --- Form Setup ---
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<WorkReportFormValues>({
    resolver: zodResolver(workReportSchema) as any,
    defaultValues: initialFormValues
  });

  const { fields, replace } = useFieldArray({
    control,
    name: "actividadesRealizadas"
  });

  // --- Watchers ---
  const fechaHoraInicio = watch('fechaHoraInicio');
  const subsistema = watch('subsistema');
  const frecuencia = watch('frecuencia');
  const herramientasSeleccionadas = watch('herramientas');
  const refaccionesSeleccionadas = watch('refacciones');

  // --- Data Fetching ---
  const { data: adminUsers = [], isLoading: isLoadingUsers } = useAdminUsers();
  const [customWorkers, setCustomWorkers] = useState<{ value: string; label: string }[]>([]);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [addWorkerError, setAddWorkerError] = useState<string | null>(null);

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
  const {
    data: warehouseItems = [],
    isLoading: isLoadingInventory,
    error: inventoryError,
  } = useWarehouseItems({ status: 'active' });

  const { herramientasOptions, refaccionesOptions } = useMemo(() => {
    const toOption = (item: WarehouseItem) => {
      const stockInfo =
        typeof item.quantityOnHand === 'number'
          ? ` · Stock: ${item.quantityOnHand}${item.unit ? ` ${item.unit}` : ''}`
          : '';
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
    const herramientas = filterByCategory('herramientas');
    const refacciones = filterByCategory('refacciones');

    return {
      herramientasOptions: herramientas.length > 0 ? herramientas : baseOptions,
      refaccionesOptions: refacciones.length > 0 ? refacciones : baseOptions,
    };
  }, [warehouseItems]);

  // --- Effects ---

  const [draftStatus, setDraftStatus] = useState<'pending' | 'restored' | 'empty'>('pending');

  // Restore draft from localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || draftStatus !== 'pending') {
      return;
    }

    const storedDraft = localStorage.getItem(WORK_REPORT_DRAFT_KEY);
    if (!storedDraft) {
      setDraftStatus('empty');
      return;
    }

    try {
      const parsed = JSON.parse(storedDraft);
      if (parsed.formValues) {
        draftRestorationGuardRef.current = true;
        const restoredValues = {
          ...initialFormValues,
          ...parsed.formValues,
        } as WorkReportFormValues;
        reset(restoredValues);
        replace(restoredValues.actividadesRealizadas || []);
        setSelectedTemplate(parsed.selectedTemplate || null);
        setTimeout(() => {
          draftRestorationGuardRef.current = false;
        }, 0);
      }
      setDraftStatus('restored');
    } catch (error) {
      console.error('Error restoring work report draft:', error);
      draftRestorationGuardRef.current = false;
      setDraftStatus('empty');
    }
  }, [initialFormValues, reset, replace, draftStatus]);

  // Auto-set start time on mount if there is no draft
  useEffect(() => {
    if (draftStatus !== 'empty') {
      return;
    }
    setValue('fechaHoraInicio', new Date().toISOString().slice(0, 16));
  }, [draftStatus, setValue]);

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
    if (draftRestorationGuardRef.current) {
      return;
    }
    setValue('frecuencia', '');
    setSelectedTemplate(null);
  }, [subsistema, setValue]);

  // Reset selection when frecuencia changes
  useEffect(() => {
    if (draftRestorationGuardRef.current) {
      return;
    }
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
      nombre: template.nombreCorto || template.descripcion || '',
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

  const blobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const fileToBase64 = (file: File) => blobToBase64(file);

  const fetchUrlToBase64 = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch file for conversion");
    }
    const blob = await response.blob();
    return blobToBase64(blob);
  };

  const dataUrlToFile = (dataUrl: string, fileName: string) => {
    if (!dataUrl.startsWith("data:")) {
      throw new Error("Invalid data URL");
    }
    const parts = dataUrl.split(",");
    if (parts.length < 2) {
      throw new Error("Invalid data URL");
    }
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
    const binary = atob(parts[1]);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new File([bytes], fileName, { type: mime });
  };

  const evidenceHasRemoteUrl = (evidence: any) => {
    if (typeof evidence === "string") {
      return /^https?:\/\//i.test(evidence);
    }
    if (evidence && typeof evidence === "object" && typeof evidence.url === "string") {
      return /^https?:\/\//i.test(evidence.url);
    }
    return false;
  };

  const extractEvidenceDataUrl = (evidence: any) => {
    if (!evidence) {
      return null;
    }
    if (typeof evidence === "string" && evidence.startsWith("data:")) {
      return evidence;
    }
    if (typeof evidence === "object") {
      if (typeof evidence.base64 === "string" && evidence.base64.startsWith("data:")) {
        return evidence.base64;
      }
      if (typeof evidence.previewUrl === "string" && evidence.previewUrl.startsWith("data:")) {
        return evidence.previewUrl;
      }
    }
    return null;
  };

  const ensureEvidencesAreUploaded = async (
    evidences: any[] = [],
    templateId: string
  ) => {
    return Promise.all(
      evidences.map(async (evidence, index) => {
        if (evidenceHasRemoteUrl(evidence)) {
          return evidence;
        }

        const dataUrl = extractEvidenceDataUrl(evidence);
        if (!dataUrl) {
          return evidence;
        }

        const fileName = `work-evidence-${templateId}-${index + 1}.png`;
        const file = dataUrlToFile(dataUrl, fileName);
        const uploaded = await uploadEvidence(file, {
          entityId: templateId,
          category: "work-report",
          order: index,
        });

        return {
          id: uploaded.id || uploaded.key,
          previewUrl: uploaded.previewUrl || uploaded.url,
          url: uploaded.url,
          key: uploaded.key,
        };
      })
    );
  };

  const convertEvidenceToBase64 = async (evidence: any): Promise<string | any> => {
    if (typeof window === "undefined") {
      return evidence;
    }

    if (typeof evidence === "string") {
      if (evidence.startsWith("data:")) {
        return evidence;
      }
      if (/^https?:\/\//i.test(evidence)) {
        try {
          return await fetchUrlToBase64(evidence);
        } catch {
          return evidence;
        }
      }
      return evidence;
    }

    if (evidence instanceof File) {
      return fileToBase64(evidence);
    }

    if (evidence && typeof evidence === "object") {
      const candidate = evidence as Partial<LocalEvidence> & { url?: string };
      if (typeof candidate.base64 === "string" && candidate.base64.startsWith("data:")) {
        return candidate.base64;
      }
      const src =
        typeof candidate.previewUrl === "string"
          ? candidate.previewUrl
          : typeof candidate.url === "string"
            ? candidate.url
            : undefined;
      if (typeof src === "string") {
        if (src.startsWith("data:")) {
          return src;
        }
        try {
          return await fetchUrlToBase64(src);
        } catch {
          return src;
        }
      }
    }

    return evidence;
  };

  const convertSignatureToBase64 = async (signature: string | null | undefined) => {
    if (!signature) {
      return null;
    }
    if (signature.startsWith("data:")) {
      return signature;
    }
    if (/^https?:\/\//i.test(signature)) {
      try {
        return await fetchUrlToBase64(signature);
      } catch {
        return signature;
      }
    }
    return signature;
  };

  const prepareActivityEvidence = async (
    activities: WorkReportFormValues['actividadesRealizadas'] = []
  ) => {
    return Promise.all(
      (activities || []).map(async (act) => {
        const evidencias = await Promise.all(
          (act.evidencias || []).map((file: any) => convertEvidenceToBase64(file))
        );
        return { ...act, evidencias };
      })
    );
  };

  const buildWorkReportPayload = async (formValues: WorkReportFormValues) => {
    const actividadesConEvidencias = await prepareActivityEvidence(formValues.actividadesRealizadas);
    const primaryActivity = actividadesConEvidencias?.[0];
    const {
      templateIds,
      actividadesRealizadas,
      inspeccionRealizada,
      observacionesActividad,
      evidencias,
      trabajadores,
      ...rest
    } = formValues;

    const templateId = selectedTemplate?._id || templateIds?.[0];
    if (!templateId) {
      throw new Error('Debes seleccionar una actividad para generar el reporte.');
    }

    const normalizedSignature = await convertSignatureToBase64(rest.firmaResponsable);
    const evidenciasSubidas = await ensureEvidencesAreUploaded(
      primaryActivity?.evidencias || [],
      templateId
    );

    const workerNames = (trabajadores || []).map(
      (workerId) => workerLabelMap[workerId] || workerId
    );

    return {
      ...rest,
      trabajadores: workerNames,
      templateId,
      tipoMantenimiento: selectedTemplate?.tipoMantenimiento || 'Preventivo',
      inspeccionRealizada: primaryActivity?.realizado ?? false,
      observacionesActividad: primaryActivity?.observaciones ?? '',
      evidencias: evidenciasSubidas,
      firmaResponsable: normalizedSignature,
    };
  };

  const onSubmit = async (data: WorkReportFormValues) => {
    // Auto-set end time
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
    data.fechaHoraTermino = localISOTime;

    try {
      const payload = await buildWorkReportPayload(data);
      console.log('Form Data Submitted:', payload);
      const result = await createReportMutation.mutateAsync(payload as any);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(WORK_REPORT_DRAFT_KEY);
      }
      alert('Reporte generado exitosamente');
      router.push(`/reports/${(result as any)._id}`);
    } catch (error) {
      console.error("Error creating report:", error);
      alert(error instanceof Error ? error.message : 'Error al generar el reporte');
    }
  };

  const handleSaveDraft = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const currentValues = getValues();
      const actividadesConEvidencias = await prepareActivityEvidence(currentValues.actividadesRealizadas);
      const firmaResponsable = await convertSignatureToBase64(currentValues.firmaResponsable);
      const draftPayload = {
        formValues: {
          ...currentValues,
          actividadesRealizadas: actividadesConEvidencias,
          firmaResponsable,
        },
        selectedTemplate,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem(WORK_REPORT_DRAFT_KEY, JSON.stringify(draftPayload));
      alert('Borrador guardado correctamente');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('No se pudo guardar el borrador');
    }
  };

  // --- Render ---

  // Watch values for preview
  const watchedValues = watch();

  // Worker options and label map (must be defined before previewValues)
  const workerOptions = useMemo(
    () =>
      (adminUsers || [])
        .map((user) => ({
          value: user.id,
          label: user.name || user.email,
        })),
    [adminUsers]
  );

  const allWorkerOptions = useMemo(
    () => [...workerOptions, ...customWorkers],
    [workerOptions, customWorkers]
  );

  const workerLabelMap = useMemo(
    () =>
      allWorkerOptions.reduce<Record<string, string>>((acc, option) => {
        acc[option.value] = option.label;
        return acc;
      }, {}),
    [allWorkerOptions]
  );

  // Map form values to preview props
  const previewValues = {
    ...watchedValues,
    trabajadores: (watchedValues.trabajadores || []).map(
      (workerId: string) => workerLabelMap[workerId] || workerId
    ),
    // Map the first activity's data to the preview fields
    inspeccionRealizada: watchedValues.actividadesRealizadas?.[0]?.realizado,
    observacionesActividad: watchedValues.actividadesRealizadas?.[0]?.observaciones,
    evidencias: watchedValues.actividadesRealizadas?.[0]?.evidencias ?? [],
    herramientas: watchedValues.herramientas,
    refacciones: watchedValues.refacciones,
  };

  const formatStock = (item: WarehouseItem) => {
    const stockValue = typeof item.quantityOnHand === 'number' ? item.quantityOnHand : 0;
    return `${stockValue}${item.unit ? ` ${item.unit}` : ''}`;
  };

  const selectedToolsDetails = useMemo(() => {
    if (!herramientasSeleccionadas?.length) return [];
    return herramientasSeleccionadas
      .map((nombre) => warehouseItems.find((item) => item.name === nombre))
      .filter((item): item is WarehouseItem => Boolean(item));
  }, [herramientasSeleccionadas, warehouseItems]);

  const selectedPartsDetails = useMemo(() => {
    if (!refaccionesSeleccionadas?.length) return [];
    return refaccionesSeleccionadas
      .map((nombre) => warehouseItems.find((item) => item.name === nombre))
      .filter((item): item is WarehouseItem => Boolean(item));
  }, [refaccionesSeleccionadas, warehouseItems]);

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const sectionHeaderClass = "flex items-center gap-3 mb-6";
  const numberBadgeClass = "w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm";
  const sectionTitleClass = "text-lg font-semibold text-gray-800";

  const handleAddCustomWorker = () => {
    const trimmed = newWorkerName.trim();
    if (!trimmed) {
      setAddWorkerError('Ingresa un nombre válido');
      return;
    }
    const exists = allWorkerOptions.some(
      (option) => option.label.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setAddWorkerError('Ese trabajador ya está en la lista');
      return;
    }
    const value = `custom-${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    const newOption = { value, label: trimmed };
    setCustomWorkers((prev) => [...prev, newOption]);
    const current = getValues('trabajadores') || [];
    setValue('trabajadores', [...current, value]);
    setNewWorkerName('');
    setAddWorkerError(null);
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-12 font-sans">

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Formato de trabajo</h1>
        <p className="text-gray-500 mt-1">Llena el formato de trabajo para registrar la actividad realizada.</p>
      </div>

      <div className="space-y-10">
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
                  <Button type="button" variant="ghost" onClick={handleBackToSelection} className="text-gray-500 hover:text-gray-900">
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
                            options={allWorkerOptions}
                            value={field.value || []}
                            onChange={field.onChange}
                            placeholder={
                              isLoadingUsers
                                ? "Cargando trabajadores..."
                                : allWorkerOptions.length === 0
                                  ? "No hay trabajadores disponibles"
                                  : "Seleccionar..."
                            }
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

                        {/* Observaciones & Evidencias */}
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
                                <ImageUpload
                                  label="Evidencias adjuntas"
                                  value={field.value ?? []}
                                  onChange={field.onChange}
                                  compact
                                />
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
                              options={herramientasOptions}
                              value={field.value || []}
                              onChange={field.onChange}
                              placeholder={
                                isLoadingInventory
                                  ? "Cargando inventario..."
                                  : warehouseItems.length === 0
                                    ? "Sin herramientas registradas"
                                    : "Seleccionar herramientas..."
                              }
                              className="border-gray-300 rounded-lg"
                            />
                          )}
                        />
                        {isLoadingInventory && (
                          <p className="text-xs text-gray-500 mt-1">Cargando inventario del almacén...</p>
                        )}
                        {!isLoadingInventory && warehouseItems.length === 0 && (
                          <p className="text-xs text-amber-600 mt-1">No hay herramientas activas en el almacén.</p>
                        )}
                        {inventoryError && (
                          <p className="text-xs text-red-500 mt-1">No se pudo cargar el inventario del almacén.</p>
                        )}
                        {selectedToolsDetails.length > 0 && (
                          <ul className="mt-2 text-xs text-gray-500 space-y-1">
                            {selectedToolsDetails.map((item) => (
                              <li
                                key={item._id}
                                className="flex items-center justify-between border-b border-dashed border-gray-200 pb-1 last:pb-0 last:border-0"
                              >
                                <span>{item.name}</span>
                                <span className="text-gray-400">Stock: {formatStock(item)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
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
                              options={refaccionesOptions}
                              value={field.value || []}
                              onChange={field.onChange}
                              placeholder={
                                isLoadingInventory
                                  ? "Cargando inventario..."
                                  : warehouseItems.length === 0
                                    ? "Sin refacciones registradas"
                                    : "Seleccionar refacciones..."
                              }
                              className="border-gray-300 rounded-lg"
                            />
                          )}
                        />
                        {isLoadingInventory && (
                          <p className="text-xs text-gray-500 mt-1">Cargando inventario del almacén...</p>
                        )}
                        {!isLoadingInventory && warehouseItems.length === 0 && (
                          <p className="text-xs text-amber-600 mt-1">No hay refacciones activas en el almacén.</p>
                        )}
                        {inventoryError && (
                          <p className="text-xs text-red-500 mt-1">No se pudo cargar el inventario del almacén.</p>
                        )}
                        {selectedPartsDetails.length > 0 && (
                          <ul className="mt-2 text-xs text-gray-500 space-y-1">
                            {selectedPartsDetails.map((item) => (
                              <li
                                key={item._id}
                                className="flex items-center justify-between border-b border-dashed border-gray-200 pb-1 last:pb-0 last:border-0"
                              >
                                <span>{item.name}</span>
                                <span className="text-gray-400">Stock: {formatStock(item)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
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
              <div className="flex flex-col gap-3 md:flex-row md:justify-end pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full md:w-auto px-8 py-3 text-base font-medium"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                >
                  Guardar como borrador
                </Button>
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

        {/* Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" id="work-report-preview-content">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Vista previa</p>
              <h3 className="text-lg font-semibold text-gray-900">Reporte de trabajo</h3>
            </div>
          </div>
          <WorkReportPreview values={previewValues} />
        </div>
      </div>
    </div>
  );
};
